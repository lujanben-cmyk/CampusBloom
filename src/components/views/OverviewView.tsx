import React, { useState, useMemo } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  BookOpen,
  ChevronRight,
  Award,
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Target,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
  Plus,
  RotateCcw,
  Calendar,
  Clock,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  ReferenceLine,
} from 'recharts';
import { Subject } from '../../types';
import { SpotifyWidget } from '../widgets/SpotifyWidget';
import { SubjectManageModal } from '../modals/SubjectManageModal';
import { useApp } from '../../context/AppContext';

interface OverviewViewProps {
  onNavigateToAttendance?: () => void;
  onNavigateToExams?: () => void;
  onNavigateToResearch?: () => void;
}

type ChartViewType = 'bar' | 'donut';

// Custom Tooltip for Bar Chart
interface CustomBarTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      fullName: string;
      grade: number;
      maxGrade: number;
      professor: string;
      credits: number;
      percentage: number;
      color: string;
    };
  }>;
}

const CustomBarTooltip: React.FC<CustomBarTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl shadow-[#864e5a]/15 border border-white text-xs space-y-1.5 min-w-[200px] z-50">
        <div className="flex items-center justify-between gap-2 border-b border-black/5 pb-1.5">
          <span className="font-bold text-[#1b1c1c] text-sm">{data.fullName}</span>
          <span
            className="px-2 py-0.5 rounded-full font-bold text-[11px] text-white shadow-xs"
            style={{ backgroundColor: data.color }}
          >
            {data.grade.toFixed(1)} / {data.maxGrade}
          </span>
        </div>
        <p className="text-[#514345] font-medium flex items-center justify-between">
          <span>Profesor/a:</span>
          <span className="font-bold text-[#1b1c1c] truncate max-w-[120px]">{data.professor}</span>
        </p>
        <p className="text-[#514345] font-medium flex items-center justify-between">
          <span>Créditos:</span>
          <span className="font-bold text-[#4e6535]">{data.credits} créditos</span>
        </p>
        <p className="text-[#514345] font-medium flex items-center justify-between">
          <span>Rendimiento:</span>
          <span className="font-bold text-[#864e5a]">{data.percentage}%</span>
        </p>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Donut Chart
interface CustomDonutTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      count: number;
      percentage: number;
      subjects: string[];
      color: string;
    };
  }>;
}

const CustomDonutTooltip: React.FC<CustomDonutTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl shadow-[#864e5a]/15 border border-white text-xs space-y-1.5 min-w-[210px] z-50">
        <div className="flex items-center justify-between gap-2 border-b border-black/5 pb-1.5">
          <span className="font-bold text-[#1b1c1c]">{data.name}</span>
          <span
            className="px-2 py-0.5 rounded-full font-bold text-[11px] text-white"
            style={{ backgroundColor: data.color }}
          >
            {data.count} {data.count === 1 ? 'materia' : 'materias'} ({data.percentage}%)
          </span>
        </div>
        <div>
          <p className="text-[11px] font-bold text-[#514345] mb-1">Materias en este rango:</p>
          <ul className="list-disc list-inside text-[#1b1c1c] space-y-0.5">
            {data.subjects.map((sub, i) => (
              <li key={i} className="truncate">
                {sub}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
  return null;
};

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigateToAttendance,
  onNavigateToExams,
  onNavigateToResearch,
}) => {
  const {
    profile,
    subjects,
    schedule,
    overallAttendancePercentage,
    overallGPA,
    setIsBgModalOpen,
    setSelectedSubject,
    setActiveTab,
    loadStarterTemplate,
  } = useApp();

  const [chartView, setChartView] = useState<ChartViewType>('bar');
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState<boolean>(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Fallback calculations for attendance gauge
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (overallAttendancePercentage / 100) * circumference;

  // Next upcoming class from schedule
  const nextClass = useMemo(() => {
    if (!schedule || schedule.length === 0) return null;
    return schedule[0];
  }, [schedule]);

  // Dynamic Bar Chart Data mapped from real global subjects
  const barChartData = useMemo(() => {
    return subjects.map((sub) => {
      const shortName = sub.name.length > 10 ? sub.name.substring(0, 8) + '…' : sub.name;
      const percentage = Math.round((sub.grade / (sub.maxGrade || 5.0)) * 100);
      return {
        name: shortName,
        fullName: sub.name,
        grade: sub.grade,
        maxGrade: sub.maxGrade || 5.0,
        percentage,
        credits: sub.credits || 6,
        professor: sub.professor,
        color: sub.color || '#864e5a',
      };
    });
  }, [subjects]);

  // Donut Chart Distribution Data
  const donutChartData = useMemo(() => {
    if (subjects.length === 0) return [];
    const ranges = [
      { name: 'Sobresaliente (4.8 - 5.0)', min: 4.8, max: 5.0, color: '#4e6535', subjects: [] as string[] },
      { name: 'Distinguido (4.0 - 4.7)', min: 4.0, max: 4.79, color: '#864e5a', subjects: [] as string[] },
      { name: 'Bueno (3.0 - 3.9)', min: 3.0, max: 3.99, color: '#eab308', subjects: [] as string[] },
      { name: 'En Riesgo (< 3.0)', min: 0.0, max: 2.99, color: '#ef4444', subjects: [] as string[] },
    ];

    subjects.forEach((sub) => {
      const g = sub.grade || 0;
      for (const r of ranges) {
        if (g >= r.min && g <= r.max) {
          r.subjects.push(sub.name);
          break;
        }
      }
    });

    const total = subjects.length;
    return ranges
      .filter((r) => r.subjects.length > 0)
      .map((r) => ({
        name: r.name,
        count: r.subjects.length,
        percentage: Math.round((r.subjects.length / total) * 100),
        subjects: r.subjects,
        color: r.color,
      }));
  }, [subjects]);

  const handleOpenAddSubject = () => {
    setEditingSubject(null);
    setIsAddSubjectOpen(true);
  };

  const handleOpenEditSubject = (e: React.MouseEvent, sub: Subject) => {
    e.stopPropagation();
    setEditingSubject(sub);
    setIsAddSubjectOpen(true);
  };

  return (
    <div id="overview-view-screen" className="w-full flex flex-col lg:flex-row items-stretch gap-5 max-w-7xl mx-auto">
      {/* Central Main Column */}
      <div className="flex-1 flex flex-col gap-5">
        {/* Central Main Student Card */}
        <div className="rounded-[28px] glass-card p-6 sm:p-8 flex flex-col items-center shadow-xl shadow-[#864e5a]/10 border border-white/80 relative overflow-hidden backdrop-blur-xl">
          {/* Subtle decorative background glow */}
          <div className="absolute -top-20 -left-20 w-48 h-48 bg-[#ffb7c5]/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-[#cde9ac]/30 rounded-full blur-3xl pointer-events-none" />

          {/* Framed Student Avatar with Ambient Glow & Sleek Squircle Glass */}
          <div
            id="overview-profile-avatar-frame"
            className="relative mb-3 group cursor-pointer"
            onClick={() => setIsBgModalOpen(true)}
            title="Click para cambiar fondo o personalizar"
          >
            {/* Ambient Glow Aura */}
            <div className="absolute -inset-2 bg-gradient-to-r from-[#ff9ebb] via-[#ffccd5] to-[#a3d977] rounded-[32px] opacity-65 blur-md group-hover:opacity-95 group-hover:blur-lg transition-all duration-500" />

            {/* Layered Squircle Frame */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[26px] p-1.5 bg-gradient-to-br from-white/95 via-white/60 to-white/30 backdrop-blur-xl shadow-xl shadow-[#864e5a]/15 border border-white/95 ring-1 ring-black/5 flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-0.5">
              <div className="w-full h-full rounded-[20px] overflow-hidden border border-white/80 shadow-inner relative bg-[#ffd9df]/30">
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-white/20 pointer-events-none" />
              </div>
            </div>

            {/* Status Badge with Live Pulse */}
            <div
              className="absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full bg-[#1b1c1c]/85 backdrop-blur-md border border-white/80 shadow-md flex items-center gap-1.5 text-white transition-transform group-hover:scale-105"
              title="Estudiante Activo/a - CampusBloom"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#cde9ac] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6ca561]"></span>
              </span>
              <span className="text-[10px] font-bold tracking-tight text-[#cde9ac]">ACTIVO</span>
            </div>
          </div>

          {/* Student Title */}
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-[#1b1c1c] text-center tracking-tight mb-6">
            {profile.name} - {profile.title}
          </h2>

          {/* Main Content Grid inside Hero Card */}
          <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Column: Academic info & Attendance Circle & Change Background Button */}
            <div className="md:col-span-6 flex flex-col justify-between gap-5">
              {/* University & Degree Info */}
              <div className="space-y-1 text-[#3b3335] text-[13px] sm:text-[14px]">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-bold text-[#1b1c1c]">Universidad:</span>
                  <span className="font-medium text-[#4a4647]">{profile.university}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-bold text-[#1b1c1c]">Carrera:</span>
                  <span className="font-medium text-[#4a4647]">{profile.career}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#1b1c1c]">Promedio Ponderado:</span>
                  <span className="font-bold text-[#4e6535] bg-[#cde9ac]/50 px-2.5 py-0.5 rounded-full text-xs border border-[#b4cf95]/60 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-[#4e6535]" />
                    {subjects.length > 0 ? `${overallGPA.toFixed(2)} / 5.0` : 'Sin calificaciones'}
                  </span>
                </div>
              </div>

              {/* Circular Attendance Gauge */}
              <div
                onClick={() => {
                  if (onNavigateToAttendance) onNavigateToAttendance();
                  else setActiveTab('asistencia');
                }}
                className="flex items-center gap-4 p-3 rounded-2xl bg-white/40 hover:bg-white/70 border border-white/60 transition-all cursor-pointer group"
                title="Click para ver detalle de asistencia"
              >
                {/* Circular Gauge */}
                <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
                  <svg className="w-24 h-24 -rotate-90 transform" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      className="text-[#ffb7c5]/30"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      className="text-[#6ca561] transition-all duration-1000 ease-out"
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-heading text-xl font-extrabold text-[#1b1c1c]">
                      {overallAttendancePercentage}%
                    </span>
                  </div>
                </div>

                {/* Attendance Text info */}
                <div className="space-y-1 text-[13px] sm:text-[14px]">
                  <p className="text-[#1b1c1c] font-semibold">
                    Clases Efectivas: <span className="font-normal text-[#514345]">{Math.max(0, (profile.totalClasses || 0) - (profile.cancelledClasses || 0))}</span>
                  </p>
                  <p className="text-[#1b1c1c] font-semibold">
                    Clases Asistidas: <span className="font-bold text-[#4e6535]">{profile.attendedClasses}</span>
                  </p>
                  {profile.cancelledClasses ? (
                    <p className="text-[11px] text-[#b45309] font-medium">
                      {profile.cancelledClasses} canceladas por docentes
                    </p>
                  ) : null}
                  <span className="inline-block text-[11px] text-[#864e5a] font-bold group-hover:underline">
                    Ver registro detallado →
                  </span>
                </div>
              </div>

              {/* "Cambiar Fondo" Button */}
              <button
                id="change-background-hero-btn"
                onClick={() => setIsBgModalOpen(true)}
                className="w-full py-3.5 px-6 rounded-[20px] bg-gradient-to-r from-[#4e6535] to-[#618342] hover:from-[#3f532a] hover:to-[#527036] text-white font-bold text-[14px] sm:text-[15px] shadow-md shadow-[#4e6535]/25 border border-white/40 flex items-center justify-center gap-2.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <ImageIcon className="w-5 h-5 text-[#cde9ac]" />
                <span>Cambiar Fondo</span>
              </button>
            </div>

            {/* Right Column: "Mis Materias" Progress list with CRUD */}
            <div className="md:col-span-6">
              <div className="rounded-[22px] bg-white/60 p-4 sm:p-5 border border-white/85 shadow-sm flex flex-col gap-3.5 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-[16px] sm:text-[17px] font-bold text-[#1b1c1c] tracking-tight flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#864e5a]" />
                    Mis Materias ({subjects.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      id="overview-add-subject-btn"
                      onClick={handleOpenAddSubject}
                      className="px-2.5 py-1 rounded-xl bg-[#4e6535] text-white text-xs font-bold flex items-center gap-1 shadow-xs hover:bg-[#3d5029] transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir</span>
                    </button>
                  </div>
                </div>

                {/* Subject List or Empty State */}
                {subjects.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-white/50 border border-dashed border-[#864e5a]/30 text-center flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#ffd9df] text-[#864e5a] flex items-center justify-center">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-[#1b1c1c]">Lienzo en blanco</p>
                      <p className="text-[11px] text-[#514345]/80">
                        Aún no tienes materias agregadas. Puedes añadir materias manualmente o cargar el cronograma desde la pestaña correspondiente.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-center pt-1">
                      <button
                        onClick={handleOpenAddSubject}
                        className="px-3.5 py-1.5 rounded-xl bg-[#4e6535] hover:bg-[#3d5029] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                      >
                        + Añadir Materia
                      </button>
                      <button
                        onClick={loadStarterTemplate}
                        className="px-3 py-1.5 rounded-xl bg-white text-[#514345] text-[11px] font-bold border border-black/10 hover:bg-black/5 transition-all cursor-pointer"
                        title="Cargar materias modelo para demostración rápida"
                      >
                        Cargar Ejemplo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {subjects.map((sub) => {
                      const pct = Math.round(
                        (sub.attendedClasses / (sub.totalClasses || 1)) * 100
                      );
                      return (
                        <div
                          key={sub.id}
                          onClick={() => setSelectedSubject(sub)}
                          className="p-3 rounded-2xl bg-white/70 hover:bg-white/95 border border-white/80 shadow-xs transition-all flex flex-col gap-1.5 cursor-pointer group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: sub.color }}
                              />
                              <span className="font-bold text-[#1b1c1c] text-xs group-hover:text-[#864e5a] transition-colors">
                                {sub.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-[#4e6535] bg-[#cde9ac]/60 px-2 py-0.5 rounded-md">
                                {sub.grade.toFixed(1)} / 5.0
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-[#514345] group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-black/5 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: sub.color,
                              }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-[#514345]">
                            <span>{sub.professor}</span>
                            <span>{pct}% Asistencia ({sub.attendedClasses}/{sub.totalClasses})</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Academic Analytics Section (Dynamic Bar / Donut Chart) */}
        {subjects.length > 0 && (
          <div className="rounded-[28px] glass-card p-6 sm:p-7 shadow-lg border border-white/80 flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-heading text-lg sm:text-xl font-bold text-[#1b1c1c] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#4e6535]" />
                  Rendimiento y Calificaciones Académicas
                </h3>
                <p className="text-xs text-[#514345]/80">
                  Visualización de notas ponderadas y distribución porcentual por cátedra
                </p>
              </div>

              {/* Chart Toggle */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/70 border border-black/5">
                <button
                  onClick={() => setChartView('bar')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    chartView === 'bar'
                      ? 'bg-[#4e6535] text-white shadow-xs'
                      : 'text-[#514345] hover:text-[#1b1c1c]'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Barras</span>
                </button>
                <button
                  onClick={() => setChartView('donut')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    chartView === 'donut'
                      ? 'bg-[#4e6535] text-white shadow-xs'
                      : 'text-[#514345] hover:text-[#1b1c1c]'
                  }`}
                >
                  <PieIcon className="w-3.5 h-3.5" />
                  <span>Distribución</span>
                </button>
              </div>
            </div>

            {/* Chart Area */}
            <div className="w-full h-64 sm:h-72">
              {chartView === 'bar' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#514345', fontSize: 11 }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis
                      domain={[0, 5]}
                      ticks={[1, 2, 3, 4, 5]}
                      tick={{ fill: '#514345', fontSize: 11 }}
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <ReferenceLine y={4.0} stroke="#4e6535" strokeDasharray="3 3" />
                    <Bar dataKey="grade" radius={[8, 8, 0, 0]}>
                      {barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomDonutTooltip />} />
                    <Pie
                      data={donutChartData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={4}
                    >
                      {donutChartData.map((entry, index) => (
                        <Cell key={`donut-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Widgets */}
      <div className="w-full lg:w-80 flex flex-col gap-5">
        <SpotifyWidget />

        {/* Quick Next Class Widget */}
        <div className="rounded-[28px] glass-card p-5 border border-white/80 shadow-md flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="font-heading text-sm font-bold text-[#1b1c1c] flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#864e5a]" />
              Próxima Clase
            </h4>
            <span
              onClick={() => setActiveTab('cronograma')}
              className="text-[11px] font-bold text-[#864e5a] hover:underline cursor-pointer"
            >
              Horario completo →
            </span>
          </div>

          {nextClass ? (
            <div className="p-3.5 rounded-2xl bg-white/80 border border-white flex flex-col gap-1.5 text-xs shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1b1c1c]">{nextClass.subjectName}</span>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: nextClass.color }}
                >
                  {nextClass.dayOfWeek}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#514345]">
                <Clock className="w-3.5 h-3.5 text-[#4e6535]" />
                <span>{nextClass.startTime} - {nextClass.endTime}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 font-semibold">
                  {nextClass.type}
                </span>
              </div>
              <div className="text-[10px] text-[#514345]/80">
                {nextClass.location} • {nextClass.professor}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-white/50 border border-dashed border-black/10 text-center text-xs text-[#514345] space-y-1">
              <p className="font-bold text-[#1b1c1c]">Sin clases agendadas</p>
              <p className="text-[11px] text-[#514345]/70">
                Añade tus clases o impórtalas en lote (JSON) en la pestaña de Cronograma.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Subject Add/Edit Modal */}
      <SubjectManageModal
        isOpen={isAddSubjectOpen}
        onClose={() => {
          setIsAddSubjectOpen(false);
          setEditingSubject(null);
        }}
        initialSubject={editingSubject}
      />
    </div>
  );
};
