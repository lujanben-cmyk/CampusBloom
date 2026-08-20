import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  ActiveTab,
  StudentProfile,
  Subject,
  ClassScheduleItem,
  Exam,
  BackgroundTheme,
  AuthUser,
  ThemeId,
  SpotifyPlaylistPreset,
} from '../types';
import {
  BACKGROUND_THEMES,
  INITIAL_SUBJECTS,
  INITIAL_SCHEDULE,
  INITIAL_EXAMS,
  INITIAL_STUDENT_PROFILE,
} from '../data/initialData';
import {
  PRESET_PLAYLISTS,
  convertToSpotifyEmbedUrl,
  createCustomSpotifyPreset,
} from '../data/spotifyData';
import { safeGet, safeSet, safeRemove, compressImage } from '../utils/storage';

// Initial clean, unpopulated profile (Blank Canvas)
export const BLANK_STUDENT_PROFILE: StudentProfile = {
  name: 'Estudiante',
  title: 'Estudiante Universitario/a',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  university: 'Facultad de Ciencias Médicas - UNCA',
  faculty: 'FCM',
  career: 'Medicina',
  currentYear: '1er Año',
  semester: 'Primer Semestre',
  gpa: 5.0,
  totalClasses: 0,
  attendedClasses: 0,
  studentId: 'EST-2026',
  email: '',
};

interface AppContextType {
  // Authentication & Profile
  currentUser: AuthUser | null;
  setCurrentUser: (user: AuthUser | null) => void;
  profile: StudentProfile;
  updateProfile: (updated: Partial<StudentProfile>) => void;
  updateAvatar: (fileOrUrl: File | string) => Promise<boolean>;

  // Subjects (CRUD)
  subjects: Subject[];
  addSubject: (newSub: Omit<Subject, 'id'> | Subject) => Subject;
  updateSubject: (updated: Subject) => void;
  deleteSubject: (subjectId: string) => void;

  // Schedule / Clases (CRUD)
  schedule: ClassScheduleItem[];
  addClass: (newClass: Omit<ClassScheduleItem, 'id'> | ClassScheduleItem) => ClassScheduleItem;
  batchAddClasses: (newClasses: (Omit<ClassScheduleItem, 'id'> | ClassScheduleItem)[]) => ClassScheduleItem[];
  updateClass: (updated: ClassScheduleItem) => void;
  deleteClass: (classId: string) => void;

  // Attendance
  updateAttendance: (subjectId: string, deltaAttended: number, deltaTotal: number, deltaCancelled?: number) => void;
  adjustSubjectAttendance: (subjectId: string, delta: { attended?: number; total?: number; cancelled?: number }) => void;
  setSubjectAttendanceStats: (subjectId: string, stats: { totalClasses?: number; attendedClasses?: number; cancelledClasses?: number }) => void;
  markClassCancelled: (subjectId: string) => void;
  overallAttendancePercentage: number;
  overallGPA: number;

  // Exams (CRUD)
  exams: Exam[];
  addExam: (newExam: Omit<Exam, 'id'> | Exam) => Exam;
  batchAddExams: (newExams: (Omit<Exam, 'id'> | Exam)[]) => Exam[];
  updateExam: (updated: Exam) => void;
  deleteExam: (examId: string) => void;

  // Navigation & View Modals
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeThemeId: ThemeId;
  setActiveThemeId: (themeId: ThemeId) => void;
  currentBg: BackgroundTheme;
  setCurrentBg: (bg: BackgroundTheme) => void;
  showResearchTab: boolean;
  setShowResearchTab: (show: boolean) => void;
  isBgModalOpen: boolean;
  setIsBgModalOpen: (open: boolean) => void;
  isVoiceModalOpen: boolean;
  setIsVoiceModalOpen: (open: boolean) => void;
  voicePromptPreset: string;
  setVoicePromptPreset: (prompt: string) => void;
  openVoiceModalWithPrompt: (prompt?: string) => void;
  selectedSubject: Subject | null;
  setSelectedSubject: (subject: Subject | null) => void;
  isPetalsActive: boolean;
  setIsPetalsActive: React.Dispatch<React.SetStateAction<boolean>>;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;

  // Batch State Sync
  importSchedule: (classes: ClassScheduleItem[]) => void;
  resetToBlank: () => void;
  resetToBlankCanvas: () => void;
  loadStarterTemplate: () => void;
  logout: () => void;
  handleLogout: () => void;
  handleLoginSuccess: (user: AuthUser) => void;

  // Spotify Focus & Persistent Player Integration
  activeSpotifyPlaylist: SpotifyPlaylistPreset;
  setActiveSpotifyPlaylist: (playlist: SpotifyPlaylistPreset) => void;
  customSpotifyUrl: string;
  setCustomSpotifyUrl: (url: string) => void;
  saveCustomPlaylist: (url: string, setAsActive?: boolean, customName?: string) => boolean;
  isSpotifyModalOpen: boolean;
  setIsSpotifyModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current logged in user (starts from storage or empty)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    return safeGet<AuthUser | null>('campusbloom_current_user', null);
  });

  const userKey = useMemo(() => {
    return currentUser
      ? currentUser.email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_')
      : 'guest_user';
  }, [currentUser]);

  // Unified global entities initialized empty from localStorage (Blank Canvas default)
  const [profile, setProfile] = useState<StudentProfile>(() => {
    const saved = safeGet<StudentProfile | null>(`campusbloom_${userKey}_profile`, null);
    if (saved) return saved;
    if (currentUser) {
      return {
        ...BLANK_STUDENT_PROFILE,
        name: currentUser.name || 'Estudiante',
        email: currentUser.email || '',
        career: currentUser.career || BLANK_STUDENT_PROFILE.career,
        university: currentUser.university || BLANK_STUDENT_PROFILE.university,
      };
    }
    return BLANK_STUDENT_PROFILE;
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = safeGet<Subject[] | null>(`campusbloom_${userKey}_subjects`, null);
    if (saved) return saved;
    return [];
  });

  const [schedule, setSchedule] = useState<ClassScheduleItem[]>(() => {
    const saved = safeGet<ClassScheduleItem[] | null>(`campusbloom_${userKey}_schedule`, null);
    if (saved) return saved;
    return [];
  });

  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = safeGet<Exam[] | null>(`campusbloom_${userKey}_exams`, null);
    if (saved) return saved;
    return [];
  });

  // UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>('resumen');
  const [activeThemeId, setActiveThemeId] = useState<ThemeId>(() => {
    return safeGet<ThemeId>(`campusbloom_${userKey}_theme_id`, 'sakura-matcha');
  });
  const [currentBg, setCurrentBg] = useState<BackgroundTheme>(() => {
    return safeGet<BackgroundTheme>(`campusbloom_${userKey}_bg`, BACKGROUND_THEMES[0]);
  });
  const [showResearchTab, setShowResearchTab] = useState<boolean>(() => {
    return safeGet<boolean>(`campusbloom_${userKey}_show_research_tab`, true);
  });

  const [isBgModalOpen, setIsBgModalOpen] = useState<boolean>(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [voicePromptPreset, setVoicePromptPreset] = useState<string>('');

  const openVoiceModalWithPrompt = useCallback((prompt?: string) => {
    if (prompt) {
      setVoicePromptPreset(prompt);
    } else {
      setVoicePromptPreset('');
    }
    setIsVoiceModalOpen(true);
  }, []);

  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isPetalsActive, setIsPetalsActive] = useState<boolean>(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Spotify Focus & Persistent Player State
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState<boolean>(false);
  const [customSpotifyUrl, setCustomSpotifyUrl] = useState<string>(() => {
    return safeGet<string>(`campusbloom_${userKey}_custom_spotify_url`, '');
  });
  const [activeSpotifyPlaylist, setActiveSpotifyPlaylistState] = useState<SpotifyPlaylistPreset>(() => {
    const savedCustomUrl = safeGet<string>(`campusbloom_${userKey}_custom_spotify_url`, '');
    const savedActive = safeGet<SpotifyPlaylistPreset | null>(`campusbloom_${userKey}_active_spotify_playlist`, null);
    if (savedActive && savedActive.embedUrl) {
      const cleanUrl = convertToSpotifyEmbedUrl(savedActive.embedUrl);
      if (cleanUrl) {
        return {
          ...savedActive,
          embedUrl: cleanUrl,
        };
      }
    }
    if (savedCustomUrl) {
      const customPreset = createCustomSpotifyPreset(savedCustomUrl);
      if (customPreset) return customPreset;
    }
    return PRESET_PLAYLISTS[0];
  });

  const setActiveSpotifyPlaylist = useCallback((playlist: SpotifyPlaylistPreset) => {
    setActiveSpotifyPlaylistState(playlist);
    safeSet(`campusbloom_${userKey}_active_spotify_playlist`, playlist);
  }, [userKey]);

  const saveCustomPlaylist = useCallback((url: string, setAsActive = true, customName?: string): boolean => {
    const customPreset = createCustomSpotifyPreset(url, customName);
    if (!customPreset) return false;

    setCustomSpotifyUrl(url);
    safeSet(`campusbloom_${userKey}_custom_spotify_url`, url);

    if (setAsActive) {
      setActiveSpotifyPlaylistState(customPreset);
      safeSet(`campusbloom_${userKey}_active_spotify_playlist`, customPreset);
    }
    return true;
  }, [userKey]);

  // Sync state whenever userKey changes
  useEffect(() => {
    if (currentUser) {
      const savedProfile = safeGet<StudentProfile | null>(`campusbloom_${userKey}_profile`, null);
      if (savedProfile) {
        setProfile(savedProfile);
      } else {
        setProfile({
          ...BLANK_STUDENT_PROFILE,
          name: currentUser.name || 'Estudiante',
          email: currentUser.email || '',
          career: currentUser.career || BLANK_STUDENT_PROFILE.career,
          university: currentUser.university || BLANK_STUDENT_PROFILE.university,
        });
      }
      setSubjects(safeGet<Subject[]>(`campusbloom_${userKey}_subjects`, []));
      setSchedule(safeGet<ClassScheduleItem[]>(`campusbloom_${userKey}_schedule`, []));
      setExams(safeGet<Exam[]>(`campusbloom_${userKey}_exams`, []));
      setCurrentBg(safeGet<BackgroundTheme>(`campusbloom_${userKey}_bg`, BACKGROUND_THEMES[0]));
      setShowResearchTab(safeGet<boolean>(`campusbloom_${userKey}_show_research_tab`, true));
      setActiveThemeId(safeGet<ThemeId>(`campusbloom_${userKey}_theme_id`, 'sakura-matcha'));
    }
  }, [userKey, currentUser]);

  // Set global HTML data-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeThemeId);
    safeSet(`campusbloom_${userKey}_theme_id`, activeThemeId);
  }, [activeThemeId, userKey]);

  // Recalculate profile summary stats whenever subjects change
  const syncProfileMetrics = useCallback((updatedSubjects: Subject[]) => {
    setProfile((prev) => {
      const totalClasses = updatedSubjects.reduce((acc, s) => acc + (s.totalClasses || 0), 0);
      const attendedClasses = updatedSubjects.reduce((acc, s) => acc + (s.attendedClasses || 0), 0);
      const cancelledClasses = updatedSubjects.reduce((acc, s) => acc + (s.cancelledClasses || 0), 0);
      const validGrades = updatedSubjects.filter((s) => typeof s.grade === 'number' && s.grade > 0);
      const avgGPA =
        validGrades.length > 0
          ? Number((validGrades.reduce((acc, s) => acc + s.grade, 0) / validGrades.length).toFixed(2))
          : prev.gpa || 5.0;

      const newProfile: StudentProfile = {
        ...prev,
        totalClasses,
        attendedClasses,
        cancelledClasses,
        gpa: avgGPA,
      };

      safeSet(`campusbloom_${userKey}_profile`, newProfile);
      return newProfile;
    });
  }, [userKey]);

  // Safe persistence effects
  useEffect(() => {
    safeSet(`campusbloom_${userKey}_profile`, profile);
  }, [profile, userKey]);

  useEffect(() => {
    safeSet(`campusbloom_${userKey}_subjects`, subjects);
  }, [subjects, userKey]);

  useEffect(() => {
    safeSet(`campusbloom_${userKey}_schedule`, schedule);
  }, [schedule, userKey]);

  useEffect(() => {
    safeSet(`campusbloom_${userKey}_exams`, exams);
  }, [exams, userKey]);

  useEffect(() => {
    safeSet(`campusbloom_${userKey}_bg`, currentBg);
  }, [currentBg, userKey]);

  useEffect(() => {
    safeSet(`campusbloom_${userKey}_show_research_tab`, showResearchTab);
  }, [showResearchTab, userKey]);

  // Calculated overall metrics: Cancelled classes by the professor DO NOT penalize attendance percentage
  const overallAttendancePercentage = useMemo(() => {
    const total = subjects.reduce((acc, s) => acc + (s.totalClasses || 0), 0);
    const cancelled = subjects.reduce((acc, s) => acc + (s.cancelledClasses || 0), 0);
    const attended = subjects.reduce((acc, s) => acc + (s.attendedClasses || 0), 0);

    const effectiveTotal = Math.max(0, total - cancelled);
    if (effectiveTotal === 0) return 100;
    return Math.min(100, Math.max(0, Math.round((Math.min(attended, effectiveTotal) / effectiveTotal) * 100)));
  }, [subjects]);

  const overallGPA = useMemo(() => {
    const valid = subjects.filter((s) => typeof s.grade === 'number' && s.grade > 0);
    if (valid.length === 0) return profile.gpa || 5.0;
    const sum = valid.reduce((acc, s) => acc + s.grade, 0);
    return Number((sum / valid.length).toFixed(2));
  }, [subjects, profile.gpa]);

  // --- CRUD: SUBJECTS ---
  const addSubject = useCallback((newSubInput: Omit<Subject, 'id'> | Subject): Subject => {
    const id = 'id' in newSubInput && newSubInput.id ? newSubInput.id : `subj-${Date.now()}`;
    const subjectToAdd: Subject = {
      ...newSubInput,
      id,
      name: newSubInput.name.trim(),
      grade: typeof newSubInput.grade === 'number' ? newSubInput.grade : 4.5,
      maxGrade: 5.0,
      professor: newSubInput.professor || 'Docente de Cátedra',
      classroom: newSubInput.classroom || 'Aula Central',
      credits: newSubInput.credits || 6,
      totalClasses: typeof newSubInput.totalClasses === 'number' ? newSubInput.totalClasses : 28,
      attendedClasses: typeof newSubInput.attendedClasses === 'number' ? newSubInput.attendedClasses : 0,
      color: newSubInput.color || '#864e5a',
    };

    setSubjects((prev) => {
      const next = [...prev, subjectToAdd];
      safeSet(`campusbloom_${userKey}_subjects`, next);
      syncProfileMetrics(next);
      return next;
    });

    return subjectToAdd;
  }, [userKey, syncProfileMetrics]);

  const updateSubject = useCallback((updated: Subject) => {
    setSubjects((prev) => {
      const next = prev.map((s) => (s.id === updated.id ? updated : s));
      safeSet(`campusbloom_${userKey}_subjects`, next);
      syncProfileMetrics(next);
      return next;
    });

    // Also cascade update subjectName & color to schedule and exams
    setSchedule((prev) => {
      const next = prev.map((c) => {
        if (c.subjectId === updated.id) {
          return {
            ...c,
            subjectName: updated.name,
            color: updated.color,
            professor: updated.professor || c.professor,
          };
        }
        return c;
      });
      safeSet(`campusbloom_${userKey}_schedule`, next);
      return next;
    });

    setExams((prev) => {
      const next = prev.map((e) => {
        if (e.subjectId === updated.id) {
          return {
            ...e,
            subjectName: updated.name,
          };
        }
        return e;
      });
      safeSet(`campusbloom_${userKey}_exams`, next);
      return next;
    });
  }, [userKey, syncProfileMetrics]);

  const deleteSubject = useCallback((subjectId: string) => {
    setSubjects((prev) => {
      const next = prev.filter((s) => s.id !== subjectId);
      safeSet(`campusbloom_${userKey}_subjects`, next);
      syncProfileMetrics(next);
      return next;
    });

    // Cascade delete classes and exams linked to this subject
    setSchedule((prev) => {
      const next = prev.filter((c) => c.subjectId !== subjectId);
      safeSet(`campusbloom_${userKey}_schedule`, next);
      return next;
    });

    setExams((prev) => {
      const next = prev.filter((e) => e.subjectId !== subjectId);
      safeSet(`campusbloom_${userKey}_exams`, next);
      return next;
    });

    if (selectedSubject?.id === subjectId) {
      setSelectedSubject(null);
    }
  }, [userKey, syncProfileMetrics, selectedSubject]);

  // --- CRUD: SCHEDULE / CLASES ---
  const addClass = useCallback((newClassInput: Omit<ClassScheduleItem, 'id'> | ClassScheduleItem): ClassScheduleItem => {
    const id = 'id' in newClassInput && newClassInput.id ? newClassInput.id : `sch-${Date.now()}`;
    const classToAdd: ClassScheduleItem = {
      ...newClassInput,
      id,
    };

    setSchedule((prev) => {
      const next = [...prev, classToAdd];
      safeSet(`campusbloom_${userKey}_schedule`, next);
      return next;
    });

    return classToAdd;
  }, [userKey]);

  const batchAddClasses = useCallback(
    (newClassesInput: (Omit<ClassScheduleItem, 'id'> | ClassScheduleItem)[]): ClassScheduleItem[] => {
      const subjectColors = ['#864e5a', '#4e6535', '#2b4c7e', '#7c3aed', '#b45309', '#0f766e'];
      const addedClasses: ClassScheduleItem[] = [];

      // Auto create missing subjects
      setSubjects((prevSubjects) => {
        const existingNames = new Set(prevSubjects.map((s) => s.name.toLowerCase().trim()));
        const newlyCreated: Subject[] = [];

        newClassesInput.forEach((item, idx) => {
          const subName = item.subjectName?.trim() || 'Materia';
          if (!existingNames.has(subName.toLowerCase())) {
            existingNames.add(subName.toLowerCase());
            newlyCreated.push({
              id: item.subjectId && !item.subjectId.startsWith('subj-') ? item.subjectId : `subj-${Date.now()}-${idx}`,
              name: subName,
              grade: 4.8,
              maxGrade: 5.0,
              professor: item.professor || 'Docente de Cátedra',
              classroom: item.location || 'Aula Magna',
              credits: 6,
              totalClasses: 28,
              attendedClasses: 26,
              color: item.color || subjectColors[(prevSubjects.length + newlyCreated.length) % subjectColors.length],
            });
          }
        });

        if (newlyCreated.length > 0) {
          const updated = [...prevSubjects, ...newlyCreated];
          safeSet(`campusbloom_${userKey}_subjects`, updated);
          syncProfileMetrics(updated);
          return updated;
        }
        return prevSubjects;
      });

      setSchedule((prev) => {
        const created = newClassesInput.map((c, i) => ({
          ...c,
          id: 'id' in c && c.id ? c.id : `sch-${Date.now()}-${i}`,
        }));
        addedClasses.push(...created);
        const next = [...prev, ...created];
        safeSet(`campusbloom_${userKey}_schedule`, next);
        return next;
      });

      return addedClasses;
    },
    [userKey, syncProfileMetrics]
  );

  const updateClass = useCallback((updated: ClassScheduleItem) => {
    setSchedule((prev) => {
      const next = prev.map((c) => (c.id === updated.id ? updated : c));
      safeSet(`campusbloom_${userKey}_schedule`, next);
      return next;
    });
  }, [userKey]);

  const deleteClass = useCallback((classId: string) => {
    setSchedule((prev) => {
      const next = prev.filter((c) => c.id !== classId);
      safeSet(`campusbloom_${userKey}_schedule`, next);
      return next;
    });
  }, [userKey]);

  // --- ATTENDANCE SYNC & CONTROLS ---
  const updateAttendance = useCallback(
    (subjectId: string, deltaAttended: number, deltaTotal: number, deltaCancelled = 0) => {
      setSubjects((prev) => {
        const next = prev.map((s) => {
          if (s.id === subjectId) {
            const currentCancelled = s.cancelledClasses || 0;
            const newCancelled = Math.max(0, currentCancelled + deltaCancelled);
            const totalClasses = Math.max(0, s.totalClasses + deltaTotal);
            const attendedClasses = Math.max(0, Math.min(totalClasses, s.attendedClasses + deltaAttended));
            return {
              ...s,
              totalClasses,
              attendedClasses,
              cancelledClasses: newCancelled,
            };
          }
          return s;
        });
        safeSet(`campusbloom_${userKey}_subjects`, next);
        syncProfileMetrics(next);
        return next;
      });
    },
    [userKey, syncProfileMetrics]
  );

  const adjustSubjectAttendance = useCallback(
    (subjectId: string, delta: { attended?: number; total?: number; cancelled?: number }) => {
      setSubjects((prev) => {
        const next = prev.map((s) => {
          if (s.id === subjectId) {
            const totalClasses = Math.max(0, s.totalClasses + (delta.total || 0));
            const cancelledClasses = Math.max(0, (s.cancelledClasses || 0) + (delta.cancelled || 0));
            const attendedClasses = Math.max(0, Math.min(totalClasses, s.attendedClasses + (delta.attended || 0)));
            return {
              ...s,
              totalClasses,
              attendedClasses,
              cancelledClasses,
            };
          }
          return s;
        });
        safeSet(`campusbloom_${userKey}_subjects`, next);
        syncProfileMetrics(next);
        return next;
      });
    },
    [userKey, syncProfileMetrics]
  );

  const setSubjectAttendanceStats = useCallback(
    (subjectId: string, stats: { totalClasses?: number; attendedClasses?: number; cancelledClasses?: number }) => {
      setSubjects((prev) => {
        const next = prev.map((s) => {
          if (s.id === subjectId) {
            const newTotal = stats.totalClasses !== undefined ? Math.max(0, stats.totalClasses) : s.totalClasses;
            const newCancelled = stats.cancelledClasses !== undefined ? Math.max(0, stats.cancelledClasses) : (s.cancelledClasses || 0);
            const newAttended = stats.attendedClasses !== undefined ? Math.max(0, Math.min(newTotal, stats.attendedClasses)) : s.attendedClasses;
            return {
              ...s,
              totalClasses: newTotal,
              attendedClasses: newAttended,
              cancelledClasses: newCancelled,
            };
          }
          return s;
        });
        safeSet(`campusbloom_${userKey}_subjects`, next);
        syncProfileMetrics(next);
        return next;
      });
    },
    [userKey, syncProfileMetrics]
  );

  const markClassCancelled = useCallback(
    (subjectId: string) => {
      setSubjects((prev) => {
        const next = prev.map((s) => {
          if (s.id === subjectId) {
            return {
              ...s,
              cancelledClasses: (s.cancelledClasses || 0) + 1,
            };
          }
          return s;
        });
        safeSet(`campusbloom_${userKey}_subjects`, next);
        syncProfileMetrics(next);
        return next;
      });
    },
    [userKey, syncProfileMetrics]
  );

  // --- CRUD: EXAMS ---
  const addExam = useCallback((newExamInput: Omit<Exam, 'id'> | Exam): Exam => {
    const id = 'id' in newExamInput && newExamInput.id ? newExamInput.id : `exam-${Date.now()}`;
    const examToAdd: Exam = {
      ...newExamInput,
      id,
    };

    setExams((prev) => {
      const next = [...prev, examToAdd];
      safeSet(`campusbloom_${userKey}_exams`, next);
      return next;
    });

    return examToAdd;
  }, [userKey]);

  const batchAddExams = useCallback(
    (newExamsInput: (Omit<Exam, 'id'> | Exam)[]): Exam[] => {
      const subjectColors = ['#864e5a', '#4e6535', '#2b4c7e', '#7c3aed', '#b45309', '#0f766e'];
      const addedExams: Exam[] = [];

      // Auto create missing subjects
      setSubjects((prevSubjects) => {
        const existingNames = new Set(prevSubjects.map((s) => s.name.toLowerCase().trim()));
        const newlyCreated: Subject[] = [];

        newExamsInput.forEach((item, idx) => {
          const subName = item.subjectName?.trim() || 'Materia';
          if (!existingNames.has(subName.toLowerCase())) {
            existingNames.add(subName.toLowerCase());
            newlyCreated.push({
              id: item.subjectId && !item.subjectId.startsWith('subj-') ? item.subjectId : `subj-${Date.now()}-${idx}`,
              name: subName,
              grade: 4.8,
              maxGrade: 5.0,
              professor: 'Docente de Cátedra',
              classroom: item.classroom || 'Aula Magna',
              credits: 6,
              totalClasses: 28,
              attendedClasses: 26,
              color: subjectColors[(prevSubjects.length + newlyCreated.length) % subjectColors.length],
            });
          }
        });

        if (newlyCreated.length > 0) {
          const updated = [...prevSubjects, ...newlyCreated];
          safeSet(`campusbloom_${userKey}_subjects`, updated);
          syncProfileMetrics(updated);
          return updated;
        }
        return prevSubjects;
      });

      setExams((prev) => {
        const created = newExamsInput.map((e, i) => ({
          ...e,
          id: 'id' in e && e.id ? e.id : `exam-${Date.now()}-${i}`,
        }));
        addedExams.push(...created);
        const next = [...prev, ...created];
        safeSet(`campusbloom_${userKey}_exams`, next);
        return next;
      });

      return addedExams;
    },
    [userKey, syncProfileMetrics]
  );

  const updateExam = useCallback((updated: Exam) => {
    setExams((prev) => {
      const next = prev.map((e) => (e.id === updated.id ? updated : e));
      safeSet(`campusbloom_${userKey}_exams`, next);
      return next;
    });
  }, [userKey]);

  const deleteExam = useCallback((examId: string) => {
    setExams((prev) => {
      const next = prev.filter((e) => e.id !== examId);
      safeSet(`campusbloom_${userKey}_exams`, next);
      return next;
    });
  }, [userKey]);

  // --- PROFILE UPDATE & AVATAR COMPRESSION ---
  const updateProfile = useCallback((updated: Partial<StudentProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updated };
      safeSet(`campusbloom_${userKey}_profile`, next);
      return next;
    });
  }, [userKey]);

  const updateAvatar = useCallback(async (fileOrUrl: File | string): Promise<boolean> => {
    try {
      // Compress automatically via HTML Canvas to max 800px and JPEG quality 0.7
      const compressed = await compressImage(fileOrUrl, 800, 800, 0.7);
      updateProfile({ avatarUrl: compressed });
      return true;
    } catch (err) {
      console.error('Error compressing avatar image:', err);
      try {
        if (typeof fileOrUrl === 'string') {
          updateProfile({ avatarUrl: fileOrUrl });
          return true;
        }
      } catch (fallbackErr) {
        console.error('Fallback update avatar error:', fallbackErr);
      }
      return false;
    }
  }, [updateProfile]);

  // Reset all user data to clean blank canvas
  const resetToBlank = useCallback(() => {
    setSubjects([]);
    setSchedule([]);
    setExams([]);
    setProfile(BLANK_STUDENT_PROFILE);
    safeRemove(`campusbloom_${userKey}_subjects`);
    safeRemove(`campusbloom_${userKey}_schedule`);
    safeRemove(`campusbloom_${userKey}_exams`);
    safeSet(`campusbloom_${userKey}_profile`, BLANK_STUDENT_PROFILE);
  }, [userKey]);

  // Starter medical template (loads the official FCM UNCA subjects & schedule)
  const loadStarterTemplate = useCallback(() => {
    setSubjects(INITIAL_SUBJECTS);
    setSchedule(INITIAL_SCHEDULE);
    setExams(INITIAL_EXAMS);
    syncProfileMetrics(INITIAL_SUBJECTS);
    safeSet(`campusbloom_${userKey}_subjects`, INITIAL_SUBJECTS);
    safeSet(`campusbloom_${userKey}_schedule`, INITIAL_SCHEDULE);
    safeSet(`campusbloom_${userKey}_exams`, INITIAL_EXAMS);
  }, [userKey, syncProfileMetrics]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    safeRemove('campusbloom_current_user');
    setActiveTab('resumen');
  }, []);

  const handleLoginSuccess = useCallback((user: AuthUser) => {
    setCurrentUser(user);
    safeSet('campusbloom_current_user', user);

    // Synchronize StudentProfile with user's details
    const cleanUserKey = user.email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
    const existingProfile = safeGet<StudentProfile | null>(`campusbloom_${cleanUserKey}_profile`, null);

    const updatedProfile: StudentProfile = {
      ...(existingProfile || BLANK_STUDENT_PROFILE),
      name: user.name || existingProfile?.name || 'Estudiante',
      email: user.email || existingProfile?.email || '',
      career: user.career || existingProfile?.career || BLANK_STUDENT_PROFILE.career,
      university: user.university || existingProfile?.university || BLANK_STUDENT_PROFILE.university,
      faculty: user.university || existingProfile?.faculty || BLANK_STUDENT_PROFILE.faculty,
    };

    setProfile(updatedProfile);
    safeSet(`campusbloom_${cleanUserKey}_profile`, updatedProfile);

    // Redirect directly to Overview (Resumen)
    setActiveTab('resumen');
  }, []);

  const importSchedule = useCallback((classes: ClassScheduleItem[]) => {
    setSchedule((prev) => [...classes, ...prev]);
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        profile,
        updateProfile,
        updateAvatar,
        subjects,
        addSubject,
        updateSubject,
        deleteSubject,
        schedule,
        addClass,
        batchAddClasses,
        updateClass,
        deleteClass,
        updateAttendance,
        adjustSubjectAttendance,
        setSubjectAttendanceStats,
        markClassCancelled,
        overallAttendancePercentage,
        overallGPA,
        exams,
        addExam,
        batchAddExams,
        updateExam,
        deleteExam,
        activeTab,
        setActiveTab,
        activeThemeId,
        setActiveThemeId,
        currentBg,
        setCurrentBg,
        showResearchTab,
        setShowResearchTab,
        isBgModalOpen,
        setIsBgModalOpen,
        isVoiceModalOpen,
        setIsVoiceModalOpen,
        voicePromptPreset,
        setVoicePromptPreset,
        openVoiceModalWithPrompt,
        selectedSubject,
        setSelectedSubject,
        isPetalsActive,
        setIsPetalsActive,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        importSchedule,
        resetToBlank,
        resetToBlankCanvas: resetToBlank,
        loadStarterTemplate,
        logout,
        handleLogout: logout,
        handleLoginSuccess,
        activeSpotifyPlaylist,
        setActiveSpotifyPlaylist,
        customSpotifyUrl,
        setCustomSpotifyUrl,
        saveCustomPlaylist,
        isSpotifyModalOpen,
        setIsSpotifyModalOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
