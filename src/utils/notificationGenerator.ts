import { AcademicNotification, Exam, ClassScheduleItem, Subject, ResearchProject, DefenseConfig } from '../types';
import { safeGet } from './storage';

const DAYS_OF_WEEK = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;

export interface DynamicNotifsParams {
  exams: Exam[];
  schedule: ClassScheduleItem[];
  subjects: Subject[];
  userKey?: string;
}

/**
 * Dynamically computes real academic notifications from current application state.
 * Returns only real, verified alerts based on loaded exams, schedule, and research projects.
 */
export function generateRealNotifications({
  exams,
  schedule,
  subjects,
  userKey,
}: DynamicNotifsParams): AcademicNotification[] {
  const notifications: AcademicNotification[] = [];
  const now = new Date();
  // Strip time for pure day difference calculation
  const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayDayName = DAYS_OF_WEEK[now.getDay()];

  // 1. GENERATE FROM EXAMS
  exams.forEach((exam) => {
    if (!exam.date) return;

    let examDate: Date;
    try {
      const parts = exam.date.split('-');
      if (parts.length === 3) {
        examDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else {
        examDate = new Date(exam.date);
      }
    } catch {
      return;
    }

    if (isNaN(examDate.getTime())) return;

    const diffTime = examDate.getTime() - todayDateOnly.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (exam.status !== 'completed') {
      if (diffDays === 0) {
        notifications.push({
          id: `exam-today-${exam.id}`,
          title: `🚨 ¡Examen HOY! • ${exam.subjectName}`,
          description: `${exam.title || 'Evaluación'}: a las ${exam.time || '08:00'} hs en ${exam.classroom || 'Aula Asignada'}.${
            exam.topics && exam.topics.length ? ` Temas: ${exam.topics.slice(0, 3).join(', ')}` : ''
          }`,
          type: 'exam',
          timestamp: `Hoy ${exam.time || ''}`.trim(),
          date: `Hoy, ${exam.time || '08:00 hs'}`,
          isRead: false,
          priority: 'high',
          tag: exam.subjectName,
        });
      } else if (diffDays === 1) {
        notifications.push({
          id: `exam-tmrw-${exam.id}`,
          title: `⏰ Examen Mañana • ${exam.subjectName}`,
          description: `${exam.title || 'Examen'}: programado para mañana a las ${exam.time || '08:00'} hs (${exam.classroom || 'Aula'}). Ponderación: ${exam.weight || 'Parcial'}.`,
          type: 'exam',
          timestamp: 'Mañana',
          date: `Mañana, ${exam.time || '08:00 hs'}`,
          isRead: false,
          priority: 'high',
          tag: exam.subjectName,
        });
      } else if (diffDays > 1 && diffDays <= 7) {
        notifications.push({
          id: `exam-week-${exam.id}`,
          title: `📅 Examen en ${diffDays} días • ${exam.subjectName}`,
          description: `${exam.title || 'Examen'}: fijado para el ${exam.date} a las ${exam.time || '08:00'} hs en ${exam.classroom || 'Aula'}. Ponderación: ${exam.weight || 'Evaluación'}.`,
          type: 'exam',
          timestamp: `En ${diffDays} días`,
          date: `${exam.date} (${exam.time || '08:00 hs'})`,
          isRead: false,
          priority: 'high',
          tag: exam.subjectName,
        });
      } else if (diffDays > 7 && diffDays <= 21) {
        notifications.push({
          id: `exam-upcoming-${exam.id}`,
          title: `📌 Próximo Examen: ${exam.subjectName}`,
          description: `${exam.title || 'Evaluación'}: programado para el ${exam.date} a las ${exam.time || '08:00'} hs. Prepara el temario con anticipación.`,
          type: 'exam',
          timestamp: `En ${diffDays} días`,
          date: `${exam.date}`,
          isRead: false,
          priority: 'medium',
          tag: exam.subjectName,
        });
      } else if (diffDays < 0 && diffDays >= -14) {
        notifications.push({
          id: `exam-pending-grade-${exam.id}`,
          title: `📝 Examen por Calificar • ${exam.subjectName}`,
          description: `La fecha fijada fue el ${exam.date}. Recuerda registrar tu puntaje obtenido o marcarlo como culminado.`,
          type: 'exam',
          timestamp: 'Pendiente',
          date: `${exam.date}`,
          isRead: false,
          priority: 'medium',
          tag: exam.subjectName,
        });
      }
    } else if (exam.status === 'completed' && exam.score !== undefined) {
      notifications.push({
        id: `exam-scored-${exam.id}`,
        title: `✅ Nota Registrada • ${exam.subjectName}`,
        description: `Calificación: ${exam.score}/${exam.maxScore || 30} pts en ${exam.title || 'Examen'}.`,
        type: 'exam',
        timestamp: 'Completado',
        date: `${exam.date}`,
        isRead: false,
        priority: 'low',
        tag: exam.subjectName,
      });
    }
  });

  // 2. GENERATE FROM SCHEDULE (Today's classes & Special sessions)
  if (schedule.length > 0) {
    const todayClasses = schedule.filter((c) => c.dayOfWeek === todayDayName);
    if (todayClasses.length > 0) {
      const summaryText = todayClasses
        .map((c) => `${c.subjectName} (${c.startTime}-${c.endTime})`)
        .join(' • ');
      notifications.push({
        id: `sched-today-${now.toISOString().split('T')[0]}`,
        title: `📚 Agenda de Hoy (${todayDayName})`,
        description: `Tienes ${todayClasses.length} clase${todayClasses.length > 1 ? 's' : ''}: ${summaryText}.`,
        type: 'campus',
        timestamp: 'Hoy',
        date: `Hoy (${todayDayName})`,
        isRead: false,
        priority: 'medium',
        tag: 'Cronograma Diario',
      });
    }

    // Special labs or practical sessions (limit to 2 most relevant to avoid clutter)
    const specialClasses = schedule.filter((c) => c.type === 'Laboratorio' || c.type === 'Práctica' || c.type === 'Seminario');
    specialClasses.slice(0, 2).forEach((cls) => {
      notifications.push({
        id: `sched-special-${cls.id}`,
        title: `🔬 ${cls.type}: ${cls.subjectName}`,
        description: `Sesión fijada los ${cls.dayOfWeek} de ${cls.startTime} a ${cls.endTime} hs en ${cls.location || 'FCM'}.${cls.professor ? ` Docente: ${cls.professor}.` : ''}`,
        type: 'assignment',
        timestamp: `${cls.dayOfWeek}`,
        date: `${cls.dayOfWeek} ${cls.startTime} hs`,
        isRead: false,
        priority: 'medium',
        tag: cls.subjectName,
      });
    });
  }

  // 3. GENERATE FROM RESEARCH & THESIS (Projects, Requirements & Defense)
  try {
    const projectsKey = userKey ? `campusbloom_${userKey}_research_junior_projects` : 'campusbloom_research_junior_projects';
    const rawProjects = localStorage.getItem(projectsKey) || localStorage.getItem('campusbloom_research_junior_projects');
    const projects: ResearchProject[] = rawProjects ? JSON.parse(rawProjects) : [];

    projects.forEach((proj) => {
      // Due date alert
      if (proj.dueDate) {
        try {
          const parts = proj.dueDate.split('-');
          const dueDate = parts.length === 3 ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])) : new Date(proj.dueDate);
          if (!isNaN(dueDate.getTime())) {
            const diffDays = Math.round((dueDate.getTime() - todayDateOnly.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays <= 30) {
              notifications.push({
                id: `proj-due-${proj.id}`,
                title: `📑 Entrega de Investigación • ${proj.title}`,
                description: `Fecha límite de entrega fijada para el ${proj.dueDate}. Tutor/a asignado: ${proj.advisor || 'FCM'}.`,
                type: 'assignment',
                timestamp: diffDays === 0 ? 'Hoy' : `En ${diffDays} días`,
                date: `${proj.dueDate}`,
                isRead: false,
                priority: diffDays <= 7 ? 'high' : 'medium',
                tag: 'Investigación FCM',
              });
            }
          }
        } catch {
          // ignore date parse
        }
      }

      // Uncompleted project requirements
      if (proj.requirements && proj.requirements.length > 0) {
        const uncompleted = proj.requirements.filter((r) => !r.completed);
        if (uncompleted.length === 1) {
          notifications.push({
            id: `proj-req-${proj.id}-${uncompleted[0].id}`,
            title: `⚠️ Requisito Pendiente • ${proj.title}`,
            description: `Falta completar: "${uncompleted[0].title}". Criterio requerido para habilitación de defensa.`,
            type: 'assignment',
            timestamp: 'Pendiente',
            date: 'Habilitación Tesis',
            isRead: false,
            priority: 'medium',
            tag: 'Habilitación',
          });
        } else if (uncompleted.length > 1) {
          notifications.push({
            id: `proj-reqs-${proj.id}`,
            title: `📋 ${uncompleted.length} Requisitos Pendientes • ${proj.title}`,
            description: `Por validar: ${uncompleted.map((r) => r.title).slice(0, 2).join(', ')}${uncompleted.length > 2 ? ` (+${uncompleted.length - 2})` : ''}.`,
            type: 'assignment',
            timestamp: 'Pendiente',
            date: 'Habilitación Tesis',
            isRead: false,
            priority: 'medium',
            tag: 'Habilitación',
          });
        }
      }
    });

    // Defense configuration dates
    const defenseConfigKey = userKey ? `campusbloom_${userKey}_research_defense_config` : 'campusbloom_research_defense_config';
    const rawDefense = localStorage.getItem(defenseConfigKey) || localStorage.getItem('campusbloom_research_defense_config');
    if (rawDefense) {
      const defense: DefenseConfig = JSON.parse(rawDefense);
      if (defense.ordinaryDate && defense.ordinaryDate.trim() !== '') {
        notifications.push({
          id: `defense-ord-${defense.ordinaryDate.replace(/\s+/g, '-')}`,
          title: `🎓 Mesa Ordinaria de Defensa de Tesis`,
          description: `Fecha fijada: ${defense.ordinaryDate}. ${defense.ordinaryNotes || 'Asegúrate de contar con el 100% de los requisitos completados.'}`,
          type: 'campus',
          timestamp: 'Defensa FCM',
          date: `${defense.ordinaryDate}`,
          isRead: false,
          priority: 'high',
          tag: 'Defensa de Tesis',
        });
      }

      if (defense.extraordinaryDate && defense.extraordinaryDate.trim() !== '') {
        notifications.push({
          id: `defense-extra-${defense.extraordinaryDate.replace(/\s+/g, '-')}`,
          title: `🎓 Mesa Extraordinaria de Defensa`,
          description: `Fecha programada: ${defense.extraordinaryDate}. ${defense.extraordinaryNotes || ''}`,
          type: 'campus',
          timestamp: 'Defensa Extra',
          date: `${defense.extraordinaryDate}`,
          isRead: false,
          priority: 'medium',
          tag: 'Defensa de Tesis',
        });
      }
    }
  } catch (err) {
    console.warn('[NotificationGenerator] Error parsing research alerts:', err);
  }

  // 4. GENERATE FROM ATTENDANCE WARNINGS
  subjects.forEach((subj) => {
    const validTotal = Math.max(0, subj.totalClasses - (subj.cancelledClasses || 0));
    if (validTotal >= 4) {
      const attendancePct = Math.round((subj.attendedClasses / validTotal) * 100);
      if (attendancePct < 80) {
        notifications.push({
          id: `att-warning-${subj.id}`,
          title: `⚠️ Alerta de Asistencia • ${subj.name}`,
          description: `Tu asistencia actual es del ${attendancePct}%. Manténla por encima del 80% para asegurar tu regularidad académica.`,
          type: 'attendance',
          timestamp: 'Alerta Regularidad',
          date: `Asistencia: ${attendancePct}%`,
          isRead: false,
          priority: 'high',
          tag: subj.name,
        });
      }
    }
  });

  return notifications;
}
