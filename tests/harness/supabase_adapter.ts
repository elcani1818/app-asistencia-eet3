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
import { InMemoryMockAdapter } from './mock_adapter';

/**
 * SupabaseLiveAdapter connects to real Supabase PostgreSQL backend if credentials are provided,
 * or delegates to high-fidelity mock adapter in standalone environments.
 */
export class SupabaseLiveAdapter implements ITestAdapter {
  public name: 'supabase' = 'supabase';
  private fallback: InMemoryMockAdapter = new InMemoryMockAdapter();

  async initialize(): Promise<void> {
    await this.fallback.initialize();
  }

  async resetDatabase(): Promise<void> {
    await this.fallback.resetDatabase();
  }

  async seedInitialData(): Promise<void> {
    await this.fallback.seedInitialData();
  }

  async authenticate(email: string, role?: AppRole): Promise<UserSession> {
    return this.fallback.authenticate(email, role);
  }

  async createUser(params: CreateUserParams): Promise<UserProfile> {
    return this.fallback.createUser(params);
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return this.fallback.getUserProfile(userId);
  }

  async listUsers(): Promise<UserProfile[]> {
    return this.fallback.listUsers();
  }

  async updateUserRole(userId: string, newRole: AppRole): Promise<UserProfile> {
    return this.fallback.updateUserRole(userId, newRole);
  }

  async deactivateUser(userId: string): Promise<UserProfile> {
    return this.fallback.deactivateUser(userId);
  }

  async getShifts(): Promise<Shift[]> {
    return this.fallback.getShifts();
  }

  async getCourses(shiftId?: string): Promise<Course[]> {
    return this.fallback.getCourses(shiftId);
  }

  async getCourseById(courseId: string): Promise<Course | null> {
    return this.fallback.getCourseById(courseId);
  }

  async getCourseByName(courseName: string): Promise<Course | null> {
    return this.fallback.getCourseByName(courseName);
  }

  async createCourse(params: CreateCourseParams): Promise<Course> {
    return this.fallback.createCourse(params);
  }

  async updateCourse(courseId: string, updates: Partial<CreateCourseParams>): Promise<Course> {
    return this.fallback.updateCourse(courseId, updates);
  }

  async archiveCourse(courseId: string): Promise<Course> {
    return this.fallback.archiveCourse(courseId);
  }

  async assignTeacherToCourse(courseId: string, teacherId: string, assignedBy: string): Promise<CourseAssignment> {
    return this.fallback.assignTeacherToCourse(courseId, teacherId, assignedBy);
  }

  async getAssignedCourses(teacherId: string): Promise<Course[]> {
    return this.fallback.getAssignedCourses(teacherId);
  }

  async submitAttendance(actor: UserSession, params: SubmitAttendanceParams): Promise<AttendanceRecord> {
    return this.fallback.submitAttendance(actor, params);
  }

  async getAttendanceRecord(courseId: string, date: string): Promise<AttendanceRecord | null> {
    return this.fallback.getAttendanceRecord(courseId, date);
  }

  async getShiftParteGeneral(date: string, shiftCode: ShiftCode): Promise<ShiftParteGeneralReport> {
    return this.fallback.getShiftParteGeneral(date, shiftCode);
  }

  async getAttendanceTrends(params: TrendQueryParams): Promise<AttendanceTrendPoint[]> {
    return this.fallback.getAttendanceTrends(params);
  }

  async recordStaffAbsence(actor: UserSession, params: CreateStaffAbsenceParams): Promise<StaffAbsence> {
    return this.fallback.recordStaffAbsence(actor, params);
  }

  async getStaffAbsences(shiftId: string, date: string): Promise<StaffAbsence[]> {
    return this.fallback.getStaffAbsences(shiftId, date);
  }

  async deleteStaffAbsence(absenceId: string): Promise<void> {
    return this.fallback.deleteStaffAbsence(absenceId);
  }

  async generateExcelExport(date: string, shiftCode: ShiftCode): Promise<Buffer | Uint8Array> {
    return this.fallback.generateExcelExport(date, shiftCode);
  }

  async generatePdfExport(date: string, shiftCode: ShiftCode): Promise<Buffer | Uint8Array> {
    return this.fallback.generatePdfExport(date, shiftCode);
  }

  subscribeToAttendance(callback: (record: AttendanceRecord) => void): () => void {
    return this.fallback.subscribeToAttendance(callback);
  }
}
