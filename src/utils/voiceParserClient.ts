import { Exam } from '../types';

export interface ParsedVoiceExamResult {
  action: string;
  exam: {
    subjectName: string;
    title: string;
    date: string;
    time: string;
    classroom: string;
    weight: string;
    topics?: string[];
    notes?: string;
  };
  summary: string;
  confidence: string;
  source?: string;
}

// Client-side date and regex parser for resilience
export function parseVoiceExamLocally(transcript: string, existingSubjects: string[] = []): ParsedVoiceExamResult {
  const base = new Date();
  const lower = transcript.toLowerCase().trim();

  let targetDate = new Date(base);
  let timeStr = '08:00';

  // Extract explicit time
  const timeMatch = lower.match(/(?:a las|a la|alas)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|hs|horas)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const mins = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const modifier = timeMatch[3]?.toLowerCase();
    if (modifier === 'pm' && hours < 12) hours += 12;
    if (modifier === 'am' && hours === 12) hours = 0;
    timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  const dayMap: Record<string, number> = {
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    miércoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
    sábado: 6,
  };

  if (lower.includes('pasado mañana')) {
    targetDate.setDate(targetDate.getDate() + 2);
  } else if (lower.includes('mañana') && !lower.includes('aula magna')) {
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (lower.includes('hoy')) {
    // keep today
  } else {
    let matchedDay: number | null = null;
    for (const [dayName, dayNum] of Object.entries(dayMap)) {
      if (new RegExp(`\\b${dayName}\\b`, 'i').test(lower)) {
        matchedDay = dayNum;
        break;
      }
    }

    if (matchedDay !== null) {
      const currentDay = base.getDay();
      let diff = matchedDay - currentDay;
      if (diff <= 0) {
        diff += 7;
      }
      targetDate.setDate(targetDate.getDate() + diff);
    } else {
      const dateMatch = lower.match(/(?:el\s*)?(\d{1,2})\s*de\s*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|setiembre|septiembre|octubre|noviembre|diciembre)(?:\s*(?:del?|de)\s*(\d{4}))?/i);
      if (dateMatch) {
        const day = parseInt(dateMatch[1], 10);
        const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        let monthName = dateMatch[2].toLowerCase();
        if (monthName === 'setiembre') monthName = 'septiembre';
        const monthIdx = monthNames.indexOf(monthName);
        const year = dateMatch[3] ? parseInt(dateMatch[3], 10) : targetDate.getFullYear();
        if (monthIdx !== -1) {
          targetDate = new Date(year, monthIdx, day);
        }
      } else {
        const currentDay = base.getDay();
        let diff = 5 - currentDay; // Default to upcoming Friday
        if (diff <= 0) diff += 7;
        targetDate.setDate(targetDate.getDate() + diff);
      }
    }
  }

  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  // Subject matching
  let subjectName = '';
  for (const sub of existingSubjects) {
    if (lower.includes(sub.toLowerCase())) {
      subjectName = sub;
      break;
    }
  }

  if (!subjectName) {
    const subMatch = transcript.match(/(?:examen|parcial|final|recuperatorio|evaluaci[oó]n|test)\s+(?:de\s+|para\s+)?([A-Za-zÀ-ÿ\s\d]+?)(?=\s+(?:el|en|a\s+las|con|para|valor|vale|ponderaci[oó]n|el\s+pr[oó]ximo|$))/i);
    if (subMatch && subMatch[1]) {
      subjectName = subMatch[1].trim().replace(/^(mi|el|la|los|las)\s+/i, '');
    } else {
      const words = transcript.split(/\s+/);
      const examIdx = words.findIndex((w) => /examen|parcial|final/i.test(w));
      if (examIdx !== -1 && words[examIdx + 1]) {
        const nextWords = words.slice(examIdx + 1, examIdx + 4).join(' ');
        subjectName = nextWords.replace(/^de\s+/i, '').split(/\s+(el|en|a|con)\b/i)[0] || 'Anatomía';
      } else {
        subjectName = 'Anatomía';
      }
    }
  }

  subjectName = subjectName.charAt(0).toUpperCase() + subjectName.slice(1);

  // Classroom
  let classroom = 'Aula Magna';
  const roomMatch = transcript.match(/(?:en\s+(?:el\s+|la\s+)?)(aula\s*\w+|laboratorio\s*\w+|anfiteatro\s*\w+|sala\s*\w+|pabell[oó]n\s*\w+)/i);
  if (roomMatch) {
    classroom = roomMatch[1].charAt(0).toUpperCase() + roomMatch[1].slice(1);
  }

  // Weight
  let weight = '30% Parcial';
  if (/final/i.test(lower)) weight = 'Final Ordinario (50%)';
  else if (/primer\s+parcial|1er\s+parcial/i.test(lower)) weight = '1er Parcial (30%)';
  else if (/segundo\s+parcial|2do\s+parcial/i.test(lower)) weight = '2do Parcial (35%)';
  else if (/recuperatorio/i.test(lower)) weight = 'Recuperatorio';

  const title = `Examen de ${subjectName}`;

  return {
    action: 'add_exam',
    exam: {
      subjectName,
      title,
      date: dateStr,
      time: timeStr,
      classroom,
      weight,
      topics: ['Temario general de cátedra'],
      notes: `Registrado por comando de voz: "${transcript}"`,
    },
    summary: `Examen de ${subjectName} programado para el ${dateStr} a las ${timeStr} en ${classroom}`,
    confidence: 'high',
    source: 'client-nlp',
  };
}

export async function parseVoiceNoteWithAI(
  transcript: string,
  existingSubjects: string[] = []
): Promise<ParsedVoiceExamResult> {
  try {
    const res = await fetch('/api/voice-note', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcript,
        currentDate: new Date().toISOString(),
        existingSubjects,
      }),
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data && data.exam) {
      return data as ParsedVoiceExamResult;
    }
    throw new Error('Invalid JSON format from voice API');
  } catch (err) {
    console.warn('Falling back to smart client NLP voice parser:', err);
    return parseVoiceExamLocally(transcript, existingSubjects);
  }
}
