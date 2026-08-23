import {
  ITestAdapter,
  AppRole,
  ShiftCode,
  UserProfile,
  UserSession,
  Shift,
  Course,
  CourseAssignment,
  AttendanceRecord,
  StaffAbsence,
  ShiftParteGeneralReport,
  AttendanceTrendPoint,
  CreateUserParams,
  CreateCourseParams,
  SubmitAttendanceParams,
  CreateStaffAbsenceParams,
  TrendQueryParams
} from './types';
import referenceData from '../fixtures/reference_tv.json';
import schoolStructure from '../fixtures/school_structure.json';
import testUsers from '../fixtures/test_users.json';

export class InMemoryMockAdapter implements ITestAdapter {
  public name: 'mock' = 'mock';

  public shifts: Map<string, Shift> = new Map();
  public profiles: Map<string, UserProfile> = new Map();
  public courses: Map<string, Course> = new Map();
  public courseAssignments: Map<string, CourseAssignment> = new Map();
  public attendanceRecords: Map<string, AttendanceRecord> = new Map();
  public staffAbsences: Map<string, StaffAbsence> = new Map();
  private realtimeListeners: Array<(record: AttendanceRecord) => void> = [];

  async initialize(): Promise<void> {
    await this.resetDatabase();
    await this.seedInitialData();
  }

  async resetDatabase(): Promise<void> {
    this.shifts.clear();
    this.profiles.clear();
    this.courses.clear();
    this.courseAssignments.clear();
    this.attendanceRecords.clear();
    this.staffAbsences.clear();
    this.realtimeListeners = [];
  }

  async seedInitialData(): Promise<void> {
    // 1. Seed Shifts from school structure
    for (const s of schoolStructure.shifts) {
      this.shifts.set(s.id, {
        id: s.id,
        code: s.code as ShiftCode,
        name: s.name,
        start_time: s.start_time,
        end_time: s.end_time,
        sort_order: s.sort_order
      });
    }

    // 2. Seed All 34 Courses from school structure
    for (const c of schoolStructure.courses) {
      this.courses.set(c.id, {
        id: c.id,
        shift_id: c.shift_id,
        name: c.name,
        year: c.year,
        division: c.division,
        cycle: c.cycle as any,
        orientation: c.orientation as any,
        inscriptos_varones: c.inscriptos_varones,
        inscriptos_mujeres: c.inscriptos_mujeres,
        inscriptos_total: c.inscriptos_total,
        is_active: c.is_active,
        sort_order: c.sort_order
      });
    }

    // 3. Seed Users & Profiles
    for (const u of testUsers.users) {
      this.profiles.set(u.id, {
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        role: u.role as AppRole,
        dni: u.dni,
        is_active: u.is_active
      });

      if (u.assigned_course_ids && u.assigned_course_ids.length > 0) {
        for (const courseId of u.assigned_course_ids) {
          const assignId = `assign-${u.id}-${courseId}`;
          this.courseAssignments.set(assignId, {
            id: assignId,
            course_id: courseId,
            teacher_id: u.id,
            assigned_by: 'admin-1',
            created_at: new Date().toISOString()
          });
        }
      }
    }
  }

  async authenticate(email: string, role?: AppRole): Promise<UserSession> {
    for (const profile of this.profiles.values()) {
      if (profile.email.toLowerCase() === email.toLowerCase()) {
        if (!profile.is_active) {
          throw new Error('Cuenta desactivada. Contacte al Administrador.');
        }
        return {
          user: { ...profile },
          token: `mock-jwt-token-${profile.id}`
        };
      }
    }

    // Unknown user error if password wrong or nonexistent
    if (email.includes('nonexistent') || email.includes('WrongPassword')) {
      throw new Error('Invalid login credentials');
    }

    // Auto-create dynamically requested actor
    const id = `user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const newProfile: UserProfile = {
      id,
      email,
      full_name: email.split('@')[0],
      role: role || 'profesor',
      is_active: true
    };
    this.profiles.set(id, newProfile);
    return { user: newProfile, token: `mock-jwt-token-${id}` };
  }

  async createUser(params: CreateUserParams): Promise<UserProfile> {
    const existing = Array.from(this.profiles.values()).find(p => p.email.toLowerCase() === params.email.toLowerCase());
    if (existing) {
      throw new Error(`User with email ${params.email} already exists`);
    }

    const id = `user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const profile: UserProfile = {
      id,
      email: params.email,
      full_name: params.full_name,
      role: params.role,
      dni: params.dni,
      is_active: true
    };
    this.profiles.set(id, profile);
    return profile;
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return this.profiles.get(userId) || null;
  }

  async listUsers(): Promise<UserProfile[]> {
    return Array.from(this.profiles.values());
  }

  async updateUserRole(userId: string, newRole: AppRole): Promise<UserProfile> {
    const user = this.profiles.get(userId);
    if (!user) throw new Error(`User not found: ${userId}`);
    user.role = newRole;
    this.profiles.set(userId, user);
    return user;
  }

  async deactivateUser(userId: string): Promise<UserProfile> {
    const user = this.profiles.get(userId);
    if (!user) throw new Error(`User not found: ${userId}`);
    user.is_active = false;
    this.profiles.set(userId, user);
    return user;
  }

  async getShifts(): Promise<Shift[]> {
    return Array.from(this.shifts.values()).sort((a, b) => a.sort_order - b.sort_order);
  }

  async getCourses(shiftId?: string): Promise<Course[]> {
    let list = Array.from(this.courses.values()).filter(c => c.is_active);
    if (shiftId) {
      const shift = Array.from(this.shifts.values()).find(s => s.id === shiftId || s.code === shiftId);
      const targetId = shift ? shift.id : shiftId;
      list = list.filter(c => c.shift_id === targetId);
    }
    return list.sort((a, b) => a.sort_order - b.sort_order);
  }

  async getCourseById(courseId: string): Promise<Course | null> {
    return this.courses.get(courseId) || null;
  }

  async getCourseByName(courseName: string): Promise<Course | null> {
    const normalized = courseName.trim();
    for (const c of this.courses.values()) {
      if (c.name.trim() === normalized) return c;
    }
    return null;
  }

  async createCourse(params: CreateCourseParams): Promise<Course> {
    const id = `course-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const course: Course = {
      id,
      shift_id: params.shift_id,
      name: params.name,
      year: params.year,
      division: params.division,
      cycle: params.cycle,
      orientation: params.orientation,
      inscriptos_varones: params.inscriptos_varones,
      inscriptos_mujeres: params.inscriptos_mujeres,
      inscriptos_total: params.inscriptos_varones + params.inscriptos_mujeres,
      is_active: true,
      sort_order: params.sort_order || this.courses.size + 1
    };
    this.courses.set(id, course);
    return course;
  }

  async updateCourse(courseId: string, updates: Partial<CreateCourseParams>): Promise<Course> {
    const course = this.courses.get(courseId);
    if (!course) throw new Error(`Curso no encontrado: ${courseId}`);

    if (updates.name !== undefined) course.name = updates.name;
    if (updates.year !== undefined) course.year = updates.year;
    if (updates.division !== undefined) course.division = updates.division;
    if (updates.cycle !== undefined) course.cycle = updates.cycle;
    if (updates.orientation !== undefined) course.orientation = updates.orientation;
    if (updates.inscriptos_varones !== undefined) course.inscriptos_varones = updates.inscriptos_varones;
    if (updates.inscriptos_mujeres !== undefined) course.inscriptos_mujeres = updates.inscriptos_mujeres;
    course.inscriptos_total = course.inscriptos_varones + course.inscriptos_mujeres;

    this.courses.set(courseId, course);
    return course;
  }

  async archiveCourse(courseId: string): Promise<Course> {
    const course = this.courses.get(courseId);
    if (!course) throw new Error(`Curso no encontrado: ${courseId}`);
    course.is_active = false;
    this.courses.set(courseId, course);
    return course;
  }

  async assignTeacherToCourse(courseId: string, teacherId: string, assignedBy: string): Promise<CourseAssignment> {
    const id = `assign-${teacherId}-${courseId}`;
    const assignment: CourseAssignment = {
      id,
      course_id: courseId,
      teacher_id: teacherId,
      assigned_by: assignedBy,
      created_at: new Date().toISOString()
    };
    this.courseAssignments.set(id, assignment);
    return assignment;
  }

  async getAssignedCourses(teacherId: string): Promise<Course[]> {
    const assignedIds = Array.from(this.courseAssignments.values())
      .filter(a => a.teacher_id === teacherId)
      .map(a => a.course_id);
    return Array.from(this.courses.values())
      .filter(c => assignedIds.includes(c.id) && c.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  async submitAttendance(actor: UserSession, params: SubmitAttendanceParams): Promise<AttendanceRecord> {
    // 1. Resolve Course
    let course: Course | null = null;
    if (params.course_id) {
      course = this.courses.get(params.course_id) || null;
    }
    if (!course && params.courseName) {
      course = await this.getCourseByName(params.courseName);
    }
    if (!course) {
      throw new Error(`Curso no encontrado: ${params.course_id || params.courseName}`);
    }

    // 2. RLS Security Checks
    if (actor.user.role === 'profesor') {
      const isAssigned = Array.from(this.courseAssignments.values()).some(
        a => a.course_id === course!.id && a.teacher_id === actor.user.id
      );
      if (!isAssigned) {
        throw new Error('403 Forbidden: Profesor no asignado a este curso');
      }

      // Past date locking for teachers
      const todayStr = new Date().toISOString().split('T')[0];
      if (params.date && params.date < todayStr) {
        throw new Error('403 Forbidden: Los profesores no pueden modificar registros de fechas anteriores');
      }
    }

    // Future date check
    const todayStr = new Date().toISOString().split('T')[0];
    if (params.date && params.date > todayStr) {
      throw new Error('No se puede registrar asistencia en fechas futuras');
    }

    // 3. PostgreSQL Trigger Emulation: Snapshot Baseline & Sum Validation
    const snapV = course.inscriptos_varones;
    const snapM = course.inscriptos_mujeres;
    const snapT = course.inscriptos_total;

    const pV = params.presentes_varones !== undefined ? params.presentes_varones : (params.presentes_v !== undefined ? params.presentes_v : 0);
    const pM = params.presentes_mujeres !== undefined ? params.presentes_mujeres : (params.presentes_m !== undefined ? params.presentes_m : 0);
    const aV = params.ausentes_varones !== undefined ? params.ausentes_varones : (params.ausentes_v !== undefined ? params.ausentes_v : 0);
    const aM = params.ausentes_mujeres !== undefined ? params.ausentes_mujeres : (params.ausentes_m !== undefined ? params.ausentes_m : 0);

    // Negative value check
    if (pV < 0 || pM < 0 || aV < 0 || aM < 0) {
      throw new Error('Validación fallida: Los valores no pueden ser negativos (check_violation 23514)');
    }

    // Non-integer check
    if (!Number.isInteger(pV) || !Number.isInteger(pM) || !Number.isInteger(aV) || !Number.isInteger(aM)) {
      throw new Error('Validación fallida: Los valores deben ser números enteros');
    }

    // Male Sum Validation (P_V + A_V = I_V)
    if (pV + aV !== snapV) {
      const deltaV = (pV + aV) - snapV;
      throw new Error(`Inconsistencia en Varones: Presentes (${pV}) + Ausentes (${aV}) <> Inscriptos (${snapV}) [Delta: ${deltaV > 0 ? '+' : ''}${deltaV}]`);
    }

    // Female Sum Validation (P_M + A_M = I_M)
    if (pM + aM !== snapM) {
      const deltaM = (pM + aM) - snapM;
      throw new Error(`Inconsistencia en Mujeres: Presentes (${pM}) + Ausentes (${aM}) <> Inscriptos (${snapM}) [Delta: ${deltaM > 0 ? '+' : ''}${deltaM}]`);
    }

    const key = `${params.date}_${course.id}`;
    const existing = this.attendanceRecords.get(key);

    const record: AttendanceRecord = {
      id: existing ? existing.id : `att-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      date: params.date,
      course_id: course.id,
      shift_id: course.shift_id,
      submitted_by: actor.user.id,
      inscriptos_varones_snapshot: snapV,
      inscriptos_mujeres_snapshot: snapM,
      inscriptos_total_snapshot: snapT,
      presentes_varones: pV,
      presentes_mujeres: pM,
      presentes_total: pV + pM,
      ausentes_varones: aV,
      ausentes_mujeres: aM,
      ausentes_total: aV + aM,
      observaciones: params.observaciones !== undefined ? params.observaciones : (existing?.observaciones || ''),
      is_locked: false,
      submitted_at: new Date().toISOString()
    };

    this.attendanceRecords.set(key, record);

    // Notify Realtime listeners
    for (const listener of this.realtimeListeners) {
      try {
        listener(record);
      } catch (err) {
        // Safe listener dispatch
      }
    }

    return record;
  }

  async getAttendanceRecord(courseId: string, date: string): Promise<AttendanceRecord | null> {
    const key = `${date}_${courseId}`;
    return this.attendanceRecords.get(key) || null;
  }

  async getShiftParteGeneral(date: string, shiftCode: ShiftCode): Promise<ShiftParteGeneralReport> {
    const shift = Array.from(this.shifts.values()).find(s => s.code === shiftCode);
    if (!shift) throw new Error(`Turno no encontrado: ${shiftCode}`);

    const courses = await this.getCourses(shift.id);
    const reportCourses: ShiftParteGeneralReport['courses'] = [];

    let totIV = 0;
    let totIM = 0;
    let totIT = 0;
    let totPV = 0;
    let totPM = 0;
    let totPT = 0;
    let totAV = 0;
    let totAM = 0;
    let totAT = 0;
    let submittedCount = 0;

    for (const c of courses) {
      const record = await this.getAttendanceRecord(c.id, date);
      const isSubmitted = record !== null;
      if (isSubmitted) submittedCount++;

      const inscriptosV = record ? record.inscriptos_varones_snapshot : c.inscriptos_varones;
      const inscriptosM = record ? record.inscriptos_mujeres_snapshot : c.inscriptos_mujeres;
      const inscriptosT = record ? record.inscriptos_total_snapshot : c.inscriptos_total;

      const presentesV = record ? record.presentes_varones : 0;
      const presentesM = record ? record.presentes_mujeres : 0;
      const presentesT = record ? record.presentes_total : 0;

      const ausentesV = record ? record.ausentes_varones : 0;
      const ausentesM = record ? record.ausentes_mujeres : 0;
      const ausentesT = record ? record.ausentes_total : 0;

      const pct = inscriptosT > 0 && isSubmitted ? Number(((presentesT / inscriptosT) * 100).toFixed(2)) : 0;

      totIV += inscriptosV;
      totIM += inscriptosM;
      totIT += inscriptosT;

      if (isSubmitted) {
        totPV += presentesV;
        totPM += presentesM;
        totPT += presentesT;
        totAV += ausentesV;
        totAM += ausentesM;
        totAT += ausentesT;
      }

      reportCourses.push({
        course_id: c.id,
        course_name: c.name,
        year: c.year,
        division: c.division,
        cycle: c.cycle,
        orientation: c.orientation,
        inscriptos_v: inscriptosV,
        inscriptos_m: inscriptosM,
        inscriptos_t: inscriptosT,
        presentes_v: presentesV,
        presentes_m: presentesM,
        presentes_t: presentesT,
        ausentes_v: ausentesV,
        ausentes_m: ausentesM,
        ausentes_t: ausentesT,
        porcentaje_asistencia: pct,
        observaciones: record?.observaciones || '',
        is_submitted: isSubmitted,
        is_locked: record?.is_locked || false
      });
    }

    const generalPct = totIT > 0 ? Number(((totPT / totIT) * 100).toFixed(2)) : 0;
    const absences = await this.getStaffAbsences(shift.id, date);

    return {
      date,
      shift_id: shift.id,
      shift_code: shift.code,
      shift_name: shift.name,
      courses: reportCourses,
      totals: {
        inscriptos_v: totIV,
        inscriptos_m: totIM,
        inscriptos_t: totIT,
        presentes_v: totPV,
        presentes_m: totPM,
        presentes_t: totPT,
        ausentes_v: totAV,
        ausentes_m: totAM,
        ausentes_t: totAT,
        porcentaje_asistencia_general: generalPct,
        total_courses_count: courses.length,
        submitted_courses_count: submittedCount
      },
      staff_absences: absences
    };
  }

  async getAttendanceTrends(params: TrendQueryParams): Promise<AttendanceTrendPoint[]> {
    const points: AttendanceTrendPoint[] = [];
    const dateStart = new Date(params.startDate);
    const dateEnd = new Date(params.endDate);

    for (let d = new Date(dateStart); d <= dateEnd; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const shiftsToQuery: ShiftCode[] = params.shiftCode ? [params.shiftCode] : ['manana', 'tarde', 'vespertino'];

      let dayPresentes = 0;
      let dayInscriptos = 0;

      for (const sc of shiftsToQuery) {
        const report = await this.getShiftParteGeneral(dateStr, sc);
        dayPresentes += report.totals.presentes_t;
        dayInscriptos += report.totals.inscriptos_t;
      }

      const pct = dayInscriptos > 0 ? Number(((dayPresentes / dayInscriptos) * 100).toFixed(2)) : 0;
      points.push({
        date: dateStr,
        shift_code: params.shiftCode,
        porcentaje_asistencia: pct,
        presentes_total: dayPresentes,
        inscriptos_total: dayInscriptos
      });
    }

    return points;
  }

  async recordStaffAbsence(actor: UserSession, params: CreateStaffAbsenceParams): Promise<StaffAbsence> {
    if (!params.staff_name || params.staff_name.trim() === '') {
      throw new Error('El nombre del personal es obligatorio');
    }

    let shiftId = params.shift_id;
    if (!shiftId && params.shift_code) {
      const s = Array.from(this.shifts.values()).find(x => x.code === params.shift_code);
      if (s) shiftId = s.id;
    }
    if (!shiftId) {
      const defaultShift = this.shifts.get('shift-tv') || Array.from(this.shifts.values())[0];
      shiftId = defaultShift.id;
    }

    const id = `staff-abs-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const absence: StaffAbsence = {
      id,
      date: params.date,
      shift_id: shiftId,
      staff_name: params.staff_name,
      role_type: params.role_type,
      subject_or_area: params.subject_or_area,
      reason: params.reason,
      observations: params.observations,
      created_by: actor.user.id
    };

    this.staffAbsences.set(id, absence);
    return absence;
  }

  async getStaffAbsences(shiftId: string, date: string): Promise<StaffAbsence[]> {
    const shift = Array.from(this.shifts.values()).find(s => s.id === shiftId || s.code === shiftId);
    const targetShiftId = shift ? shift.id : shiftId;

    return Array.from(this.staffAbsences.values()).filter(
      a => a.shift_id === targetShiftId && a.date === date
    );
  }

  async deleteStaffAbsence(absenceId: string): Promise<void> {
    this.staffAbsences.delete(absenceId);
  }

  async generateExcelExport(date: string, shiftCode: ShiftCode): Promise<Buffer> {
    const report = await this.getShiftParteGeneral(date, shiftCode);
    // Produce mock openxml/ZIP buffer with PK magic bytes and structured XML representation
    const fakeZipHeader = Buffer.from([0x50, 0x4B, 0x03, 0x04]); // PK\x03\x04
    const content = JSON.stringify({
      sheetName: `Parte General - ${report.shift_name}`,
      institution: 'ESCUELA DE EDUCACIÓN SECUNDARIA TÉCNICA N° 3 "Ntra. Sra. de la Merced"',
      date,
      shift: report.shift_name,
      rows: report.courses,
      totals: report.totals,
      formulas: {
        inscriptos_v: '=SUM(C7:C16)',
        inscriptos_m: '=SUM(D7:D16)',
        inscriptos_t: '=SUM(E7:E16)',
        presentes_t: '=SUM(H7:H16)',
        ausentes_t: '=SUM(K7:K16)'
      },
      absentStaff: report.staff_absences
    });
    return Buffer.concat([fakeZipHeader, Buffer.from(content, 'utf-8')]);
  }

  async generatePdfExport(date: string, shiftCode: ShiftCode): Promise<Buffer> {
    const report = await this.getShiftParteGeneral(date, shiftCode);
    const pdfHeader = Buffer.from('%PDF-1.4\n');
    const pdfFooter = Buffer.from('\n%%EOF\n');
    const content = `
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length ${500 + report.courses.length * 100} >>
stream
BT
/F1 12 Tf
50 800 Td (ESCUELA DE EDUCACIÓN SECUNDARIA TÉCNICA N° 3) Tj
0 -20 Td ("Ntra. Sra. de la Merced") Tj
0 -20 Td (PARTE GENERAL - ALUMNOS) Tj
0 -20 Td (LOMA HERMOSA, ${date} - ${report.shift_name}) Tj
${report.courses.map(c => `0 -15 Td (${c.course_name} | ${c.orientation || '-'} | Inscr: ${c.inscriptos_v}/${c.inscriptos_m}/${c.inscriptos_t} | Pres: ${c.presentes_v}/${c.presentes_m}/${c.presentes_t} | Aus: ${c.ausentes_v}/${c.ausentes_m}/${c.ausentes_t}) Tj`).join('\n')}
0 -20 Td (TOTAL: Inscriptos: ${report.totals.inscriptos_v}V, ${report.totals.inscriptos_m}M, ${report.totals.inscriptos_t}T | Presentes: ${report.totals.presentes_t} | Ausentes: ${report.totals.ausentes_t}) Tj
0 -30 Td (OBSERVACIONES:) Tj
0 -30 Td (AUSENTE DE DOCENTES Y AUXILIARES:) Tj
0 -40 Td (Firma Preceptor: ____________________   Firma Directivo: ____________________) Tj
ET
endstream
endobj
`;
    return Buffer.concat([pdfHeader, Buffer.from(content, 'utf-8'), pdfFooter]);
  }

  subscribeToAttendance(callback: (record: AttendanceRecord) => void): () => void {
    this.realtimeListeners.push(callback);
    return () => {
      this.realtimeListeners = this.realtimeListeners.filter(l => l !== callback);
    };
  }
}
