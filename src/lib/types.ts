export interface Shift {
  id: string;
  name: 'Mañana' | 'Tarde' | 'Vespertino';
  display_order: number;
}

export interface Orientation {
  id: string;
  code: 'TECQU' | 'TECMM' | 'TECET' | 'C.TEC.MMO' | 'CB';
  full_name: string;
}

export interface Course {
  id: string;
  year: number;
  division: number;
  display_name: string;
  shift_id: string;
  orientation_id: string;
  inscriptos_v: number;
  inscriptos_m: number;
  inscriptos_t: number;
  cycle: 'basico' | 'superior' | 'tecnico';
  is_active: boolean;
  orientations?: Orientation;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'preceptor' | 'profesor';
  is_active: boolean;
}

export interface ProfessorCourse {
  id: string;
  professor_id: string;
  course_id: string;
}

export interface AttendanceRecord {
  id: string;
  course_id: string;
  record_date: string;
  presentes_v: number;
  presentes_m: number;
  presentes_t: number;
  ausentes_v: number;
  ausentes_m: number;
  ausentes_t: number;
  observaciones: string;
  ausencia_docentes: string;
  submitted_by: string;
  created_at?: string;
  updated_at?: string;
}
