import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Save,
  Palette,
  Award,
  GraduationCap,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { Subject } from '../../types';
import { useApp } from '../../context/AppContext';

interface SubjectManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSubject?: Subject | null;
  subjectToEdit?: Subject | null;
}

const PRESET_COLORS = [
  '#864e5a', // Sakura Rose
  '#4e6535', // Matcha Green
  '#8a5a44', // Terracotta Warm
  '#5b7065', // Sage Slate
  '#9e6b6e', // Vintage Blossom
  '#3b6e8c', // Slate Blue
  '#6b5b95', // Lavender Dusk
  '#a2673f', // Amber Wood
  '#4a7c59', // Forest Pine
];

export const SubjectManageModal: React.FC<SubjectManageModalProps> = ({
  isOpen,
  onClose,
  initialSubject,
  subjectToEdit,
}) => {
  const { addSubject, updateSubject, deleteSubject } = useApp();

  const targetSubject = subjectToEdit !== undefined ? subjectToEdit : initialSubject;
  const isEditing = !!targetSubject;

  const [name, setName] = useState<string>('');
  const [professor, setProfessor] = useState<string>('');
  const [classroom, setClassroom] = useState<string>('');
  const [credits, setCredits] = useState<number>(6);
  const [grade, setGrade] = useState<number>(4.5);
  const [totalClasses, setTotalClasses] = useState<number>(28);
  const [attendedClasses, setAttendedClasses] = useState<number>(24);
  const [cancelledClasses, setCancelledClasses] = useState<number>(0);
  const [color, setColor] = useState<string>(PRESET_COLORS[0]);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    if (targetSubject) {
      setName(targetSubject.name);
      setProfessor(targetSubject.professor || '');
      setClassroom(targetSubject.classroom || '');
      setCredits(targetSubject.credits || 6);
      setGrade(targetSubject.grade || 4.5);
      setTotalClasses(targetSubject.totalClasses || 28);
      setAttendedClasses(targetSubject.attendedClasses || 0);
      setCancelledClasses(targetSubject.cancelledClasses || 0);
      setColor(targetSubject.color || PRESET_COLORS[0]);
    } else {
      setName('');
      setProfessor('');
      setClassroom('');
      setCredits(6);
      setGrade(4.5);
      setTotalClasses(28);
      setAttendedClasses(24);
      setCancelledClasses(0);
      setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    }
    setShowConfirmDelete(false);
  }, [targetSubject, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditing && targetSubject) {
      updateSubject({
        ...targetSubject,
        name: name.trim(),
        professor: professor.trim() || 'Docente de Cátedra',
        classroom: classroom.trim() || 'Aula Central',
        credits: Number(credits) || 6,
        grade: Number(grade) || 4.5,
        totalClasses: Number(totalClasses) || 0,
        attendedClasses: Math.min(Number(totalClasses) || 0, Number(attendedClasses) || 0),
        cancelledClasses: Math.max(0, Number(cancelledClasses) || 0),
        color,
      });
      setSuccessToast('¡Materia actualizada exitosamente!');
    } else {
      addSubject({
        name: name.trim(),
        professor: professor.trim() || 'Docente de Cátedra',
        classroom: classroom.trim() || 'Aula Central',
        credits: Number(credits) || 6,
        grade: Number(grade) || 4.5,
        maxGrade: 5.0,
        totalClasses: Number(totalClasses) || 0,
        attendedClasses: Math.min(Number(totalClasses) || 0, Number(attendedClasses) || 0),
        cancelledClasses: Math.max(0, Number(cancelledClasses) || 0),
        color,
      });
      setSuccessToast('¡Nueva materia añadida al Estado Global!');
    }

    setTimeout(() => {
      setSuccessToast(null);
      onClose();
    }, 900);
  };

  const handleDelete = () => {
    if (targetSubject) {
      deleteSubject(targetSubject.id);
      setSuccessToast('Materia eliminada del sistema.');
      setTimeout(() => {
        setSuccessToast(null);
        onClose();
      }, 700);
    }
  };

  return (
    <div
      id="subject-manage-modal-backdrop"
      className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        id="subject-manage-modal-container"
        className="w-full max-w-lg rounded-[28px] glass-card p-6 sm:p-7 shadow-2xl border border-white flex flex-col gap-4 max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 pb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: color }}
            >
              <BookOpen className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-[#1b1c1c]">
                {isEditing ? 'Editar Materia' : 'Añadir Nueva Materia'}
              </h3>
              <p className="text-xs text-[#514345]/80">
                Se sincronizará instantáneamente en Perfil, Cronograma y Asistencia.
              </p>
            </div>
          </div>

          <button
            id="subject-manage-close-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-[#514345] hover:bg-black/5 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successToast ? (
          <div className="p-8 rounded-2xl bg-[#cde9ac]/80 border border-[#4e6535] text-center flex flex-col items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-10 h-10 text-[#4e6535] animate-bounce" />
            <h4 className="font-heading text-base font-bold text-[#1b1c1c]">{successToast}</h4>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Subject Name */}
            <div>
              <label className="font-bold text-[#514345] mb-1 block">
                Nombre de la Cátedra / Materia *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ej: Anatomía Humana, Fisiología, Bioquímica..."
                className="w-full p-2.5 rounded-xl bg-white/90 border border-white text-xs text-[#1b1c1c] font-medium outline-none focus:ring-2 focus:ring-[#4e6535] shadow-inner"
              />
            </div>

            {/* Professor & Classroom */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#514345] mb-1 block">Docente / Cátedra</label>
                <input
                  type="text"
                  value={professor}
                  onChange={(e) => setProfessor(e.target.value)}
                  placeholder="Ej: Dr. Alejandro Benítez"
                  className="w-full p-2.5 rounded-xl bg-white/90 border border-white text-xs text-[#1b1c1c] outline-none focus:ring-2 focus:ring-[#4e6535] shadow-inner"
                />
              </div>

              <div>
                <label className="font-bold text-[#514345] mb-1 block">Aula o Laboratorio</label>
                <input
                  type="text"
                  value={classroom}
                  onChange={(e) => setClassroom(e.target.value)}
                  placeholder="Ej: Pabellón Central A-102"
                  className="w-full p-2.5 rounded-xl bg-white/90 border border-white text-xs text-[#1b1c1c] outline-none focus:ring-2 focus:ring-[#4e6535] shadow-inner"
                />
              </div>
            </div>

            {/* Grade, Credits, Classes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="font-bold text-[#514345] mb-1 block">Nota (1 - 5)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={grade}
                  onChange={(e) => setGrade(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 rounded-xl bg-white/90 border border-white text-xs font-mono font-bold text-[#4e6535] outline-none focus:ring-2 focus:ring-[#4e6535]"
                />
              </div>

              <div>
                <label className="font-bold text-[#514345] mb-1 block">Créditos</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={credits}
                  onChange={(e) => setCredits(parseInt(e.target.value, 10) || 1)}
                  className="w-full p-2 rounded-xl bg-white/90 border border-white text-xs font-mono font-bold text-[#1b1c1c] outline-none focus:ring-2 focus:ring-[#4e6535]"
                />
              </div>

              <div>
                <label className="font-bold text-[#514345] mb-1 block">Clases Totales</label>
                <input
                  type="number"
                  min="0"
                  value={totalClasses}
                  onChange={(e) => setTotalClasses(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2 rounded-xl bg-white/90 border border-white text-xs font-mono font-bold text-[#1b1c1c] outline-none focus:ring-2 focus:ring-[#4e6535]"
                />
              </div>

              <div>
                <label className="font-bold text-[#514345] mb-1 block">Asistidas</label>
                <input
                  type="number"
                  min="0"
                  value={attendedClasses}
                  onChange={(e) => setAttendedClasses(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2 rounded-xl bg-white/90 border border-white text-xs font-mono font-bold text-[#4e6535] outline-none focus:ring-2 focus:ring-[#4e6535]"
                />
              </div>

              <div className="col-span-2 sm:col-span-2">
                <label className="font-bold text-[#514345] mb-1 block flex items-center justify-between">
                  <span>Canceladas / Docente Ausente</span>
                  <span className="text-[10px] text-[#4e6535] font-semibold">No descuenta asistencia</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={cancelledClasses}
                  onChange={(e) => setCancelledClasses(parseInt(e.target.value, 10) || 0)}
                  placeholder="0"
                  className="w-full p-2 rounded-xl bg-white/90 border border-white text-xs font-mono font-bold text-[#b45309] outline-none focus:ring-2 focus:ring-[#b45309]"
                />
              </div>
            </div>

            {/* Color Palette Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="font-bold text-[#514345] flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#864e5a]" />
                <span>Color Distintivo de la Cátedra</span>
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform cursor-pointer shadow-xs ${
                      color === c ? 'scale-125 ring-2 ring-[#1b1c1c] ring-offset-2' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Delete confirmation section (if editing) */}
            {isEditing && (
              <div className="pt-2 border-t border-black/5">
                {showConfirmDelete ? (
                  <div className="p-3 rounded-2xl bg-[#ffdad6] border border-[#ba1a1a]/30 text-[#410002] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#ba1a1a] shrink-0" />
                      <span className="font-bold text-[11px]">
                        ¿Confirmar eliminación de {initialSubject?.name}? Se borrarán sus clases asociadas.
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
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-[#514345] font-bold hover:bg-black/5 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#4e6535] hover:bg-[#3d5029] text-white font-bold shadow-md shadow-[#4e6535]/25 flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Guardar Cambios' : 'Añadir Materia'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
