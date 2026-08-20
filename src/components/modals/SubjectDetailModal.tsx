import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  UserCheck,
  MapPin,
  Award,
  Calendar,
  Save,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Subject } from '../../types';
import { useApp } from '../../context/AppContext';

interface SubjectDetailModalProps {
  subject: Subject | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSubject?: (updated: Subject) => void;
}

export const SubjectDetailModal: React.FC<SubjectDetailModalProps> = ({
  subject,
  isOpen,
  onClose,
  onUpdateSubject,
}) => {
  const { updateSubject, deleteSubject } = useApp();

  const [grade, setGrade] = useState<number>(subject?.grade ?? 4.5);
  const [professor, setProfessor] = useState<string>(subject?.professor ?? '');
  const [classroom, setClassroom] = useState<string>(subject?.classroom ?? '');
  const [credits, setCredits] = useState<number>(subject?.credits ?? 6);
  const [totalClasses, setTotalClasses] = useState<number>(subject?.totalClasses ?? 28);
  const [attendedClasses, setAttendedClasses] = useState<number>(subject?.attendedClasses ?? 0);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

  useEffect(() => {
    if (subject) {
      setGrade(subject.grade);
      setProfessor(subject.professor);
      setClassroom(subject.classroom);
      setCredits(subject.credits || 6);
      setTotalClasses(subject.totalClasses || 28);
      setAttendedClasses(subject.attendedClasses || 0);
      setShowConfirmDelete(false);
    }
  }, [subject]);

  if (!isOpen || !subject) return null;

  const attendancePercent = Math.round(
    (attendedClasses / (totalClasses || 1)) * 100
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Subject = {
      ...subject,
      grade: Number(grade) || 4.5,
      professor: professor.trim() || 'Docente de Cátedra',
      classroom: classroom.trim() || 'Aula Central',
      credits: Number(credits) || 6,
      totalClasses: Number(totalClasses) || 28,
      attendedClasses: Math.min(Number(totalClasses) || 28, Number(attendedClasses) || 0),
    };

    updateSubject(updated);
    if (onUpdateSubject) onUpdateSubject(updated);

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const handleDelete = () => {
    deleteSubject(subject.id);
    onClose();
  };

  return (
    <div
      id="subject-detail-modal-backdrop"
      className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        id="subject-detail-modal-container"
        className="w-full max-w-lg rounded-[28px] glass-card p-6 sm:p-7 shadow-2xl border border-white flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-2xl text-white flex items-center justify-center shadow-md"
              style={{ backgroundColor: subject.color || '#864e5a' }}
            >
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-[#1b1c1c]">
                {subject.name}
              </h3>
              <p className="text-xs text-[#514345]/80">
                Detalles de Cátedra & Calificación
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#514345] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {saved ? (
          <div className="p-6 rounded-2xl bg-[#cde9ac]/80 border border-[#4e6535] text-center flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-[#4e6535]" />
            <h4 className="font-heading font-bold text-base text-[#1b1c1c]">
              ¡Materia Actualizada!
            </h4>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl glass-inner border border-white/80">
                <span className="text-[11px] text-[#514345] font-semibold">Calificación Actual</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Award className="w-4 h-4 text-[#4e6535]" />
                  <span className="font-heading text-lg font-extrabold text-[#4e6535]">
                    {grade.toFixed(1)} / {subject.maxGrade}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl glass-inner border border-white/80">
                <span className="text-[11px] text-[#514345] font-semibold">Asistencia en Cátedra</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <Calendar className="w-4 h-4 text-[#864e5a]" />
                  <span className="font-heading text-lg font-extrabold text-[#1b1c1c]">
                    {attendancePercent}% ({attendedClasses}/{totalClasses})
                  </span>
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="font-bold text-[#514345] mb-1 block">Calificación (1 - 5)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={grade}
                  onChange={(e) => setGrade(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl bg-white/90 border border-white text-xs text-[#1b1c1c] font-bold outline-none focus:ring-2 focus:ring-[#4e6535]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#514345] mb-1 block">Clases Asistidas</label>
                  <input
                    type="number"
                    min="0"
                    value={attendedClasses}
                    onChange={(e) => setAttendedClasses(parseInt(e.target.value, 10) || 0)}
                    className="w-full p-2.5 rounded-xl bg-white/90 border border-white text-xs text-[#4e6535] font-bold outline-none focus:ring-2 focus:ring-[#4e6535]"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#514345] mb-1 block">Clases Totales</label>
                  <input
                    type="number"
                    min="0"
                    value={totalClasses}
                    onChange={(e) => setTotalClasses(parseInt(e.target.value, 10) || 0)}
                    className="w-full p-2.5 rounded-xl bg-white/90 border border-white text-xs text-[#1b1c1c] font-bold outline-none focus:ring-2 focus:ring-[#4e6535]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#514345] mb-1 block">Docente Titular</label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 text-[#514345] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={professor}
                    onChange={(e) => setProfessor(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/90 border border-white text-xs text-[#1b1c1c] outline-none focus:ring-2 focus:ring-[#4e6535]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#514345] mb-1 block">Aula o Pabellón</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#514345] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={classroom}
                    onChange={(e) => setClassroom(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/90 border border-white text-xs text-[#1b1c1c] outline-none focus:ring-2 focus:ring-[#4e6535]"
                  />
                </div>
              </div>
            </div>

            {/* Delete Subject Section */}
            <div className="pt-2 border-t border-black/5">
              {showConfirmDelete ? (
                <div className="p-3 rounded-2xl bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#410002] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#ba1a1a] shrink-0" />
                    <span className="font-bold text-[11px]">
                      ¿Eliminar {subject.name}? Se borrarán sus clases de cronograma.
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-2.5 py-1 rounded-lg bg-[#ba1a1a] text-white font-bold text-[10px] hover:bg-[#93000a] cursor-pointer"
                    >
                      Sí, Eliminar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmDelete(false)}
                      className="px-2 py-1 rounded-lg bg-white text-[#514345] font-bold text-[10px] cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="text-[#ba1a1a] font-bold hover:underline flex items-center gap-1 cursor-pointer text-[11px]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar esta materia</span>
                </button>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-[#514345] font-bold hover:bg-black/5 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#4e6535] hover:bg-[#3d5029] text-white font-bold shadow-md shadow-[#4e6535]/25 flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
