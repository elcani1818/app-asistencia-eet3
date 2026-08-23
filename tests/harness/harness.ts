import { ITestAdapter, UserSession, AppRole, ShiftCode } from './types';
import { InMemoryMockAdapter } from './mock_adapter';
import { SupabaseLiveAdapter } from './supabase_adapter';

export interface HarnessOptions {
  adapter?: 'mock' | 'supabase';
}

export interface ValidationResult {
  isValid: boolean;
  varonesValid: boolean;
  mujeresValid: boolean;
  totalValid: boolean;
  varonesDisparity: number; // (P_V + A_V) - I_V
  mujeresDisparity: number; // (P_M + A_M) - I_M
  errorMessage?: string;
}

export class TestHarness {
  public adapter: ITestAdapter;

  constructor(adapter: ITestAdapter) {
    this.adapter = adapter;
  }

  async initialize(): Promise<void> {
    await this.adapter.initialize();
  }

  async reset(): Promise<void> {
    await this.adapter.resetDatabase();
    await this.adapter.seedInitialData();
  }

  async createAdminActor(): Promise<UserSession> {
    return this.adapter.authenticate('admin@eest3.edu.ar', 'administrador');
  }

  async createPreceptorActor(shift: ShiftCode = 'vespertino'): Promise<UserSession> {
    const email = `preceptor.${shift === 'manana' ? 'tm' : (shift === 'tarde' ? 'tt' : 'tv')}@eest3.edu.ar`;
    return this.adapter.authenticate(email, 'preceptor');
  }

  async createTeacherActor(courseNameOrId?: string): Promise<UserSession> {
    const email = `prof.${Date.now()}@eest3.edu.ar`;
    const session = await this.adapter.authenticate(email, 'profesor');

    if (courseNameOrId) {
      const course = await this.adapter.getCourseByName(courseNameOrId) || await this.adapter.getCourseById(courseNameOrId);
      if (course) {
        await this.adapter.assignTeacherToCourse(course.id, session.user.id, 'admin-1');
      }
    }
    return session;
  }

  async getPredefinedTeacher(email: string): Promise<UserSession> {
    return this.adapter.authenticate(email, 'profesor');
  }
}

export async function createTestHarness(options: HarnessOptions = {}): Promise<TestHarness> {
  const adapterType = options.adapter || 'mock';
  const adapter: ITestAdapter = adapterType === 'supabase' ? new SupabaseLiveAdapter() : new InMemoryMockAdapter();
  const harness = new TestHarness(adapter);
  await harness.initialize();
  return harness;
}

// Canonical Calculation & Validation Helpers matching PROJECT.md
export function validateAttendanceRow(
  inscriptosV: number,
  inscriptosM: number,
  presentesV: number,
  presentesM: number,
  ausentesV: number,
  ausentesM: number
): ValidationResult {
  // Non-negative & integer checks
  if (presentesV < 0 || presentesM < 0 || ausentesV < 0 || ausentesM < 0 ||
      inscriptosV < 0 || inscriptosM < 0) {
    return {
      isValid: false,
      varonesValid: false,
      mujeresValid: false,
      totalValid: false,
      varonesDisparity: 0,
      mujeresDisparity: 0,
      errorMessage: 'Los valores no pueden ser negativos'
    };
  }

  if (!Number.isInteger(presentesV) || !Number.isInteger(presentesM) ||
      !Number.isInteger(ausentesV) || !Number.isInteger(ausentesM)) {
    return {
      isValid: false,
      varonesValid: false,
      mujeresValid: false,
      totalValid: false,
      varonesDisparity: 0,
      mujeresDisparity: 0,
      errorMessage: 'Los valores deben ser números enteros'
    };
  }

  const varonesDisparity = (presentesV + ausentesV) - inscriptosV;
  const mujeresDisparity = (presentesM + ausentesM) - inscriptosM;
  const totalDisparity = ((presentesV + presentesM) + (ausentesV + ausentesM)) - (inscriptosV + inscriptosM);

  const varonesValid = varonesDisparity === 0;
  const mujeresValid = mujeresDisparity === 0;
  const totalValid = totalDisparity === 0;
  const isValid = varonesValid && mujeresValid;

  let errorMessage: string | undefined;
  if (!isValid) {
    const errParts: string[] = [];
    if (!varonesValid) {
      if (varonesDisparity < 0) {
        errParts.push(`Varones: Faltan ${Math.abs(varonesDisparity)} para completar los ${inscriptosV} inscriptos`);
      } else {
        errParts.push(`Varones: Sobran ${varonesDisparity} (suma ${presentesV + ausentesV} de ${inscriptosV} inscriptos)`);
      }
    }
    if (!mujeresValid) {
      if (mujeresDisparity < 0) {
        errParts.push(`Mujeres: Faltan ${Math.abs(mujeresDisparity)} para completar las ${inscriptosM} inscriptas`);
      } else {
        errParts.push(`Mujeres: Sobran ${mujeresDisparity} (suma ${presentesM + ausentesM} de ${inscriptosM} inscriptas)`);
      }
    }
    errorMessage = errParts.join('; ');
  }

  return {
    isValid,
    varonesValid,
    mujeresValid,
    totalValid,
    varonesDisparity,
    mujeresDisparity,
    errorMessage
  };
}

export function calculateAttendancePercentage(presentesTotal: number, inscriptosTotal: number): number {
  if (inscriptosTotal <= 0) return 0;
  return Number(((presentesTotal / inscriptosTotal) * 100).toFixed(2));
}

export function calculateShiftTotals(rows: Array<{
  inscriptos_varones?: number;
  inscriptos_v?: number;
  inscriptos_mujeres?: number;
  inscriptos_m?: number;
  inscriptos_total?: number;
  inscriptos_t?: number;
  presentes_varones?: number;
  presentes_v?: number;
  presentes_mujeres?: number;
  presentes_m?: number;
  presentes_total?: number;
  presentes_t?: number;
  ausentes_varones?: number;
  ausentes_v?: number;
  ausentes_mujeres?: number;
  ausentes_m?: number;
  ausentes_total?: number;
  ausentes_t?: number;
}>): {
  inscriptosV: number;
  inscriptosM: number;
  inscriptosT: number;
  presentesV: number;
  presentesM: number;
  presentesT: number;
  ausentesV: number;
  ausentesM: number;
  ausentesT: number;
  porcentajeAsistencia: number;
} {
  let inscriptosV = 0;
  let inscriptosM = 0;
  let inscriptosT = 0;
  let presentesV = 0;
  let presentesM = 0;
  let presentesT = 0;
  let ausentesV = 0;
  let ausentesM = 0;
  let ausentesT = 0;

  for (const r of rows) {
    const iv = r.inscriptos_varones ?? r.inscriptos_v ?? 0;
    const im = r.inscriptos_mujeres ?? r.inscriptos_m ?? 0;
    const it = r.inscriptos_total ?? r.inscriptos_t ?? (iv + im);

    const pv = r.presentes_varones ?? r.presentes_v ?? 0;
    const pm = r.presentes_mujeres ?? r.presentes_m ?? 0;
    const pt = r.presentes_total ?? r.presentes_t ?? (pv + pm);

    const av = r.ausentes_varones ?? r.ausentes_v ?? 0;
    const am = r.ausentes_mujeres ?? r.ausentes_m ?? 0;
    const at = r.ausentes_total ?? r.ausentes_t ?? (av + am);

    inscriptosV += iv;
    inscriptosM += im;
    inscriptosT += it;

    presentesV += pv;
    presentesM += pm;
    presentesT += pt;

    ausentesV += av;
    ausentesM += am;
    ausentesT += at;
  }

  const porcentajeAsistencia = calculateAttendancePercentage(presentesT, inscriptosT);

  return {
    inscriptosV,
    inscriptosM,
    inscriptosT,
    presentesV,
    presentesM,
    presentesT,
    ausentesV,
    ausentesM,
    ausentesT,
    porcentajeAsistencia
  };
}

export function calculatePartialShiftTotals(rows: Array<{
  inscriptos_v: number;
  inscriptos_m: number;
  inscriptos_t: number;
  presentes_v: number;
  presentes_m: number;
  presentes_t: number;
  ausentes_v: number;
  ausentes_m: number;
  ausentes_t: number;
  is_submitted: boolean;
}>) {
  let submittedCount = 0;
  let pendingCount = 0;
  let submittedInscriptosT = 0;
  let totalInscriptosT = 0;
  let presentesT = 0;
  let ausentesT = 0;

  for (const r of rows) {
    totalInscriptosT += r.inscriptos_t;
    if (r.is_submitted) {
      submittedCount++;
      submittedInscriptosT += r.inscriptos_t;
      presentesT += r.presentes_t;
      ausentesT += r.ausentes_t;
    } else {
      pendingCount++;
    }
  }

  const porcentajeSubmitted = calculateAttendancePercentage(presentesT, submittedInscriptosT);
  const porcentajeGlobal = calculateAttendancePercentage(presentesT, totalInscriptosT);

  return {
    totalInscriptosT,
    submittedInscriptosT,
    presentesT,
    ausentesT,
    submittedCount,
    pendingCount,
    porcentajeSubmitted,
    porcentajeGlobal
  };
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export function getTomorrowString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}
