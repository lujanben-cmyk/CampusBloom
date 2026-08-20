import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  BookOpen,
  Layers,
  Check,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Plus,
  Edit3,
  Award,
  Filter,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { Exam } from '../../types';
import { useApp } from '../../context/AppContext';
import { soundEngine } from '../../utils/audioSynthesizer';
import { SubjectManageModal } from '../modals/SubjectManageModal';
import { ExamEditModal } from '../modals/ExamEditModal';
import { BatchImportModal } from '../modals/BatchImportModal';

interface Flashcard {
  id: string;
  subject: string;
  question: string;
  answer: string;
  hint: string;
}

const DEFAULT_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc-1',
    subject: 'Inglés Técnico II',
    question: 'What is the clinical definition and prefix of "Hypertension" vs "Hypotension"?',
    answer: '"Hyper-" signifies high / above normal (Elevated BP ≥ 140/90 mmHg), whereas "Hypo-" signifies low / below normal (Low BP < 90/60 mmHg).',
    hint: 'Prefixes are essential roots for medical diagnostic interpretation.',
  },
  {
    id: 'fc-2',
    subject: 'Fisiología II',
    question: '¿Qué genera el primer ruido cardíaco (R1) y en qué fase del ciclo ocurre?',
    answer: 'El cierre de las válvulas auriculoventriculares (Mitral y Tricúspide) al inicio de la sístole ventricular (contracción isovolumétrica).',
    hint: 'Corresponde al "LUB" del ciclo cardíaco.',
  },
  {
    id: 'fc-3',
    subject: 'Bioquímica II',
    question: '¿Cuál es la enzima reguladora clave y limitante de la Glucólisis?',
    answer: 'La Fosfofructoquinasa-1 (PFK-1), estimulada alostéricamente por Fructosa-2,6-bisfosfato y AMP.',
    hint: 'Cataliza la conversión irreversible de Fructosa-6-P a Fructosa-1,6-BP.',
  },
  {
    id: 'fc-4',
    subject: 'Microbiología y Parasitología II',
    question: '¿Cuál es la fase infectante y la vía de transmisión de Giardia lamblia?',
    answer: 'Fase infectante: Quiste tetranucleado. Vía de transmisión: Fecal-oral a través de agua o alimentos contaminados.',
    hint: 'Habita en el duodeno y yeyuno proximal produciendo síndrome de malabsorción.',
  },
  {
    id: 'fc-5',
    subject: 'Inglés Técnico II',
    question: 'Translate and explain: "The patient presents with acute dyspnea and productive cough".',
    answer: '"El paciente se presenta con disnea aguda y tos productiva (con expectoración)".',
    hint: 'Dyspnea = dificultad respiratoria / falta de aire.',
  },
  {
    id: 'fc-6',
    subject: 'Medicina de la Comunidad',
    question: '¿Cuáles son los 3 niveles de prevención en Salud Pública?',
    answer: '1. Primaria (promoción y protección), 2. Secundaria (diagnóstico precoz y tratamiento oportuno), 3. Terciaria (rehabilitación y limitación del daño).',
    hint: 'Esquema clásico de Leavell y Clark.',
  },
];

export const ExamsView: React.FC = () => {
  const { exams, subjects, addExam, updateExam, deleteExam } = useApp();

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  // Pomodoro Timer State
  const [pomodoroMode, setPomodoroMode] = useState<'study' | 'break'>('study');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60); // 25 min
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [pomodoroCycles, setPomodoroCycles] = useState<number>(0);

  // Flashcards state
  const [cardIndex, setCardIndex] = useState<number>(0);
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);
  const [masteredCards, setMasteredCards] = useState<string[]>([]);

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState<boolean>(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState<boolean>(false);

  // Quick Score edit state
  const [quickScoreExamId, setQuickScoreExamId] = useState<string | null>(null);
  const [quickScoreVal, setQuickScoreVal] = useState<string>('');
  const [quickMaxScoreVal, setQuickMaxScoreVal] = useState<string>('30');

  useEffect(() => {
    let interval: number;
    if (isTimerRunning) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (pomodoroMode === 'study') {
              setPomodoroMode('break');
              setPomodoroCycles((c) => c + 1);
              return 5 * 60; // 5 min break
            } else {
              setPomodoroMode('study');
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, pomodoroMode]);

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
    if (!isTimerRunning && pomodoroMode === 'study') {
      soundEngine.play('lofi-beats');
    }
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeft(pomodoroMode === 'study' ? 25 * 60 : 5 * 60);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Open modal to create new exam
  const handleOpenAddModal = () => {
    setEditingExam(null);
    setIsEditModalOpen(true);
  };

  // Open modal to edit existing exam
  const handleOpenEditModal = (ex: Exam) => {
    setEditingExam(ex);
    setIsEditModalOpen(true);
  };

  // Handle saving an exam (add or update)
  const handleSaveExam = (examData: Omit<Exam, 'id'> | Exam) => {
    if ('id' in examData && examData.id) {
      updateExam(examData as Exam);
    } else {
      addExam(examData);
    }
  };

  // Quick Score submission
  const handleSaveQuickScore = (ex: Exam) => {
    const s = parseFloat(quickScoreVal);
    const ms = parseFloat(quickMaxScoreVal) || ex.maxScore || 30;
    if (!isNaN(s) && ms > 0) {
      updateExam({
        ...ex,
        score: s,
        maxScore: ms,
        status: 'completed',
      });
    }
    setQuickScoreExamId(null);
  };

  // Filtered & Sorted exams
  const filteredExams = useMemo(() => {
    return exams
      .filter((ex) => {
        // Status filter
        if (statusFilter === 'upcoming') {
          if (ex.status === 'completed' || (ex.score !== undefined && ex.score !== null)) {
            return false;
          }
        } else if (statusFilter === 'completed') {
          if (ex.status !== 'completed' && (ex.score === undefined || ex.score === null)) {
            return false;
          }
        }
        // Subject filter
        if (selectedSubjectFilter !== 'all' && ex.subjectId !== selectedSubjectFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [exams, statusFilter, selectedSubjectFilter]);

  // Overall Exam Statistics
  const stats = useMemo(() => {
    const total = exams.length;
    const graded = exams.filter((e) => e.score !== undefined && e.score !== null);
    const gradedCount = graded.length;
    const upcomingCount = total - gradedCount;

    let avgPercentage = 0;
    if (gradedCount > 0) {
      const sumPct = graded.reduce((acc, curr) => {
        const max = curr.maxScore || 30;
        return acc + ((curr.score || 0) / max) * 100;
      }, 0);
      avgPercentage = Math.round((sumPct / gradedCount) * 10) / 10;
    }

    return { total, gradedCount, upcomingCount, avgPercentage };
  }, [exams]);

  const currentCard = DEFAULT_FLASHCARDS[cardIndex] || DEFAULT_FLASHCARDS[0];
  const isMastered = masteredCards.includes(currentCard?.id || '');

  return (
    <div id="exams-view-screen" className="w-full flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Banner & Action Header */}
      <div className="rounded-[28px] glass-card p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-[#864e5a]/10 border border-white/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ffd9df] text-[#6b3743] border border-[#ffb7c5]">
              Calendario de Evaluaciones & Calificaciones
            </span>
            <span className="text-xs text-[#514345] font-semibold">
              {exams.length} fechas registradas
            </span>
          </div>
          <h2 className="font-heading text-2xl font-bold text-[#1b1c1c] tracking-tight">
            Exámenes, Parciales & Sala de Estudio
          </h2>
          <p className="text-xs sm:text-sm text-[#514345]/80">
            Administra tus fechas, edita notas de exámenes del total y repasa con flashcards y Pomodoro.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="exams-batch-import-btn"
            onClick={() => setIsBatchImportOpen(true)}
            className="px-4 py-3 rounded-2xl glass-inner hover:bg-white/90 text-[#864e5a] text-xs font-bold border border-white/80 shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105"
            title="Importar fechas de exámenes masivamente desde Gemini o NotebookLM"
          >
            <span className="text-sm">📋</span>
            <span>Importar en Lote</span>
          </button>

          <button
            id="exams-add-single-btn"
            onClick={() => {
              if (subjects.length === 0) {
                setIsAddSubjectOpen(true);
              } else {
                handleOpenAddModal();
              }
            }}
            className="px-5 py-3 rounded-2xl bg-[#864e5a] hover:bg-[#6b3743] text-white text-xs font-bold shadow-md shadow-[#864e5a]/25 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Fecha de Examen</span>
          </button>
        </div>
      </div>

      {/* Stats Overview Pill Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-[20px] glass-card p-4 border border-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ffd9df] text-[#864e5a] flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-[#514345] font-semibold">Total Evaluaciones</p>
            <p className="font-heading text-xl font-bold text-[#1b1c1c]">{stats.total}</p>
          </div>
        </div>

        <div className="rounded-[20px] glass-card p-4 border border-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#cde9ac] text-[#374d20] flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-[#514345] font-semibold">Rendidos / Calificados</p>
            <p className="font-heading text-xl font-bold text-[#4e6535]">{stats.gradedCount}</p>
          </div>
        </div>

        <div className="rounded-[20px] glass-card p-4 border border-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#fff2d6] text-[#b45309] flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-[#514345] font-semibold">Próximos a Rendir</p>
            <p className="font-heading text-xl font-bold text-[#b45309]">{stats.upcomingCount}</p>
          </div>
        </div>

        <div className="rounded-[20px] glass-card p-4 border border-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#dbeafe] text-[#1d4ed8] flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-[#514345] font-semibold">Promedio Exámenes</p>
            <p className="font-heading text-xl font-bold text-[#1d4ed8]">
              {stats.gradedCount > 0 ? `${stats.avgPercentage}%` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="rounded-[22px] glass-card p-3 sm:p-4 border border-white/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl glass-inner flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#864e5a] text-white shadow-xs'
                : 'text-[#514345] hover:bg-white/60'
            }`}
          >
            Todos ({exams.length})
          </button>
          <button
            onClick={() => setStatusFilter('upcoming')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'upcoming'
                ? 'bg-[#864e5a] text-white shadow-xs'
                : 'text-[#514345] hover:bg-white/60'
            }`}
          >
            Próximos ({stats.upcomingCount})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-[#4e6535] text-white shadow-xs'
                : 'text-[#514345] hover:bg-white/60'
            }`}
          >
            Calificados ({stats.gradedCount})
          </button>
        </div>

        {/* Filter by Subject */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-[#514345] flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#864e5a]" /> Materia:
          </span>
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="flex-1 sm:flex-none p-2 rounded-xl bg-white/90 border border-white text-xs font-bold text-[#1b1c1c] outline-none focus:ring-2 focus:ring-[#864e5a] shadow-xs"
          >
            <option value="all">Todas las materias</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Left = Exams List, Right = Pomodoro & Flashcards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Upcoming Exams Timeline (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-heading text-lg font-bold text-[#1b1c1c] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#864e5a]" />
              Cronograma de Evaluaciones ({filteredExams.length})
            </h3>
            <span className="text-xs text-[#514345]/80 font-medium">
              Haz clic en <strong>Editar</strong> para cambiar fecha o cargar tu nota
            </span>
          </div>

          {filteredExams.length === 0 ? (
            <div className="rounded-[24px] glass-card p-8 text-center flex flex-col items-center justify-center gap-3 border border-white">
              <div className="w-12 h-12 rounded-2xl bg-[#ffd9df] text-[#864e5a] flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="font-heading text-base font-bold text-[#1b1c1c]">
                No hay evaluaciones con el filtro seleccionado
              </h4>
              <p className="text-xs text-[#514345]/80 max-w-sm">
                Puedes cambiar de pestaña o añadir una nueva fecha de examen para tu cátedra.
              </p>
              <button
                onClick={handleOpenAddModal}
                className="mt-2 px-4 py-2 rounded-xl bg-[#864e5a] text-white font-bold text-xs shadow-md cursor-pointer hover:scale-105 transition-all"
              >
                + Añadir Examen
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredExams.map((ex) => {
                const examDate = new Date(ex.date);
                const today = new Date();
                // Reset hours for accurate day diff
                examDate.setHours(0, 0, 0, 0);
                const todayClean = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const diffTime = examDate.getTime() - todayClean.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                const hasGrade = ex.score !== undefined && ex.score !== null;
                const max = ex.maxScore || 30;
                const scorePercentage = hasGrade ? Math.round(((ex.score || 0) / max) * 100) : null;

                const isQuickGrading = quickScoreExamId === ex.id;

                return (
                  <div
                    key={ex.id}
                    id={`exam-card-${ex.id}`}
                    className={`rounded-[24px] glass-card p-5 sm:p-5.5 border transition-all duration-200 flex flex-col gap-3.5 group relative shadow-md hover:shadow-lg ${
                      hasGrade
                        ? 'border-[#b4cf95]/80 bg-white/85'
                        : 'border-white/80 bg-white/70'
                    }`}
                  >
                    {/* Top Row: Subject badge, weight, Status & Action buttons */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ffb7c5]/35 text-[#864e5a] border border-[#ffb7c5]/60">
                            {ex.subjectName}
                          </span>
                          <span className="text-[11px] font-semibold text-[#514345]/80 bg-black/5 px-2 py-0.5 rounded-md">
                            {ex.weight}
                          </span>
                          {hasGrade ? (
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#cde9ac] text-[#374d20] border border-[#b4cf95] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Rendido
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#ffd9df]/50 text-[#864e5a]">
                              {diffDays > 0
                                ? `En ${diffDays} días`
                                : diffDays === 0
                                ? '¡Hoy!'
                                : `Rendido hace ${Math.abs(diffDays)} días`}
                            </span>
                          )}
                        </div>

                        <h4 className="font-heading text-[16px] sm:text-[17px] font-bold text-[#1b1c1c] group-hover:text-[#864e5a] transition-colors leading-snug">
                          {ex.title}
                        </h4>
                      </div>

                      {/* Action buttons: Edit, Delete */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(ex)}
                          className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-[#864e5a] text-[#514345] hover:text-white border border-black/10 hover:border-[#864e5a] text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Editar fecha, aula o calificación"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar "${ex.title}"?`)) {
                              deleteExam(ex.id);
                            }
                          }}
                          className="p-1.5 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-xl transition-all cursor-pointer opacity-70 hover:opacity-100"
                          title="Eliminar examen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Date, Time & Classroom info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#514345] py-0.5">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-[#4e6535]" />
                        <span>
                          Fecha: <strong className="text-[#1b1c1c]">{ex.date}</strong> ({ex.time} hs)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#864e5a]" />
                        <span>
                          Salón: <strong className="text-[#1b1c1c]">{ex.classroom}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Score / Grade Section */}
                    <div className="mt-1 pt-2.5 border-t border-black/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      {hasGrade ? (
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div className="w-9 h-9 rounded-xl bg-[#4e6535] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                            <Award className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-heading font-extrabold text-base text-[#1b1c1c]">
                                {ex.score} / {max} pts
                              </span>
                              <span className="text-xs font-bold text-[#4e6535] bg-[#cde9ac] px-2 py-0.5 rounded-md">
                                {scorePercentage}%
                              </span>
                            </div>
                            <p className="text-[10px] text-[#514345]/80 font-medium">
                              Calificación cargada exitosamente
                            </p>
                          </div>
                        </div>
                      ) : isQuickGrading ? (
                        <div className="flex items-center gap-2 flex-wrap w-full bg-white/90 p-2.5 rounded-xl border border-[#864e5a]/30">
                          <span className="text-[11px] font-bold text-[#514345]">Nota:</span>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Puntos"
                            value={quickScoreVal}
                            onChange={(e) => setQuickScoreVal(e.target.value)}
                            className="w-20 p-1.5 rounded-lg border border-black/15 text-xs font-bold outline-none focus:ring-1 focus:ring-[#864e5a]"
                          />
                          <span className="text-[11px] font-bold text-[#514345]">/ Total:</span>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Total"
                            value={quickMaxScoreVal}
                            onChange={(e) => setQuickMaxScoreVal(e.target.value)}
                            className="w-20 p-1.5 rounded-lg border border-black/15 text-xs font-bold outline-none focus:ring-1 focus:ring-[#864e5a]"
                          />
                          <button
                            onClick={() => handleSaveQuickScore(ex)}
                            className="px-3 py-1.5 rounded-lg bg-[#4e6535] text-white text-xs font-bold shadow-xs hover:bg-[#3f532a] cursor-pointer"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setQuickScoreExamId(null)}
                            className="px-2 py-1.5 rounded-lg text-[#514345] text-xs hover:bg-black/5 cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setQuickScoreVal(ex.score !== undefined ? String(ex.score) : '');
                            setQuickMaxScoreVal(String(ex.maxScore || 30));
                            setQuickScoreExamId(ex.id);
                          }}
                          className="text-xs font-bold text-[#864e5a] hover:text-[#6b3743] flex items-center gap-1.5 hover:underline cursor-pointer"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>+ Cargar nota obtenida</span>
                        </button>
                      )}

                      {/* Quick Date Change Trigger */}
                      <button
                        onClick={() => handleOpenEditModal(ex)}
                        className="text-[11px] font-semibold text-[#514345]/80 hover:text-[#864e5a] transition-colors cursor-pointer"
                      >
                        Cambiar fecha / aula →
                      </button>
                    </div>

                    {/* Topics evaluated tags */}
                    {ex.topics && ex.topics.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1.5">
                        {ex.topics.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium bg-white/80 px-2 py-0.5 rounded-lg text-[#514345] border border-black/5"
                          >
                            • {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Notes if present */}
                    {ex.notes && (
                      <div className="text-[11px] italic text-[#514345]/90 bg-white/50 p-2 rounded-xl border border-white/60">
                        💬 {ex.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Pomodoro & Flashcards (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Pomodoro Timer Card */}
          <div className="rounded-[26px] glass-card p-5 sm:p-6 shadow-xl shadow-[#864e5a]/10 border border-white/80 flex flex-col items-center text-center gap-4 relative overflow-hidden">
            <div className="w-full flex items-center justify-between">
              <span className="text-xs font-bold text-[#864e5a] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#ffb7c5]" /> Sala de Enfoque Pomodoro
              </span>
              <span className="text-[11px] font-semibold text-[#514345] bg-white/60 px-2 py-0.5 rounded-full">
                Ciclo #{pomodoroCycles}
              </span>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-2 p-1 rounded-2xl glass-inner">
              <button
                onClick={() => {
                  setPomodoroMode('study');
                  setTimeLeft(25 * 60);
                  setIsTimerRunning(false);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  pomodoroMode === 'study'
                    ? 'bg-[#864e5a] text-white shadow-sm'
                    : 'text-[#514345] hover:bg-white/60'
                }`}
              >
                Estudio (25m)
              </button>
              <button
                onClick={() => {
                  setPomodoroMode('break');
                  setTimeLeft(5 * 60);
                  setIsTimerRunning(false);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  pomodoroMode === 'break'
                    ? 'bg-[#4e6535] text-white shadow-sm'
                    : 'text-[#514345] hover:bg-white/60'
                }`}
              >
                Pausa Té (5m)
              </button>
            </div>

            {/* Timer Display */}
            <div className="w-36 h-36 rounded-full border-4 border-[#ffb7c5]/60 bg-white/50 flex flex-col items-center justify-center glow-pink my-1">
              <span className="font-heading text-3xl sm:text-4xl font-extrabold text-[#1b1c1c] tracking-tight">
                {formatTimer(timeLeft)}
              </span>
              <span className="text-[11px] font-semibold text-[#864e5a] mt-1 capitalize">
                {pomodoroMode === 'study' ? 'Tiempo de Estudio' : 'Descanso & Hidratación'}
              </span>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTimer}
                className="px-6 py-2.5 rounded-2xl bg-[#864e5a] hover:bg-[#6b3743] text-white text-xs font-bold shadow-md shadow-[#864e5a]/25 flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isTimerRunning ? 'Pausar' : 'Iniciar'}</span>
              </button>

              <button
                onClick={resetTimer}
                className="p-2.5 rounded-2xl bg-white/70 hover:bg-white text-[#514345] border border-white shadow-xs transition-all cursor-pointer"
                title="Reiniciar Temporizador"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Medical Flashcards Interactive Widget */}
          <div className="rounded-[26px] glass-card p-5 sm:p-6 shadow-xl shadow-[#864e5a]/10 border border-white/80 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#ffd9df] text-[#864e5a] flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold text-[#1b1c1c]">
                    Flashcards de Repaso Rápido
                  </h4>
                  <p className="text-[10px] text-[#514345]/80">
                    Tarjetas interactivas de memorización activa
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-bold text-[#864e5a] bg-[#ffd9df]/50 px-2 py-0.5 rounded-full">
                {cardIndex + 1} / {DEFAULT_FLASHCARDS.length}
              </span>
            </div>

            {/* Flashcard Card (Interactive Flip) */}
            <div
              onClick={() => setIsCardFlipped(!isCardFlipped)}
              className={`min-h-[160px] p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between select-none ${
                isCardFlipped
                  ? 'bg-[#cde9ac]/50 border-[#b4cf95] text-[#374d20]'
                  : 'bg-white/80 border-white text-[#1b1c1c] hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                  {currentCard?.subject}
                </span>
                <span className="text-[10px] font-bold underline opacity-80">
                  {isCardFlipped ? 'Respuesta' : 'Toca para ver respuesta'}
                </span>
              </div>

              <div className="py-2 text-center">
                <p className="font-heading text-sm font-bold leading-snug">
                  {isCardFlipped ? currentCard?.answer : currentCard?.question}
                </p>
                {isCardFlipped && currentCard?.hint && (
                  <p className="text-[11px] italic mt-2 opacity-90">💡 {currentCard.hint}</p>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] font-medium opacity-60">
                <span>{isCardFlipped ? 'Tarjeta dominada' : 'Pregunta teórica'}</span>
                <span>{isMastered ? '✓ Aprendida' : '○ Pendiente'}</span>
              </div>
            </div>

            {/* Flashcard Navigation Controls */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => {
                  setIsCardFlipped(false);
                  setCardIndex((prev) => (prev > 0 ? prev - 1 : DEFAULT_FLASHCARDS.length - 1));
                }}
                className="p-2 rounded-xl bg-white/70 hover:bg-white text-[#514345] border border-white transition-all cursor-pointer"
                title="Tarjeta anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  if (currentCard && !isMastered) {
                    setMasteredCards([...masteredCards, currentCard.id]);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  isMastered
                    ? 'bg-[#4e6535] text-white'
                    : 'bg-white/70 text-[#514345] hover:bg-white'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isMastered ? 'Completada' : 'Marcar Aprendida'}</span>
              </button>

              <button
                onClick={() => {
                  setIsCardFlipped(false);
                  setCardIndex((prev) => (prev + 1) % DEFAULT_FLASHCARDS.length);
                }}
                className="p-2 rounded-xl bg-white/70 hover:bg-white text-[#514345] border border-white transition-all cursor-pointer"
                title="Siguiente tarjeta"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit / Add Exam Modal */}
      <ExamEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        exam={editingExam}
        subjects={subjects}
        onSave={handleSaveExam}
        onDelete={deleteExam}
      />

      {/* Subject Add/Edit Modal */}
      <SubjectManageModal
        isOpen={isAddSubjectOpen}
        onClose={() => setIsAddSubjectOpen(false)}
      />

      {/* Batch Import Modal */}
      <BatchImportModal
        isOpen={isBatchImportOpen}
        onClose={() => setIsBatchImportOpen(false)}
        defaultTarget="exams"
      />
    </div>
  );
};
