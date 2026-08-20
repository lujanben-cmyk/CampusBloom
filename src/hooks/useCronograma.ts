import { useState, useEffect, useMemo, useCallback } from 'react';
import { UnifiedCronogramaEvent, Subject, ClassScheduleItem, Exam } from '../types';
import { useApp } from '../context/AppContext';

export interface UseCronogramaReturn {
  eventos: UnifiedCronogramaEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  importCustomEvents: (events: UnifiedCronogramaEvent[]) => void;
  syncToCampusBloom: () => { subjectsAdded: number; classesAdded: number; examsAdded: number };
}

export function useCronograma(url = '/data/cronograma_unificado.json'): UseCronogramaReturn {
  const [eventos, setEventos] = useState<UnifiedCronogramaEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { subjects, addSubject, addClass, addExam } = useApp();

  const fetchCronograma = useCallback(() => {
    let cancelado = false;
    setLoading(true);
    setError(null);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`No se pudo cargar el archivo desde ${url}`);
        return res.json();
      })
      .then((data: UnifiedCronogramaEvent[]) => {
        if (!cancelado) {
          setEventos(data);
        }
      })
      .catch((err: Error) => {
        if (!cancelado) {
          setError(err.message || 'Error desconocido al cargar el cronograma');
        }
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [url]);

  useEffect(() => {
    const cleanup = fetchCronograma();
    return cleanup;
  }, [fetchCronograma]);

  const importCustomEvents = useCallback((custom: UnifiedCronogramaEvent[]) => {
    setEventos(custom);
  }, []);

  // Helper to map and synchronize unified events directly into CampusBloom's global AppContext
  const syncToCampusBloom = useCallback(() => {
    const subjectColors = [
      '#864e5a', // Rosa Sakura
      '#4e6535', // Verde Matcha
      '#2b4c7e', // Azul Marino FCM
      '#7c3aed', // Púrpura Lavanda
      '#b45309', // Ámbar Clínico
      '#0f766e', // Teal Esmeralda
    ];

    const existingSubjectNames = new Set(subjects.map((s) => s.name.toLowerCase().trim()));
    const uniqueSubjectNames: string[] = Array.from(new Set(eventos.map((e) => String(e.materia || '').trim())));

    const createdSubjects: Subject[] = [];
    let classesCount = 0;
    let examsCount = 0;

    // 1. Process Subjects
    uniqueSubjectNames.forEach((matName: string, idx: number) => {
      if (!matName) return;
      const isExisting = existingSubjectNames.has(matName.toLowerCase());
      const sampleEvent = eventos.find((e) => String(e.materia || '').trim() === matName);

      if (!isExisting) {
        const newSubject = addSubject({
          name: matName,
          grade: 4.8,
          maxGrade: 5.0,
          professor: sampleEvent?.docente || 'Cátedra FCM UNCA',
          classroom: sampleEvent?.aula || 'Aula FCM',
          credits: 6,
          totalClasses: 32,
          attendedClasses: 30,
          color: subjectColors[idx % subjectColors.length],
        });
        createdSubjects.push(newSubject);
      }
    });

    const allSubjects = [...createdSubjects, ...subjects];

    // 2. Process Classes and Exams
    eventos.forEach((ev, idx) => {
      const evMateria = String(ev.materia || '').trim();
      const matchedSubject = allSubjects.find((s) => s.name.toLowerCase().trim() === evMateria.toLowerCase()) || allSubjects[0];
      const subjectId = matchedSubject?.id || `subj-${idx}`;
      const subjectColor = matchedSubject?.color || '#864e5a';

      if (ev.tipo && ev.tipo.toLowerCase().includes('examen')) {
        // Create Exam
        addExam({
          subjectId,
          subjectName: evMateria || 'Materia',
          title: `${ev.tipo}: ${ev.tema || evMateria}`,
          date: ev.fecha || '2026-09-01',
          time: ev.horario ? ev.horario.split('-')[0]?.trim() || '08:00' : '08:00',
          classroom: ev.aula || matchedSubject?.classroom || 'Aula Magna',
          weight: ev.tipo.toLowerCase().includes('final') ? '60% Final' : '30% Parcial',
          status: 'upcoming',
          topics: ev.tema ? [ev.tema] : ['Contenido unificado'],
        });
        examsCount++;
      } else {
        // Calculate Day of Week from Date or assign
        let dayOfWeek: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' = 'Lunes';
        if (ev.fecha) {
          const dateObj = new Date(ev.fecha + 'T12:00:00');
          const dayNum = dateObj.getDay();
          const daysMap: Record<number, 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado'> = {
            1: 'Lunes',
            2: 'Martes',
            3: 'Miércoles',
            4: 'Jueves',
            5: 'Viernes',
            6: 'Sábado',
            0: 'Lunes',
          };
          dayOfWeek = daysMap[dayNum] || 'Lunes';
        }

        const times = ev.horario ? ev.horario.split('-') : ['08:00', '10:00'];
        const startTime = times[0]?.trim() || '08:00';
        const endTime = times[1]?.trim() || '10:00';

        let classType: 'Teoría' | 'Práctica' | 'Laboratorio' | 'Seminario' = 'Teoría';
        if (ev.tipo && (ev.tipo.toLowerCase().includes('práctica') || ev.tipo.toLowerCase().includes('practica'))) {
          classType = 'Práctica';
        } else if (ev.tipo && ev.tipo.toLowerCase().includes('seminario')) {
          classType = 'Seminario';
        } else if (ev.tipo && ev.tipo.toLowerCase().includes('laboratorio')) {
          classType = 'Laboratorio';
        }

        addClass({
          subjectId,
          subjectName: evMateria || 'Materia',
          dayOfWeek,
          startTime,
          endTime,
          location: ev.aula || 'Aula FCM',
          professor: ev.docente || matchedSubject?.professor || 'Docente de Cátedra',
          type: classType,
          color: subjectColor,
        });
        classesCount++;
      }
    });

    return {
      subjectsAdded: createdSubjects.length,
      classesAdded: classesCount,
      examsAdded: examsCount,
    };
  }, [eventos, subjects, addSubject, addClass, addExam]);

  return {
    eventos,
    loading,
    error,
    refetch: fetchCronograma,
    importCustomEvents,
    syncToCampusBloom,
  };
}

export function useCronogramaViews(eventos: UnifiedCronogramaEvent[]) {
  return useMemo(() => {
    const examenes = eventos.filter((e) => e.tipo && e.tipo.toLowerCase().includes('examen'));
    const clasesTeoricas = eventos.filter(
      (e) => e.tipo && (e.tipo.toLowerCase().includes('teórica') || e.tipo.toLowerCase().includes('teoria'))
    );
    const practicas = eventos.filter(
      (e) => e.tipo && (e.tipo.toLowerCase().includes('práctica') || e.tipo.toLowerCase().includes('practica'))
    );
    const seminarios = eventos.filter((e) => e.tipo && e.tipo.toLowerCase().includes('seminario'));
    const investigacion = eventos.filter(
      (e) => e.tipo && (e.tipo.toLowerCase().includes('investigación') || e.tipo.toLowerCase().includes('investigacion'))
    );

    const porMateria = eventos.reduce<Record<string, UnifiedCronogramaEvent[]>>((acc, e) => {
      const key = String(e.materia || '').trim();
      if (!key) return acc;
      if (!acc[key]) acc[key] = [];
      acc[key].push(e);
      return acc;
    }, {});

    const materias = Object.keys(porMateria).sort();

    return {
      todos: eventos,
      examenes,
      clasesTeoricas,
      practicas,
      seminarios,
      investigacion,
      porMateria,
      materias,
    };
  }, [eventos]);
}
