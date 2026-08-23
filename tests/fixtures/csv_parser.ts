import * as fs from 'fs';
import * as path from 'path';

export interface ParsedCsvCourse {
  name: string;
  year: number;
  division: number;
  cycle: 'basico' | 'superior' | 'tecnico_especial';
  orientation: string | null;
  inscriptos_v: number;
  inscriptos_m: number;
  inscriptos_t: number;
}

export interface ParsedCsvResult {
  institution: string;
  shift_code: 'vespertino';
  shift_name: string;
  location: string;
  courses: ParsedCsvCourse[];
  totals: {
    inscriptos_v: number;
    inscriptos_m: number;
    inscriptos_t: number;
  };
}

export function parseReferenceTvCsv(csvContent?: string): ParsedCsvResult {
  let content = csvContent;
  if (!content) {
    const csvPath = path.resolve(__dirname, 'reference_tv.csv');
    if (fs.existsSync(csvPath)) {
      content = fs.readFileSync(csvPath, 'utf-8');
    } else {
      const rootCsvPath = path.resolve(__dirname, '../../PARTE GENERALES TV.xlsx - T.V.csv');
      content = fs.readFileSync(rootCsvPath, 'utf-8');
    }
  }

  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

  // Institution title from lines 1-2
  const institution = 'ESCUELA DE EDUCACIÓN SECUNDARIA TÉCNICA N° 3 "Ntra. Sra. de la Merced"';
  const location = 'LOMA HERMOSA';

  const courses: ParsedCsvCourse[] = [];
  let totals = { inscriptos_v: 0, inscriptos_m: 0, inscriptos_t: 0 };

  for (const line of lines) {
    // Parse comma-delimited row respecting quotes
    const parts = parseCsvLine(line);
    if (parts.length < 10) continue;

    const courseRaw = parts[1] ? parts[1].trim() : '';
    const orientationRaw = parts[3] ? parts[3].trim() : '';
    const inscriptosVRaw = parts[6] !== undefined ? parts[6].trim() : '';
    const inscriptosMRaw = parts[7] !== undefined ? parts[7].trim() : '';
    const inscriptosTRaw = parts[8] !== undefined ? parts[8].trim() : '';

    if (courseRaw === 'TOTAL') {
      const v = parseNumber(inscriptosVRaw);
      const m = parseNumber(inscriptosMRaw);
      const t = parseNumber(inscriptosTRaw);
      totals = { inscriptos_v: v, inscriptos_m: m, inscriptos_t: t };
      continue;
    }

    // Check if line contains course data (e.g. 5º4º, 6º1º, 1° 1°)
    if (/^[0-9]+[º°]/.test(courseRaw)) {
      const v = parseNumber(inscriptosVRaw);
      const m = parseNumber(inscriptosMRaw);
      const t = parseNumber(inscriptosTRaw);

      const parsedName = normalizeCourseName(courseRaw);
      const { year, division, cycle } = parseCourseDetails(courseRaw, orientationRaw);

      // Verify row integrity: V + M = T
      if (v + m !== t) {
        throw new Error(`CSV Integrity Error in course ${courseRaw}: ${v} (V) + ${m} (M) != ${t} (T)`);
      }

      courses.push({
        name: parsedName,
        year,
        division,
        cycle,
        orientation: orientationRaw || null,
        inscriptos_v: v,
        inscriptos_m: m,
        inscriptos_t: t
      });
    }
  }

  // Validate aggregate sums
  const calculatedV = courses.reduce((acc, c) => acc + c.inscriptos_v, 0);
  const calculatedM = courses.reduce((acc, c) => acc + c.inscriptos_m, 0);
  const calculatedT = courses.reduce((acc, c) => acc + c.inscriptos_t, 0);

  if (totals.inscriptos_v === 0) {
    totals = { inscriptos_v: calculatedV, inscriptos_m: calculatedM, inscriptos_t: calculatedT };
  } else {
    if (calculatedV !== totals.inscriptos_v || calculatedM !== totals.inscriptos_m || calculatedT !== totals.inscriptos_t) {
      throw new Error(`CSV Totals Mismatch: Calculated (${calculatedV}V, ${calculatedM}M, ${calculatedT}T) != Reported (${totals.inscriptos_v}V, ${totals.inscriptos_m}M, ${totals.inscriptos_t}T)`);
    }
  }

  return {
    institution,
    shift_code: 'vespertino',
    shift_name: 'Turno Vespertino',
    location,
    courses,
    totals
  };
}

function parseNumber(val: string): number {
  if (!val || val === '-' || val === '') return 0;
  const num = parseInt(val, 10);
  return isNaN(num) ? 0 : num;
}

function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur);
  return result;
}

function normalizeCourseName(raw: string): string {
  if (raw.includes('C.TEC.MMO')) return '1° 1ª C.TEC.MMO';
  const match = raw.match(/([0-9]+)[º°]\s*([0-9]+)[ºª°]/);
  if (match) {
    return `${match[1]}° ${match[2]}ª`;
  }
  return raw;
}

function parseCourseDetails(raw: string, orientation: string): { year: number; division: number; cycle: 'basico' | 'superior' | 'tecnico_especial' } {
  if (raw.includes('C.TEC.MMO') || orientation.includes('C.TEC.MMO')) {
    return { year: 1, division: 1, cycle: 'tecnico_especial' };
  }
  const match = raw.match(/([0-9]+)[º°]\s*([0-9]+)[ºª°]/);
  if (match) {
    const year = parseInt(match[1], 10);
    const division = parseInt(match[2], 10);
    const cycle = year <= 3 ? 'basico' : 'superior';
    return { year, division, cycle };
  }
  return { year: 1, division: 1, cycle: 'basico' };
}
