import React, { useState } from 'react';
import {
  CalendarCheck2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  Calculator,
  ShieldCheck,
  BookOpen,
  RotateCcw,
  Edit3,
  CalendarOff,
  Sparkles,
  Info,
  Check,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SubjectManageModal } from '../modals/SubjectManageModal';
import { Subject } from '../../types';

export const AttendanceView: React.FC = () => {
  const {
    profile,
    subjects,
    updateAttendance,
    adjustSubjectAttendance,
    setSubjectAttendanceStats,
    markClassCancelled,
    overallAttendancePercentage,
    loadStarterTemplate,
  } = useApp();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [simulatedAbsences, setSimulatedAbsences] = useState<number>(1);
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState<boolean>(false);
  const [editingSubjectAttendance, setEditingSubjectAttendance] = useState<Subject | null>(null);
  const [editTotalInput, setEditTotalInput] = useState<number>(28);
  const [editAttendedInput, setEditAttendedInput] = useState<number>(24);
  const [editCancelledInput, setEditCancelledInput] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const notify = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleQuickLog = (subjectId: string, type: 'present' | 'absent' | 'cancelled') => {
    if (type === 'present') {
      updateAttendance(subjectId, 1, 1, 0);
      notify('¡Asistencia registrada con éxito (+1)!');
    } else if (type === 'absent') {
      updateAttendance(subjectId, 0, 1, 0);
      notify('Inasistencia registrada (+1 clase total).');
    } else if (type === 'cancelled') {
      markClassCancelled(subjectId);
      notify('Clase registrada como cancelada / docente ausente. ¡No descuenta tu porcentaje!');
    }
  };

  const openManualEdit = (sub: Subject) => {
    setEditingSubjectAttendance(sub);
    setEditTotalInput(sub.totalClasses || 0);
    setEditAttendedInput(sub.attendedClasses || 0);
    setEditCancelledInput(sub.cancelledClasses || 0);
  };

  const saveManualEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubjectAttendance) return;
    const safeTotal = Math.max(0, Number(editTotalInput) || 0);
    const safeCancelled = Math.max(0, Number(editCancelledInput) || 0);
    const safeAttended = Math.max(0, Math.min(safeTotal, Number(editAttendedInput) || 0));

    setSubjectAttendanceStats(editingSubjectAttendance.id, {
      totalClasses: safeTotal,
      attendedClasses: safeAttended,
      cancelledClasses: safeCancelled,
    });

    notify(`Cómputo de ${editingSubjectAttendance.name} actualizado.`);
    setEditingSubjectAttendance(null);
  };

  // Absence simulator calculations
  const simSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];
  const simTotalScheduled = simSubject ? simSubject.totalClasses || 0 : 0;
  const simCancelled = simSubject ? simSubject.cancelledClasses || 0 : 0;
  const simEffectiveTotal = Math.max(0, simTotalScheduled - simCancelled) + simulatedAbsences;
  const simAttended = simSubject ? simSubject.attendedClasses || 0 : 0;
  const simProjectedPercent = simEffectiveTotal > 0 ? Math.min(100, Math.round((simAttended / simEffectiveTotal) * 100)) : 100;
  const isRegularSafe = simProjectedPercent >= 80;

  return (
    <div id="attendance-view-screen" className="w-full flex flex-col gap-5 max-w-7xl mx-auto">
      {/* Top Banner Alert / Success Toast */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-[#cde9ac] text-[#374d20] font-bold text-xs border border-[#b4cf95] flex items-center justify-between shadow-md animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4.5 h-4.5 text-[#4e6535] shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-[#374d20] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Metric Banner */}
      <div className="rounded-[28px] glass-card p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-[#864e5a]/10 border border-white/80">
        <div className="flex items-center gap-5">
          {/* Circular Metric */}
          <div className="w-24 h-24 rounded-full p-2 bg-gradient-to-tr from-[#cde9ac] to-[#4e6535] flex items-center justify-center text-white shadow-lg shadow-[#4e6535]/20 flex-shrink-0">
            <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center text-[#1b1c1c]">
              <span className="font-heading text-2xl font-extrabold">{overallAttendancePercentage}%</span>
              <span className="text-[10px] text-[#514345] font-bold uppercase tracking-wider">Efectivo</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ffd9df] text-[#6b3743] border border-[#ffb7c5]">
                Reglamento Académico
              </span>
              <span className="text-xs text-[#514345] font-semibold">Mínimo Requerido: 80%</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#cde9ac] text-[#374d20] border border-[#b4cf95]">
                Clases canceladas no descuentan
              </span>
            </div>
            <h2 className="font-heading text-2xl font-bold text-[#1b1c1c] tracking-tight mt-1">
              Control de Asistencia Universitaria
            </h2>
            <p className="text-xs sm:text-sm text-[#514345]/80 mt-0.5">
              Has asistido a <strong className="text-[#4e6535]">{profile.attendedClasses}</strong> de{' '}
              <strong className="text-[#1b1c1c]">{Math.max(0, (profile.totalClasses || 0) - (profile.cancelledClasses || 0))}</strong> clases efectivas
              {profile.cancelledClasses ? (
                <span> (<strong className="text-[#b45309]">{profile.cancelledClasses}</strong> canceladas por docentes)</span>
              ) : null}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <button
            onClick={() => setIsAddSubjectOpen(true)}
            className="flex-1 md:flex-initial px-4 py-3 rounded-2xl glass-inner text-xs font-bold text-[#514345] hover:bg-white/80 border border-white/80 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#864e5a]" />
            <span>Añadir Materia</span>
          </button>

          {subjects.length > 0 && (
            <button
              id="open-register-attendance-modal-btn"
              onClick={() => setShowLogModal(true)}
              className="flex-1 md:flex-initial px-5 py-3 rounded-2xl bg-[#4e6535] hover:bg-[#3d5029] text-white text-xs font-bold shadow-md shadow-[#4e6535]/25 flex items-center justify-center gap-2 transition-all hover:scale-105 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Asistencia Hoy</span>
            </button>
          )}
        </div>
      </div>

      {/* When no subjects: Empty State */}
      {subjects.length === 0 ? (
        <div className="rounded-[28px] glass-card p-10 text-center flex flex-col items-center justify-center gap-4 border border-white shadow-lg">
          <div className="w-16 h-16 rounded-3xl bg-[#cde9ac]/50 text-[#4e6535] flex items-center justify-center shadow-md">
            <CalendarCheck2 className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="font-heading text-lg font-bold text-[#1b1c1c]">
              No hay materias en tu control de asistencia
            </h3>
            <p className="text-xs text-[#514345]/80">
              Agrega tus materias o importa tu cronograma para que se generen automáticamente las barras de regularidad y el simulador de faltas.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-center pt-2">
            <button
              onClick={() => setIsAddSubjectOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#4e6535] hover:bg-[#3d5029] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              + Añadir Materia
            </button>
            <button
              onClick={loadStarterTemplate}
              className="px-4 py-2.5 rounded-xl bg-white text-[#514345] text-xs font-bold border border-black/10 hover:bg-black/5 transition-all cursor-pointer"
            >
              Cargar Ejemplo
            </button>
          </div>
        </div>
      ) : (
        /* Grid: Subject Breakdown on Left + Simulator on Right */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Subject Breakdown Cards (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-heading text-lg font-bold text-[#1b1c1c] flex items-center gap-2">
                <CalendarCheck2 className="w-5 h-5 text-[#864e5a]" />
                Asistencia por Cátedra ({subjects.length})
              </h3>
              <span className="text-[11px] text-[#514345]/80 font-medium hidden sm:inline">
                Usa los botones (+ / -) o edita el total programado
              </span>
            </div>

            <div className="space-y-3.5">
              {subjects.map((sub) => {
                const totalScheduled = sub.totalClasses || 0;
                const cancelled = sub.cancelledClasses || 0;
                const effectiveClasses = Math.max(0, totalScheduled - cancelled);
                const attended = sub.attendedClasses || 0;
                const percent =
                  effectiveClasses > 0
                    ? Math.min(100, Math.round((Math.min(attended, effectiveClasses) / effectiveClasses) * 100))
                    : 100;

                const isWarning = percent < 75;
                const isBorderline = percent >= 75 && percent < 80;

                return (
                  <div
                    key={sub.id}
                    id={`attendance-card-${sub.id}`}
                    className={`rounded-[24px] p-4 sm:p-5 border transition-all duration-200 shadow-sm ${
                      isWarning
                        ? 'bg-[#fadadd]/80 border-[#9e6b6e]/30'
                        : isBorderline
                        ? 'glass-card border-[#ffd9df]'
                        : 'glass-card border-white/80'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: sub.color }}
                          />
                          <h4 className="font-heading text-[15px] font-bold text-[#1b1c1c]">
                            {sub.name}
                          </h4>
                          {isWarning && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#ba1a1a] text-white flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Riesgo (&lt;80%)
                            </span>
                          )}
                          {isBorderline && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ffd9df] text-[#7b4551]">
                              En límite (80%)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#514345]/80 mt-0.5">
                          {sub.classroom} • {sub.professor}
                        </p>
                      </div>

                      {/* Percentage & Summary Pill */}
                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <button
                          onClick={() => openManualEdit(sub)}
                          className="px-2 py-1 rounded-xl bg-white/80 hover:bg-white text-[11px] font-bold text-[#514345] border border-black/5 flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                          title="Editar total y cómputo de asistencia manualmente"
                        >
                          <Edit3 className="w-3 h-3 text-[#864e5a]" />
                          <span>Editar</span>
                        </button>

                        <div className="text-right">
                          <span className="font-heading text-xl font-extrabold text-[#1b1c1c]">
                            {percent}%
                          </span>
                          <div className="text-[10px] text-[#514345] font-semibold">
                            {attended} de {effectiveClasses} clases
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-black/5 rounded-full h-2.5 overflow-hidden mb-3">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: sub.color || '#4e6535',
                        }}
                      />
                    </div>

                    {/* Classes Breakdown Stats */}
                    <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-white/60 border border-white text-center text-xs mb-3">
                      <div>
                        <span className="text-[10px] text-[#514345] block font-medium">Programadas</span>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <button
                            onClick={() => adjustSubjectAttendance(sub.id, { total: -1 })}
                            className="w-5 h-5 rounded-md bg-white text-[#514345] hover:bg-black/5 flex items-center justify-center border border-black/5 font-bold cursor-pointer"
                            title="Restar 1 clase programada"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-[#1b1c1c] text-xs px-1">
                            {totalScheduled}
                          </span>
                          <button
                            onClick={() => adjustSubjectAttendance(sub.id, { total: 1 })}
                            className="w-5 h-5 rounded-md bg-white text-[#514345] hover:bg-black/5 flex items-center justify-center border border-black/5 font-bold cursor-pointer"
                            title="Sumar 1 clase programada"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-[#4e6535] block font-bold">Asistidas</span>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <button
                            onClick={() => adjustSubjectAttendance(sub.id, { attended: -1 })}
                            className="w-5 h-5 rounded-md bg-white text-[#4e6535] hover:bg-black/5 flex items-center justify-center border border-black/5 font-bold cursor-pointer"
                            title="Restar 1 asistencia"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-[#4e6535] text-xs px-1">
                            {attended}
                          </span>
                          <button
                            onClick={() => adjustSubjectAttendance(sub.id, { attended: 1 })}
                            className="w-5 h-5 rounded-md bg-white text-[#4e6535] hover:bg-black/5 flex items-center justify-center border border-black/5 font-bold cursor-pointer"
                            title="Sumar 1 asistencia"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-[#b45309] block font-bold" title="No descuenta asistencia">
                          Canceladas
                        </span>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <button
                            onClick={() => adjustSubjectAttendance(sub.id, { cancelled: -1 })}
                            className="w-5 h-5 rounded-md bg-white text-[#b45309] hover:bg-black/5 flex items-center justify-center border border-black/5 font-bold cursor-pointer"
                            title="Restar 1 clase cancelada"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-[#b45309] text-xs px-1">
                            {cancelled}
                          </span>
                          <button
                            onClick={() => adjustSubjectAttendance(sub.id, { cancelled: 1 })}
                            className="w-5 h-5 rounded-md bg-white text-[#b45309] hover:bg-black/5 flex items-center justify-center border border-black/5 font-bold cursor-pointer"
                            title="Sumar 1 clase cancelada por docente"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Buttons Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-black/5 text-xs flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleQuickLog(sub.id, 'present')}
                          className="px-2.5 py-1.5 rounded-xl bg-[#cde9ac] text-[#374d20] hover:bg-[#bede99] font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                          title="Registrar Asistió (+1)"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#4e6535]" />
                          <span>+ Presente</span>
                        </button>
                        <button
                          onClick={() => handleQuickLog(sub.id, 'absent')}
                          className="px-2.5 py-1.5 rounded-xl bg-[#ffd9df] text-[#6b3743] hover:bg-[#ffccd5] font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                          title="Registrar Inasistencia (+1 clase total, 0 asistida)"
                        >
                          <XCircle className="w-3.5 h-3.5 text-[#ba1a1a]" />
                          <span>+ Ausente</span>
                        </button>
                      </div>

                      <button
                        onClick={() => handleQuickLog(sub.id, 'cancelled')}
                        className="px-2.5 py-1.5 rounded-xl bg-[#fff2d6] hover:bg-[#ffe6b3] text-[#8c4800] font-bold text-[11px] flex items-center gap-1.5 border border-[#ffd280]/60 transition-all cursor-pointer shadow-xs"
                        title="Marcar clase cancelada por el docente / sin clase (no descuenta tu porcentaje)"
                      >
                        <CalendarOff className="w-3.5 h-3.5 text-[#b45309]" />
                        <span>Sin Clase / Docente Ausente</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Absence Simulator & Regulations (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Absence Simulator Card */}
            <div className="rounded-[28px] glass-card p-6 shadow-lg border border-white/80 flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#ffd9df] text-[#864e5a] flex items-center justify-center">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-bold text-[#1b1c1c]">
                    Simulador Predictivo de Faltas
                  </h3>
                  <p className="text-xs text-[#514345]/80">
                    Calcula cómo afectarán inasistencias futuras a tu regularidad.
                  </p>
                </div>
              </div>

              {/* Subject selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#514345]">Seleccionar Cátedra:</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white/80 border border-[#864e5a]/20 text-xs font-medium text-[#1b1c1c] outline-none focus:ring-1 focus:ring-[#4e6535]"
                >
                  {subjects.map((sub) => {
                    const eff = Math.max(0, (sub.totalClasses || 0) - (sub.cancelledClasses || 0));
                    const p = eff > 0 ? Math.round(((sub.attendedClasses || 0) / eff) * 100) : 100;
                    return (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} (Actual: {p}%)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Number of simulated absences slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#514345]">Faltas futuras que planeas tener:</span>
                  <span className="font-bold text-[#864e5a] text-sm">{simulatedAbsences} clases</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={simulatedAbsences}
                  onChange={(e) => setSimulatedAbsences(parseInt(e.target.value, 10))}
                  className="w-full accent-[#864e5a] cursor-pointer"
                />
              </div>

              {/* Projection Result */}
              {simSubject && (
                <div
                  className={`p-4 rounded-2xl border flex flex-col gap-2 ${
                    isRegularSafe
                      ? 'bg-[#cde9ac]/40 border-[#b4cf95] text-[#374d20]'
                      : 'bg-[#ffd9df]/50 border-[#ffb7c5] text-[#6b3743]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Asistencia Proyectada:</span>
                    <span className="font-heading text-lg font-extrabold">{simProjectedPercent}%</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs">
                    {isRegularSafe ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-[#4e6535] shrink-0" />
                        <span>Mantienes la Regularidad (≥ 80%). Aún puedes firmar la libreta y rendir examen final.</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-[#ba1a1a] shrink-0" />
                        <span className="font-bold text-[#ba1a1a]">
                          ¡Peligro! Caerías por debajo del 80% reglamentario.
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Academic Regulation Notice */}
            <div className="rounded-[28px] glass-card p-5 border border-white/80 shadow-md flex flex-col gap-2.5 text-xs text-[#514345]">
              <h4 className="font-heading font-bold text-[#1b1c1c] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#4e6535]" />
                Normativa de Regularidad Universitaria
              </h4>
              <p className="leading-relaxed">
                El estudiante debe registrar un mínimo del <strong>80% de asistencia presencial</strong> en clases prácticas y laboratorios para tener derecho a firmar la libreta y acceder a los periodos de exámenes finales ordinarios.
              </p>
              <div className="p-3 rounded-xl bg-white/70 border border-white flex items-start gap-2 text-[11px] text-[#514345]">
                <Info className="w-4 h-4 text-[#4e6535] shrink-0 mt-0.5" />
                <span>
                  <strong>Nota sobre clases canceladas:</strong> Si la Dra. o docente se ausenta o la cátedra se suspende, regístrala como <em>"Docente Ausente / Cancelada"</em> para que dicha fecha sea excluida del total evaluado y no reduzca tu porcentaje.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Attendance Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-[28px] glass-card p-6 shadow-2xl border border-white flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/5 pb-2.5">
              <h3 className="font-heading text-lg font-bold text-[#1b1c1c]">
                Registrar Asistencia de la Jornada
              </h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1.5 rounded-xl hover:bg-black/5 text-[#514345] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#514345]">
              Selecciona el estado de tu clase hoy. Las clases canceladas por docentes no perjudican tu porcentaje.
            </p>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {subjects.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3.5 rounded-2xl bg-white/80 border border-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-xs"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.color }} />
                      <span className="font-bold text-[#1b1c1c]">{sub.name}</span>
                    </div>
                    <span className="text-[11px] text-[#514345]/70 block mt-0.5">
                      {sub.attendedClasses} asistidas / {sub.totalClasses} totales
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => {
                        handleQuickLog(sub.id, 'present');
                        setShowLogModal(false);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-[#cde9ac] text-[#374d20] font-bold text-[11px] hover:bg-[#bede99] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#4e6535]" />
                      <span>Asistí</span>
                    </button>

                    <button
                      onClick={() => {
                        handleQuickLog(sub.id, 'absent');
                        setShowLogModal(false);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-[#ffd9df] text-[#6b3743] font-bold text-[11px] hover:bg-[#ffccd5] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5 text-[#ba1a1a]" />
                      <span>Falté</span>
                    </button>

                    <button
                      onClick={() => {
                        handleQuickLog(sub.id, 'cancelled');
                        setShowLogModal(false);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-[#fff2d6] text-[#8c4800] font-bold text-[11px] hover:bg-[#ffe6b3] transition-colors cursor-pointer flex items-center gap-1 border border-[#ffd280]/60"
                      title="Docente ausente / Cancelada (No perjudica)"
                    >
                      <CalendarOff className="w-3.5 h-3.5 text-[#b45309]" />
                      <span>Cancelada</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowLogModal(false)}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-[#514345] hover:bg-black/5 transition-colors cursor-pointer mt-1"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Manual Attendance Subject Editor Modal */}
      {editingSubjectAttendance && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-[28px] glass-card p-6 shadow-2xl border border-white flex flex-col gap-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-black/5 pb-2.5">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: editingSubjectAttendance.color }}
                >
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-bold text-[#1b1c1c]">
                    Editar Cómputo de Asistencia
                  </h3>
                  <p className="text-[11px] text-[#514345]/80">{editingSubjectAttendance.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingSubjectAttendance(null)}
                className="p-1.5 rounded-xl hover:bg-black/5 text-[#514345] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveManualEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#514345] mb-1 block">
                  Total de Clases Programadas en el Semestre:
                </label>
                <input
                  type="number"
                  min="0"
                  value={editTotalInput}
                  onChange={(e) => setEditTotalInput(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2.5 rounded-xl bg-white/90 border border-white text-xs font-mono font-bold text-[#1b1c1c] outline-none focus:ring-2 focus:ring-[#4e6535]"
                />
              </div>

              <div>
                <label className="font-bold text-[#514345] mb-1 block">
                  Clases Asistidas por el Alumno:
                </label>
                <input
                  type="number"
                  min="0"
                  value={editAttendedInput}
                  onChange={(e) => setEditAttendedInput(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2.5 rounded-xl bg-white/90 border border-white text-xs font-mono font-bold text-[#4e6535] outline-none focus:ring-2 focus:ring-[#4e6535]"
                />
              </div>

              <div>
                <label className="font-bold text-[#514345] mb-1 flex items-center justify-between">
                  <span>Clases Canceladas / Docente Ausente:</span>
                  <span className="text-[10px] text-[#4e6535] font-semibold">No descuenta asistencia</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={editCancelledInput}
                  onChange={(e) => setEditCancelledInput(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2.5 rounded-xl bg-white/90 border border-white text-xs font-mono font-bold text-[#b45309] outline-none focus:ring-2 focus:ring-[#b45309]"
                />
              </div>

              {/* Live calculation preview in modal */}
              {(() => {
                const eff = Math.max(0, (editTotalInput || 0) - (editCancelledInput || 0));
                const att = Math.min(eff, Math.max(0, editAttendedInput || 0));
                const p = eff > 0 ? Math.round((att / eff) * 100) : 100;
                return (
                  <div className="p-3 rounded-xl bg-[#f5f9f0] border border-[#cde9ac] text-[11px] text-[#374d20] flex items-center justify-between">
                    <span>Porcentaje resultante:</span>
                    <strong className="font-heading text-sm font-extrabold">{p}%</strong>
                  </div>
                );
              })()}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSubjectAttendance(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white text-[#514345] font-bold border border-black/10 hover:bg-black/5 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#4e6535] hover:bg-[#3d5029] text-white font-bold transition-all shadow-md cursor-pointer"
                >
                  Guardar Cómputo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Add/Edit Modal */}
      <SubjectManageModal
        isOpen={isAddSubjectOpen}
        onClose={() => setIsAddSubjectOpen(false)}
      />
    </div>
  );
};
