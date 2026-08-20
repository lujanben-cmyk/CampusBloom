import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  UserCheck,
  Plus,
  Filter,
  Download,
  Trash2,
  BookOpen,
  Sparkles,
  FileJson,
  LayoutGrid,
} from 'lucide-react';
import { ClassScheduleItem, Subject } from '../../types';
import { useApp } from '../../context/AppContext';
import { SubjectManageModal } from '../modals/SubjectManageModal';
import { BatchImportModal } from '../modals/BatchImportModal';
import { CronogramaBloom } from '../cronograma/CampusBloomCronograma';

const DAYS: Array<'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado'> = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

export const ScheduleView: React.FC = () => {
  const {
    schedule,
    subjects,
    addClass,
    deleteClass,
    loadStarterTemplate,
  } = useApp();

  const [viewMode, setViewMode] = useState<'semanal' | 'unificado_json'>('semanal');
  const [selectedDay, setSelectedDay] = useState<
    'Todos' | 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado'
  >('Todos');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState<boolean>(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState<boolean>(false);

  // New class form state
  const [newSubjectId, setNewSubjectId] = useState<string>(subjects[0]?.id || '');
  const [newDay, setNewDay] = useState<'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado'>(
    'Lunes'
  );
  const [newStartTime, setNewStartTime] = useState<string>('08:00');
  const [newEndTime, setNewEndTime] = useState<string>('10:00');
  const [newLocation, setNewLocation] = useState<string>('Pabellón Central A-101');
  const [newType, setNewType] = useState<'Teoría' | 'Práctica' | 'Laboratorio' | 'Seminario'>('Teoría');

  const filteredSchedule = schedule.filter((item) => {
    const matchesDay = selectedDay === 'Todos' || item.dayOfWeek === selectedDay;
    const matchesSub = filterSubject === 'all' || item.subjectId === filterSubject;
    return matchesDay && matchesSub;
  });

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    const subj = subjects.find((s) => s.id === newSubjectId) || subjects[0];
    if (!subj) return;

    addClass({
      subjectId: subj.id,
      subjectName: subj.name,
      dayOfWeek: newDay,
      startTime: newStartTime,
      endTime: newEndTime,
      location: newLocation,
      professor: subj.professor,
      type: newType,
      color: subj.color,
    });

    setIsAddModalOpen(false);
  };

  const handleExportSchedule = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Día,Horario,Materia,Tipo,Aula,Docente\n' +
      schedule
        .map(
          (s) =>
            `${s.dayOfWeek},${s.startTime}-${s.endTime},"${s.subjectName}",${s.type},"${s.location}","${s.professor}"`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Cronograma_CampusBloom.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="schedule-view-screen" className="w-full flex flex-col gap-5 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="rounded-[28px] glass-card p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md shadow-[#864e5a]/10 border border-white/80">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#cde9ac] text-[#374d20] border border-[#b4cf95]">
              Horario Académico 2026
            </span>
            <span className="text-xs text-[#514345] font-medium">
              {schedule.length} clases en cuadrícula
            </span>
          </div>
          <h2 className="font-heading text-2xl font-bold text-[#1b1c1c] tracking-tight">
            Cronograma de Clases y Pipeline Unificado
          </h2>
          <p className="text-xs sm:text-sm text-[#514345]/80">
            Gestiona tus horas de clases teóricas, laboratorios y el pipeline de cronograma unificado JSON.
          </p>
        </div>

        {/* Action buttons & View Mode Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded-2xl glass-inner border border-white/80 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('semanal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'semanal'
                  ? 'bg-[#4e6535] text-white shadow-xs'
                  : 'text-[#514345] hover:bg-white/60'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cuadrícula Semanal</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('unificado_json')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'unificado_json'
                  ? 'bg-[#864e5a] text-white shadow-xs'
                  : 'text-[#514345] hover:bg-white/60'
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Cronograma Unificado (JSON)</span>
            </button>
          </div>

          <button
            id="schedule-batch-import-btn"
            onClick={() => setIsBatchImportOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl glass-inner text-xs font-bold text-[#4e6535] hover:bg-white/90 transition-all border border-white/80 shadow-sm cursor-pointer hover:scale-105"
            title="Importar cronograma de clases masivamente desde Gemini o NotebookLM"
          >
            <span className="text-sm">📋</span>
            <span>Importar en Lote</span>
          </button>

          {schedule.length > 0 && (
            <button
              id="schedule-export-btn"
              onClick={handleExportSchedule}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl glass-inner text-xs font-bold text-[#514345] hover:bg-white/80 transition-all border border-white/80 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#4e6535]" />
              <span>Exportar CSV</span>
            </button>
          )}

          <button
            id="schedule-add-class-btn"
            onClick={() => {
              if (subjects.length === 0) {
                setIsAddSubjectOpen(true);
              } else {
                setNewSubjectId(subjects[0]?.id || '');
                setIsAddModalOpen(true);
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#4e6535] hover:bg-[#3d5029] text-white text-xs font-bold shadow-md shadow-[#4e6535]/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Clase</span>
          </button>
        </div>
      </div>

      {viewMode === 'unificado_json' ? (
        /* Unified JSON Pipeline Component */
        <CronogramaBloom />
      ) : (
        /* Weekly Grid View */
        <>
          {/* Filter Tabs by Day & Subject */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 px-1">
            {/* Day Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              <button
                onClick={() => setSelectedDay('Todos')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedDay === 'Todos'
                    ? 'bg-[#864e5a] text-white shadow-xs'
                    : 'bg-white/70 text-[#514345] hover:bg-white'
                }`}
              >
                Todos los Días
              </button>
              {DAYS.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedDay === d
                      ? 'bg-[#864e5a] text-white shadow-xs'
                      : 'bg-white/70 text-[#514345] hover:bg-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Subject Filter Dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#514345]" />
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="p-1.5 px-3 rounded-xl bg-white/80 border border-white text-xs text-[#1b1c1c] font-medium outline-none focus:ring-1 focus:ring-[#4e6535]"
              >
                <option value="all">Todas las materias ({subjects.length})</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Empty State when 0 classes */}
          {filteredSchedule.length === 0 ? (
            <div className="rounded-[28px] glass-card p-10 text-center flex flex-col items-center justify-center gap-4 border border-white shadow-lg">
              <div className="w-16 h-16 rounded-3xl bg-[#ffd9df] text-[#864e5a] flex items-center justify-center shadow-md">
                <CalendarIcon className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="font-heading text-lg font-bold text-[#1b1c1c]">
                  No hay clases registradas para este filtro
                </h3>
                <p className="text-xs text-[#514345]/80">
                  Puedes sincronizar el cronograma unificado JSON en 1 clic, importar en lote con IA o añadir clases de forma manual.
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap justify-center pt-2">
                <button
                  onClick={() => setViewMode('unificado_json')}
                  className="px-5 py-2.5 rounded-xl bg-[#864e5a] hover:bg-[#6e3e48] text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <FileJson className="w-4 h-4 text-[#ffb7c5]" />
                  <span>Ver Cronograma Unificado (JSON)</span>
                </button>
                <button
                  onClick={() => setIsBatchImportOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#4e6535] hover:bg-[#3d5029] text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>📋</span>
                  <span>Importar en Lote</span>
                </button>
                <button
                  onClick={loadStarterTemplate}
                  className="px-4 py-2.5 rounded-xl bg-white text-[#514345] text-xs font-bold border border-black/10 hover:bg-black/5 cursor-pointer"
                >
                  Cargar Ejemplo
                </button>
              </div>
            </div>
          ) : (
            /* Schedule Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSchedule.map((item) => (
                <div
                  key={item.id}
                  id={`schedule-item-${item.id}`}
                  className="rounded-[24px] glass-card p-5 border border-white/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3 group relative overflow-hidden"
                >
                  <div
                    className="absolute top-0 left-0 bottom-0 w-1.5"
                    style={{ backgroundColor: item.color || '#864e5a' }}
                  />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs"
                        style={{ backgroundColor: item.color || '#864e5a' }}
                      >
                        {item.dayOfWeek}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/5 text-[#514345]">
                          {item.type}
                        </span>
                        <button
                          onClick={() => deleteClass(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-md transition-all cursor-pointer"
                          title="Eliminar clase"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-heading text-base font-bold text-[#1b1c1c] tracking-tight">
                      {item.subjectName}
                    </h4>

                    <div className="space-y-1.5 text-xs text-[#514345] pt-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#4e6535]" />
                        <span className="font-bold text-[#1b1c1c]">
                          {item.startTime} - {item.endTime}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#864e5a]" />
                        <span>{item.location}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-[#514345]" />
                        <span className="truncate">{item.professor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}


      {/* Add Class Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-[28px] glass-card p-6 shadow-2xl border border-white flex flex-col gap-4">
            <h3 className="font-heading text-lg font-bold text-[#1b1c1c]">
              Agregar Nueva Clase al Horario
            </h3>

            <form onSubmit={handleCreateClass} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-[#514345] mb-1 block">Materia / Cátedra</label>
                <select
                  value={newSubjectId}
                  onChange={(e) => setNewSubjectId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white/90 border border-white text-xs font-bold text-[#1b1c1c] outline-none focus:ring-2 focus:ring-[#4e6535]"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#514345] mb-1 block">Día</label>
                  <select
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-white/90 border border-white text-xs text-[#1b1c1c] outline-none focus:ring-2 focus:ring-[#4e6535]"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#514345] mb-1 block">Tipo</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-white/90 border border-white text-xs text-[#1b1c1c] outline-none focus:ring-2 focus:ring-[#4e6535]"
                  >
                    <option value="Teoría">Teoría</option>
                    <option value="Práctica">Práctica</option>
                    <option value="Laboratorio">Laboratorio</option>
                    <option value="Seminario">Seminario</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#514345] mb-1 block">Hora Inicio</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl bg-white/90 border border-white text-xs text-[#1b1c1c] outline-none focus:ring-2 focus:ring-[#4e6535]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#514345] mb-1 block">Hora Fin</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl bg-white/90 border border-white text-xs text-[#1b1c1c] outline-none focus:ring-2 focus:ring-[#4e6535]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#514345] mb-1 block">Lugar / Aula / Pabellón</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Ej: Pabellón Central A-101"
                  required
                  className="w-full p-2.5 rounded-xl bg-white/90 border border-white text-xs text-[#1b1c1c] outline-none focus:ring-2 focus:ring-[#4e6535]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#514345] font-bold hover:bg-black/5 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#4e6535] hover:bg-[#3d5029] text-white font-bold shadow-md cursor-pointer"
                >
                  Guardar Clase
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

      {/* Batch Import Modal */}
      <BatchImportModal
        isOpen={isBatchImportOpen}
        onClose={() => setIsBatchImportOpen(false)}
        defaultTarget="schedule"
      />
    </div>
  );
};
