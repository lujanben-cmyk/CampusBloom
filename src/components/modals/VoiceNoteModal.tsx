import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Award,
  BookOpen,
  X,
  RotateCcw,
  Volume2,
  AlertCircle,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { parseVoiceNoteWithAI, ParsedVoiceExamResult } from '../../utils/voiceParserClient';
import { soundEngine } from '../../utils/audioSynthesizer';
import { Exam } from '../../types';

interface VoiceNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTranscript?: string;
  autoStartListening?: boolean;
}

export const VoiceNoteModal: React.FC<VoiceNoteModalProps> = ({
  isOpen,
  onClose,
  initialTranscript = '',
  autoStartListening = false,
}) => {
  const { subjects, addExam, setActiveTab } = useApp();

  const {
    isListening,
    transcript,
    interimTranscript,
    audioLevel,
    errorMessage,
    hasSpeechSupport,
    startListening,
    stopListening,
    setSimulatedSpeech,
    resetTranscript,
  } = useVoiceRecognition();

  const [isProcessingAI, setIsProcessingAI] = useState<boolean>(false);
  const [parsedResult, setParsedResult] = useState<ParsedVoiceExamResult | null>(null);
  const [savedExam, setSavedExam] = useState<Exam | null>(null);
  const [editableExam, setEditableExam] = useState<Partial<Exam> | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Suggested test prompts
  const samplePrompts = [
    'Tengo examen de Anatomía el viernes',
    'Parcial de Fisiología el próximo lunes a las 09:00 en el Aula Magna',
    'Examen final de Farmacología el 15 de diciembre a las 8:00 am',
    'Evaluación práctica de Histología de mañana a las 14:00',
    'Examen de Bioquímica el 25 de noviembre en el laboratorio 3',
  ];

  // Auto start or load initial transcript when opened
  useEffect(() => {
    if (isOpen) {
      setParsedResult(null);
      setSavedExam(null);
      setEditableExam(null);
      setIsEditing(false);
      setStatusFeedback(null);

      if (initialTranscript) {
        setSimulatedSpeech(initialTranscript);
      } else if (autoStartListening) {
        startListening('es-ES');
      }
    } else {
      stopListening();
    }
  }, [isOpen, initialTranscript, autoStartListening, setSimulatedSpeech, startListening, stopListening]);

  // Handle live transcript text change
  const currentText = (transcript + ' ' + interimTranscript).trim();

  // Process text with Gemini / NLP
  const handleProcessVoiceText = async (textToProcess?: string) => {
    const text = (textToProcess || currentText).trim();
    if (!text) return;

    stopListening();
    setIsProcessingAI(true);
    setStatusFeedback('Analizando nota de voz y calculando fechas con IA...');

    try {
      const subjectNames = subjects.map((s) => s.name);
      const result = await parseVoiceNoteWithAI(text, subjectNames);
      setParsedResult(result);
      setEditableExam(result.exam);
      setStatusFeedback(null);
    } catch (err: any) {
      console.error('Error parsing voice note:', err);
      setStatusFeedback('No se pudo procesar automáticamente. Puedes ajustar los campos manualmente.');
    } finally {
      setIsProcessingAI(false);
    }
  };

  // Add parsed exam to CampusBloom global state
  const handleConfirmAndAddExam = () => {
    if (!editableExam) return;

    const subjectName = editableExam.subjectName?.trim() || 'Anatomía';
    const existingSub = subjects.find((s) => s.name.toLowerCase() === subjectName.toLowerCase());

    const newExamData: Omit<Exam, 'id'> = {
      subjectId: existingSub ? existingSub.id : `subj-${Date.now()}`,
      subjectName,
      title: editableExam.title || `Examen de ${subjectName}`,
      date: editableExam.date || new Date().toISOString().split('T')[0],
      time: editableExam.time || '08:00',
      classroom: editableExam.classroom || 'Aula Magna',
      weight: editableExam.weight || '30% Parcial',
      status: 'upcoming',
      topics: editableExam.topics && editableExam.topics.length > 0 ? editableExam.topics : ['Temario general'],
      notes: editableExam.notes || `Agregado por comando de voz: "${currentText || initialTranscript}"`,
    };

    const added = addExam(newExamData);
    setSavedExam(added);
    soundEngine.playChime('success');
  };

  // Navigate to Exams view
  const handleGoToExams = () => {
    setActiveTab('examenes');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="voice-note-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopListening();
          onClose();
        }
      }}
    >
      <div
        id="voice-note-modal-container"
        className="relative w-full max-w-xl bg-[#fffbfa] rounded-3xl shadow-2xl border border-white/80 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 bg-linear-to-r from-[#ffd9df]/50 via-white to-[#cde9ac]/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#864e5a] text-white flex items-center justify-center shadow-md shadow-[#864e5a]/20">
              <Mic className="w-5 h-5 text-[#ffdad6]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#1b1c1c]">Nota de Voz & Comando IA</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#864e5a] text-white flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Gemini Flash
                </span>
              </div>
              <p className="text-xs text-[#514345]/80">
                Habla o di un comando para que la IA programe tu examen al instante
              </p>
            </div>
          </div>
          <button
            id="voice-modal-close-btn"
            onClick={() => {
              stopListening();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-black/5 text-[#514345] transition-colors cursor-pointer"
            aria-label="Cerrar modal de voz"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Main Microphone Interaction Zone */}
          {!savedExam && (
            <div
              id="voice-mic-zone"
              className={`p-6 rounded-3xl border transition-all flex flex-col items-center justify-center text-center relative overflow-hidden ${
                isListening
                  ? 'bg-[#ffd9df]/30 border-[#864e5a] ring-4 ring-[#864e5a]/15 shadow-lg'
                  : 'bg-white/80 border-black/10 hover:border-[#864e5a]/40 shadow-xs'
              }`}
            >
              {/* Animated Wave Rings while listening */}
              {isListening && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div
                    className="absolute w-32 h-32 rounded-full bg-[#864e5a]/10 animate-ping"
                    style={{ animationDuration: '2s' }}
                  />
                  <div
                    className="absolute w-44 h-44 rounded-full bg-[#864e5a]/5 animate-pulse"
                    style={{ animationDuration: '1.5s' }}
                  />
                </div>
              )}

              {/* Big Mic Button */}
              <button
                id="voice-mic-toggle-btn"
                type="button"
                onClick={() => {
                  if (isListening) {
                    stopListening();
                  } else {
                    startListening('es-ES');
                  }
                }}
                title={isListening ? 'Detener escucha' : 'Presiona para hablar'}
                className={`relative z-10 w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer ${
                  isListening
                    ? 'bg-[#ba1a1a] text-white ring-4 ring-[#ba1a1a]/30 shadow-[#ba1a1a]/40 animate-pulse'
                    : 'bg-[#864e5a] text-white shadow-[#864e5a]/30 hover:bg-[#6e3e48]'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-8 h-8 text-white" />
                ) : (
                  <Mic className="w-8 h-8 text-[#ffdad6]" />
                )}
              </button>

              {/* Mic Status Text */}
              <div className="mt-4 z-10">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    isListening
                      ? 'bg-[#ba1a1a] text-white animate-pulse'
                      : 'bg-[#514345]/10 text-[#514345]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isListening ? 'bg-white' : 'bg-[#514345]'
                    }`}
                  />
                  {isListening ? 'Escuchando tu voz en tiempo real...' : 'Haz clic para hablar'}
                </span>

                {/* Decibel / Amplitude Visualizer Bar */}
                {isListening && (
                  <div className="mt-2.5 flex items-center justify-center gap-1">
                    {[15, 30, 60, 90, 100, 75, 45, 20].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 bg-[#864e5a] rounded-full transition-all duration-75"
                        style={{
                          height: `${Math.max(6, Math.min(32, (audioLevel * (h / 100)) / 2))}px`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Transcript Display Area */}
              <div className="mt-4 w-full z-10">
                <div
                  id="voice-transcript-box"
                  className="p-3.5 min-h-[64px] rounded-2xl bg-white border border-black/10 text-left text-sm font-medium text-[#1b1c1c] shadow-inner flex items-center justify-between gap-2"
                >
                  <p className="text-sm">
                    {currentText ? (
                      <span>
                        <span className="text-[#1b1c1c] font-semibold">{transcript}</span>
                        {interimTranscript && (
                          <span className="text-[#864e5a] italic ml-1 opacity-75">
                            {interimTranscript}...
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-[#514345]/50 italic">
                        Di por ejemplo: &quot;Tengo examen de Anatomía el viernes&quot; o presiona una sugerencia abajo...
                      </span>
                    )}
                  </p>
                  {currentText && (
                    <button
                      id="voice-clear-transcript-btn"
                      onClick={resetTranscript}
                      className="text-xs text-[#514345]/70 hover:text-[#ba1a1a] p-1 rounded-lg hover:bg-black/5"
                      title="Borrar texto"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Process with AI Button */}
              {currentText && !isListening && (
                <div className="mt-3.5 w-full flex items-center justify-end gap-2 z-10">
                  <button
                    id="voice-process-ai-btn"
                    disabled={isProcessingAI}
                    onClick={() => handleProcessVoiceText(currentText)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#4e6535] hover:bg-[#3d5029] text-white text-xs font-bold shadow-md shadow-[#4e6535]/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-[#cde9ac]" />
                    <span>{isProcessingAI ? 'Interpretando con IA...' : 'Analizar y Extraer Examen'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Browser / Mic Error Banner */}
          {errorMessage && (
            <div
              id="voice-error-banner"
              className="p-3.5 rounded-2xl bg-[#ffdad6]/60 border border-[#ffb4ab] text-xs text-[#93000a] flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-[#ba1a1a] mt-0.5" />
              <div>
                <p className="font-bold">Aviso del micrófono:</p>
                <p className="text-[11px] opacity-90">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Quick Clickable Examples (Especially helpful for 1-click test 'Tengo examen de Anatomía el viernes') */}
          {!savedExam && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#514345]">
                <Lightbulb className="w-3.5 h-3.5 text-[#864e5a]" />
                <span>Ejemplos rápidos (haz clic para probar):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {samplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    id={`voice-sample-prompt-${idx}`}
                    type="button"
                    onClick={() => {
                      setSimulatedSpeech(prompt);
                      handleProcessVoiceText(prompt);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold text-left transition-all border cursor-pointer ${
                      prompt === 'Tengo examen de Anatomía el viernes'
                        ? 'bg-[#ffd9df] text-[#6b3743] border-[#ffb7c5] hover:bg-[#ffc2cc] shadow-xs font-bold ring-1 ring-[#864e5a]/20'
                        : 'bg-white/80 hover:bg-white text-[#514345] border-black/10 hover:border-[#864e5a]/40 shadow-2xs'
                    }`}
                  >
                    💬 &quot;{prompt}&quot;
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Status or Parsing State */}
          {isProcessingAI && (
            <div
              id="voice-ai-loading"
              className="p-4 rounded-2xl bg-[#cde9ac]/30 border border-[#b4cf95] flex items-center gap-3 text-xs text-[#374d20] animate-pulse"
            >
              <Sparkles className="w-4 h-4 text-[#4e6535] animate-spin" />
              <span>Extrayendo materia, aula, fecha y hora mediante IA de CampusBloom...</span>
            </div>
          )}

          {/* Parsed Result Preview Card */}
          {parsedResult && !savedExam && editableExam && (
            <div
              id="voice-parsed-exam-card"
              className="p-5 rounded-3xl bg-linear-to-br from-white to-[#ffd9df]/20 border border-[#864e5a]/30 shadow-md space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-xl bg-[#864e5a] text-white text-xs font-bold">
                    {editableExam.subjectName || 'Anatomía'}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-[#4e6535]/15 text-[#374d20] text-[10px] font-extrabold border border-[#4e6535]/30">
                    {editableExam.weight || '30% Parcial'}
                  </span>
                </div>
                <button
                  id="voice-toggle-edit-mode-btn"
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-xs text-[#864e5a] font-bold hover:underline cursor-pointer"
                >
                  {isEditing ? 'Ocultar edición' : '✏️ Editar datos'}
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#1b1c1c]">{editableExam.title}</h3>
                {parsedResult.summary && (
                  <p className="text-xs text-[#514345] mt-0.5">{parsedResult.summary}</p>
                )}
              </div>

              {/* Editable Fields (if user toggles or wants to review) */}
              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-bold text-[#514345]">Materia</label>
                    <input
                      type="text"
                      value={editableExam.subjectName || ''}
                      onChange={(e) =>
                        setEditableExam((prev) => ({ ...prev, subjectName: e.target.value }))
                      }
                      className="w-full mt-1 px-3 py-1.5 rounded-xl border border-black/15 bg-white text-xs text-[#1b1c1c]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#514345]">Título</label>
                    <input
                      type="text"
                      value={editableExam.title || ''}
                      onChange={(e) =>
                        setEditableExam((prev) => ({ ...prev, title: e.target.value }))
                      }
                      className="w-full mt-1 px-3 py-1.5 rounded-xl border border-black/15 bg-white text-xs text-[#1b1c1c]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#514345]">Fecha (YYYY-MM-DD)</label>
                    <input
                      type="date"
                      value={editableExam.date || ''}
                      onChange={(e) =>
                        setEditableExam((prev) => ({ ...prev, date: e.target.value }))
                      }
                      className="w-full mt-1 px-3 py-1.5 rounded-xl border border-black/15 bg-white text-xs text-[#1b1c1c]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#514345]">Hora</label>
                    <input
                      type="time"
                      value={editableExam.time || '08:00'}
                      onChange={(e) =>
                        setEditableExam((prev) => ({ ...prev, time: e.target.value }))
                      }
                      className="w-full mt-1 px-3 py-1.5 rounded-xl border border-black/15 bg-white text-xs text-[#1b1c1c]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#514345]">Aula / Ubicación</label>
                    <input
                      type="text"
                      value={editableExam.classroom || 'Aula Magna'}
                      onChange={(e) =>
                        setEditableExam((prev) => ({ ...prev, classroom: e.target.value }))
                      }
                      className="w-full mt-1 px-3 py-1.5 rounded-xl border border-black/15 bg-white text-xs text-[#1b1c1c]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#514345]">Ponderación</label>
                    <input
                      type="text"
                      value={editableExam.weight || '30% Parcial'}
                      onChange={(e) =>
                        setEditableExam((prev) => ({ ...prev, weight: e.target.value }))
                      }
                      className="w-full mt-1 px-3 py-1.5 rounded-xl border border-black/15 bg-white text-xs text-[#1b1c1c]"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="p-2.5 rounded-2xl bg-white/90 border border-black/5">
                    <span className="text-[10px] font-bold text-[#514345]/70 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#864e5a]" /> Fecha
                    </span>
                    <p className="text-xs font-bold text-[#1b1c1c] mt-0.5">{editableExam.date}</p>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white/90 border border-black/5">
                    <span className="text-[10px] font-bold text-[#514345]/70 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#864e5a]" /> Hora
                    </span>
                    <p className="text-xs font-bold text-[#1b1c1c] mt-0.5">{editableExam.time || '08:00'}</p>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white/90 border border-black/5">
                    <span className="text-[10px] font-bold text-[#514345]/70 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#4e6535]" /> Aula
                    </span>
                    <p className="text-xs font-bold text-[#1b1c1c] mt-0.5 truncate">{editableExam.classroom || 'Aula Magna'}</p>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white/90 border border-black/5">
                    <span className="text-[10px] font-bold text-[#514345]/70 flex items-center gap-1">
                      <Award className="w-3 h-3 text-[#b45309]" /> Peso
                    </span>
                    <p className="text-xs font-bold text-[#1b1c1c] mt-0.5 truncate">{editableExam.weight || '30% Parcial'}</p>
                  </div>
                </div>
              )}

              {/* Confirm Add Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  id="voice-confirm-add-exam-btn"
                  onClick={handleConfirmAndAddExam}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#864e5a] hover:bg-[#6e3e48] text-white text-xs font-bold shadow-lg shadow-[#864e5a]/25 flex items-center justify-center gap-2 transition-all transform hover:scale-102 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#ffdad6]" />
                  <span>Guardar en Módulo de Exámenes</span>
                </button>
              </div>
            </div>
          )}

          {/* Success State When Saved */}
          {savedExam && (
            <div
              id="voice-exam-success-card"
              className="p-6 rounded-3xl bg-[#cde9ac]/40 border border-[#b4cf95] shadow-lg text-center space-y-4 animate-in zoom-in-95 duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-[#4e6535] text-white flex items-center justify-center mx-auto shadow-md shadow-[#4e6535]/30">
                <CheckCircle2 className="w-6 h-6 text-[#cde9ac]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1b1c1c]">
                  ¡Examen agregado exitosamente!
                </h3>
                <p className="text-xs text-[#374d20] mt-1 font-medium">
                  Se ha registrado <strong>{savedExam.title}</strong> para el <strong>{savedExam.date}</strong> a las <strong>{savedExam.time}</strong> en {savedExam.classroom}.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                <button
                  id="voice-navigate-to-exams-btn"
                  onClick={handleGoToExams}
                  className="px-5 py-2.5 rounded-2xl bg-[#4e6535] hover:bg-[#3d5029] text-white text-xs font-bold shadow-md shadow-[#4e6535]/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>Ver en Módulo de Exámenes</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  id="voice-add-another-note-btn"
                  onClick={() => {
                    setSavedExam(null);
                    setParsedResult(null);
                    setEditableExam(null);
                    resetTranscript();
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-white hover:bg-white/80 text-[#514345] text-xs font-bold border border-black/10 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Mic className="w-3.5 h-3.5 text-[#864e5a]" />
                  <span>Capturar otra nota</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-black/2 border-t border-black/5 flex items-center justify-between text-[11px] text-[#514345]/75">
          <span>CampusBloom • Reconocimiento de Voz & IA Gemini</span>
          <button
            onClick={() => {
              stopListening();
              onClose();
            }}
            className="hover:underline text-[#864e5a] font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
