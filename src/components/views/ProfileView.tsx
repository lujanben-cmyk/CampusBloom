import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Award,
  BookOpen,
  Sparkles,
  Image as ImageIcon,
  Volume2,
  VolumeX,
  Save,
  RotateCcw,
  Check,
  Camera,
  Heart,
  Palette,
  Layers,
  Sliders,
  Play,
  Pause,
  Square,
  X,
  ExternalLink,
  Download,
  Copy,
  Info,
  Calendar,
  GraduationCap,
  Mail,
  Hash,
  School,
  CheckCircle2,
  Cloud,
  Folder,
  Globe,
  Music,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Share2,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  Radio,
  FileText,
  LogOut,
  Link2,
} from 'lucide-react';

import { THEME_PALETTES } from '../../data/themePalettes';
import { ThemeId, Subject } from '../../types';
import { useApp } from '../../context/AppContext';
import { SubjectManageModal } from '../modals/SubjectManageModal';
import { compressImage } from '../../utils/storage';
import { Trash2, Plus } from 'lucide-react';

/* ==========================================================================
   SELF-CONTAINED TYPES & INTERFACES
   (Ready to copy-paste without external type imports)
   ========================================================================== */

export interface StudentProfile {
  name: string;
  title: string;
  avatarUrl: string;
  university: string;
  faculty: string;
  career: string;
  currentYear: string;
  semester: string;
  gpa: number;
  totalClasses: number;
  attendedClasses: number;
  studentId: string;
  email: string;
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

export interface CloudLinkItem {
  id: 'google-drive' | 'aula-virtual';
  name: string;
  label: string;
  description: string;
  url: string;
  defaultUrl: string;
}

export interface SpotifyTrackPreset {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  coverUrl: string;
  soundType: 'lofi-beats' | 'rain-cafe' | 'piano-chill' | 'ambient-zen';
  badge: string;
}

export interface ProfileViewProps {
  currentUser?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    career?: string;
    university?: string;
  } | null;
  profile?: StudentProfile;
  currentBg?: BackgroundTheme;
  activeThemeId?: ThemeId;
  showResearchTab?: boolean;
  onToggleResearchTab?: (enabled: boolean) => void;
  onUpdateProfile?: (updated: StudentProfile) => void;
  onSelectBackground?: (theme: BackgroundTheme) => void;
  onSelectThemeId?: (themeId: ThemeId) => void;
  onResetDefaults?: () => void;
  onLogout?: () => void;
}

/* ==========================================================================
   SELF-CONTAINED INITIAL DATA & THEMES
   ========================================================================== */

const DEFAULT_PROFILE: StudentProfile = {
  name: '',
  title: '',
  avatarUrl: '',
  university: '',
  faculty: '',
  career: '',
  currentYear: '',
  semester: '',
  gpa: 0,
  totalClasses: 0,
  attendedClasses: 0,
  studentId: '',
  email: '',
};

const BOTANICAL_BACKGROUNDS: BackgroundTheme[] = [
  {
    id: 'matcha-sakura',
    name: 'Matcha & Pétalos Sakura',
    category: 'Botánica Calma',
    thumbnail: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
    url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=2000&q=85',
    overlayOpacity: 0.15,
  },
  {
    id: 'sakura-blossom',
    name: 'Flores de Cerezo Japonés',
    category: 'Primavera',
    thumbnail: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=400&q=80',
    url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=2000&q=85',
    overlayOpacity: 0.20,
  },
  {
    id: 'lofi-desk',
    name: 'Rincón de Estudio & Té',
    category: 'Estudio Lo-Fi',
    thumbnail: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=400&q=80',
    url: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=2000&q=85',
    overlayOpacity: 0.22,
  },
  {
    id: 'greenhouse',
    name: 'Invernadero Botánico',
    category: 'Naturaleza',
    thumbnail: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=400&q=80',
    url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=2000&q=85',
    overlayOpacity: 0.18,
  },
  {
    id: 'zen-garden',
    name: 'Jardín Zen de Rocas & Bonsái',
    category: 'Meditación',
    thumbnail: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=400&q=80',
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=2000&q=85',
    overlayOpacity: 0.18,
  },
  {
    id: 'rainy-cafe',
    name: 'Ventana de Café Lluvioso',
    category: 'Atmósfera',
    thumbnail: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80',
    url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=2000&q=85',
    overlayOpacity: 0.25,
    isDark: true,
  },
  {
    id: 'bamboo-mist',
    name: 'Bosque de Bambú y Niebla',
    category: 'Zen & Enfoque',
    thumbnail: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=80',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=2000&q=85',
    overlayOpacity: 0.18,
  },
  {
    id: 'vintage-library',
    name: 'Biblioteca Clásica de Medicina',
    category: 'Académico',
    thumbnail: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=400&q=80',
    url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=2000&q=85',
    overlayOpacity: 0.22,
    isDark: true,
  },
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
];

const SPOTIFY_PRESETS: SpotifyTrackPreset[] = [
  {
    id: 'track-1',
    title: 'Sakura Rain Beats (Focus Study)',
    artist: 'CampusBloom Lo-Fi Girl & ChilledCow',
    album: 'Matcha & Coffee Study Sessions',
    duration: 215,
    coverUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80',
    soundType: 'lofi-beats',
    badge: 'Lo-Fi Chill',
  },
  {
    id: 'track-2',
    title: 'Lluvia en Ventana de Biblioteca',
    artist: 'Rain Ambience Collective',
    album: 'Sonidos de Concentración y Calma',
    duration: 260,
    coverUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80',
    soundType: 'rain-cafe',
    badge: 'Lluvia Zen',
  },
  {
    id: 'track-3',
    title: 'Piano Pentatónico & Flores de Té',
    artist: 'Haruka Soft Melodies',
    album: 'FCM Medical Study Beats',
    duration: 188,
    coverUrl: 'https://images.unsplash.com/photo-1520523839898-507127027429?auto=format&fit=crop&w=600&q=80',
    soundType: 'piano-chill',
    badge: 'Piano Suave',
  },
  {
    id: 'track-4',
    title: 'Cuencos Tibetanos & Ondas Zen (432 Hz)',
    artist: 'Mindfulness & Memory Echoes',
    album: 'Ondas Alfa para Retención',
    duration: 320,
    coverUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80',
    soundType: 'ambient-zen',
    badge: 'Ondas Alfa',
  },
];

/* ==========================================================================
   SELF-CONTAINED WEB AUDIO SOUNDSCAPE SYNTHESIZER
   (Synthesizes authentic procedural ambient sounds natively in browser)
   ========================================================================== */

class StandaloneSoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private activeNodes: (AudioNode | number)[] = [];
  private currentVolume: number = 0.5;

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.currentVolume = Math.max(0, Math.min(1, vol));
  }

  public stop() {
    this.activeNodes.forEach((node) => {
      if (typeof node === 'number') {
        window.clearInterval(node);
      } else {
        try {
          if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
            (node as AudioScheduledSourceNode).stop();
          }
          node.disconnect();
        } catch {
          // Ignore disconnection cleanup errors
        }
      }
    });
    this.activeNodes = [];
    this.isRunning = false;
  }

  public playSound(type: 'lofi-beats' | 'rain-cafe' | 'piano-chill' | 'ambient-zen') {
    this.stop();
    this.initCtx();
    if (!this.ctx) return;
    this.isRunning = true;

    if (type === 'rain-cafe') {
      this.generateRainNoise();
    } else if (type === 'lofi-beats') {
      this.generateLofiChords();
    } else if (type === 'piano-chill') {
      this.generatePentatonicPiano();
    } else if (type === 'ambient-zen') {
      this.generateZenBowls();
    }
  }

  private generateRainNoise() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.currentVolume * 0.4, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start();
    this.activeNodes.push(whiteNoise, filter, gain);
  }

  private generateLofiChords() {
    if (!this.ctx) return;
    const chords = [
      [146.83, 220.00, 261.63, 329.63], // Dm9
      [196.00, 246.94, 293.66, 329.63], // G13
      [130.81, 196.00, 246.94, 329.63], // Cmaj9
      [110.00, 164.81, 220.00, 261.63], // Am7
    ];
    let chordIdx = 0;

    const playChord = () => {
      if (!this.ctx || !this.isRunning) return;
      const notes = chords[chordIdx % chords.length];
      chordIdx++;

      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = i === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, this.ctx.currentTime);

        const now = this.ctx.currentTime;
        const noteDuration = 3.8;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(this.currentVolume * 0.12, now + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + noteDuration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + noteDuration);
        this.activeNodes.push(osc, gain, filter);
      });
    };

    playChord();
    const interval = window.setInterval(playChord, 4000);
    this.activeNodes.push(interval);
  }

  private generatePentatonicPiano() {
    if (!this.ctx) return;
    const pentatonicScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];

    const playNote = () => {
      if (!this.ctx || !this.isRunning) return;
      const freq = pentatonicScale[Math.floor(Math.random() * pentatonicScale.length)];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(this.currentVolume * 0.15, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 2.2);
      this.activeNodes.push(osc, gain);
    };

    playNote();
    const interval = window.setInterval(playNote, 1200);
    this.activeNodes.push(interval);
  }

  private generateZenBowls() {
    if (!this.ctx) return;
    const baseFreq = 432; // Harmonic 432Hz tuning

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(baseFreq * 1.5, this.ctx.currentTime); // Perfect fifth

    gain.gain.setValueAtTime(this.currentVolume * 0.08, this.ctx.currentTime);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();
    this.activeNodes.push(osc1, osc2, gain);
  }
}

// Global instance for sound synthesis
const localSynth = new StandaloneSoundSynthesizer();

/* ==========================================================================
   PROFILE VIEW COMPONENT
   ========================================================================== */

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  profile = DEFAULT_PROFILE,
  currentBg = BOTANICAL_BACKGROUNDS[0],
  activeThemeId = 'sakura-matcha',
  showResearchTab = true,
  onToggleResearchTab,
  onUpdateProfile,
  onSelectBackground,
  onSelectThemeId,
  onResetDefaults,
  onLogout,
}) => {
  const userEmail = currentUser?.email || profile?.email || 'default';
  const normalizedEmail = userEmail.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  const cloudDriveKey = `campusbloom_${normalizedEmail}_cloud_drive_url`;
  const cloudPortalKey = `campusbloom_${normalizedEmail}_cloud_portal_url`;
  const spotifyPlaylistKey = `campusbloom_${normalizedEmail}_spotify_playlist_url`;

  const { subjects, deleteSubject, updateAvatar } = useApp();
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState<boolean>(false);
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | undefined>(undefined);

  // Active theme object
  const currentPalette = THEME_PALETTES.find((t) => t.id === activeThemeId) || THEME_PALETTES[0];

  // Local state for editing profile
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<StudentProfile>(profile);
  const [activeBg, setActiveBg] = useState<BackgroundTheme>(currentBg);
  const [customBgUrl, setCustomBgUrl] = useState('');
  const [customBgName, setCustomBgName] = useState('');
  const [showCustomBgInput, setShowCustomBgInput] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State for NUBE section (Google Drive & Aula Virtual)
  const [cloudDriveUrl, setCloudDriveUrl] = useState<string>(() => {
    return (
      localStorage.getItem(cloudDriveKey) ||
      localStorage.getItem('campusbloom_cloud_drive_url') ||
      'https://drive.google.com/drive/folders/campusbloom-estudiante'
    );
  });

  const [cloudPortalUrl, setCloudPortalUrl] = useState<string>(() => {
    return (
      localStorage.getItem(cloudPortalKey) ||
      localStorage.getItem('campusbloom_cloud_portal_url') ||
      'https://aulavirtual.fcmunca.edu.py'
    );
  });

  // Modal for editing NUBE links
  const [isEditingCloudLinks, setIsEditingCloudLinks] = useState(false);
  const [editDriveUrl, setEditDriveUrl] = useState(cloudDriveUrl);
  const [editPortalUrl, setEditPortalUrl] = useState(cloudPortalUrl);

  // State for Spotify Aesthetic Widget & Custom Playlist Link
  const [spotifyPlaylistUrl, setSpotifyPlaylistUrl] = useState<string>(() => {
    return (
      localStorage.getItem(spotifyPlaylistKey) ||
      'https://open.spotify.com/playlist/37i9dQZF1DX8Uebhn9wzrS'
    );
  });
  const [isEditingSpotifyPlaylist, setIsEditingSpotifyPlaylist] = useState<boolean>(false);
  const [editSpotifyUrlInput, setEditSpotifyUrlInput] = useState<string>(spotifyPlaylistUrl);

  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlayingSpotify, setIsPlayingSpotify] = useState<boolean>(false);
  const [isShuffled, setIsShuffled] = useState<boolean>(false);
  const [isRepeating, setIsRepeating] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(true);
  const [likeCount, setLikeCount] = useState<number>(142);
  const [trackProgress, setTrackProgress] = useState<number>(45); // in seconds
  const [volumeLevel, setVolumeLevel] = useState<number>(65);

  // Reload data when user changes
  useEffect(() => {
    const savedDrive = localStorage.getItem(cloudDriveKey);
    if (savedDrive) setCloudDriveUrl(savedDrive);

    const savedPortal = localStorage.getItem(cloudPortalKey);
    if (savedPortal) setCloudPortalUrl(savedPortal);

    const savedSpotify = localStorage.getItem(spotifyPlaylistKey);
    if (savedSpotify) setSpotifyPlaylistUrl(savedSpotify);
  }, [cloudDriveKey, cloudPortalKey, spotifyPlaylistKey]);

  // State for Research Tab Visibility Switch
  const [isResearchTabActive, setIsResearchTabActive] = useState<boolean>(showResearchTab);

  // Sync external props
  useEffect(() => {
    setEditForm(profile);
  }, [profile]);

  useEffect(() => {
    setActiveBg(currentBg);
  }, [currentBg]);

  useEffect(() => {
    setIsResearchTabActive(showResearchTab);
  }, [showResearchTab]);

  // Floating Theme Menu state
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Click outside to close floating theme selector
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    if (isThemeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isThemeMenuOpen]);

  // Audio volume sync
  useEffect(() => {
    localSynth.setVolume(volumeLevel / 100);
  }, [volumeLevel]);

  // Spotify simulated timeline playback
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlayingSpotify) {
      timer = setInterval(() => {
        setTrackProgress((prev) => {
          const currentTrack = SPOTIFY_PRESETS[currentTrackIndex];
          if (prev >= currentTrack.duration) {
            if (isRepeating) {
              return 0;
            } else {
              // Next track
              handleNextTrack();
              return 0;
            }
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlayingSpotify, currentTrackIndex, isRepeating]);

  // Trigger toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Profile save handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateProfile) {
      onUpdateProfile(editForm);
    }
    setIsEditing(false);
    showToast('¡Perfil de estudiante actualizado correctamente!');
  };

  // Background selector handler
  const handleSelectTheme = (theme: BackgroundTheme) => {
    setActiveBg(theme);
    if (onSelectBackground) {
      onSelectBackground(theme);
    }
    showToast(`Fondo "${theme.name}" aplicado.`);
  };

  const handleApplyCustomBackground = () => {
    if (!customBgUrl.trim()) return;
    const newTheme: BackgroundTheme = {
      id: `custom-${Date.now()}`,
      name: customBgName.trim() || 'Fondo Personalizado',
      category: 'Personalizado',
      thumbnail: customBgUrl.trim(),
      url: customBgUrl.trim(),
      overlayOpacity: 0.2,
    };
    handleSelectTheme(newTheme);
    setCustomBgUrl('');
    setCustomBgName('');
    setShowCustomBgInput(false);
  };

  // Cloud Links Save Handler
  const handleSaveCloudLinks = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedDrive = editDriveUrl.trim() || 'https://drive.google.com';
    const trimmedPortal = editPortalUrl.trim() || 'https://aulavirtual.fcmunca.edu.py';

    setCloudDriveUrl(trimmedDrive);
    setCloudPortalUrl(trimmedPortal);

    localStorage.setItem(cloudDriveKey, trimmedDrive);
    localStorage.setItem(cloudPortalKey, trimmedPortal);

    setIsEditingCloudLinks(false);
    showToast('¡Enlaces de la sección NUBE actualizados!');
  };

  // Spotify Custom Playlist Save Handler
  const handleSaveSpotifyPlaylistUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editSpotifyUrlInput.trim() || 'https://open.spotify.com';
    setSpotifyPlaylistUrl(trimmed);
    localStorage.setItem(spotifyPlaylistKey, trimmed);
    setIsEditingSpotifyPlaylist(false);
    showToast('¡Enlace de tu playlist de Spotify guardado!');
  };

  // Toggle Research Tab Visibility
  const handleToggleResearchVisibility = () => {
    const nextState = !isResearchTabActive;
    setIsResearchTabActive(nextState);
    localStorage.setItem('campusbloom_show_research_tab', String(nextState));
    if (onToggleResearchTab) {
      onToggleResearchTab(nextState);
    }
    showToast(
      nextState
        ? 'Pestaña "Investigación" activada en la barra lateral.'
        : 'Pestaña "Investigación" oculta en la barra lateral.'
    );
  };

  // Spotify Player Handlers
  const handleTogglePlaySpotify = () => {
    const currentTrack = SPOTIFY_PRESETS[currentTrackIndex];
    if (isPlayingSpotify) {
      localSynth.stop();
      setIsPlayingSpotify(false);
    } else {
      localSynth.playSound(currentTrack.soundType);
      setIsPlayingSpotify(true);
    }
  };

  const handleNextTrack = () => {
    let nextIdx = (currentTrackIndex + 1) % SPOTIFY_PRESETS.length;
    if (isShuffled) {
      nextIdx = Math.floor(Math.random() * SPOTIFY_PRESETS.length);
    }
    setCurrentTrackIndex(nextIdx);
    setTrackProgress(0);
    if (isPlayingSpotify) {
      localSynth.playSound(SPOTIFY_PRESETS[nextIdx].soundType);
    }
  };

  const handlePrevTrack = () => {
    const prevIdx = (currentTrackIndex - 1 + SPOTIFY_PRESETS.length) % SPOTIFY_PRESETS.length;
    setCurrentTrackIndex(prevIdx);
    setTrackProgress(0);
    if (isPlayingSpotify) {
      localSynth.playSound(SPOTIFY_PRESETS[prevIdx].soundType);
    }
  };

  const handleSelectTrackPreset = (idx: number) => {
    setCurrentTrackIndex(idx);
    setTrackProgress(0);
    localSynth.playSound(SPOTIFY_PRESETS[idx].soundType);
    setIsPlayingSpotify(true);
  };

  const handleToggleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    } else {
      setIsLiked(true);
      setLikeCount((c) => c + 1);
      showToast('Guardado en tus canciones favoritas de Spotify');
    }
  };

  const handleScrubTimeline = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value);
    setTrackProgress(newProgress);
  };

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Copy Profile to Clipboard
  const handleCopyProfileCard = () => {
    const text = `🎓 Estudiante: ${profile.name}
📚 Carrera: ${profile.career} (${profile.currentYear}, ${profile.semester})
🏛️ Institución: ${profile.university} - ${profile.faculty}
⭐ Promedio GPA: ${profile.gpa} / 5.0
📧 Correo: ${profile.email}`;

    navigator.clipboard.writeText(text);
    showToast('¡Ficha del estudiante copiada al portapapeles!');
  };

  // Reset to defaults
  const handleReset = () => {
    if (window.confirm('¿Segura que deseas restablecer todos los datos del perfil y enlaces a sus valores predeterminados?')) {
      if (onResetDefaults) {
        onResetDefaults();
      }
      setEditForm(DEFAULT_PROFILE);
      setActiveBg(BOTANICAL_BACKGROUNDS[0]);
      setCloudDriveUrl('https://drive.google.com/drive/folders/campusbloom-estudiante');
      setCloudPortalUrl('https://aulavirtual.fcmunca.edu.py');
      setIsResearchTabActive(true);
      localStorage.removeItem('campusbloom_cloud_drive_url');
      localStorage.removeItem('campusbloom_cloud_portal_url');
      localStorage.removeItem('campusbloom_show_research_tab');
      localSynth.stop();
      setIsPlayingSpotify(false);
      showToast('Valores restablecidos por defecto.');
    }
  };

  const currentTrack = SPOTIFY_PRESETS[currentTrackIndex];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-fade-in text-[var(--theme-text-primary)] pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl bg-[#283818] text-[#cde9ac] text-xs font-bold shadow-2xl flex items-center gap-2 border border-[#8cb86d] animate-bounce">
          <Sparkles className="w-4 h-4 text-[#ffd9df]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          1. HEADER CARD: STUDENT IDENTITY & QUICK STATS
          ========================================================================= */}
      <div
        id="profile-hero-card"
        className="rounded-[32px] bloom-glass p-6 sm:p-8 shadow-xl border border-[var(--theme-card-border)] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[var(--theme-accent)]/15 via-[var(--theme-secondary)]/15 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          {/* Avatar & Core Identity */}
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative group cursor-pointer" onClick={() => setIsEditing(true)}>
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden p-1 bg-gradient-to-tr from-[var(--theme-accent)] via-white/50 to-[var(--theme-secondary)] shadow-lg shadow-black/10 flex items-center justify-center">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name || 'Estudiante'}
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-[var(--theme-header-badge-bg)] text-[var(--theme-accent)] flex items-center justify-center font-bold text-2xl">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : <User className="w-8 h-8 text-[var(--theme-accent)]" />}
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--theme-text-primary)] tracking-tight">
                  {profile.name || 'Tu Nombre'}
                </h2>
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[var(--theme-secondary-light)] text-[var(--theme-nav-active-text)] border border-[var(--theme-secondary)]">
                  Estudiante Activo/a
                </span>
              </div>

              <p className="text-sm font-semibold text-[var(--theme-accent)]">
                {profile.title || 'Estudiante Universitario/a'}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-xs text-[var(--theme-text-secondary)]">
                <span className="flex items-center gap-1 font-medium">
                  <School className="w-3.5 h-3.5 text-[var(--theme-secondary)]" />
                  {profile.faculty || profile.university || 'Tu Universidad'}
                </span>
                <span>•</span>
                <span className="font-semibold text-[var(--theme-secondary)]">
                  {profile.career || 'Carrera Universitaria'} {profile.currentYear ? `(${profile.currentYear})` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Metrics */}
          <div className="flex flex-col items-center sm:items-end gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <button
                id="btn-edit-profile"
                onClick={() => setIsEditing(!isEditing)}
                className="bloom-btn-pressable px-4 py-2 rounded-xl bg-[var(--theme-secondary)] text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:brightness-110 transition-all hover:scale-105"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Cerrar Edición' : 'Editar Perfil'}</span>
              </button>

              <button
                onClick={handleCopyProfileCard}
                className="bloom-btn-pressable p-2 rounded-xl bloom-inner hover:bg-white/20 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] transition-all shadow-xs border border-[var(--theme-card-border)]"
                title="Copiar datos del estudiante"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            {/* GPA & Attendance Badges */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsEditing(true)}
                className="bloom-btn-pressable px-3.5 py-1.5 rounded-2xl bg-[var(--theme-header-badge-bg)] hover:brightness-105 border border-[var(--theme-header-badge-border)] flex items-center gap-1.5 shadow-xs transition-transform hover:scale-105 cursor-pointer text-left group"
                title="Hacer clic para editar Promedio GPA"
              >
                <Award className="w-4 h-4 text-[var(--theme-accent)]" />
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase font-bold text-[var(--theme-accent)] block leading-none">
                      Promedio GPA
                    </span>
                    <Edit2 className="w-2.5 h-2.5 text-[var(--theme-accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-xs font-black text-[var(--theme-text-primary)]">
                    {profile.gpa ? `${profile.gpa.toFixed(2)} / 5.0` : '0.0 / 5.0'}
                  </span>
                </div>
              </button>

              <div className="px-3.5 py-1.5 rounded-2xl bg-[var(--theme-secondary-light)] border border-[var(--theme-secondary)] flex items-center gap-1.5 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-[var(--theme-nav-active-text)]" />
                <div className="text-left">
                  <span className="text-[10px] uppercase font-bold text-[var(--theme-nav-active-text)] block leading-none">
                    Asistencia
                  </span>
                  <span className="text-xs font-black text-[var(--theme-nav-active-text)]">
                    {profile.totalClasses > 0
                      ? `${Math.round((profile.attendedClasses / profile.totalClasses) * 100)}%`
                      : '0%'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Info Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-[var(--theme-card-border)] text-xs text-[var(--theme-text-secondary)]">
          <div
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer group"
            title="Editar Correo"
          >
            <Mail className="w-4 h-4 text-[var(--theme-secondary)]" />
            <div className="overflow-hidden">
              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase font-bold text-[var(--theme-secondary)] block">Correo Institucional</span>
                <Edit2 className="w-2.5 h-2.5 text-[var(--theme-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="font-semibold truncate max-w-[200px] block text-[var(--theme-text-primary)]">
                {profile.email || '--'}
              </span>
            </div>
          </div>

          <div
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer group"
            title="Editar Semestre"
          >
            <GraduationCap className="w-4 h-4 text-[var(--theme-accent)]" />
            <div className="overflow-hidden">
              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase font-bold text-[var(--theme-accent)] block">Semestre Actual</span>
                <Edit2 className="w-2.5 h-2.5 text-[var(--theme-accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="font-semibold truncate block text-[var(--theme-text-primary)]">
                {profile.semester || '--'}
              </span>
            </div>
          </div>

          <div
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 p-2 rounded-xl hover:bg-white/10 transition-all cursor-pointer group"
            title="Editar Universidad"
          >
            <School className="w-4 h-4 text-[var(--theme-secondary)]" />
            <div className="overflow-hidden">
              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase font-bold text-[var(--theme-secondary)] block">Universidad</span>
                <Edit2 className="w-2.5 h-2.5 text-[var(--theme-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="font-semibold truncate max-w-[200px] block text-[var(--theme-text-primary)]">
                {profile.university || '--'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form Modal */}
      {isEditing && (
        <div className="rounded-[28px] bloom-glass p-6 sm:p-8 shadow-xl shadow-[#864e5a]/10 border border-white animate-scale-up">
          <div className="flex items-center justify-between pb-4 border-b border-black/5 mb-5">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#864e5a]" />
              <h3 className="text-base font-bold text-[#1b1c1c]">Editar Datos de Estudiante</h3>
            </div>
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs font-bold text-[#864e5a] hover:underline"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-[#514345] mb-1 block">Nombre Completo *</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-white/90 border border-white outline-none focus:ring-2 focus:ring-[#864e5a]"
                  placeholder="Ej: Tu Nombre y Apellido"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#514345] mb-1 block">Carrera *</label>
                <input
                  type="text"
                  value={editForm.career}
                  onChange={(e) => setEditForm({ ...editForm, career: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-white/90 border border-white outline-none focus:ring-2 focus:ring-[#864e5a]"
                  placeholder="Ej: Medicina, Ingeniería, etc."
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[#514345] mb-1 block">Facultad</label>
                <input
                  type="text"
                  value={editForm.faculty}
                  onChange={(e) => setEditForm({ ...editForm, faculty: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-white/90 border border-white outline-none focus:ring-2 focus:ring-[#864e5a]"
                  placeholder="Ej: Tu Facultad o Escuela"
                />
              </div>

              <div>
                <label className="font-bold text-[#514345] mb-1 block">Universidad</label>
                <input
                  type="text"
                  value={editForm.university}
                  onChange={(e) => setEditForm({ ...editForm, university: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-white/90 border border-white outline-none focus:ring-2 focus:ring-[#864e5a]"
                  placeholder="Ej: Tu Universidad"
                />
              </div>

              <div>
                <label className="font-bold text-[#514345] mb-1 block">Promedio GPA (Escala 1.0 - 5.0)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={editForm.gpa || ''}
                  onChange={(e) => setEditForm({ ...editForm, gpa: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 rounded-xl bg-white/90 border border-white outline-none focus:ring-2 focus:ring-[#864e5a] font-mono font-bold"
                  placeholder="Ej: 0.0"
                />
              </div>

              <div>
                <label className="font-bold text-[#514345] mb-1 block">Título / Rol</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-white/90 border border-white outline-none focus:ring-2 focus:ring-[#864e5a]"
                  placeholder="Ej: Estudiante Universitario/a"
                />
              </div>

              <div>
                <label className="font-bold text-[#514345] mb-1 block">Año Lectivo</label>
                <input
                  type="text"
                  value={editForm.currentYear}
                  onChange={(e) => setEditForm({ ...editForm, currentYear: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-white/90 border border-white outline-none focus:ring-2 focus:ring-[#864e5a]"
                  placeholder="Ej: 1er Año"
                />
              </div>

              <div>
                <label className="font-bold text-[#514345] mb-1 block">Semestre</label>
                <input
                  type="text"
                  value={editForm.semester}
                  onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-white/90 border border-white outline-none focus:ring-2 focus:ring-[#864e5a]"
                  placeholder="Ej: Primer Semestre"
                />
              </div>

              <div>
                <label className="font-bold text-[#514345] mb-1 block">Correo Institucional / Personal</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-white/90 border border-white outline-none focus:ring-2 focus:ring-[#864e5a]"
                  placeholder="Ej: tu.usuario@universidad.edu"
                />
              </div>
            </div>

            {/* Avatar / Photo Selection & Local Upload */}
            <div className="pt-3 border-t border-black/5 space-y-3">
              <label className="font-bold text-[#514345] block">
                Foto de Perfil / Avatar del Estudiante:
              </label>

              {/* Live Avatar Preview */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-2xl bg-white/60 border border-white">
                <div className="w-16 h-16 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-[#ffd9df] to-[#cde9ac] shadow-md flex-shrink-0">
                  <img
                    src={editForm.avatarUrl || PRESET_AVATARS[0]}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 w-full space-y-2">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="profile-avatar-upload"
                      className="px-3.5 py-2 rounded-xl bg-[#4e6535] hover:bg-[#3d5029] text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-xs transition-all hover:scale-105"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Subir Foto desde Dispositivo</span>
                    </label>
                    <input
                      id="profile-avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            // Automatic Canvas compression to max 800px and JPEG quality 0.7
                            const compressed = await compressImage(file, 800, 800, 0.7);
                            setEditForm((prev) => ({ ...prev, avatarUrl: compressed }));
                            try {
                              await updateAvatar(compressed);
                            } catch (storageErr) {
                              console.warn('Safe catch on avatar storage save:', storageErr);
                            }
                            showToast('Foto optimizada (800px / JPEG 0.7) y guardada.');
                          } catch (err) {
                            console.error('Error compressing image:', err);
                            try {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  const fallbackUrl = event.target.result as string;
                                  setEditForm((prev) => ({ ...prev, avatarUrl: fallbackUrl }));
                                }
                              };
                              reader.readAsDataURL(file);
                            } catch {
                              // ignore
                            }
                          }
                        }
                      }}
                    />
                    <span className="text-[11px] text-[#514345]">o pega una URL directa debajo:</span>
                  </div>

                  <input
                    type="url"
                    value={editForm.avatarUrl}
                    onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 rounded-xl bg-white/90 border border-white outline-none focus:ring-2 focus:ring-[#864e5a] text-xs font-mono"
                  />
                </div>
              </div>

              {/* Preset Botanical Avatars */}
              <div>
                <span className="text-[11px] font-bold text-[#514345] block mb-1.5">
                  Avatares botánicos recomendados:
                </span>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                  {PRESET_AVATARS.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Avatar botánico ${i + 1}`}
                      onClick={() => setEditForm({ ...editForm, avatarUrl: url })}
                      className={`w-11 h-11 rounded-full object-cover cursor-pointer border-2 transition-all flex-shrink-0 ${
                        editForm.avatarUrl === url
                          ? 'border-[#864e5a] scale-110 shadow-md ring-2 ring-[#ffd9df]'
                          : 'border-white hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-black/5">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 rounded-xl bg-white/80 hover:bg-white text-[#514345] font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#4e6535] text-white font-bold flex items-center gap-2 shadow-md hover:bg-[#3d5029] transition-all hover:scale-105"
              >
                <Save className="w-4 h-4" /> Guardar Cambios Inmediatamente
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          1.5. MIS MATERIAS / CÁTEDRAS UNIVERSITARIAS (CRUD UNIVERSAL)
          ========================================================================= */}
      <div
        id="profile-subjects-section"
        className="rounded-[28px] bloom-glass p-5 sm:p-6 shadow-xl border border-[var(--theme-card-border)] relative overflow-hidden flex flex-col gap-4"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--theme-secondary-light)] text-[var(--theme-nav-active-text)] flex items-center justify-center shadow-xs border border-[var(--theme-secondary)]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[var(--theme-text-primary)] tracking-tight">
                Mis Materias & Cátedras ({subjects.length})
              </h3>
              <p className="text-xs text-[var(--theme-text-secondary)]">
                Gestiona tus asignaturas universitarias. Cualquier cambio se sincroniza en toda la app.
              </p>
            </div>
          </div>

          <button
            id="profile-add-subject-btn"
            type="button"
            onClick={() => {
              setSubjectToEdit(undefined);
              setIsSubjectModalOpen(true);
            }}
            className="bloom-btn-pressable px-4 py-2 rounded-xl bg-[var(--theme-secondary)] text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:brightness-110 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Materia</span>
          </button>
        </div>

        {subjects.length === 0 ? (
          <div className="p-6 rounded-2xl bloom-inner border border-[var(--theme-card-border)] text-center space-y-2">
            <p className="text-xs text-[var(--theme-text-secondary)] font-medium">
              No tienes materias registradas actualmente.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubjectToEdit(undefined);
                setIsSubjectModalOpen(true);
              }}
              className="text-xs font-bold text-[var(--theme-accent)] hover:underline"
            >
              + Agregar tu primera materia ahora
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {subjects.map((sub) => {
              const percent = Math.round((sub.attendedClasses / (sub.totalClasses || 1)) * 100);
              return (
                <div
                  key={sub.id}
                  className="p-3.5 rounded-2xl bloom-inner border border-[var(--theme-card-border)] flex flex-col justify-between gap-2.5 relative group hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: sub.color || 'var(--theme-accent)' }}
                      />
                      <h4 className="font-extrabold text-xs text-[var(--theme-text-primary)] truncate">
                        {sub.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => {
                          setSubjectToEdit(sub);
                          setIsSubjectModalOpen(true);
                        }}
                        className="p-1 rounded-md hover:bg-black/10 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] cursor-pointer"
                        title="Editar materia"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`¿Eliminar materia "${sub.name}"? Se removerá del estado global y de tus horarios.`)) {
                            deleteSubject(sub.id);
                            showToast(`Materia "${sub.name}" eliminada.`);
                          }
                        }}
                        className="p-1 rounded-md hover:bg-red-500/20 text-red-500 cursor-pointer"
                        title="Eliminar materia"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-[var(--theme-text-secondary)] space-y-0.5">
                    <p className="truncate font-medium">{sub.classroom} • {sub.professor}</p>
                    <div className="flex items-center justify-between font-bold pt-1">
                      <span>Nota: <strong className="text-[var(--theme-text-primary)]">{sub.grade} / {sub.maxGrade}</strong></span>
                      <span>Asist: <strong className="text-[var(--theme-nav-active-text)]">{percent}%</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          2. APARTADO 'NUBE': GOOGLE DRIVE & AULA VIRTUAL (CARD INDEPENDIENTE)
          ========================================================================= */}
      <div
        id="profile-nube-section"
        className="rounded-[28px] bloom-glass p-5 sm:p-6 shadow-xl border border-[var(--theme-card-border)] relative overflow-hidden flex flex-col gap-4"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--theme-header-badge-bg)] text-[var(--theme-accent)] flex items-center justify-center shadow-xs border border-[var(--theme-header-badge-border)]">
              <Cloud className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-[var(--theme-text-primary)] tracking-tight uppercase">
              NUBE
            </h3>
          </div>

          <button
            id="btn-edit-nube-links"
            onClick={() => {
              setEditDriveUrl(cloudDriveUrl);
              setEditPortalUrl(cloudPortalUrl);
              setIsEditingCloudLinks(!isEditingCloudLinks);
            }}
            className="bloom-btn-pressable px-3 py-1.5 rounded-xl bloom-inner hover:bg-white/20 text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] border border-[var(--theme-card-border)] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Edit2 className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
            <span>{isEditingCloudLinks ? 'Cerrar' : 'Editar URLs'}</span>
          </button>
        </div>

        {/* Editing NUBE Links Form */}
        {isEditingCloudLinks && (
          <form
            onSubmit={handleSaveCloudLinks}
            className="p-4 rounded-2xl bloom-inner border border-[var(--theme-card-border)] space-y-3 animate-fade-in text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--theme-text-primary)]">Personalizar Enlaces de la Nube</span>
              <span className="text-[10px] text-[var(--theme-text-muted)]">Guardado local automático</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[var(--theme-accent)] mb-1 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5" /> URL de Google Drive
                </label>
                <input
                  type="url"
                  value={editDriveUrl}
                  onChange={(e) => setEditDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full p-2 rounded-xl bg-[var(--theme-card-inner)] border border-[var(--theme-card-border)] text-[var(--theme-text-primary)] text-xs outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-[var(--theme-secondary)] mb-1 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" /> URL de Aula Virtual
                </label>
                <input
                  type="url"
                  value={editPortalUrl}
                  onChange={(e) => setEditPortalUrl(e.target.value)}
                  placeholder="https://aulavirtual.fcmunca.edu.py"
                  className="w-full p-2 rounded-xl bg-[var(--theme-card-inner)] border border-[var(--theme-card-border)] text-[var(--theme-text-primary)] text-xs outline-none focus:ring-2 focus:ring-[var(--theme-secondary)]"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingCloudLinks(false)}
                className="bloom-btn-pressable px-3.5 py-1.5 rounded-xl bloom-inner text-[var(--theme-text-secondary)] font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bloom-btn-pressable px-4 py-1.5 rounded-xl bg-[var(--theme-secondary)] text-white font-bold text-xs hover:brightness-110 shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" /> Guardar
              </button>
            </div>
          </form>
        )}

        {/* NUBE Grid Cards: Google Drive & Aula Virtual */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Card 1: Google Drive */}
          <div className="p-4 rounded-2xl bloom-inner border border-[var(--theme-card-border)] flex items-center justify-between gap-3 hover:shadow-md transition-all group">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-white/90 shadow-xs border border-black/5 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                  <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                  <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                  <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                  <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                  <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                  <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                </svg>
              </div>
              <span className="font-extrabold text-sm sm:text-base text-[var(--theme-text-primary)] group-hover:text-[var(--theme-accent)] transition-colors truncate">
                Google Drive
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(cloudDriveUrl);
                  showToast('Enlace de Google Drive copiado');
                }}
                className="bloom-btn-pressable p-2 rounded-xl bloom-inner hover:bg-white/20 text-[var(--theme-accent)] shadow-2xs border border-[var(--theme-card-border)] transition-all"
                title="Copiar enlace"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <a
                id="link-open-google-drive"
                href={cloudDriveUrl}
                target="_blank"
                rel="noreferrer"
                className="bloom-btn-pressable px-3.5 py-2 rounded-xl bg-[var(--theme-header-badge-bg)] hover:brightness-105 border border-[var(--theme-header-badge-border)] text-[var(--theme-accent)] font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-all hover:scale-105 whitespace-nowrap"
              >
                <span>Abrir</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Card 2: Aula Virtual */}
          <div className="p-4 rounded-2xl bloom-inner border border-[var(--theme-card-border)] flex items-center justify-between gap-3 hover:shadow-md transition-all group">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[var(--theme-secondary-light)] text-[var(--theme-nav-active-text)] border border-[var(--theme-secondary)] shadow-xs flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-sm sm:text-base text-[var(--theme-text-primary)] group-hover:text-[var(--theme-secondary)] transition-colors truncate">
                Aula Virtual
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(cloudPortalUrl);
                  showToast('Enlace del Aula Virtual copiado');
                }}
                className="bloom-btn-pressable p-2 rounded-xl bloom-inner hover:bg-white/20 text-[var(--theme-secondary)] shadow-2xs border border-[var(--theme-card-border)] transition-all"
                title="Copiar enlace"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <a
                id="link-open-aula-virtual"
                href={cloudPortalUrl}
                target="_blank"
                rel="noreferrer"
                className="bloom-btn-pressable px-3.5 py-2 rounded-xl bg-[var(--theme-secondary-light)] hover:brightness-105 border border-[var(--theme-secondary)] text-[var(--theme-nav-active-text)] font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-all hover:scale-105 whitespace-nowrap"
              >
                <span>Abrir</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. WIDGET ESTÉTICO DE SPOTIFY (LO-FI / FOCUS PLAYER)
          ========================================================================= */}
      <div
        id="profile-spotify-widget-card"
        className="rounded-[28px] bloom-glass p-6 sm:p-8 shadow-xl border border-[var(--theme-card-border)] relative overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Left: Spotify Track Info & Cover */}
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left w-full lg:w-auto">
            {/* Spinning Album Artwork Vinyl / Cover */}
            <div className="relative group flex-shrink-0">
              <div
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-lg border-2 border-white/50 transition-all duration-700 ${
                  isPlayingSpotify ? 'scale-105 shadow-[#1DB954]/25 ring-4 ring-[#1DB954]/30' : 'shadow-black/10'
                }`}
              >
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  className={`w-full h-full object-cover transition-transform duration-700 ${
                    isPlayingSpotify ? 'scale-110' : ''
                  }`}
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Spotify Official Badge */}
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#121212] text-[#1DB954] flex items-center justify-center shadow-md border-2 border-white">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.518 17.307c-.216.354-.678.468-1.032.252-2.827-1.727-6.386-2.118-10.578-1.16-.404.093-.81-.16-.902-.564-.093-.405.16-.81.564-.903 4.593-1.05 8.528-.604 11.696 1.343.354.216.468.678.252 1.032zm1.473-3.275c-.272.443-.855.584-1.298.312-3.236-1.99-8.168-2.565-11.995-1.402-.497.151-1.025-.133-1.176-.63-.151-.497.133-1.025.63-1.176 4.377-1.328 9.816-.684 13.527 1.6 443.272.584.855.312 1.296zm.126-3.41c-3.88-2.304-10.28-2.516-13.992-1.388-.595.18-1.226-.157-1.407-.752-.18-.595.157-1.226.752-1.407 4.267-1.296 11.332-1.047 15.795 1.602.535.317.708 1.01.39 1.545-.317.535-1.01.708-1.538.4z"/>
                </svg>
              </div>
            </div>

            {/* Track metadata & Equalizer */}
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/30">
                  {currentTrack.badge}
                </span>
                {isPlayingSpotify && (
                  <div className="flex items-center gap-0.5 px-2 py-0.5 bg-[var(--theme-secondary)]/15 rounded-full">
                    <span className="w-1 h-3 bg-[var(--theme-secondary)] animate-pulse rounded-full" />
                    <span className="w-1 h-4 bg-[var(--theme-accent)] animate-pulse delay-75 rounded-full" />
                    <span className="w-1 h-2 bg-[var(--theme-secondary)] animate-pulse delay-150 rounded-full" />
                  </div>
                )}
              </div>

              <h4 className="text-base sm:text-lg font-black text-[var(--theme-text-primary)] tracking-tight">
                {currentTrack.title}
              </h4>
              <p className="text-xs font-semibold text-[var(--theme-accent)]">
                {currentTrack.artist}
              </p>
              <p className="text-[11px] text-[var(--theme-text-muted)]">
                {currentTrack.album}
              </p>
            </div>
          </div>

          {/* Center / Right: Interactive Controls & Timeline */}
          <div className="w-full lg:w-[460px] flex flex-col gap-3">
            {/* Playback Button Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setIsShuffled(!isShuffled)}
                className={`bloom-btn-pressable p-2 rounded-xl transition-all ${
                  isShuffled ? 'text-[#1DB954] bg-[#1DB954]/15' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                }`}
                title="Modo Aleatorio"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={handlePrevTrack}
                className="bloom-btn-pressable p-2.5 rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-white/10 transition-all active:scale-95"
                title="Pista Anterior"
              >
                <SkipBack className="w-5 h-5 fill-current opacity-70" />
              </button>

              <button
                id="spotify-play-pause-btn"
                onClick={handleTogglePlaySpotify}
                className="bloom-btn-pressable w-12 h-12 rounded-full bg-[#1DB954] text-white flex items-center justify-center shadow-lg shadow-[#1DB954]/30 hover:scale-110 active:scale-95 transition-all"
                title={isPlayingSpotify ? 'Pausar' : 'Reproducir'}
              >
                {isPlayingSpotify ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={handleNextTrack}
                className="bloom-btn-pressable p-2.5 rounded-xl text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)] hover:bg-white/10 transition-all active:scale-95"
                title="Siguiente Pista"
              >
                <SkipForward className="w-5 h-5 fill-current opacity-70" />
              </button>

              <button
                onClick={() => setIsRepeating(!isRepeating)}
                className={`bloom-btn-pressable p-2 rounded-xl transition-all ${
                  isRepeating ? 'text-[#1DB954] bg-[#1DB954]/15' : 'text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-primary)]'
                }`}
                title="Repetir Canción"
              >
                <Repeat className="w-4 h-4" />
              </button>

              <button
                onClick={handleToggleLike}
                className="bloom-btn-pressable p-2 rounded-xl text-[var(--theme-accent)] hover:scale-110 transition-all flex items-center gap-1"
                title="Favorito"
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-[10px] font-bold text-[var(--theme-text-secondary)]">{likeCount}</span>
              </button>
            </div>

            {/* Scrubber Timeline Bar */}
            <div className="flex items-center gap-3 text-xs text-[var(--theme-text-secondary)] font-mono">
              <span className="text-[11px] w-10 text-right">{formatTime(trackProgress)}</span>
              <input
                type="range"
                min="0"
                max={currentTrack.duration}
                value={trackProgress}
                onChange={handleScrubTimeline}
                className="flex-1 accent-[#1DB954] h-1.5 bg-black/10 rounded-full cursor-pointer"
              />
              <span className="text-[11px] w-10">{formatTime(currentTrack.duration)}</span>
            </div>

            {/* Volume and Playlist Selector */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-[var(--theme-card-border)]">
              {/* Preset Track Selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {SPOTIFY_PRESETS.map((preset, idx) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectTrackPreset(idx)}
                    className={`bloom-btn-pressable px-2.5 py-1 rounded-xl text-[10px] font-extrabold whitespace-nowrap transition-all ${
                      currentTrackIndex === idx
                        ? 'bg-[#1DB954] text-white shadow-xs'
                        : 'bloom-inner hover:bg-white/20 text-[var(--theme-text-secondary)]'
                    }`}
                  >
                    {preset.badge}
                  </button>
                ))}
              </div>

              {/* Mini Volume Slider */}
              <div className="flex items-center gap-1.5 text-xs text-[var(--theme-text-secondary)] flex-shrink-0">
                {volumeLevel === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[var(--theme-secondary)]" />}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volumeLevel}
                  onChange={(e) => setVolumeLevel(Number(e.target.value))}
                  className="w-16 accent-[var(--theme-secondary)] h-1 cursor-pointer"
                />
              </div>
            </div>

            {/* Custom Playlist URL Toolbar */}
            <div className="pt-2.5 border-t border-[var(--theme-card-border)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              {!isEditingSpotifyPlaylist ? (
                <>
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-[11px] font-bold text-[var(--theme-text-secondary)] whitespace-nowrap flex items-center gap-1">
                      <Music className="w-3.5 h-3.5 text-[#1DB954]" /> Tu Playlist:
                    </span>
                    <span className="text-[11px] text-[var(--theme-accent)] font-mono truncate max-w-[200px]">
                      {spotifyPlaylistUrl}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setEditSpotifyUrlInput(spotifyPlaylistUrl);
                        setIsEditingSpotifyPlaylist(true);
                      }}
                      className="bloom-btn-pressable px-3 py-1.5 rounded-xl bloom-inner hover:bg-white/20 text-[var(--theme-text-secondary)] font-bold text-xs flex items-center gap-1 shadow-2xs border border-[var(--theme-card-border)]"
                    >
                      <Edit2 className="w-3 h-3 text-[#1DB954]" />
                      <span>Editar URL</span>
                    </button>
                    <a
                      href={spotifyPlaylistUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bloom-btn-pressable px-3 py-1.5 rounded-xl bg-[#1DB954] hover:bg-[#18a44b] text-white font-extrabold text-xs flex items-center gap-1 shadow-xs transition-all hover:scale-105"
                    >
                      <span>Abrir en Spotify</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </>
              ) : (
                <form onSubmit={handleSaveSpotifyPlaylistUrl} className="w-full flex items-center gap-2">
                  <input
                    type="url"
                    value={editSpotifyUrlInput}
                    onChange={(e) => setEditSpotifyUrlInput(e.target.value)}
                    placeholder="https://open.spotify.com/playlist/..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-[var(--theme-card-inner)] border border-[#1DB954]/50 text-xs text-[var(--theme-text-primary)] focus:outline-none focus:ring-2 focus:ring-[#1DB954]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditingSpotifyPlaylist(false)}
                    className="bloom-btn-pressable px-2.5 py-1.5 rounded-xl bloom-inner text-[var(--theme-text-secondary)] font-bold text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bloom-btn-pressable px-3 py-1.5 rounded-xl bg-[#1DB954] hover:bg-[#18a44b] text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                  >
                    <Save className="w-3 h-3" />
                    <span>Guardar</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. CONFIGURACIÓN DE INVESTIGACIÓN (INTERRUPTOR DE VISIBILIDAD)
          ========================================================================= */}
      <div
        id="profile-research-settings-card"
        className="rounded-[28px] bloom-glass p-6 sm:p-8 shadow-xl border border-[var(--theme-card-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
      >
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[var(--theme-secondary-light)] text-[var(--theme-nav-active-text)] border border-[var(--theme-secondary)] flex items-center justify-center shadow-md flex-shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-[var(--theme-text-primary)]">
                Configuración de Investigación
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border transition-all ${
                  isResearchTabActive
                    ? 'bg-[var(--theme-secondary-light)] text-[var(--theme-nav-active-text)] border-[var(--theme-secondary)]'
                    : 'bg-[var(--theme-header-badge-bg)] text-[var(--theme-accent)] border-[var(--theme-header-badge-border)]'
                }`}
              >
                {isResearchTabActive ? 'Visible en el menú' : 'Oculto en el menú'}
              </span>
            </div>
            <p className="text-xs text-[var(--theme-text-secondary)] max-w-xl">
              Activa o desactiva la visibilidad de la pestaña <strong>'Investigación'</strong> con la Dra. Gladys en la barra de navegación lateral.
            </p>
          </div>
        </div>

        {/* Interactive Toggle Switch */}
        <div className="flex items-center gap-3 self-end sm:self-auto bloom-inner p-2 rounded-2xl border border-[var(--theme-card-border)] shadow-xs">
          <span className="text-xs font-bold text-[var(--theme-text-secondary)]">
            {isResearchTabActive ? (
              <span className="flex items-center gap-1 text-[var(--theme-nav-active-text)]">
                <Eye className="w-4 h-4" /> Activada
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[var(--theme-accent)]">
                <EyeOff className="w-4 h-4" /> Desactivada
              </span>
            )}
          </span>

          <button
            id="toggle-research-tab-visibility"
            type="button"
            role="switch"
            aria-checked={isResearchTabActive}
            onClick={handleToggleResearchVisibility}
            className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
              isResearchTabActive ? 'bg-[var(--theme-secondary)]' : 'bg-black/20'
            }`}
          >
            <div
              className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${
                isResearchTabActive ? 'translate-x-6 text-[var(--theme-secondary)]' : 'translate-x-0 text-gray-400'
              }`}
            >
              {isResearchTabActive ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <X className="w-3.5 h-3.5 stroke-[3]" />}
            </div>
          </button>
        </div>
      </div>

      {/* =========================================================================
          5. ATMOSPHERIC WALLPAPER & BOTANICAL THEMES SELECTOR
          ========================================================================= */}
      <div className="rounded-[28px] bloom-glass p-6 sm:p-8 shadow-xl border border-[var(--theme-card-border)] flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-[var(--theme-header-badge-bg)] text-[var(--theme-accent)] border border-[var(--theme-header-badge-border)]">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[var(--theme-text-primary)]">
                Fondos de Pantalla & Atmósferas Visuales
              </h3>
              <p className="text-xs text-[var(--theme-text-secondary)]">
                Selecciona la fotografía o paisaje de fondo adaptado a tu temática para acompañar tus jornadas de estudio.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs font-bold text-[var(--theme-nav-active-text)] bg-[var(--theme-secondary-light)] px-3 py-1 rounded-full border border-[var(--theme-secondary)]">
              Fondo Activo: {activeBg.name}
            </span>
            <button
              onClick={() => setShowCustomBgInput(!showCustomBgInput)}
              className="bloom-btn-pressable p-1.5 rounded-xl bloom-inner hover:bg-white/20 border border-[var(--theme-card-border)] text-xs font-semibold text-[var(--theme-text-secondary)] flex items-center gap-1 shadow-xs"
              title="Añadir fondo personalizado"
            >
              <Sliders className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
              <span className="hidden sm:inline">Fondo URL</span>
            </button>
          </div>
        </div>

        {/* Custom URL Input Panel */}
        {showCustomBgInput && (
          <div className="p-4 rounded-2xl bloom-inner border border-[var(--theme-card-border)] flex flex-col sm:flex-row items-center gap-3 animate-fade-in text-xs">
            <input
              type="text"
              placeholder="Nombre del fondo (ej. Atardecer en el Campus)"
              value={customBgName}
              onChange={(e) => setCustomBgName(e.target.value)}
              className="w-full sm:w-1/3 p-2.5 rounded-xl bg-[var(--theme-card-inner)] border border-[var(--theme-card-border)] text-[var(--theme-text-primary)] text-xs outline-none"
            />
            <input
              type="url"
              placeholder="Pega la URL de la imagen (Unsplash, etc.)..."
              value={customBgUrl}
              onChange={(e) => setCustomBgUrl(e.target.value)}
              className="w-full sm:flex-1 p-2.5 rounded-xl bg-[var(--theme-card-inner)] border border-[var(--theme-card-border)] text-[var(--theme-text-primary)] text-xs outline-none"
            />
            <button
              type="button"
              onClick={handleApplyCustomBackground}
              className="bloom-btn-pressable w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[var(--theme-secondary)] text-white font-bold text-xs hover:brightness-110 transition-all whitespace-nowrap"
            >
              Aplicar Fondo
            </button>
          </div>
        )}

        {/* Background Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5">
          {BOTANICAL_BACKGROUNDS.map((theme) => {
            const isSelected = activeBg.id === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => handleSelectTheme(theme)}
                className={`group cursor-pointer rounded-2xl overflow-hidden p-1.5 transition-all duration-300 flex flex-col gap-1.5 border ${
                  isSelected
                    ? 'bg-[var(--theme-secondary-light)] border-[var(--theme-secondary)] shadow-md scale-[1.04] ring-2 ring-[var(--theme-secondary)]/30'
                    : 'bloom-inner border-[var(--theme-card-border)] hover:scale-105 hover:bg-white/20'
                }`}
              >
                <div className="relative aspect-square rounded-xl overflow-hidden shadow-inner">
                  <img
                    src={theme.thumbnail}
                    alt={theme.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                      <div className="w-7 h-7 rounded-full bg-[var(--theme-secondary)] text-white flex items-center justify-center shadow-md">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="px-1 text-center">
                  <p className="text-[11px] font-bold text-[var(--theme-text-primary)] truncate">{theme.name}</p>
                  <p className="text-[9px] font-semibold text-[var(--theme-accent)] truncate">{theme.category}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          7. RESTORE DEFAULT VALUES / DANGER ZONE
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-5 rounded-2xl bloom-inner border border-[var(--theme-card-border)] text-xs gap-3">
        <div className="flex items-center gap-2 text-[var(--theme-text-secondary)]">
          <Info className="w-4 h-4 text-[var(--theme-accent)] flex-shrink-0" />
          <span>
            ¿Deseas restablecer los datos, enlaces de la nube y temas por defecto del perfil estudiantil?
          </span>
        </div>
        <button
          onClick={handleReset}
          className="bloom-btn-pressable px-4 py-2 rounded-xl bloom-inner hover:bg-red-500/20 text-red-400 font-bold flex items-center gap-1.5 transition-all shadow-xs border border-red-500/30 whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restablecer Valores</span>
        </button>
      </div>

      {/* =========================================================================
          8. CERRAR SESIÓN (LOG OUT)
          ========================================================================= */}
      <div
        id="profile-logout-card"
        className="p-6 sm:p-7 rounded-[28px] bloom-glass border border-[var(--theme-card-border)] flex flex-col sm:flex-row items-center justify-between gap-5 shadow-lg"
      >
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-[var(--theme-header-badge-bg)] border border-[var(--theme-header-badge-border)] text-[var(--theme-accent)] flex items-center justify-center flex-shrink-0 shadow-xs">
            <LogOut className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[var(--theme-text-primary)]">
              Cerrar Sesión Activa
            </h3>
            <p className="text-xs text-[var(--theme-text-secondary)] font-medium">
              Conectado como <strong className="text-[var(--theme-accent)] font-mono font-bold">{currentUser?.email || profile.email}</strong>. Tus datos, registros de investigación y preferencias se guardan de forma independiente.
            </p>
          </div>
        </div>

        <button
          id="profile-logout-btn"
          type="button"
          onClick={() => {
            if (onLogout) {
              onLogout();
            }
          }}
          className="bloom-btn-pressable w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>

      {/* =========================================================================
          9. SELECTOR DE TEMAS FLOTANTE Y DINÁMICO (GLASS BADGE & DROPDOWN)
          ========================================================================= */}
      <div
        ref={themeMenuRef}
        id="floating-theme-selector-container"
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 flex flex-col items-end"
      >
        <AnimatePresence>
          {isThemeMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.94 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="mb-3 w-80 sm:w-96 rounded-[26px] bloom-glass p-4 sm:p-5 shadow-2xl border border-[var(--theme-card-border)] backdrop-blur-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--theme-card-border)] mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[var(--theme-header-badge-bg)] text-[var(--theme-accent)] flex items-center justify-center shadow-xs border border-[var(--theme-header-badge-border)]">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-[var(--theme-text-primary)]">
                      Paletas & Tema Visual
                    </h4>
                    <p className="text-[10px] text-[var(--theme-text-muted)]">
                      Personalización estética global
                    </p>
                  </div>
                </div>

                <span className="text-xs px-2.5 py-1 rounded-full bloom-inner font-extrabold text-[var(--theme-accent)] shadow-xs border border-[var(--theme-card-border)]">
                  {currentPalette.emoji} Activo
                </span>
              </div>

              {/* 4 Theme Options */}
              <div className="flex flex-col gap-2">
                {THEME_PALETTES.map((theme) => {
                  const isSelected = activeThemeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        if (onSelectThemeId) {
                          onSelectThemeId(theme.id);
                          showToast(`Tema '${theme.name}' aplicado`);
                        }
                        setIsThemeMenuOpen(false);
                      }}
                      className={`bloom-btn-pressable w-full text-left p-2.5 rounded-2xl transition-all flex items-center justify-between gap-3 border cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--theme-card-bg)] border-[var(--theme-accent)] shadow-md scale-[1.01] ring-2 ring-[var(--theme-accent)]/25'
                          : 'bloom-inner hover:bg-white/20 border-[var(--theme-card-border)] hover:scale-[1.01]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl p-1.5 rounded-xl bloom-inner shadow-2xs border border-[var(--theme-card-border)] flex-shrink-0">
                          {theme.emoji}
                        </span>
                        <div className="truncate">
                          <p className="text-xs font-extrabold text-[var(--theme-text-primary)] truncate">
                            {theme.name}
                          </p>
                          <p className="text-[10px] text-[var(--theme-text-muted)] truncate">
                            {theme.tagline}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Swatches preview */}
                        <div className="flex items-center -space-x-1">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/50 shadow-2xs"
                            style={{ backgroundColor: theme.accentColor }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/50 shadow-2xs"
                            style={{ backgroundColor: theme.secondaryColor }}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/50 shadow-2xs"
                            style={{ backgroundColor: theme.cardBg }}
                          />
                        </div>

                        {/* Selected Checkmark */}
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            isSelected
                              ? 'bg-[var(--theme-accent)] text-white shadow-xs'
                              : 'border border-[var(--theme-card-border)]'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Glass Badge Trigger Button */}
        <motion.button
          id="btn-floating-theme-badge"
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
          className={`bloom-btn-pressable flex items-center gap-2.5 px-4 py-2.5 rounded-full bloom-glass border border-[var(--theme-card-border)] shadow-xl backdrop-blur-2xl font-black text-xs transition-all cursor-pointer ${
            isThemeMenuOpen
              ? 'ring-2 ring-[var(--theme-accent)]/50 text-[var(--theme-accent)] shadow-2xl'
              : 'text-[var(--theme-text-primary)] hover:text-[var(--theme-accent)]'
          }`}
          title="Personalizar Tema & Paleta de Colores"
        >
          <span className="text-base leading-none">✨</span>
          <span className="tracking-tight font-extrabold">{currentPalette.name}</span>
          <span className="text-sm">{currentPalette.emoji}</span>
          <Sparkles className="w-3.5 h-3.5 text-[var(--theme-accent)]" />
        </motion.button>
      </div>

      {/* Global Subject Add/Edit Modal */}
      <SubjectManageModal
        isOpen={isSubjectModalOpen}
        onClose={() => {
          setIsSubjectModalOpen(false);
          setSubjectToEdit(undefined);
        }}
        subjectToEdit={subjectToEdit}
      />
    </div>
  );
};

export default ProfileView;
