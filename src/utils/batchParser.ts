export interface ParsedBatchCard {
  id: string;
  materia: string;
  fecha: string; // YYYY-MM-DD or string
  tipo: string; // e.g. "1er Examen Parcial", "Teoría", "Laboratorio"
  temas: string[]; // List of topics
  horario: string; // e.g. "08:00" or "08:00 - 10:00"
  aula?: string; // e.g. "Aula Magna"
  docente?: string; // e.g. "Dra. Ramos"
  peso?: string; // e.g. "30% Parcial"
  diaSemana?: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';
  isExam: boolean;
  raw?: any;
  errors: string[];
  isValid: boolean;
}

export interface ParseResult {
  cards: ParsedBatchCard[];
  validCount: number;
  invalidCount: number;
  formatDetected: 'json' | 'structured-text' | 'unknown';
  generalError?: string;
}

// Helper to determine day of week from YYYY-MM-DD
export function getDayOfWeekFromDate(dateStr: string): 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' {
  if (!dateStr) return 'Lunes';
  try {
    const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00'));
    if (isNaN(d.getTime())) return 'Lunes';
    const day = d.getDay();
    const map: Record<number, 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado'> = {
      0: 'Lunes', // Fallback for Sunday
      1: 'Lunes',
      2: 'Martes',
      3: 'Miércoles',
      4: 'Jueves',
      5: 'Viernes',
      6: 'Sábado',
    };
    return map[day] || 'Lunes';
  } catch {
    return 'Lunes';
  }
}

// Normalize date to YYYY-MM-DD format if possible (supports DD/MM/YYYY, YYYY-MM-DD, etc.)
export function normalizeDate(dateRaw: string): string {
  if (!dateRaw) return '';
  const trimmed = dateRaw.trim();

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Return as-is if unable to normalize
  return trimmed;
}

// Clean and normalize topics
export function normalizeTopics(rawTemas: any): string[] {
  if (!rawTemas) return [];
  if (Array.isArray(rawTemas)) {
    return rawTemas
      .map((t) => String(t).trim())
      .filter((t) => t.length > 0);
  }
  if (typeof rawTemas === 'string') {
    return rawTemas
      .split(/[,;\n•\-\*]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }
  return [String(rawTemas)];
}

// Detect if card is primarily an exam or class
export function isExamType(tipo: string, defaultMode: 'exams' | 'schedule' | 'auto'): boolean {
  if (defaultMode === 'exams') return true;
  if (defaultMode === 'schedule') return false;

  const t = (tipo || '').toLowerCase();
  if (
    t.includes('examen') ||
    t.includes('parcial') ||
    t.includes('final') ||
    t.includes('recuperatorio') ||
    t.includes('evaluación') ||
    t.includes('evaluacion') ||
    t.includes('test') ||
    t.includes('quiz')
  ) {
    return true;
  }
  return false;
}

/**
 * Parses raw input text from user (JSON, Markdown JSON, or Key-Value text blocks)
 */
export function parseBatchInput(
  rawInput: string,
  mode: 'exams' | 'schedule' | 'auto' = 'auto'
): ParseResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      cards: [],
      validCount: 0,
      invalidCount: 0,
      formatDetected: 'unknown',
    };
  }

  // 1. Try parsing as JSON (including stripping markdown code blocks ```json ... ```)
  let cleanJsonStr = trimmed;
  if (cleanJsonStr.includes('```')) {
    cleanJsonStr = cleanJsonStr.replace(/```(?:json)?([\s\S]*?)```/gi, '$1').trim();
  }

  if (
    (cleanJsonStr.startsWith('[') && cleanJsonStr.endsWith(']')) ||
    (cleanJsonStr.startsWith('{') && cleanJsonStr.endsWith('}'))
  ) {
    try {
      const parsedJson = JSON.parse(cleanJsonStr);
      const items = Array.isArray(parsedJson)
        ? parsedJson
        : parsedJson.fichas || parsedJson.examenes || parsedJson.clases || parsedJson.eventos || [parsedJson];

      const cards: ParsedBatchCard[] = items.map((item: any, idx: number) => {
        const materia = String(item.materia || item.subject || item.asignatura || item.nombre || '').trim();
        const rawFecha = String(item.fecha || item.date || item.dia || '').trim();
        const fecha = normalizeDate(rawFecha);
        const tipo = String(
          item.tipo || item.type || item.titulo || item.title || (mode === 'exams' ? 'Examen Parcial' : 'Clase Teórica')
        ).trim();
        
        const rawTemas = item.temas || item.topics || item.tema || item.topic || item.contenido || item.description || [];
        const temas = normalizeTopics(rawTemas);
        
        const horario = String(item.horario || item.hora || item.time || '08:00').trim();
        const aula = String(item.aula || item.salon || item.classroom || item.location || 'Aula Magna').trim();
        const docente = String(item.docente || item.profesor || item.professor || '').trim();
        const peso = String(item.peso || item.weight || (isExamType(tipo, mode) ? '30% Parcial' : '')).trim();

        // Validation
        const errors: string[] = [];
        if (!materia) errors.push('Falta el campo "Materia"');
        if (!fecha) errors.push('Falta el campo "Fecha"');
        if (!tipo) errors.push('Falta el campo "Tipo"');
        if (temas.length === 0) errors.push('Falta el campo "Temas"');

        const isExam = isExamType(tipo, mode);
        const diaSemana = getDayOfWeekFromDate(fecha);

        return {
          id: `batch-${Date.now()}-${idx}`,
          materia,
          fecha,
          tipo,
          temas,
          horario,
          aula,
          docente,
          peso,
          diaSemana,
          isExam,
          raw: item,
          errors,
          isValid: errors.length === 0,
        };
      });

      const validCount = cards.filter((c) => c.isValid).length;
      return {
        cards,
        validCount,
        invalidCount: cards.length - validCount,
        formatDetected: 'json',
      };
    } catch {
      // Not valid JSON, proceed to structured text parsing
    }
  }

  // 2. Parse Structured Text Blocks
  // Delimited by blank lines, "---", "###", or numbered blocks "1.", "2."
  const blocks = splitIntoBlocks(trimmed);
  const cards: ParsedBatchCard[] = [];

  blocks.forEach((block, idx) => {
    const card = parseStructuredTextBlock(block, idx, mode);
    if (card) {
      cards.push(card);
    }
  });

  if (cards.length > 0) {
    const validCount = cards.filter((c) => c.isValid).length;
    return {
      cards,
      validCount,
      invalidCount: cards.length - validCount,
      formatDetected: 'structured-text',
    };
  }

  return {
    cards: [],
    validCount: 0,
    invalidCount: 0,
    formatDetected: 'unknown',
    generalError:
      'No se pudieron identificar fichas válidas en el texto. Asegúrate de incluir Materia, Fecha, Tipo y Temas.',
  };
}

function splitIntoBlocks(text: string): string[] {
  // Split by markdown horizontal rule, multiple line breaks, or numbered markers
  const rawBlocks = text
    .split(/\n\s*[-=_]{3,}\s*\n|\n{2,}(?=[#\*\d\w])/g)
    .map((b) => b.trim())
    .filter((b) => b.length > 5);

  if (rawBlocks.length <= 1) {
    // Check if it's numbered items e.g., "1. Materia:", "2. Materia:"
    const numbered = text.split(/\n(?=\d+[\.\)]\s*(?:\*\*)?(?:Materia|Subject|Fecha|Tipo))/gi);
    if (numbered.length > 1) {
      return numbered.map((b) => b.trim()).filter((b) => b.length > 5);
    }
  }

  return rawBlocks;
}

function parseStructuredTextBlock(
  block: string,
  idx: number,
  mode: 'exams' | 'schedule' | 'auto'
): ParsedBatchCard | null {
  const lines = block.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return null;

  let materia = '';
  let rawFecha = '';
  let tipo = '';
  let rawTemas = '';
  let horario = '08:00';
  let aula = 'Aula Magna';
  let docente = '';
  let peso = '';

  for (const line of lines) {
    const cleanLine = line.replace(/^[0-9]+[\.\)]\s*/, '').replace(/^\*+\s*/, '').replace(/^[-•]\s*/, '');
    
    // Check key-value patterns
    const matchKV = cleanLine.match(/^(?:\*\*)?([^:\*]+)(?:\*\*)?\s*:\s*(.+)$/i);
    if (matchKV) {
      const key = matchKV[1].toLowerCase().trim();
      const val = matchKV[2].replace(/\*+/g, '').trim();

      if (key.includes('materia') || key.includes('asignatura') || key.includes('subject') || key.includes('cátedra') || key.includes('catedra')) {
        materia = val;
      } else if (key.includes('fecha') || key.includes('date') || key.includes('día') || key.includes('dia')) {
        rawFecha = val;
      } else if (key.includes('tipo') || key.includes('type') || key.includes('evaluación') || key.includes('evaluacion') || key.includes('título') || key.includes('titulo')) {
        tipo = val;
      } else if (key.includes('tema') || key.includes('topic') || key.includes('contenido') || key.includes('unidades') || key.includes('unidad')) {
        rawTemas = val;
      } else if (key.includes('hora') || key.includes('time') || key.includes('horario')) {
        horario = val;
      } else if (key.includes('aula') || key.includes('salon') || key.includes('salón') || key.includes('lugar') || key.includes('classroom') || key.includes('location')) {
        aula = val;
      } else if (key.includes('docente') || key.includes('profesor') || key.includes('doctor') || key.includes('prof')) {
        docente = val;
      } else if (key.includes('peso') || key.includes('ponderación') || key.includes('ponderacion') || key.includes('weight') || key.includes('porcentaje')) {
        peso = val;
      }
    }
  }

  // Fallback if missing some keys by line position
  if (!materia && lines[0] && !lines[0].includes(':')) {
    materia = lines[0].replace(/^[#\*\d\.\s\-]+/, '').trim();
  }

  if (!tipo) {
    tipo = mode === 'exams' ? 'Examen Parcial' : 'Clase Teórica';
  }

  const fecha = normalizeDate(rawFecha);
  const temas = normalizeTopics(rawTemas);
  const isExam = isExamType(tipo, mode);
  const diaSemana = getDayOfWeekFromDate(fecha);

  const errors: string[] = [];
  if (!materia) errors.push('Falta el campo "Materia"');
  if (!fecha) errors.push('Falta el campo "Fecha"');
  if (!tipo) errors.push('Falta el campo "Tipo"');
  if (temas.length === 0) errors.push('Falta el campo "Temas"');

  return {
    id: `batch-text-${Date.now()}-${idx}`,
    materia,
    fecha,
    tipo,
    temas,
    horario,
    aula,
    docente,
    peso: peso || (isExam ? '30% Parcial' : ''),
    diaSemana,
    isExam,
    raw: block,
    errors,
    isValid: errors.length === 0,
  };
}

export const SAMPLE_AI_PROMPT_EXAMS = `Actúa como asistente académico universitario y genera un JSON con mis fechas de exámenes para importar en CampusBloom.
El formato DEBE ser un arreglo JSON con las siguientes propiedades para cada evaluación:
- "materia": Nombre de la materia
- "fecha": Fecha en formato YYYY-MM-DD
- "tipo": Tipo de examen (ej. "1er Examen Parcial", "Examen Final", "Recuperatorio")
- "temas": Lista de temas/unidades clave que entran en el examen
- "horario": Hora del examen (ej. "08:00")
- "aula": Salón o aula (ej. "Aula Magna", "Pabellón A")
- "peso": Ponderación (ej. "30% Parcial")

Ejemplo:
[
  {
    "materia": "Fisiología II",
    "fecha": "2026-09-18",
    "tipo": "1er Examen Parcial",
    "temas": ["Potencial de acción", "Fisiología cardiovascular", "Ciclo cardíaco"],
    "horario": "08:00",
    "aula": "Aula Magna FCM",
    "peso": "30% Parcial"
  }
]`;

export const SAMPLE_AI_PROMPT_SCHEDULE = `Actúa como asistente académico y genera un JSON con mis clases/cronograma universitario para CampusBloom.
El formato DEBE ser un arreglo JSON con las siguientes propiedades:
- "materia": Nombre de la materia
- "fecha": Fecha o primera sesión (YYYY-MM-DD)
- "tipo": "Teoría", "Práctica", "Laboratorio" o "Seminario"
- "temas": Lista de contenidos de la clase
- "horario": Rango de horas (ej. "08:00 - 10:00")
- "aula": Salón o laboratorio
- "docente": Nombre del profesor/a

Ejemplo:
[
  {
    "materia": "Microbiología II",
    "fecha": "2026-09-14",
    "tipo": "Laboratorio",
    "temas": ["Cultivo bacteriano", "Tinción de Gram y Ziehl-Neelsen"],
    "horario": "10:00 - 12:00",
    "aula": "Laboratorio de Microbiología L-2",
    "docente": "Dra. Ramos"
  }
]`;
