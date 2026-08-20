import React, { useState, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  UserCheck,
  Sparkles,
  BookOpen,
  Layers,
  FileJson,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Download,
  Filter,
  ArrowRight,
} from 'lucide-react';
import { UnifiedCronogramaEvent } from '../../types';
import { useCronograma, useCronogramaViews } from '../../hooks/useCronograma';
import { BatchImportModal } from '../modals/BatchImportModal';

interface EventoCardProps {
  evento: UnifiedCronogramaEvent;
}

export const EventoCard: React.FC<EventoCardProps> = ({ evento }) => {
  const getBadgeStyle = (tipo: string) => {
    const t = tipo.toLowerCase();
    if (t.includes('final')) {
      return {
        bg: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300',
        pill: 'bg-red-500/20 text-red-800 dark:text-red-200 border border-red-500/30',
        dot: 'bg-red-500',
      };
    }
    if (t.includes('recuperatorio')) {
      return {
        bg: 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300',
        pill: 'bg-orange-500/20 text-orange-800 dark:text-orange-200 border border-orange-500/30',
        dot: 'bg-orange-500',
      };
    }
    if (t.includes('parcial') || t.includes('examen')) {
      return {
        bg: 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300',
        pill: 'bg-rose-500/20 text-rose-800 dark:text-rose-200 border border-rose-500/30',
        dot: 'bg-rose-500',
      };
    }
    if (t.includes('entrega')) {
      return {
        bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300',
        pill: 'bg-indigo-500/20 text-indigo-800 dark:text-indigo-200 border border-indigo-500/30',
        dot: 'bg-indigo-500',
      };
    }
    if (t.includes('aula invertida')) {
      return {
        bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300',
        pill: 'bg-cyan-500/20 text-cyan-800 dark:text-cyan-200 border border-cyan-500/30',
        dot: 'bg-cyan-500',
      };
    }
    if (t.includes('evento')) {
      return {
        bg: 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-700 dark:text-fuchsia-300',
        pill: 'bg-fuchsia-500/20 text-fuchsia-800 dark:text-fuchsia-200 border border-fuchsia-500/30',
        dot: 'bg-fuchsia-500',
      };
    }
    if (t.includes('seminario')) {
      return {
        bg: 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300',
        pill: 'bg-purple-500/20 text-purple-800 dark:text-purple-200 border border-purple-500/30',
        dot: 'bg-purple-500',
      };
    }
    if (t.includes('práctica') || t.includes('practica')) {
      return {
        bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
        pill: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30',
        dot: 'bg-emerald-600',
      };
    }
    if (t.includes('investigación') || t.includes('investigacion')) {
      return {
        bg: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300',
        pill: 'bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30',
        dot: 'bg-amber-500',
      };
    }
    return {
      bg: 'bg-slate-500/10 border-slate-500/30 text-slate-700 dark:text-slate-300',
      pill: 'bg-slate-500/20 text-slate-800 dark:text-slate-200 border border-slate-500/30',
      dot: 'bg-slate-500',
    };
  };

  const style = getBadgeStyle(evento.tipo);

  return (
    <div
      className={`rounded-2xl border p-4 transition-all duration-200 hover:shadow-md flex flex-col justify-between gap-2.5 bloom-inner ${style.bg}`}
    >
      <div className="flex items-center justify-between gap-2 text-xs font-semibold">
        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${style.pill}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          {evento.tipo}
        </span>
        <span className="text-[11px] font-medium opacity-85 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {evento.horario}
        </span>
      </div>

      <div>
        <h4 className="font-heading font-extrabold text-sm sm:text-base text-[var(--theme-text-primary)] leading-snug">
          {evento.materia}
        </h4>
        {evento.tema && (
          <p className="mt-1 text-xs text-[var(--theme-text-secondary)] line-clamp-2 leading-relaxed">
            {evento.tema}
          </p>
        )}
      </div>

      <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] text-[var(--theme-text-secondary)] font-medium">
        <span className="flex items-center gap-1">
          <CalendarIcon className="w-3 h-3 text-[var(--theme-accent)]" />
          {evento.fecha}
        </span>
        {evento.aula && (
          <span className="flex items-center gap-1 max-w-[130px] truncate" title={evento.aula}>
            <MapPin className="w-3 h-3 text-[var(--theme-secondary)]" />
            {evento.aula}
          </span>
        )}
      </div>
    </div>
  );
};

export const CronogramaBloom: React.FC = () => {
  const { eventos, loading, error, refetch, importCustomEvents, syncToCampusBloom } = useCronograma();
  const { todos, examenes, porMateria, materias } = useCronogramaViews(eventos);

  const [activeSection, setActiveSection] = useState<'todos' | 'cronograma' | 'examenes' | 'materias'>('todos');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('todos');
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          importCustomEvents(parsed);
          setSyncToast(`¡Se cargaron con éxito ${parsed.length} eventos desde el archivo JSON!`);
          setTimeout(() => setSyncToast(null), 4000);
        } else {
          alert('El archivo JSON debe contener un arreglo de eventos.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON. Formato no válido.');
      }
    };
    reader.readAsText(file);
  };

  const handleSyncToAppState = () => {
    const result = syncToCampusBloom();
    setSyncToast(
      `✓ Sincronizado: ${result.subjectsAdded} materias creadas, ${result.classesAdded} clases añadidas y ${result.examsAdded} exámenes registrados en el estado global.`
    );
    setTimeout(() => setSyncToast(null), 5000);
  };

  const filteredTodos = todos.filter((e) => {
    if (selectedTypeFilter === 'todos') return true;
    return e.tipo.toLowerCase().includes(selectedTypeFilter.toLowerCase());
  });

  if (loading) {
    return (
      <div className="rounded-[28px] bloom-glass p-8 text-center flex flex-col items-center justify-center gap-3 border border-[var(--theme-card-border)]">
        <RefreshCw className="w-6 h-6 text-[var(--theme-accent)] animate-spin" />
        <p className="text-sm font-bold text-[var(--theme-text-primary)]">
          Cargando cronograma unificado...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[28px] bloom-glass p-8 text-center flex flex-col items-center justify-center gap-3 border border-red-300">
        <AlertCircle className="w-8 h-8 text-red-500" />
        <h3 className="text-base font-bold text-red-600">Error al cargar cronograma</h3>
        <p className="text-xs text-[var(--theme-text-secondary)]">{error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 rounded-xl bg-[var(--theme-secondary)] text-white font-bold text-xs shadow-md"
        >
          Reintentar Carga
        </button>
      </div>
    );
  }

  return (
    <div id="unified-cronograma-container" className="w-full flex flex-col gap-6">
      {/* Action Header Card */}
      <div className="rounded-[28px] bloom-glass p-5 sm:p-6 shadow-xl border border-[var(--theme-card-border)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--theme-secondary-light)] text-[var(--theme-nav-active-text)] border border-[var(--theme-secondary)] flex items-center gap-1.5">
              <FileJson className="w-3.5 h-3.5" />
              cronograma_unificado.json
            </span>
            <span className="text-xs font-semibold text-[var(--theme-text-secondary)]">
              {eventos.length} eventos indexados
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-[var(--theme-text-primary)]">
            Cronograma Unificado & Pipeline JSON
          </h3>
          <p className="text-xs text-[var(--theme-text-secondary)]">
            Visualiza eventos derivados por cronograma, exámenes y materias, o sincronízalos al estado global con un clic.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsBatchImportOpen(true)}
            className="bloom-btn-pressable px-3.5 py-2 rounded-xl bg-white/80 dark:bg-white/10 hover:bg-white border border-[var(--theme-card-border)] text-[var(--theme-text-primary)] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer hover:scale-105"
            title="Importar fichas masivas con IA (Gemini/NotebookLM)"
          >
            <span className="text-sm">📋</span>
            <span>Importar en Lote</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bloom-btn-pressable px-3.5 py-2 rounded-xl bg-white/70 dark:bg-white/10 hover:bg-white border border-[var(--theme-card-border)] text-[var(--theme-text-primary)] text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Cargar archivo JSON personalizado"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Subir JSON</span>
          </button>

          <button
            type="button"
            onClick={handleSyncToAppState}
            className="bloom-btn-pressable px-4 py-2 rounded-xl bg-[var(--theme-secondary)] text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:brightness-110 transition-all cursor-pointer"
            title="Sincronizar eventos con Materias, Cronograma y Exámenes globales"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sincronizar a CampusBloom</span>
          </button>
        </div>
      </div>

      {/* Sync Notification Toast */}
      {syncToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Section Switcher Tabs */}
      <div className="flex items-center justify-between gap-2 flex-wrap border-b border-[var(--theme-card-border)] pb-2">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bloom-inner">
          <button
            type="button"
            onClick={() => setActiveSection('todos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'todos'
                ? 'bg-[var(--theme-secondary)] text-white shadow-xs'
                : 'text-[var(--theme-text-secondary)] hover:bg-black/5'
            }`}
          >
            Todos ({eventos.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('cronograma')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'cronograma'
                ? 'bg-[var(--theme-secondary)] text-white shadow-xs'
                : 'text-[var(--theme-text-secondary)] hover:bg-black/5'
            }`}
          >
            Cronograma ({todos.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('examenes')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'examenes'
                ? 'bg-[var(--theme-secondary)] text-white shadow-xs'
                : 'text-[var(--theme-text-secondary)] hover:bg-black/5'
            }`}
          >
            Exámenes ({examenes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('materias')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSection === 'materias'
                ? 'bg-[var(--theme-secondary)] text-white shadow-xs'
                : 'text-[var(--theme-text-secondary)] hover:bg-black/5'
            }`}
          >
            Materias ({materias.length})
          </button>
        </div>

        {/* Filter by Type */}
        <div className="flex items-center gap-1.5 text-xs">
          <Filter className="w-3.5 h-3.5 text-[var(--theme-text-secondary)]" />
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="p-1.5 rounded-xl bg-white/80 dark:bg-white/10 border border-[var(--theme-card-border)] text-xs font-bold text-[var(--theme-text-primary)] outline-none"
          >
            <option value="todos">Todos los Tipos</option>
            <option value="teórica">Clases Teóricas</option>
            <option value="práctica">Prácticas de Lab</option>
            <option value="seminario">Seminarios</option>
            <option value="examen">Exámenes</option>
            <option value="investigación">Investigación</option>
          </select>
        </div>
      </div>

      {/* SECTION 1: CRONOGRAMA GENERAL */}
      {(activeSection === 'todos' || activeSection === 'cronograma') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base sm:text-lg font-black text-[var(--theme-text-primary)] flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[var(--theme-accent)]" />
              Cronograma de Actividades ({filteredTodos.length})
            </h2>
          </div>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTodos.map((evento, idx) => (
              <EventoCard key={`cronograma-${idx}-${evento.fecha}`} evento={evento} />
            ))}
          </div>
        </section>
      )}

      {/* SECTION 2: EXÁMENES */}
      {(activeSection === 'todos' || activeSection === 'examenes') && (
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base sm:text-lg font-black text-[var(--theme-text-primary)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-500" />
              Exámenes & Evaluaciones ({examenes.length})
            </h2>
          </div>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {examenes.map((evento, idx) => (
              <EventoCard key={`examen-${idx}-${evento.fecha}`} evento={evento} />
            ))}
          </div>
        </section>
      )}

      {/* SECTION 3: MATERIAS AGRUPADAS */}
      {(activeSection === 'todos' || activeSection === 'materias') && (
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base sm:text-lg font-black text-[var(--theme-text-primary)] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[var(--theme-secondary)]" />
              Materias ({materias.length} asignaturas)
            </h2>
          </div>

          <div className="space-y-5">
            {materias.map((mat) => (
              <div
                key={mat}
                className="rounded-[24px] bloom-glass p-4 sm:p-5 border border-[var(--theme-card-border)] space-y-3"
              >
                <div className="flex items-center justify-between border-b border-[var(--theme-card-border)] pb-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-[var(--theme-text-primary)] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--theme-secondary)]" />
                    {mat}
                  </h3>
                  <span className="text-[11px] font-bold text-[var(--theme-text-secondary)] bg-[var(--theme-secondary-light)] px-2 py-0.5 rounded-full">
                    {porMateria[mat]?.length || 0} sesiones registradas
                  </span>
                </div>

                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {porMateria[mat]?.map((evento, idx) => (
                    <EventoCard key={`materia-${mat}-${idx}`} evento={evento} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Batch Import Modal */}
      <BatchImportModal
        isOpen={isBatchImportOpen}
        onClose={() => setIsBatchImportOpen(false)}
        defaultTarget="schedule"
      />
    </div>
  );
};

export default CronogramaBloom;
