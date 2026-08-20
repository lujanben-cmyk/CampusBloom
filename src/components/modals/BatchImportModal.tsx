import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  FileCode,
  FileText,
  HelpCircle,
  Plus,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import {
  parseBatchInput,
  ParsedBatchCard,
  SAMPLE_AI_PROMPT_EXAMS,
  SAMPLE_AI_PROMPT_SCHEDULE,
} from '../../utils/batchParser';
import { useApp } from '../../context/AppContext';
import { Exam, ClassScheduleItem } from '../../types';

interface BatchImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTarget?: 'exams' | 'schedule';
}

export const BatchImportModal: React.FC<BatchImportModalProps> = ({
  isOpen,
  onClose,
  defaultTarget = 'exams',
}) => {
  const { batchAddExams, batchAddClasses, subjects } = useApp();

  const [targetModule, setTargetModule] = useState<'exams' | 'schedule'>(defaultTarget);
  const [rawText, setRawText] = useState<string>('');
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [showHelper, setShowHelper] = useState<boolean>(true);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Sync defaultTarget when opened
  useEffect(() => {
    if (isOpen) {
      setTargetModule(defaultTarget);
      setImportSuccessMessage(null);
    }
  }, [isOpen, defaultTarget]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Parse raw text in real-time
  const parseResult = useMemo(() => {
    return parseBatchInput(rawText, targetModule);
  }, [rawText, targetModule]);

  if (!isOpen) return null;

  const currentPrompt = targetModule === 'exams' ? SAMPLE_AI_PROMPT_EXAMS : SAMPLE_AI_PROMPT_SCHEDULE;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(currentPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  const handleInsertSample = () => {
    if (targetModule === 'exams') {
      setRawText(`[
  {
    "materia": "Fisiología II",
    "fecha": "2026-09-18",
    "tipo": "1er Examen Parcial",
    "temas": ["Potencial de acción y contracción", "Gasto cardíaco y PA", "ECG y ciclo cardíaco"],
    "horario": "08:00",
    "aula": "Aula Magna FCM",
    "peso": "30% Parcial"
  },
  {
    "materia": "Bioquímica II",
    "fecha": "2026-09-25",
    "tipo": "1er Parcial",
    "temas": ["Glucólisis y Gluconeogénesis", "Ciclo de Krebs", "Cadena de transporte de electrones"],
    "horario": "09:30",
    "aula": "Pabellón A - Salón 201",
    "peso": "30% Parcial"
  },
  {
    "materia": "Microbiología y Parasitología II",
    "fecha": "2026-10-02",
    "tipo": "Parcial Práctico",
    "temas": ["Tinción de Gram", "Cultivo de enterobacterias", "Parásitos intestinales"],
    "horario": "10:00",
    "aula": "Laboratorio L-3",
    "peso": "20% Práctica"
  }
]`);
    } else {
      setRawText(`[
  {
    "materia": "Fisiología II",
    "fecha": "2026-09-15",
    "tipo": "Teoría",
    "temas": ["Fisiología renal y equilibrio ácido-base"],
    "horario": "08:00 - 10:00",
    "aula": "Aula Magna FCM",
    "docente": "Dr. Fernando Gómez"
  },
  {
    "materia": "Bioquímica II",
    "fecha": "2026-09-16",
    "tipo": "Práctica",
    "temas": ["Electroforesis de proteínas séricas"],
    "horario": "10:00 - 12:00",
    "aula": "Laboratorio Bioquímica L-1",
    "docente": "Dra. Patricia Ortiz"
  },
  {
    "materia": "Inglés Técnico II",
    "fecha": "2026-09-17",
    "tipo": "Seminario",
    "temas": ["Clinical case study translation and vocabulary"],
    "horario": "14:00 - 16:00",
    "aula": "Pabellón B - Salón 105",
    "docente": "Lic. Mariana Vera"
  }
]`);
    }
  };

  const handleCargarFichas = () => {
    const validCards = parseResult.cards.filter((c) => c.isValid);
    if (validCards.length === 0) {
      alert('No se encontraron fichas válidas. Por favor verifica que cada ficha tenga Materia, Fecha, Tipo y Temas.');
      return;
    }

    if (targetModule === 'exams') {
      const examsToAdd: (Omit<Exam, 'id'> | Exam)[] = validCards.map((c) => {
        // Look up matching existing subject or prepare new
        const matched = subjects.find((s) => s.name.toLowerCase().trim() === c.materia.toLowerCase().trim());
        return {
          subjectId: matched ? matched.id : `subj-${Date.now()}`,
          subjectName: c.materia,
          title: c.tipo.includes(c.materia) ? c.tipo : `${c.tipo} - ${c.materia}`,
          date: c.fecha,
          time: c.horario.split('-')[0]?.trim() || '08:00',
          classroom: c.aula || 'Aula Magna',
          weight: c.peso || '30% Parcial',
          status: 'upcoming',
          topics: c.temas,
        };
      });

      const added = batchAddExams(examsToAdd);
      setImportSuccessMessage(`¡Éxito! Se han importado ${added.length} fichas de exámenes.`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      const classesToAdd: (Omit<ClassScheduleItem, 'id'> | ClassScheduleItem)[] = validCards.map((c) => {
        const matched = subjects.find((s) => s.name.toLowerCase().trim() === c.materia.toLowerCase().trim());
        const times = c.horario.includes('-') ? c.horario.split('-') : [c.horario, '10:00'];
        const startTime = times[0]?.trim() || '08:00';
        const endTime = times[1]?.trim() || '10:00';

        let classType: 'Teoría' | 'Práctica' | 'Laboratorio' | 'Seminario' = 'Teoría';
        const tLower = c.tipo.toLowerCase();
        if (tLower.includes('práctica') || tLower.includes('practica')) classType = 'Práctica';
        else if (tLower.includes('laboratorio')) classType = 'Laboratorio';
        else if (tLower.includes('seminario')) classType = 'Seminario';

        return {
          subjectId: matched ? matched.id : `subj-${Date.now()}`,
          subjectName: c.materia,
          dayOfWeek: c.diaSemana || 'Lunes',
          startTime,
          endTime,
          location: c.aula || 'Pabellón Central FCM',
          professor: c.docente || 'Docente de Cátedra',
          type: classType,
          color: matched?.color || '#864e5a',
        };
      });

      const added = batchAddClasses(classesToAdd);
      setImportSuccessMessage(`¡Éxito! Se han importado ${added.length} clases al cronograma semanal.`);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  return (
    <div
      id="batch-import-modal-overlay"
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in"
    >
      <div
        id="batch-import-modal-container"
        className="w-full max-w-3xl rounded-[32px] glass-card p-5 sm:p-7 shadow-2xl border border-white/90 flex flex-col gap-4 my-auto relative max-h-[92vh] overflow-y-auto"
      >
        {/* Header with Title and Close */}
        <div className="flex items-start justify-between gap-3 border-b border-black/5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#ffd9df] text-[#864e5a] flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#cde9ac] text-[#374d20] border border-[#b4cf95]">
                  IA Batch Importer
                </span>
                <span className="text-xs text-[#514345] font-medium hidden sm:inline">
                  Gemini & NotebookLM
                </span>
              </div>
              <h3 className="font-heading text-lg sm:text-xl font-black text-[#1b1c1c] tracking-tight mt-0.5">
                Importar Fichas en Lote
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#514345] hover:bg-black/5 transition-all cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Module Selector Pills (Exámenes vs Cronograma) */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl glass-inner border border-white/80">
            <button
              type="button"
              onClick={() => setTargetModule('exams')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                targetModule === 'exams'
                  ? 'bg-[#864e5a] text-white shadow-xs'
                  : 'text-[#514345] hover:bg-white/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Módulo de Exámenes</span>
            </button>

            <button
              type="button"
              onClick={() => setTargetModule('schedule')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                targetModule === 'schedule'
                  ? 'bg-[#4e6535] text-white shadow-xs'
                  : 'text-[#514345] hover:bg-white/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Módulo de Cronograma</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHelper(!showHelper)}
              className="text-xs font-bold text-[#864e5a] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showHelper ? 'Ocultar Guía' : 'Ver Guía de Formato'}</span>
            </button>

            <button
              type="button"
              onClick={handleInsertSample}
              className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-xs font-bold text-[#514345] border border-white shadow-xs cursor-pointer flex items-center gap-1"
            >
              <FileCode className="w-3.5 h-3.5 text-[#864e5a]" />
              <span>Pegar Ejemplo</span>
            </button>
          </div>
        </div>

        {/* AI Helper / Prompt Guide Box */}
        {showHelper && (
          <div className="p-4 rounded-2xl bg-white/70 border border-white/90 space-y-2.5 text-xs text-[#514345] shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="font-bold text-[#1b1c1c] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#864e5a]" />
                  ¿Cómo pedirle la lista a Gemini o NotebookLM?
                </p>
                <p className="text-[#514345]/90 leading-relaxed text-[11px] sm:text-xs">
                  Copia el siguiente prompt y pégalo en <strong>Gemini</strong> junto a tu programa de estudios o temario. Gemini te devolverá la estructura exacta para pegar aquí:
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyPrompt}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  copiedPrompt
                    ? 'bg-[#4e6535] text-white shadow-xs'
                    : 'bg-[#864e5a] hover:bg-[#6e3e48] text-white shadow-sm'
                }`}
                title="Copiar prompt listo para Gemini"
              >
                {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPrompt ? '¡Copiado!' : 'Copiar Prompt para Gemini'}</span>
              </button>
            </div>

            {/* Field requirements tags */}
            <div className="pt-1 flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-[#1b1c1c] text-[11px]">Campos requeridos:</span>
              <span className="px-2 py-0.5 rounded-md bg-[#ffd9df] text-[#864e5a] font-bold text-[10px]">
                ✓ Materia
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#ffd9df] text-[#864e5a] font-bold text-[10px]">
                ✓ Fecha (YYYY-MM-DD)
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#ffd9df] text-[#864e5a] font-bold text-[10px]">
                ✓ Tipo (Examen / Parcial / Clase)
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#ffd9df] text-[#864e5a] font-bold text-[10px]">
                ✓ Temas (Lista de temas evaluados)
              </span>
              <span className="text-[10px] text-[#514345]/70 italic">
                (Opcionales: Aula, Horario, Docente, Peso)
              </span>
            </div>
          </div>
        )}

        {/* Textarea Area */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs px-1">
            <label htmlFor="batch-textarea-input" className="font-bold text-[#1b1c1c] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#864e5a]" />
              Pega aquí el JSON o texto generado por la IA:
            </label>
            <span className="text-[11px] text-[#514345] font-medium">
              {rawText.length} caracteres
            </span>
          </div>

          <textarea
            id="batch-textarea-input"
            rows={8}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`Pega aquí el JSON o texto de Gemini...\n\nEjemplo:\n[\n  {\n    "materia": "Fisiología II",\n    "fecha": "2026-09-18",\n    "tipo": "1er Examen Parcial",\n    "temas": ["Potencial de acción", "Ciclo cardíaco"],\n    "horario": "08:00",\n    "aula": "Aula Magna"\n  }\n]`}
            className="w-full p-3.5 rounded-2xl bg-white/95 border border-black/10 font-mono text-xs text-[#1b1c1c] outline-none focus:ring-2 focus:ring-[#864e5a] shadow-inner resize-y transition-all"
          />
        </div>

        {/* Real-Time Detection and Validation Preview */}
        {rawText.trim().length > 0 && (
          <div className="p-3.5 rounded-2xl bg-white/60 border border-white/80 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#1b1c1c]">Validación de Fichas:</span>
                {parseResult.validCount > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#cde9ac] text-[#374d20] border border-[#b4cf95] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {parseResult.validCount} fichas válidas listas
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ffd9df] text-[#ba1a1a] border border-[#ffb7c5] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    0 fichas completas detectadas
                  </span>
                )}

                {parseResult.invalidCount > 0 && (
                  <span className="text-[11px] font-semibold text-[#ba1a1a]">
                    ({parseResult.invalidCount} con datos incompletos)
                  </span>
                )}
              </div>

              <span className="text-[11px] text-[#514345]/80 font-mono uppercase bg-black/5 px-2 py-0.5 rounded-md">
                Formato: {parseResult.formatDetected}
              </span>
            </div>

            {/* List of Detected Cards Preview (Scrollable) */}
            {parseResult.cards.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1.5 pt-1 pr-1">
                {parseResult.cards.map((card, idx) => (
                  <div
                    key={card.id || idx}
                    className={`p-2 rounded-xl text-xs flex items-center justify-between gap-2 border transition-all ${
                      card.isValid
                        ? 'bg-white/90 border-[#b4cf95]/80 text-[#1b1c1c]'
                        : 'bg-red-50/80 border-red-200 text-red-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded-full bg-black/5 text-[#514345] font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <strong className="truncate">{card.materia || 'Sin Materia'}</strong>
                      <span className="text-[11px] text-[#514345] truncate">
                        • {card.tipo} ({card.fecha || 'Sin fecha'})
                      </span>
                      {card.temas && card.temas.length > 0 && (
                        <span className="text-[10px] text-[#514345]/75 truncate hidden sm:inline">
                          [{card.temas.join(', ')}]
                        </span>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      {card.isValid ? (
                        <span className="text-[10px] font-bold text-[#374d20] bg-[#cde9ac] px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Check className="w-3 h-3" /> Válida
                        </span>
                      ) : (
                        <span
                          className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-md"
                          title={card.errors.join(', ')}
                        >
                          {card.errors[0] || 'Incompleta'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Success Alert Banner */}
        {importSuccessMessage && (
          <div className="p-3.5 rounded-2xl bg-[#cde9ac] text-[#243513] border border-[#b4cf95] text-xs font-bold flex items-center gap-2 animate-fade-in shadow-md">
            <CheckCircle2 className="w-5 h-5 text-[#374d20] shrink-0" />
            <span>{importSuccessMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-black/5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold text-[#514345] hover:bg-black/5 transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            id="btn-cargar-fichas-lote"
            onClick={handleCargarFichas}
            disabled={parseResult.validCount === 0}
            className={`px-6 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer ${
              parseResult.validCount > 0
                ? targetModule === 'exams'
                  ? 'bg-[#864e5a] hover:bg-[#6e3e48] text-white hover:scale-105 shadow-[#864e5a]/25'
                  : 'bg-[#4e6535] hover:bg-[#3d5029] text-white hover:scale-105 shadow-[#4e6535]/25'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Cargar {parseResult.validCount > 0 ? `${parseResult.validCount} ` : ''}Fichas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
