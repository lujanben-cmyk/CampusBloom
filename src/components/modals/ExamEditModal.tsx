import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Award,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  FileText,
  Percent,
} from 'lucide-react';
import { Exam, Subject } from '../../types';

interface ExamEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Exam | null; // If null, creates new exam
  subjects: Subject[];
  onSave: (examData: Omit<Exam, 'id'> | Exam) => void;
  onDelete?: (examId: string) => void;
}

export const ExamEditModal: React.FC<ExamEditModalProps> = ({
  isOpen,
  onClose,
  exam,
  subjects,
  onSave,
  onDelete,
}) => {
  const isEditing = !!exam;

  const [subjectId, setSubjectId] = useState<string>(subjects[0]?.id || '');
  const [title, setTitle] = useState<string>('');
  const [date, setDate] = useState<string>('2026-09-28');
  const [time, setTime] = useState<string>('08:00');
  const [classroom, setClassroom] = useState<string>('Aula Magna FCM');
  const [weight, setWeight] = useState<string>('30% Parcial');
  const [status, setStatus] = useState<'upcoming' | 'completed' | 'in-progress'>('upcoming');
  const [score, setScore] = useState<string>('');
  const [maxScore, setMaxScore] = useState<string>('30');
  const [topics, setTopics] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (exam) {
      setSubjectId(exam.subjectId || subjects[0]?.id || '');
      setTitle(exam.title || '');
      setDate(exam.date || '2026-09-28');
      setTime(exam.time || '08:00');
      setClassroom(exam.classroom || 'Aula Magna FCM');
      setWeight(exam.weight || '30% Parcial');
      setStatus(exam.status || 'upcoming');
      setScore(exam.score !== undefined && exam.score !== null ? String(exam.score) : '');
      setMaxScore(exam.maxScore !== undefined && exam.maxScore !== null ? String(exam.maxScore) : '30');
      setTopics(exam.topics ? exam.topics.join(', ') : '');
      setNotes(exam.notes || '');
    } else {
      setSubjectId(subjects[0]?.id || '');
      setTitle('');
      setDate('2026-09-28');
      setTime('08:00');
      setClassroom('Aula Magna FCM');
      setWeight('30% Parcial');
      setStatus('upcoming');
      setScore('');
      setMaxScore('30');
      setTopics('');
      setNotes('');
    }
  }, [exam, subjects, isOpen]);

  if (!isOpen) return null;

  const numScore = parseFloat(score);
  const numMaxScore = parseFloat(maxScore);
  const hasValidScore = !isNaN(numScore) && !isNaN(numMaxScore) && numMaxScore > 0;
  const scorePct = hasValidScore ? Math.round((numScore / numMaxScore) * 1000) / 10 : null;

  // Medical scale equivalency (UNCA scale: >=91: 5, >=81: 4, >=71: 3, >=60: 2, <60: 1)
  let notaEscala: number | null = null;
  if (scorePct !== null) {
    if (scorePct >= 91) notaEscala = 5;
    else if (scorePct >= 81) notaEscala = 4;
    else if (scorePct >= 71) notaEscala = 3;
    else if (scorePct >= 60) notaEscala = 2;
    else notaEscala = 1;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentSubject = subjects.find((s) => s.id === subjectId) || subjects[0];
    if (!currentSubject) return;

    const topicsArray = topics
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const examData: Omit<Exam, 'id'> | Exam = {
      ...(exam ? { id: exam.id } : {}),
      subjectId: currentSubject.id,
      subjectName: currentSubject.name,
      title: title.trim() || `Examen de ${currentSubject.name}`,
      date,
      time,
      classroom: classroom.trim() || currentSubject.classroom || 'Aula FCM',
      weight: weight.trim() || '30% Parcial',
      status: hasValidScore && status === 'upcoming' ? 'completed' : status,
      topics: topicsArray.length > 0 ? topicsArray : ['Contenido del programa'],
      score: hasValidScore ? numScore : undefined,
      maxScore: !isNaN(numMaxScore) && numMaxScore > 0 ? numMaxScore : undefined,
      notes: notes.trim() || undefined,
    };

    onSave(examData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-xl rounded-[28px] glass-card p-6 sm:p-7 shadow-2xl border border-white flex flex-col gap-5 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#ffd9df] text-[#864e5a] flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-[#1b1c1c]">
                {isEditing ? 'Editar Evaluación & Calificación' : 'Registrar Nueva Fecha de Examen'}
              </h3>
              <p className="text-xs text-[#514345]/80">
                {isEditing
                  ? 'Ajusta la fecha, aula, ponderación y carga tu nota obtenida.'
                  : 'Añade un parcial, examen oral, final o entrega.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#514345] hover:bg-black/5 transition-all cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Materia & Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-[#514345] mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#864e5a]" />
                Materia / Asignatura
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-white/90 border border-white text-xs font-bold text-[#1b1c1c] outline-none focus:ring-2 focus:ring-[#864e5a] shadow-xs"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-[#514345] mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4e6535]" />
                Estado de la Evaluación
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'upcoming' | 'completed' | 'in-progress')}
                className="w-full p-2.5 rounded-xl bg-white/90 border border-white text-xs font-bold text-[#1b1c1c] outline-none focus:ring-2 focus:ring-[#864e5a] shadow-xs"
              >
                <option value="upcoming">📅 Próximo a rendir</option>
                <option value="completed">✅ Rendido / Calificado</option>
                <option value="in-progress">⏳ En curso / Por calificar</option>
              </select>
            </div>
          </div>

          {/* Título de la evaluación */}
          <div>
            <label className="font-bold text-[#514345] mb-1 block">
              Título / Nombre de la Evaluación *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Primer Examen Parcial de Inglés Técnico II"
              required
              className="w-full p-2.5 rounded-xl bg-white/90 border border-white outline-none focus:ring-2 focus:ring-[#864e5a] text-xs font-semibold text-[#1b1c1c] shadow-xs"
            />
          </div>

          {/* Fecha, Hora, Aula, Ponderación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-[#514345] mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#864e5a]" />
                Fecha del Examen *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl bg-white/90 border border-white outline-none focus:ring-2 focus:ring-[#864e5a] text-xs font-semibold text-[#1b1c1c] shadow-xs"
              />
            </div>

            <div>
              <label className="font-bold text-[#514345] mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#4e6535]" />
                Horario *
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl bg-white/90 border border-white outline-none focus:ring-2 focus:ring-[#864e5a] text-xs font-semibold text-[#1b1c1c] shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-[#514345] mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#864e5a]" />
                Aula / Salón / Modalidad
              </label>
              <input
                type="text"
                value={classroom}
                onChange={(e) => setClassroom(e.target.value)}
                placeholder="Ej: Aula 202 FCM / Aula Magna"
                className="w-full p-2.5 rounded-xl bg-white/90 border border-white outline-none focus:ring-2 focus:ring-[#864e5a] text-xs font-medium text-[#1b1c1c] shadow-xs"
              />
            </div>

            <div>
              <label className="font-bold text-[#514345] mb-1 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#b45309]" />
                Ponderación / Tipo
              </label>
              <input
                type="text"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Ej: 30% Parcial, 60% Final"
                className="w-full p-2.5 rounded-xl bg-white/90 border border-white outline-none focus:ring-2 focus:ring-[#864e5a] text-xs font-medium text-[#1b1c1c] shadow-xs"
              />
            </div>
          </div>

          {/* SECCIÓN DESTACADA: CALIFICACIÓN / NOTA OBTENIDA */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#ffd9df]/40 via-white/80 to-[#cde9ac]/30 border border-[#ffb7c5]/50 flex flex-col gap-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#864e5a] flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#864e5a]" />
                Calificación Obtenida (Nota del Total)
              </span>
              <span className="text-[10px] font-semibold text-[#514345]/80 bg-white/80 px-2 py-0.5 rounded-full">
                Opcional si aún no rendiste
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-[#514345] mb-1 block text-[11px]">
                  Puntos / Nota Obtenida:
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={score}
                  onChange={(e) => {
                    setScore(e.target.value);
                    if (e.target.value && status === 'upcoming') {
                      setStatus('completed');
                    }
                  }}
                  placeholder="Ej: 28"
                  className="w-full p-2.5 rounded-xl bg-white border border-white font-bold text-[#1b1c1c] outline-none focus:ring-2 focus:ring-[#4e6535] text-sm shadow-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-[#514345] mb-1 block text-[11px]">
                  Puntaje Total del Examen:
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                  placeholder="Ej: 30 o 100"
                  className="w-full p-2.5 rounded-xl bg-white border border-white font-bold text-[#1b1c1c] outline-none focus:ring-2 focus:ring-[#4e6535] text-sm shadow-xs"
                />
              </div>
            </div>

            {/* Live Score Preview Calculation */}
            {hasValidScore && scorePct !== null && (
              <div className="mt-1 p-3 rounded-xl bg-white/90 border border-white flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white ${
                      notaEscala && notaEscala >= 3 ? 'bg-[#4e6535]' : 'bg-[#ba1a1a]'
                    }`}
                  >
                    {notaEscala || '—'}
                  </div>
                  <div>
                    <p className="font-bold text-[#1b1c1c] text-xs">
                      Rendimiento: {scorePct}% ({numScore} / {numMaxScore} pts)
                    </p>
                    <p className="text-[10px] text-[#514345]/80">
                      {notaEscala && notaEscala >= 3
                        ? `Aprobado (Nota ${notaEscala}/5 según escala FCM)`
                        : `No aprobado (Nota ${notaEscala || 1}/5)`}
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#cde9ac] text-[#374d20] border border-[#b4cf95]">
                  {scorePct >= 90 ? 'Excelente' : scorePct >= 70 ? 'Aprobado' : 'A recuperar'}
                </span>
              </div>
            )}
          </div>

          {/* Temas evaluados */}
          <div>
            <label className="font-bold text-[#514345] mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#864e5a]" />
              Temas / Unidades evaluadas (separadas por coma)
            </label>
            <input
              type="text"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder="Ej: Terminología Médica, Lectura de Casos, Sufijos Farmacológicos"
              className="w-full p-2.5 rounded-xl bg-white/90 border border-white outline-none focus:ring-2 focus:ring-[#864e5a] text-xs font-medium text-[#1b1c1c] shadow-xs"
            />
          </div>

          {/* Notas personales adicionales */}
          <div>
            <label className="font-bold text-[#514345] mb-1 block">
              Notas / Recordatorios de Estudio
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Repasar resumen de las flashcards y diapositivas de la cátedra..."
              rows={2}
              className="w-full p-2.5 rounded-xl bg-white/90 border border-white outline-none focus:ring-2 focus:ring-[#864e5a] text-xs font-medium text-[#1b1c1c] shadow-xs resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-black/5">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`¿Estás seguro de eliminar "${exam.title}"?`)) {
                    onDelete(exam.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2 rounded-xl text-[#ba1a1a] hover:bg-[#ffdad6] font-bold text-xs transition-all cursor-pointer"
              >
                Eliminar Examen
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-[#514345] font-bold text-xs hover:bg-black/5 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#864e5a] hover:bg-[#6b3743] text-white font-bold text-xs shadow-md shadow-[#864e5a]/20 transition-all hover:scale-105 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Guardar Cambios' : 'Registrar Examen'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
