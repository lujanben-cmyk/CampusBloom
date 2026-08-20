import { StudentProfile, Subject, ClassScheduleItem, Exam, BackgroundTheme, MusicTrack } from '../types';

export const INITIAL_STUDENT_PROFILE: StudentProfile = {
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

export const INITIAL_SUBJECTS: Subject[] = [];

export const INITIAL_SCHEDULE: ClassScheduleItem[] = [];

export const INITIAL_EXAMS: Exam[] = [];

export const BACKGROUND_THEMES: BackgroundTheme[] = [
  {
    id: 'sakura-garden',
    name: 'Jardín de Cerezos',
    category: 'Botanical',
    thumbnail: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&q=80&w=400',
    url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&q=80&w=1920',
    overlayOpacity: 0.15,
  },
  {
    id: 'matcha-zen',
    name: 'Bosque de Bambú & Té Verde',
    category: 'Botanical',
    thumbnail: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=400',
    url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=1920',
    overlayOpacity: 0.2,
  },
  {
    id: 'vintage-library',
    name: 'Biblioteca Médica Clásica',
    category: 'Academic',
    thumbnail: 'https://images.unsplash.com/photo-1507842229451-79731d75a807?auto=format&fit=crop&q=80&w=400',
    url: 'https://images.unsplash.com/photo-1507842229451-79731d75a807?auto=format&fit=crop&q=80&w=1920',
    overlayOpacity: 0.25,
  },
  {
    id: 'spring-blossom',
    name: 'Primavera en Flor',
    category: 'Botanical',
    thumbnail: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&q=80&w=400',
    url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&q=80&w=1920',
    overlayOpacity: 0.18,
  },
  {
    id: 'hospital-garden',
    name: 'Patio Clínico Sereno',
    category: 'Medical',
    thumbnail: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400',
    url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=1920',
    overlayOpacity: 0.22,
  },
  {
    id: 'zen-study',
    name: 'Estudio de Escritorio Nórdico',
    category: 'Study',
    thumbnail: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=400',
    url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1920',
    overlayOpacity: 0.15,
  },
];

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'track-1',
    title: 'Sakura Petals Breeze',
    artist: 'CampusBloom Lofi',
    album: 'FCM Study Sessions',
    coverUrl: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&q=80&w=300',
    soundType: 'lofi-beats',
    duration: 180,
  },
  {
    id: 'track-2',
    title: 'Rain on FCM Medical Library',
    artist: 'CampusBloom Ambience',
    album: 'Deep Focus Ambient',
    coverUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=300',
    soundType: 'rain-cafe',
    duration: 240,
  },
  {
    id: 'track-3',
    title: 'Nocturnal Study Piano',
    artist: 'CampusBloom Relax',
    album: 'Midnight Anatomy',
    coverUrl: 'https://images.unsplash.com/photo-1507842229451-79731d75a807?auto=format&fit=crop&q=80&w=300',
    soundType: 'piano-chill',
    duration: 210,
  },
  {
    id: 'track-4',
    title: 'Zen Binaural Waves for Focus',
    artist: 'CampusBloom Mindfulness',
    album: 'Sakura Zen Waves',
    coverUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=300',
    soundType: 'ambient-zen',
    duration: 300,
  },
];

export const MUSIC_PLAYLIST = MUSIC_TRACKS;
