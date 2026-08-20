export interface Subject {
  id: string;
  name: string;
  grade: number; // e.g. 4.5
  maxGrade: number; // 5.0
  professor: string;
  classroom: string;
  credits: number;
  totalClasses: number;
  attendedClasses: number;
  cancelledClasses?: number; // Clases canceladas / sin clase / docente ausente (no perjudica al alumno)
  color: string;
  icon?: string;
  upcomingExam?: string;
  examDate?: string;
}

export interface StudentProfile {
  name: string;
  title: string; // e.g., "Estudiante Universitaria"
  avatarUrl: string;
  university: string;
  faculty: string;
  career: string;
  currentYear: string;
  semester: string;
  gpa: number;
  totalClasses: number;
  attendedClasses: number;
  cancelledClasses?: number; // Total clases canceladas por docentes
  studentId: string;
  email: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  career?: string;
  university?: string;
  createdAt?: string;
}

export interface ClassScheduleItem {
  id: string;
  subjectId: string;
  subjectName: string;
  dayOfWeek: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';
  startTime: string;
  endTime: string;
  location: string;
  professor: string;
  type: 'Teoría' | 'Práctica' | 'Laboratorio' | 'Seminario';
  color: string;
}

export interface Exam {
  id: string;
  subjectId: string;
  subjectName: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string;
  classroom: string;
  weight: string; // e.g. "30% Parcial"
  status: 'upcoming' | 'completed' | 'in-progress';
  topics: string[];
  score?: number; // Puntaje / Nota obtenida (ej. 28)
  maxScore?: number; // Puntaje total del examen (ej. 30 o 100)
  notes?: string;
}

export interface AttendanceEntry {
  id: string;
  date: string;
  subjectId: string;
  status: 'present' | 'absent' | 'justified' | 'cancelled';
  notes?: string;
}

export interface BackgroundTheme {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  url: string;
  overlayOpacity: number;
  isDark?: boolean;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  duration: number; // in seconds
  soundType: 'lofi-beats' | 'rain-cafe' | 'ambient-zen' | 'piano-chill';
}

export type ActiveTab = 'resumen' | 'cronograma' | 'asistencia' | 'examenes' | 'investigacion' | 'perfil';

export interface ResearchHourLog {
  id: string;
  date: string; // YYYY-MM-DD or readable
  topic: string; // Tema revisado
  hours: number; // e.g. 2
  status: 'En proceso' | 'Culminado';
  notes?: string;
}

export interface ProjectRequirement {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  category?: 'tutoría' | 'manuscrito' | 'ética' | 'evaluación' | 'documentación' | 'otro';
  dueDate?: string;
  notes?: string;
}

export interface ResearchProject {
  id: string;
  title: string;
  description: string;
  advisor: string; // Dra. Gladys or custom
  status: 'Pendiente' | 'En proceso' | 'Culminado';
  lastUpdated?: string;
  linkUrl?: string;
  dueDate?: string;
  requirements?: ProjectRequirement[];
  customTargetHours?: number;
}

export interface DefenseConfig {
  ordinaryDate: string;
  ordinaryNotes: string;
  extraordinaryDate: string;
  extraordinaryNotes: string;
  manuscriptApprovalStatus: 'Pendiente' | 'Aprobado' | 'En revisión';
  customNotes?: string;
}

export type NotificationType = 'exam' | 'assignment' | 'campus' | 'attendance';

export interface AcademicNotification {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  timestamp: string;
  date: string;
  isRead: boolean;
  actionLabel?: string;
  priority?: 'high' | 'medium' | 'low';
  tag?: string;
}

export type ThemeId = 'sakura-matcha' | 'bosque-nocturno' | 'azul-pizarra' | 'grafito-monocromo';

export interface ThemeColorToken {
  name: string;
  hex: string;
  label: string;
  textColor?: string;
}

export interface ThemePalette {
  id: ThemeId;
  name: string;
  tagline: string;
  description: string;
  emoji: string;
  badge: string;
  isDark: boolean;
  accentColor: string;
  secondaryColor: string;
  bgTint: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  defaultWallpaperUrl: string;
  particleType: 'sakura' | 'emerald-leaves' | 'ice-sparks' | 'monochrome-dust';
  tokens: ThemeColorToken[];
}

export interface UnifiedCronogramaEvent {
  materia: string;
  tipo: string;
  fecha: string;
  horario: string;
  tema?: string;
  aula?: string;
  docente?: string;
}

export interface SpotifyPlaylistPreset {
  id: string;
  name: string;
  tagline: string;
  category: 'lofi' | 'piano' | 'ambient' | 'focus' | 'classical' | 'custom';
  embedUrl: string;
  coverImage?: string;
  iconName: 'lofi' | 'piano' | 'ambient' | 'coffee' | 'focus' | 'classical' | 'custom';
  isCustom?: boolean;
  colorTheme: {
    bg: string;
    text: string;
    border: string;
  };
}
