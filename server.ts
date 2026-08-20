import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

// Intelligent date calculator helper for Spanish relative dates
function computeRelativeDate(text: string, baseDateStr?: string): { dateStr: string; timeStr: string } {
  const base = baseDateStr ? new Date(baseDateStr) : new Date();
  const lower = text.toLowerCase();
  
  let targetDate = new Date(base);
  let timeStr = '08:00';

  // Extract explicit time like "a las 9", "a las 14:30", "a las 10 am"
  const timeMatch = lower.match(/(?:a las|a la|alas)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|hs|horas)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const mins = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const modifier = timeMatch[3]?.toLowerCase();
    if (modifier === 'pm' && hours < 12) hours += 12;
    if (modifier === 'am' && hours === 12) hours = 0;
    timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  // Days of week mapping (0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday)
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
    // Keep today
  } else {
    // Check for day of week mentions
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
        diff += 7; // Next occurrence
      }
      targetDate.setDate(targetDate.getDate() + diff);
    } else {
      // Check for explicit date like "el 25 de noviembre", "15 de mayo", "el 4 de abril"
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
        // Default to upcoming Friday if unspecified
        const currentDay = base.getDay();
        let diff = 5 - currentDay;
        if (diff <= 0) diff += 7;
        targetDate.setDate(targetDate.getDate() + diff);
      }
    }
  }

  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getDate()).padStart(2, '0');

  return {
    dateStr: `${yyyy}-${mm}-${dd}`,
    timeStr,
  };
}

// Algorithmic extractor as immediate reliable fallback
function extractExamAlgorithmic(transcript: string, currentDate?: string, existingSubjects: string[] = []) {
  const { dateStr, timeStr } = computeRelativeDate(transcript, currentDate);
  const lower = transcript.toLowerCase();

  // Try matching against existing subjects
  let subjectName = '';
  for (const sub of existingSubjects) {
    if (lower.includes(sub.toLowerCase())) {
      subjectName = sub;
      break;
    }
  }

  // Common medical/university subjects regex fallback
  if (!subjectName) {
    const subMatch = transcript.match(/(?:examen|parcial|final|recuperatorio|evaluaci[oó]n|test)\s+(?:de\s+|para\s+)?([A-Za-zÀ-ÿ\s\d]+?)(?=\s+(?:el|en|a\s+las|con|para|valor|vale|ponderaci[oó]n|el\s+pr[oó]ximo|$))/i);
    if (subMatch && subMatch[1]) {
      subjectName = subMatch[1].trim();
      // Clean up common filler words
      subjectName = subjectName.replace(/^(mi|el|la|los|las)\s+/i, '');
    } else {
      // General match
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

  // Capitalize nicely
  subjectName = subjectName.charAt(0).toUpperCase() + subjectName.slice(1);

  // Classroom
  let classroom = 'Aula Magna';
  const roomMatch = transcript.match(/(?:en\s+(?:el\s+|la\s+)?)(aula\s*\w+|laboratorio\s*\w+|anfiteatro\s*\w+|sala\s*\w+|pabell[oó]n\s*\w+)/i);
  if (roomMatch) {
    classroom = roomMatch[1].charAt(0).toUpperCase() + roomMatch[1].slice(1);
  }

  // Weight / Type
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
      status: 'upcoming',
      topics: ['Temario principal de cátedra'],
      notes: `Registrado por comando de voz: "${transcript}"`,
    },
    summary: `Examen de ${subjectName} programado para ${dateStr} a las ${timeStr} en ${classroom}`,
    confidence: 'high',
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // AI Voice Note & Exam Command Parser
  app.post('/api/voice-note', async (req, res) => {
    try {
      const { transcript, currentDate, existingSubjects } = req.body;

      if (!transcript || typeof transcript !== 'string') {
        res.status(400).json({ error: 'Se requiere el texto transcrito de la voz.' });
        return;
      }

      const todayIso = currentDate || new Date().toISOString();
      const subsList = Array.isArray(existingSubjects) ? existingSubjects : [];

      // Check if Gemini API is available
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // High quality algorithmic fallback
        const result = extractExamAlgorithmic(transcript, todayIso, subsList);
        res.json({ ...result, source: 'smart-local-nlp' });
        return;
      }

      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const prompt = `Eres el asistente inteligente de CampusBloom para estudiantes universitarios de medicina y ciencias de la salud.
La fecha y hora actual de referencia del usuario es: ${todayIso}.
Materias existentes en el perfil del usuario: ${JSON.stringify(subsList)}.

El usuario acaba de decir mediante nota de voz:
"${transcript}"

Tu tarea es analizar el comando de voz del usuario y extraer los datos estructurados para agregar un examen o nota académica al módulo de Exámenes.
Calcula con precisión la fecha en formato YYYY-MM-DD a partir de expresiones relativas como "el viernes", "este viernes", "el próximo lunes", "mañana", "el 15 de noviembre", etc., teniendo en cuenta la fecha actual (${todayIso}).
Si menciona una hora como "a las 8 am" o "a las 14:00", devuélvela en formato HH:mm (ej. "08:00"). Si no menciona hora, usa "08:00".
Si no especifica aula, usa "Aula Magna".
Si no especifica ponderación, usa "30% Parcial".
Extrae el nombre de la materia (ej. "Anatomía", "Fisiología", "Farmacología", etc.) y un título claro como "Examen de Anatomía".
Devuelve un JSON estrictamente estructurado.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                action: {
                  type: Type.STRING,
                  description: 'Action type, e.g. "add_exam" or "add_note"',
                },
                exam: {
                  type: Type.OBJECT,
                  properties: {
                    subjectName: {
                      type: Type.STRING,
                      description: 'Nombre de la materia (ej. Anatomía)',
                    },
                    title: {
                      type: Type.STRING,
                      description: 'Título del examen (ej. Examen de Anatomía)',
                    },
                    date: {
                      type: Type.STRING,
                      description: 'Fecha en formato YYYY-MM-DD',
                    },
                    time: {
                      type: Type.STRING,
                      description: 'Hora en formato HH:mm',
                    },
                    classroom: {
                      type: Type.STRING,
                      description: 'Aula o laboratorio',
                    },
                    weight: {
                      type: Type.STRING,
                      description: 'Ponderación (ej. 30% Parcial, Final)',
                    },
                    topics: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'Lista de temas del examen si se mencionan',
                    },
                    notes: {
                      type: Type.STRING,
                      description: 'Nota o transcripción original',
                    },
                  },
                  required: ['subjectName', 'title', 'date', 'time', 'classroom', 'weight'],
                },
                summary: {
                  type: Type.STRING,
                  description: 'Resumen en español para mostrar al usuario',
                },
                confidence: {
                  type: Type.STRING,
                  description: 'high, medium, low',
                },
              },
              required: ['action', 'exam', 'summary'],
            },
          },
        });

        const rawText = response.text || '';
        const parsed = JSON.parse(rawText);
        res.json({
          ...parsed,
          source: 'gemini-3.7-flash',
        });
      } catch (geminiErr) {
        console.error('Error invoking Gemini API for voice note, using smart local fallback:', geminiErr);
        const fallbackResult = extractExamAlgorithmic(transcript, todayIso, subsList);
        res.json({
          ...fallbackResult,
          source: 'smart-local-nlp-fallback',
        });
      }
    } catch (err: any) {
      console.error('Error in /api/voice-note:', err);
      res.status(500).json({ error: 'Error procesando la nota de voz' });
    }
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CampusBloom Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
