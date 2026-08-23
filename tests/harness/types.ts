export type AppRole = 'administrador' | 'preceptor' | 'profesor';
export type ShiftCode = 'manana' | 'tarde' | 'vespertino';
export type CycleType = 'basico' | 'superior' | 'tecnico_especial';
export type OrientationType = 'TECQU' | 'TECMM' | 'TECET' | 'C.TEC.MMO' | null;

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  dni?: string;
  is_active: boolean;
}

export interface UserSession {
  user: UserProfile;
  token: string;
}

export interface Shift {
  id: string;
  code: ShiftCode;
  name: string;
  start_time: string;
  end_time: string;
  sort_order: number;
}

export interface Course {
  id: string;
  shift_id: string;
  name: string;
  year: number;
  division: number;
  cycle: CycleType;
  orientation: OrientationType;
  inscriptos_varones: number;
  inscriptos_mujeres: number;
  inscriptos_total: number;
  is_active: boolean;
  sort_order: number;
}

export interface CourseAssignment {
  id: string;
  course_id: string;
  teacher_id: string;
  assigned_by: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  course_id: string;
  shift_id: string;
  submitted_by: string;
  inscriptos_varones_snapshot: number;
  inscriptos_mujeres_snapshot: number;
  inscriptos_total_snapshot: number;
  presentes_varones: number;
  presentes_mujeres: number;
  presentes_total: number;
  ausentes_varones: number;
  ausentes_mujeres: number;
  ausentes_total: number;
  observaciones?: string;
  is_locked: boolean;
  submitted_at: string;
}

export interface StaffAbsence {
  id: string;
  date: string;
  shift_id: string;
  staff_name: string;
  role_type: string; // 'Docente' | 'Auxiliar'
  subject_or_area?: string;
  reason?: string;
  observations?: string;
  created_by: string;
}

export interface ShiftParteGeneralReport {
  date: string;
  shift_id: string;
  shift_code: ShiftCode;
  shift_name: string;
  courses: Array<{
    course_id: string;
    course_name: string;
    year: number;
    division: number;
    cycle: CycleType;
    orientation: string | null;
    inscriptos_v: number;
    inscriptos_m: number;
    inscriptos_t: number;
    presentes_v: number;
    presentes_m: number;
    presentes_t: number;
    ausentes_v: number;
    ausentes_m: number;
    ausentes_t: number;
    porcentaje_asistencia: number;
    observaciones: string;
    is_submitted: boolean;
    is_locked: boolean;
  }>;
  totals: {
    inscriptos_v: number;
    inscriptos_m: number;
    inscriptos_t: number;
    presentes_v: number;
    presentes_m: number;
    presentes_t: number;
    ausentes_v: number;
    ausentes_m: number;
    ausentes_t: number;
    porcentaje_asistencia_general: number;
    total_courses_count: number;
    submitted_courses_count: number;
  };
  staff_absences: StaffAbsence[];
}

export interface AttendanceTrendPoint {
  date: string;
  shift_code?: ShiftCode;
  course_name?: string;
  porcentaje_asistencia: number;
  presentes_total: number;
  inscriptos_total: number;
}

export interface CreateUserParams {
  email: string;
  password?: string;
  full_name: string;
  role: AppRole;
  dni?: string;
}

export interface CreateCourseParams {
  shift_id: string;
  name: string;
  year: number;
  division: number;
  cycle: CycleType;
  orientation: OrientationType;
  inscriptos_varones: number;
  inscriptos_mujeres: number;
  sort_order?: number;
}

export interface SubmitAttendanceParams {
  course_id?: string;
  courseName?: string;
  date: string;
  presentes_varones?: number;
  presentes_v?: number;
  presentes_mujeres?: number;
  presentes_m?: number;
  ausentes_varones?: number;
  ausentes_v?: number;
  ausentes_mujeres?: number;
  ausentes_m?: number;
  observaciones?: string;
}

export interface CreateStaffAbsenceParams {
  shift_id?: string;
  shift_code?: ShiftCode;
  date: string;
  staff_name: string;
  role_type: string;
  subject_or_area?: string;
  reason?: string;
  observations?: string;
}

export interface TrendQueryParams {
  startDate: string;
  endDate: string;
  shiftCode?: ShiftCode;
  courseId?: string;
}

export interface ITestAdapter {
  name: 'mock' | 'supabase';
  initialize(): Promise<void>;
  resetDatabase(): Promise<void>;
  seedInitialData(): Promise<void>;

  // Authentication & Profiles
  authenticate(email: string, role?: AppRole): Promise<UserSession>;
  createUser(user: CreateUserParams): Promise<UserProfile>;
  getUserProfile(userId: string): Promise<UserProfile | null>;
  listUsers(): Promise<UserProfile[]>;
  updateUserRole(userId: string, newRole: AppRole): Promise<UserProfile>;
  deactivateUser(userId: string): Promise<UserProfile>;

  // Courses & Shifts
  getShifts(): Promise<Shift[]>;
  getCourses(shiftId?: string): Promise<Course[]>;
  getCourseById(courseId: string): Promise<Course | null>;
  getCourseByName(courseName: string): Promise<Course | null>;
  createCourse(course: CreateCourseParams): Promise<Course>;
  updateCourse(courseId: string, updates: Partial<CreateCourseParams>): Promise<Course>;
  archiveCourse(courseId: string): Promise<Course>;
  assignTeacherToCourse(courseId: string, teacherId: string, assignedBy: string): Promise<CourseAssignment>;
  getAssignedCourses(teacherId: string): Promise<Course[]>;

  // Attendance Records
  submitAttendance(actor: UserSession, params: SubmitAttendanceParams): Promise<AttendanceRecord>;
  getAttendanceRecord(courseId: string, date: string): Promise<AttendanceRecord | null>;
  getShiftParteGeneral(date: string, shiftCode: ShiftCode): Promise<ShiftParteGeneralReport>;
  getAttendanceTrends(params: TrendQueryParams): Promise<AttendanceTrendPoint[]>;

  // Staff Absences
  recordStaffAbsence(actor: UserSession, params: CreateStaffAbsenceParams): Promise<StaffAbsence>;
  getStaffAbsences(shiftId: string, date: string): Promise<StaffAbsence[]>;
  deleteStaffAbsence(absenceId: string): Promise<void>;

  // Exports
  generateExcelExport(date: string, shiftCode: ShiftCode): Promise<Buffer | Uint8Array>;
  generatePdfExport(date: string, shiftCode: ShiftCode): Promise<Buffer | Uint8Array>;

  // Realtime Subscriptions
  subscribeToAttendance(callback: (record: AttendanceRecord) => void): () => void;
}
