# Technical Analysis & Architecture Specification: Milestone 3 Data Layer, Services, and Custom Hooks

**Project:** Escuela de Educación Secundaria Técnica N° 3 "Ntra. Sra. de la Merced" (Loma Hermosa)  
**System:** Parte General Digital de Alumnos  
**Module:** Milestone 3 (M3: Teacher & Preceptor Daily Attendance Entry Module)  
**Author:** Explorer 2 (sub_orch_m3_explorer_2)  
**Date:** 2026-08-20  

---

## 1. Executive Summary & Architectural Overview

Milestone 3 delivers the operational core of the attendance workflow: the daily entry, real-time validation, and persistence of dual-gender student attendance ($P_V, P_M, A_V, A_M$) and staff inattendance records (*Ausencias de Docentes y Auxiliares*).

The data layer and state architecture designed here bridges the frontend UI components (to be implemented by the UI Worker) with the PostgreSQL 15+ database engine (established in M1) and the authentication context (M2).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             REACT UI LAYER (M3)                             │
│  [CourseSelector]  [CourseHeaderCard]  [AttendanceForm]  [StaffAbsenceModal] │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Consumer of
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CUSTOM HOOK: src/hooks/useAttendance.ts                  │
│  - Unified State Machine (selectedCourse, date, formCounts, isDirty, flags) │
│  - Live Validation & Parity Math (P_V + A_V = I_V, P_M + A_M = I_M)        │
│  - Action Dispatchers (setPresente, setAusente, quickFill, saveAttendance)  │
│  - Optimistic UI updates with automatic rollback on server error            │
│  - Role & Date Lockout Evaluator (Profesor past-date read-only guard)       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Invokes
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 DATA SERVICE: src/services/attendanceService.ts             │
│  - getCoursesForUser(user) -> Filtered course catalog by RBAC               │
│  - getAttendanceByCourseAndDate(courseId, date) -> AttendanceRecord | null  │
│  - upsertAttendance(recordInput) -> Atomic DB upsert via Supabase           │
│  - getStaffAbsencesByShiftAndDate(shift, date) -> StaffAbsence[]            │
│  - createStaffAbsence(absenceInput) -> StaffAbsence                         │
│  - deleteStaffAbsence(absenceId) -> void                                    │
│  - Database Exception Parser (Trigger errors, RLS violations, Date lock)    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Supabase JS Client (src/lib/supabase)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     POSTGRESQL 15+ SUPABASE DATABASE (M1)                   │
│  - public.courses / public.course_assignments / public.shifts               │
│  - public.attendance_records (with trg_validate_attendance_math & date_lock)│
│  - public.staff_absences / public.attendance_audit_logs                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. TypeScript Types & Domain Model Enhancements (`src/types/`)

### 2.1 Existing Type Assessment
- `src/types/index.ts` already contains core types: `User`, `Role`, `Shift`, `Course`, `AttendanceRecord`, `StaffAbsence`, `ShiftSummary`, `ValidationResult`.
- `src/types/database.ts` contains raw Supabase schema definitions matching PostgreSQL tables: `attendance_records`, `staff_absences`, `courses`, `course_assignments`, `profiles`, `shifts`.

### 2.2 New Types & Interfaces for M3 Attendance Workflow
To ensure strict type-safety, clean separation of raw inputs vs validated domain models, and developer ergonomics, the following interfaces are specified for `src/types/index.ts` and `src/types/attendance.ts`:

```typescript
// ============================================================================
// ATTENDANCE WORKFLOW TYPES (Milestone 3)
// ============================================================================

import { Course, CycleType, OrientationType, ShiftCode } from './index';

/**
 * Controlled form input state for the attendance entry form.
 * Supports empty string '' during active user typing before conversion to number.
 */
export interface AttendanceFormData {
  presentes_varones: number | '';
  presentes_mujeres: number | '';
  ausentes_varones: number | '';
  ausentes_mujeres: number | '';
  observaciones: string;
}

/**
 * Quick-fill action types for accelerated teacher entry.
 */
export type QuickFillType = 
  | 'todos_presentes'       // P_V = I_V, P_M = I_M, A_V = 0, A_M = 0
  | 'todos_ausentes'        // P_V = 0, P_M = 0, A_V = I_V, A_M = I_M
  | 'autocompletar_ausentes'// A_V = max(0, I_V - P_V), A_M = max(0, I_M - P_M)
  | 'reset';                // Resets to initial baseline or zeros

/**
 * Live validation state computed on every keystroke.
 */
export interface AttendanceValidationState {
  isValid: boolean;
  varonesValid: boolean;
  mujeresValid: boolean;
  totalValid: boolean;
  varonesDisparity: number; // (P_V + A_V) - I_V  (negative = missing, positive = excess)
  mujeresDisparity: number; // (P_M + A_M) - I_M
  totalDisparity: number;   // (P_T + A_T) - I_T
  disparityMessages: string[];
  errorMessage?: string;
  presentesTotal: number;
  ausentesTotal: number;
  inscriptosTotal: number;
  porcentajeAsistencia: number;
}

/**
 * Normalized input payload for upserting an attendance record.
 */
export interface AttendanceRecordInput {
  id?: string;
  course_id: string;
  shift_id?: string;
  date: string; // YYYY-MM-DD
  presentes_varones: number;
  presentes_mujeres: number;
  ausentes_varones: number;
  ausentes_mujeres: number;
  snapshot_inscriptos_v?: number;
  snapshot_inscriptos_m?: number;
  observaciones?: string;
  observations?: string;
  submitted_by?: string;
  is_locked?: boolean;
}

/**
 * Normalized input payload for creating a staff absence.
 */
export interface StaffAbsenceInput {
  shift_id: string;
  date: string; // YYYY-MM-DD
  staff_name: string;
  role_type: 'Docente' | 'Auxiliar' | string;
  role?: string;
  subject_or_area?: string;
  course_id?: string | null;
  reason?: string;
  is_justified?: boolean;
  observations?: string;
  created_by?: string;
}

/**
 * Complete course option with formatted display string for dropdowns.
 */
export interface CourseSelectOption {
  value: string;
  label: string;
  course: Course;
  isAssignedToUser: boolean;
  hasSubmissionToday?: boolean;
}

/**
 * Full Return Contract for the useAttendance Hook.
 */
export interface UseAttendanceReturn {
  // Course State
  selectedCourse: Course | null;
  selectedCourseId: string;
  availableCourses: Course[];
  setSelectedCourseId: (courseId: string) => void;

  // Date State & Locks
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
  isToday: boolean;
  isPastDate: boolean;
  isFutureDate: boolean;
  isReadOnly: boolean; // True if past date & user is profesor

  // Form State
  formData: AttendanceFormData;
  existingRecord: AttendanceRecord | null;
  isSubmitted: boolean;
  isDirty: boolean;

  // Real-time Calculated Metrics & Validation
  validation: AttendanceValidationState;

  // Action Dispatchers
  setPresenteV: (value: number | string) => void;
  setPresenteM: (value: number | string) => void;
  setAusenteV: (value: number | string) => void;
  setAusenteM: (value: number | string) => void;
  setObservaciones: (value: string) => void;
  applyQuickFill: (type: QuickFillType) => void;
  saveAttendance: () => Promise<boolean>;

  // Staff Absences Sub-Module
  staffAbsences: StaffAbsence[];
  addStaffAbsence: (absence: StaffAbsenceInput) => Promise<boolean>;
  removeStaffAbsence: (absenceId: string) => Promise<boolean>;

  // Async Lifecycle Flags & Feedback
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  successMessage: string | null;
  clearFeedback: () => void;
  reload: () => Promise<void>;
}
```

---

## 3. Data Service Specification: `src/services/attendanceService.ts`

`attendanceService.ts` encapsulates all direct interactions with the Supabase client (`src/lib/supabase.ts`), enforcing authorization boundaries, input sanitization, and database error translation.

### 3.1 Service Method Architecture

```typescript
/**
 * ============================================================================
 * ATTENDANCE & STAFF ABSENCE DATA SERVICE
 * Location: src/services/attendanceService.ts
 * ============================================================================
 */

import { supabase } from '../lib/supabase';
import { 
  Course, 
  AttendanceRecord, 
  StaffAbsence, 
  User, 
  AttendanceRecordInput, 
  StaffAbsenceInput 
} from '../types';
import { validateAttendanceRow } from '../utils/calculations';
import { getTodayString } from '../utils/formatters';

export const attendanceService = {
  /**
   * 1. Fetches courses accessible by the active user based on RBAC:
   *  - 'administrador': All active courses across all shifts.
   *  - 'preceptor': All active courses in preceptor's shift (or all active courses if shift_id is null).
   *  - 'profesor': Only courses actively assigned to this teacher in public.course_assignments.
   */
  async getCoursesForUser(user: User): Promise<Course[]> {
    if (!user || !user.id) return [];

    try {
      if (user.role === 'administrador') {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('is_active', true)
          .order('shift_id', { ascending: true })
          .order('sort_order', { ascending: true })
          .order('year', { ascending: true })
          .order('division', { ascending: true });

        if (error) throw error;
        return (data as Course[]) || [];
      }

      if (user.role === 'preceptor') {
        let query = supabase
          .from('courses')
          .select('*')
          .eq('is_active', true);

        if (user.shift_id) {
          query = query.eq('shift_id', user.shift_id);
        }

        const { data, error } = await query
          .order('sort_order', { ascending: true })
          .order('year', { ascending: true })
          .order('division', { ascending: true });

        if (error) throw error;
        return (data as Course[]) || [];
      }

      // Role: 'profesor'
      // Query courses assigned via course_assignments table
      const { data: assignments, error: assignError } = await supabase
        .from('course_assignments')
        .select('course_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (assignError) throw assignError;

      const courseIds = (assignments || []).map((a) => a.course_id);

      // Support fallback for demo user accounts or cached assignments
      if (courseIds.length === 0 && user.assigned_courses && user.assigned_courses.length > 0) {
        // Attempt query by IDs or names
        const { data: fallbackCourses, error: fallbackError } = await supabase
          .from('courses')
          .select('*')
          .eq('is_active', true)
          .in('id', user.assigned_courses);

        if (!fallbackError && fallbackCourses && fallbackCourses.length > 0) {
          return fallbackCourses as Course[];
        }
      }

      if (courseIds.length === 0) {
        return [];
      }

      const { data: assignedCourses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .in('id', courseIds)
        .order('sort_order', { ascending: true })
        .order('year', { ascending: true })
        .order('division', { ascending: true });

      if (coursesError) throw coursesError;
      return (assignedCourses as Course[]) || [];
    } catch (err: any) {
      console.error('[attendanceService.getCoursesForUser] Error:', err);
      throw new Error(`Error al cargar los cursos asignados: ${err.message || err}`);
    }
  },

  /**
   * 2. Retrieves the attendance submission for a specific course and date.
   * Returns null if not yet submitted.
   */
  async getAttendanceByCourseAndDate(
    courseId: string, 
    date: string
  ): Promise<AttendanceRecord | null> {
    if (!courseId || !date) return null;

    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          submitted_by_profile:profiles!attendance_records_submitted_by_fkey(id, full_name, email)
        `)
        .eq('course_id', courseId)
        .eq('date', date)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Normalize return object
      return {
        id: data.id,
        date: data.date,
        course_id: data.course_id,
        shift_id: data.shift_id,
        submitted_by: data.submitted_by || '',
        inscriptos_varones_snapshot: data.snapshot_inscriptos_v,
        inscriptos_mujeres_snapshot: data.snapshot_inscriptos_m,
        inscriptos_total_snapshot: data.snapshot_inscriptos_total || (data.snapshot_inscriptos_v + data.snapshot_inscriptos_m),
        presentes_varones: data.presentes_varones,
        presentes_mujeres: data.presentes_mujeres,
        presentes_total: data.total_presentes || (data.presentes_varones + data.presentes_mujeres),
        ausentes_varones: data.ausentes_varones,
        ausentes_mujeres: data.ausentes_mujeres,
        ausentes_total: data.total_ausentes || (data.ausentes_varones + data.ausentes_mujeres),
        observaciones: data.observations || '',
        is_locked: data.is_locked ?? false,
        submitted_at: data.submitted_at || data.created_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (err: any) {
      console.error('[attendanceService.getAttendanceByCourseAndDate] Error:', err);
      throw new Error(`Error al consultar el parte de asistencia: ${err.message || err}`);
    }
  },

  /**
   * 3. Persists (Insert or Update) daily attendance with mathematical validation.
   * Handles database triggers (trg_validate_attendance_math & trg_date_lock_attendance).
   */
  async upsertAttendance(
    input: AttendanceRecordInput,
    user: User
  ): Promise<AttendanceRecord> {
    if (!input.course_id) throw new Error('El ID de curso es obligatorio.');
    if (!input.date) throw new Error('La fecha del parte es obligatoria.');

    // 1. Fetch course details to verify enrollment snapshot & shift
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', input.course_id)
      .single();

    if (courseError || !course) {
      throw new Error(`Curso no encontrado (ID: ${input.course_id}).`);
    }

    const iv = input.snapshot_inscriptos_v ?? course.inscriptos_varones;
    const im = input.snapshot_inscriptos_m ?? course.inscriptos_mujeres;
    const pv = Number(input.presentes_varones) || 0;
    const pm = Number(input.presentes_mujeres) || 0;
    const av = Number(input.ausentes_varones) || 0;
    const am = Number(input.ausentes_mujeres) || 0;

    // 2. Client-side Pre-Validation (Matching DB Trigger)
    const valResult = validateAttendanceRow(iv, im, pv, pm, av, am);
    if (!valResult.isValid) {
      throw new Error(valResult.errorMessage || 'Error de validación: Presentes + Ausentes ≠ Inscriptos');
    }

    // 3. Date check for teachers
    const today = getTodayString();
    if (user.role === 'profesor' && input.date < today) {
      throw new Error('Bloqueo de Fecha: No se permite modificar partes de asistencia de fechas anteriores.');
    }
    if (input.date > today) {
      throw new Error('No se permite registrar partes de asistencia en fechas futuras.');
    }

    const shiftId = input.shift_id || course.shift_id;
    const notes = input.observaciones ?? input.observations ?? '';

    // 4. Perform Supabase Upsert
    const { data, error } = await supabase
      .from('attendance_records')
      .upsert(
        {
          course_id: input.course_id,
          shift_id: shiftId,
          date: input.date,
          presentes_varones: pv,
          presentes_mujeres: pm,
          ausentes_varones: av,
          ausentes_mujeres: am,
          snapshot_inscriptos_v: iv,
          snapshot_inscriptos_m: im,
          observations: notes,
          submitted_by: user.id,
          status: 'presente',
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'course_id,date'
        }
      )
      .select()
      .single();

    if (error) {
      // Parse PostgreSQL Trigger Error Messages
      if (error.message.includes('Inconsistencia en Varones') || error.message.includes('Inconsistencia en Mujeres')) {
        throw new Error(`Inconsistencia en matrícula: ${error.message}`);
      }
      if (error.message.includes('Bloqueo de Fecha')) {
        throw new Error('Bloqueo de Fecha: El registro histórico está bloqueado contra modificaciones.');
      }
      if (error.code === '42501' || error.message.includes('permission denied') || error.message.includes('violates row-level security')) {
        throw new Error('403 Forbidden: No tiene autorización para registrar asistencia en este curso o fecha.');
      }
      throw error;
    }

    return {
      id: data.id,
      date: data.date,
      course_id: data.course_id,
      shift_id: data.shift_id,
      submitted_by: data.submitted_by || user.id,
      inscriptos_varones_snapshot: data.snapshot_inscriptos_v,
      inscriptos_mujeres_snapshot: data.snapshot_inscriptos_m,
      inscriptos_total_snapshot: data.snapshot_inscriptos_total,
      presentes_varones: data.presentes_varones,
      presentes_mujeres: data.presentes_mujeres,
      presentes_total: data.total_presentes,
      ausentes_varones: data.ausentes_varones,
      ausentes_mujeres: data.ausentes_mujeres,
      ausentes_total: data.total_ausentes,
      observaciones: data.observations || '',
      is_locked: data.is_locked,
      submitted_at: data.submitted_at || data.updated_at,
    };
  },

  /**
   * 4. Fetches logged staff absences for a given shift and date.
   */
  async getStaffAbsencesByShiftAndDate(
    shiftIdOrCode: string,
    date: string
  ): Promise<StaffAbsence[]> {
    if (!shiftIdOrCode || !date) return [];

    try {
      let resolvedShiftId = shiftIdOrCode;

      // If code provided ('vespertino', 'manana', 'tarde'), resolve UUID
      if (['manana', 'tarde', 'vespertino', 'shift-tm', 'shift-tt', 'shift-tv'].includes(shiftIdOrCode)) {
        const cleanCode = shiftIdOrCode.replace('shift-', '').replace('tv', 'vespertino').replace('tm', 'manana').replace('tt', 'tarde');
        const { data: shiftData } = await supabase
          .from('shifts')
          .select('id')
          .eq('code', cleanCode as any)
          .maybeSingle();

        if (shiftData) resolvedShiftId = shiftData.id;
      }

      const { data, error } = await supabase
        .from('staff_absences')
        .select(`
          *,
          courses(id, name),
          profiles:created_by(id, full_name)
        `)
        .eq('shift_id', resolvedShiftId)
        .eq('date', date)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return ((data || []) as any[]).map((row) => ({
        id: row.id,
        date: row.date,
        shift_id: row.shift_id,
        staff_name: row.staff_name,
        role_type: row.role, // Map DB column 'role' to UI 'role_type'
        subject_or_area: row.subject_or_area || '',
        course_id: row.course_id || null,
        course_name: row.courses?.name || null,
        reason: row.reason || '',
        is_justified: row.is_justified ?? false,
        observations: row.observations || '',
        created_by: row.created_by,
        created_by_name: row.profiles?.full_name || null,
        created_at: row.created_at,
      }));
    } catch (err: any) {
      console.error('[attendanceService.getStaffAbsencesByShiftAndDate] Error:', err);
      throw new Error(`Error al consultar inasistencias de personal: ${err.message || err}`);
    }
  },

  /**
   * 5. Creates a new staff absence entry.
   */
  async createStaffAbsence(
    input: StaffAbsenceInput,
    user: User
  ): Promise<StaffAbsence> {
    if (!input.staff_name || !input.staff_name.trim()) {
      throw new Error('El nombre del docente o auxiliar es obligatorio.');
    }
    if (!input.date) {
      throw new Error('La fecha de inasistencia es obligatoria.');
    }
    const roleValue = input.role_type || input.role;
    if (!roleValue || !roleValue.trim()) {
      throw new Error('El rol (Docente / Auxiliar) es obligatorio.');
    }

    try {
      const { data, error } = await supabase
        .from('staff_absences')
        .insert({
          shift_id: input.shift_id,
          date: input.date,
          staff_name: input.staff_name.trim(),
          role: roleValue.trim(),
          subject_or_area: input.subject_or_area?.trim() || null,
          course_id: input.course_id || null,
          reason: input.reason?.trim() || null,
          is_justified: input.is_justified ?? false,
          observations: input.observations?.trim() || null,
          created_by: user.id
        })
        .select(`
          *,
          courses(id, name),
          profiles:created_by(id, full_name)
        `)
        .single();

      if (error) {
        if (error.code === '42501' || error.message.includes('permission denied')) {
          throw new Error('403 Forbidden: Solo preceptores y directivos pueden registrar inasistencias de personal.');
        }
        throw error;
      }

      return {
        id: data.id,
        date: data.date,
        shift_id: data.shift_id,
        staff_name: data.staff_name,
        role_type: data.role,
        subject_or_area: data.subject_or_area || '',
        course_id: data.course_id || null,
        course_name: (data as any).courses?.name || null,
        reason: data.reason || '',
        is_justified: data.is_justified ?? false,
        observations: data.observations || '',
        created_by: data.created_by,
        created_by_name: (data as any).profiles?.full_name || user.full_name,
        created_at: data.created_at,
      };
    } catch (err: any) {
      console.error('[attendanceService.createStaffAbsence] Error:', err);
      throw new Error(`Error al registrar inasistencia de personal: ${err.message || err}`);
    }
  },

  /**
   * 6. Deletes a staff absence entry by ID.
   */
  async deleteStaffAbsence(absenceId: string): Promise<void> {
    if (!absenceId) throw new Error('El ID de inasistencia es obligatorio.');

    try {
      const { error } = await supabase
        .from('staff_absences')
        .delete()
        .eq('id', absenceId);

      if (error) {
        if (error.code === '42501' || error.message.includes('permission denied')) {
          throw new Error('403 Forbidden: No tiene permisos para eliminar registros de inasistencias.');
        }
        throw error;
      }
    } catch (err: any) {
      console.error('[attendanceService.deleteStaffAbsence] Error:', err);
      throw new Error(`Error al eliminar inasistencia: ${err.message || err}`);
    }
  },
};
```

---

## 4. Custom React Hook Specification: `src/hooks/useAttendance.ts`

`useAttendance` is the central orchestration hook for the Milestone 3 attendance entry view. It manages reactive form input state, real-time parity calculations, historical lock policies, server persistence, and optimistic state synchronization.

### 4.1 State Machine Lifecycle & Transitions

```
                    ┌─────────────────────────┐
                    │    INITIALIZE HOOK      │
                    │  (Fetch user courses)   │
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │     SELECT COURSE       │
                    │   (Default to 1st)      │
                    └───────────┬─────────────┘
                                │
                                ▼
         ┌─────────────────────────────────────────────────┐
         │ FETCH ATTENDANCE & ABSENCES (courseId, date)   │
         │ - If existing record: populate formData         │
         │ - If none: formData = 0s or empty, isDirty = false
         └──────────────────────┬──────────────────────────┘
                                │
                                ▼
         ┌─────────────────────────────────────────────────┐
         │               ACTIVE EDITING LOOP               │
         │  - User edits P_V, P_M, A_V, A_M, Observaciones │
         │  - User triggers Quick-Fill action              │
         │  - computeLiveValidation() on each state change │
         │  - isDirty = true                               │
         └──────────────────────┬──────────────────────────┘
                                │
                   User clicks "Guardar Parte"
                                │
                                ▼
         ┌─────────────────────────────────────────────────┐
         │              VALIDATION GATEWAY                 │
         │  P_V + A_V == I_V  &&  P_M + A_M == I_M?        │
         └───────────┬─────────────────────────┬───────────┘
                     │ YES                     │ NO
                     ▼                         ▼
         ┌───────────────────────┐  ┌──────────────────────┐
         │ OPTIMISTIC UI COMMIT  │  │ BLOCK & SHOW ALERT   │
         │ isSaving = true       │  │ Display disparity    │
         │ Sync DB via service   │  │ message per gender   │
         └───────────┬───────────┘  └──────────────────────┘
                     │
          ┌──────────┴──────────┐
          │ SUCCESS             │ ERROR
          ▼                     ▼
┌──────────────────┐  ┌─────────────────────────────┐
│ Commit record    │  │ Rollback optimistic state   │
│ isDirty = false  │  │ Display error banner        │
│ Show green toast │  │ Keep input state for editing│
└──────────────────┘  └─────────────────────────────┘
```

### 4.2 Complete Hook Implementation Architecture

```typescript
/**
 * ============================================================================
 * DAILY ATTENDANCE CUSTOM HOOK
 * Location: src/hooks/useAttendance.ts
 * ============================================================================
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { attendanceService } from '../services/attendanceService';
import { 
  Course, 
  AttendanceRecord, 
  StaffAbsence, 
  AttendanceFormData, 
  AttendanceValidationState, 
  QuickFillType, 
  StaffAbsenceInput,
  UseAttendanceReturn 
} from '../types';
import { validateAttendanceRow, calculateAttendancePercentage } from '../utils/calculations';
import { getTodayString } from '../utils/formatters';

interface UseAttendanceOptions {
  initialCourseId?: string;
  initialDate?: string;
}

export function useAttendance(options?: UseAttendanceOptions): UseAttendanceReturn {
  const { user } = useAuth();

  // 1. Date State
  const [selectedDate, setSelectedDateState] = useState<string>(
    options?.initialDate || getTodayString()
  );

  // 2. Course Catalog State
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseIdState] = useState<string>(
    options?.initialCourseId || ''
  );

  // 3. Active Attendance Form State
  const [formData, setFormData] = useState<AttendanceFormData>({
    presentes_varones: '',
    presentes_mujeres: '',
    ausentes_varones: '',
    ausentes_mujeres: '',
    observaciones: '',
  });

  // 4. Persistence & Server Snapshot State
  const [existingRecord, setExistingRecord] = useState<AttendanceRecord | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // 5. Staff Absences State
  const [staffAbsences, setStaffAbsences] = useState<StaffAbsence[]>([]);

  // 6. Async Flags & Feedback Messages
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Date flags
  const todayStr = useMemo(() => getTodayString(), []);
  const isToday = selectedDate === todayStr;
  const isPastDate = selectedDate < todayStr;
  const isFutureDate = selectedDate > todayStr;

  // Read-only lockout: past date locks teachers out of editing
  const isReadOnly = useMemo(() => {
    if (!user) return true;
    if (user.role === 'profesor' && isPastDate) return true;
    if (existingRecord?.is_locked && user.role !== 'administrador') return true;
    return false;
  }, [user, isPastDate, existingRecord]);

  // Selected Course Object Reference
  const selectedCourse = useMemo(() => {
    return availableCourses.find((c) => c.id === selectedCourseId) || null;
  }, [availableCourses, selectedCourseId]);

  // Clear messages helper
  const clearFeedback = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  // 7. Load Courses on Mount or User Change
  useEffect(() => {
    let isMounted = true;

    async function loadCourses() {
      if (!user) return;
      setIsLoading(true);
      try {
        const courses = await attendanceService.getCoursesForUser(user);
        if (!isMounted) return;

        setAvailableCourses(courses);

        // Auto-select first course if not set or invalid
        if (courses.length > 0) {
          if (!selectedCourseId || !courses.some((c) => c.id === selectedCourseId)) {
            setSelectedCourseIdState(courses[0].id);
          }
        } else {
          setSelectedCourseIdState('');
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Error al cargar los cursos.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadCourses();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // 8. Load Attendance & Staff Absences when Course or Date changes
  const loadAttendanceData = useCallback(async () => {
    if (!selectedCourseId || !selectedDate) return;

    setIsLoading(true);
    clearFeedback();

    try {
      // 1. Fetch attendance record
      const record = await attendanceService.getAttendanceByCourseAndDate(
        selectedCourseId,
        selectedDate
      );

      setExistingRecord(record);

      if (record) {
        setFormData({
          presentes_varones: record.presentes_varones,
          presentes_mujeres: record.presentes_mujeres,
          ausentes_varones: record.ausentes_varones,
          ausentes_mujeres: record.ausentes_mujeres,
          observaciones: record.observaciones || '',
        });
      } else {
        // Reset to blank/0 baseline
        setFormData({
          presentes_varones: '',
          presentes_mujeres: '',
          ausentes_varones: '',
          ausentes_mujeres: '',
          observaciones: '',
        });
      }
      setIsDirty(false);

      // 2. Fetch staff absences for this course's shift & date
      const course = availableCourses.find((c) => c.id === selectedCourseId);
      if (course?.shift_id) {
        const absences = await attendanceService.getStaffAbsencesByShiftAndDate(
          course.shift_id,
          selectedDate
        );
        setStaffAbsences(absences);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos del parte de asistencia.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourseId, selectedDate, availableCourses, clearFeedback]);

  useEffect(() => {
    loadAttendanceData();
  }, [loadAttendanceData]);

  // 9. Live Mathematical Validation Engine
  const validation = useMemo<AttendanceValidationState>(() => {
    const iv = selectedCourse?.inscriptos_varones ?? 0;
    const im = selectedCourse?.inscriptos_mujeres ?? 0;
    const it = iv + im;

    const pv = formData.presentes_varones === '' ? 0 : Number(formData.presentes_varones);
    const pm = formData.presentes_mujeres === '' ? 0 : Number(formData.presentes_mujeres);
    const av = formData.ausentes_varones === '' ? 0 : Number(formData.ausentes_varones);
    const am = formData.ausentes_mujeres === '' ? 0 : Number(formData.ausentes_mujeres);

    const rowVal = validateAttendanceRow(iv, im, pv, pm, av, am);

    const pt = pv + pm;
    const at = av + am;
    const pct = calculateAttendancePercentage(pt, it);

    const disparityMessages: string[] = [];
    if (!rowVal.varonesValid) {
      if (rowVal.varonesDisparity < 0) {
        disparityMessages.push(
          `Varones: Faltan ${Math.abs(rowVal.varonesDisparity)} para completar los ${iv} inscriptos.`
        );
      } else {
        disparityMessages.push(
          `Varones: Sobran ${rowVal.varonesDisparity} (suma ${pv + av} de ${iv} inscriptos).`
        );
      }
    }

    if (!rowVal.mujeresValid) {
      if (rowVal.mujeresDisparity < 0) {
        disparityMessages.push(
          `Mujeres: Faltan ${Math.abs(rowVal.mujeresDisparity)} para completar las ${im} inscriptas.`
        );
      } else {
        disparityMessages.push(
          `Mujeres: Sobran ${rowVal.mujeresDisparity} (suma ${pm + am} de ${im} inscriptas).`
        );
      }
    }

    return {
      isValid: rowVal.isValid,
      varonesValid: rowVal.varonesValid,
      mujeresValid: rowVal.mujeresValid,
      totalValid: rowVal.totalValid,
      varonesDisparity: rowVal.varonesDisparity,
      mujeresDisparity: rowVal.mujeresDisparity,
      totalDisparity: (pt + at) - it,
      disparityMessages,
      errorMessage: rowVal.errorMessage,
      presentesTotal: pt,
      ausentesTotal: at,
      inscriptosTotal: it,
      porcentajeAsistencia: pct,
    };
  }, [selectedCourse, formData]);

  // 10. Form Field Setters
  const setPresenteV = useCallback((val: number | string) => {
    setFormData((prev) => ({
      ...prev,
      presentes_varones: val === '' ? '' : Math.max(0, parseInt(String(val), 10) || 0),
    }));
    setIsDirty(true);
    clearFeedback();
  }, [clearFeedback]);

  const setPresenteM = useCallback((val: number | string) => {
    setFormData((prev) => ({
      ...prev,
      presentes_mujeres: val === '' ? '' : Math.max(0, parseInt(String(val), 10) || 0),
    }));
    setIsDirty(true);
    clearFeedback();
  }, [clearFeedback]);

  const setAusenteV = useCallback((val: number | string) => {
    setFormData((prev) => ({
      ...prev,
      ausentes_varones: val === '' ? '' : Math.max(0, parseInt(String(val), 10) || 0),
    }));
    setIsDirty(true);
    clearFeedback();
  }, [clearFeedback]);

  const setAusenteM = useCallback((val: number | string) => {
    setFormData((prev) => ({
      ...prev,
      ausentes_mujeres: val === '' ? '' : Math.max(0, parseInt(String(val), 10) || 0),
    }));
    setIsDirty(true);
    clearFeedback();
  }, [clearFeedback]);

  const setObservaciones = useCallback((val: string) => {
    setFormData((prev) => ({
      ...prev,
      observaciones: val,
    }));
    setIsDirty(true);
    clearFeedback();
  }, [clearFeedback]);

  // 11. Quick-Fill Automation Engine
  const applyQuickFill = useCallback(
    (type: QuickFillType) => {
      if (!selectedCourse || isReadOnly) return;

      const iv = selectedCourse.inscriptos_varones;
      const im = selectedCourse.inscriptos_mujeres;

      switch (type) {
        case 'todos_presentes':
          setFormData((prev) => ({
            ...prev,
            presentes_varones: iv,
            presentes_mujeres: im,
            ausentes_varones: 0,
            ausentes_mujeres: 0,
          }));
          break;

        case 'todos_ausentes':
          setFormData((prev) => ({
            ...prev,
            presentes_varones: 0,
            presentes_mujeres: 0,
            ausentes_varones: iv,
            ausentes_mujeres: im,
          }));
          break;

        case 'autocompletar_ausentes':
          setFormData((prev) => {
            const pv = prev.presentes_varones === '' ? 0 : Number(prev.presentes_varones);
            const pm = prev.presentes_mujeres === '' ? 0 : Number(prev.presentes_mujeres);
            return {
              ...prev,
              ausentes_varones: Math.max(0, iv - pv),
              ausentes_mujeres: Math.max(0, im - pm),
            };
          });
          break;

        case 'reset':
          if (existingRecord) {
            setFormData({
              presentes_varones: existingRecord.presentes_varones,
              presentes_mujeres: existingRecord.presentes_mujeres,
              ausentes_varones: existingRecord.ausentes_varones,
              ausentes_mujeres: existingRecord.ausentes_mujeres,
              observaciones: existingRecord.observaciones || '',
            });
          } else {
            setFormData({
              presentes_varones: '',
              presentes_mujeres: '',
              ausentes_varones: '',
              ausentes_mujeres: '',
              observaciones: '',
            });
          }
          break;
      }

      setIsDirty(true);
      clearFeedback();
    },
    [selectedCourse, isReadOnly, existingRecord, clearFeedback]
  );

  // 12. Save Attendance (Atomic Persist + Optimistic Update)
  const saveAttendance = useCallback(async (): Promise<boolean> => {
    if (!selectedCourse || !user) {
      setError('No se pudo identificar el curso o usuario activo.');
      return false;
    }

    if (isReadOnly) {
      setError('El parte de asistencia no permite modificaciones (modo solo lectura).');
      return false;
    }

    if (!validation.isValid) {
      setError(
        validation.errorMessage ||
          'No se puede guardar: la cantidad de Presentes + Ausentes no coincide con la matrícula oficial.'
      );
      return false;
    }

    setIsSaving(true);
    clearFeedback();

    const previousRecord = existingRecord;

    const pv = Number(formData.presentes_varones) || 0;
    const pm = Number(formData.presentes_mujeres) || 0;
    const av = Number(formData.ausentes_varones) || 0;
    const am = Number(formData.ausentes_mujeres) || 0;

    // Optimistic record snapshot
    const optimisticRecord: AttendanceRecord = {
      id: existingRecord?.id || `temp-${Date.now()}`,
      date: selectedDate,
      course_id: selectedCourse.id,
      shift_id: selectedCourse.shift_id,
      submitted_by: user.id,
      inscriptos_varones_snapshot: selectedCourse.inscriptos_varones,
      inscriptos_mujeres_snapshot: selectedCourse.inscriptos_mujeres,
      inscriptos_total_snapshot: selectedCourse.inscriptos_total,
      presentes_varones: pv,
      presentes_mujeres: pm,
      presentes_total: pv + pm,
      ausentes_varones: av,
      ausentes_mujeres: am,
      ausentes_total: av + am,
      observaciones: formData.observaciones,
      is_locked: false,
      submitted_at: new Date().toISOString(),
    };

    setExistingRecord(optimisticRecord);

    try {
      const persistedRecord = await attendanceService.upsertAttendance(
        {
          course_id: selectedCourse.id,
          shift_id: selectedCourse.shift_id,
          date: selectedDate,
          presentes_varones: pv,
          presentes_mujeres: pm,
          ausentes_varones: av,
          ausentes_mujeres: am,
          observaciones: formData.observaciones,
        },
        user
      );

      setExistingRecord(persistedRecord);
      setIsDirty(false);
      setSuccessMessage('¡Parte de asistencia guardado exitosamente!');
      return true;
    } catch (err: any) {
      // Rollback to previous state on failure
      setExistingRecord(previousRecord);
      setError(err.message || 'Error al persistir el parte de asistencia en la base de datos.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [
    selectedCourse,
    user,
    isReadOnly,
    validation,
    existingRecord,
    formData,
    selectedDate,
    clearFeedback,
  ]);

  // 13. Staff Absences Sub-Form Handlers
  const addStaffAbsence = useCallback(
    async (absenceInput: StaffAbsenceInput): Promise<boolean> => {
      if (!user) return false;
      setIsSaving(true);
      clearFeedback();

      try {
        const newAbsence = await attendanceService.createStaffAbsence(absenceInput, user);
        setStaffAbsences((prev) => [...prev, newAbsence]);
        setSuccessMessage('Inasistencia de personal registrada correctamente.');
        return true;
      } catch (err: any) {
        setError(err.message || 'Error al registrar la inasistencia de personal.');
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [user, clearFeedback]
  );

  const removeStaffAbsence = useCallback(
    async (absenceId: string): Promise<boolean> => {
      setIsSaving(true);
      clearFeedback();

      const prevList = staffAbsences;
      // Optimistic delete
      setStaffAbsences((prev) => prev.filter((a) => a.id !== absenceId));

      try {
        await attendanceService.deleteStaffAbsence(absenceId);
        setSuccessMessage('Registro de inasistencia eliminado.');
        return true;
      } catch (err: any) {
        // Rollback
        setStaffAbsences(prevList);
        setError(err.message || 'Error al eliminar la inasistencia.');
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [staffAbsences, clearFeedback]
  );

  // Selector setters with state resets
  const setSelectedCourseId = useCallback(
    (courseId: string) => {
      setSelectedCourseIdState(courseId);
      clearFeedback();
    },
    [clearFeedback]
  );

  const setSelectedDate = useCallback(
    (date: string) => {
      setSelectedDateState(date);
      clearFeedback();
    },
    [clearFeedback]
  );

  return {
    selectedCourse,
    selectedCourseId,
    availableCourses,
    setSelectedCourseId,

    selectedDate,
    setSelectedDate,
    isToday,
    isPastDate,
    isFutureDate,
    isReadOnly,

    formData,
    existingRecord,
    isSubmitted: !!existingRecord,
    isDirty,

    validation,

    setPresenteV,
    setPresenteM,
    setAusenteV,
    setAusenteM,
    setObservaciones,
    applyQuickFill,
    saveAttendance,

    staffAbsences,
    addStaffAbsence,
    removeStaffAbsence,

    isLoading,
    isSaving,
    error,
    successMessage,
    clearFeedback,
    reload: loadAttendanceData,
  };
}
```

---

## 5. Edge Case Analysis & Error Taxonomy

| Scenario / Edge Case | Expected System Behavior | Implementation Guarantee |
|---|---|---|
| **Zero Female Students ($I_M = 0$)** | Form allows $P_M = 0, A_M = 0$, marks Mujeres Valid = true, and enables submission when Varones match. | `validateAttendanceRow` validates $(0 + 0) - 0 = 0$ as valid parity. |
| **Teacher with Zero Assigned Courses** | Hook returns `availableCourses: []`, `selectedCourse: null`. UI displays empty state card without crashing. | Guarded early returns in hook and service queries. |
| **Compensating Disparity Errors** ($P_V = 10, A_V = 0$ for $I_V = 11$, and $P_M = 4, A_M = 1$ for $I_M = 4$) | Hard blocked. Total is 15 of 15, but per-gender parity fails ($P_V+A_V \ne I_V$ and $P_M+A_M \ne I_M$). | Strict dual-boolean check `varonesValid && mujeresValid`. |
| **Rapid Keystroke / Typing** | User types multi-digit strings (e.g. `1` then `12`). Real-time validation updates immediately without lag. | Controlled string/number parsing with `Math.max(0, parseInt(...))` and memoized validation. |
| **Teacher Edits Past Date ($date < today$)** | `isReadOnly = true`. Inputs disabled, submit button hidden/disabled, read-only institutional banner displayed. | Database trigger `trg_date_lock_attendance` + client-side `isPastDate && role === 'profesor'` check. |
| **Admin / Preceptor Edits Past Date** | Allowed. `isReadOnly = false`. Database trigger explicitly allows `is_admin()` override. | DB function `fn_date_lock_attendance` checks `public.is_admin()`. |
| **Network / Supabase Timeout during Save** | Rollback optimistic record state, show human-readable error banner with retry button. | `try / catch` with `setExistingRecord(previousRecord)` rollback in `saveAttendance()`. |
| **Special Characters & Diacritics in Observaciones** | Full Spanish unicode support (á, é, í, ó, ú, ñ, °) preserved without data corruption or truncation. | UTF-8 DB columns with sanitization in TypeScript. |

---

## 6. Integration Contract with UI Components (Explorer 1 Scope)

The UI Worker implementing components under `src/components/attendance/` will consume `useAttendance()` directly:

1. **`CourseSelector.tsx`**: Consumes `availableCourses`, `selectedCourseId`, `setSelectedCourseId`, `isLoading`.
2. **`CourseHeaderCard.tsx`**: Consumes `selectedCourse` (name, year, division, orientation, $I_V, I_M, I_T$).
3. **`DateSelector.tsx`**: Consumes `selectedDate`, `setSelectedDate`, `isToday`, `isPastDate`, `isReadOnly`.
4. **`AttendanceForm.tsx`**: Consumes `formData`, `setPresenteV`, `setPresenteM`, `setAusenteV`, `setAusenteM`, `setObservaciones`, `applyQuickFill`, `saveAttendance`, `validation`, `isSaving`, `isReadOnly`, `isDirty`.
5. **`ValidationBadge.tsx`**: Consumes `validation.isValid`, `validation.varonesValid`, `validation.mujeresValid`.
6. **`DisparityAlert.tsx`**: Consumes `validation.disparityMessages`, `validation.isValid`.
7. **`StaffAbsenceForm.tsx`**: Consumes `staffAbsences`, `addStaffAbsence`, `removeStaffAbsence`, `isSaving`, `selectedDate`, `selectedCourse?.shift_id`.

---

## 7. Verification Method

1. **Unit Test Coverage**:
   - `tests/tier1_feature_coverage/attendance_form.test.ts` (All 26 test cases in F-03 to F-09).
   - `tests/tier2_boundaries/math_boundaries.test.ts` (Boundary conditions $0\%$, $100\%$, zero-female, negative sanitization).
   - `tests/tier2_boundaries/date_boundaries.test.ts` (Today, yesterday lock, future date rejection).
2. **Verification Command**:
   - Run the test suite: `npx tsx tests/runner/index.ts`
3. **Type-Check Command**:
   - Run TypeScript compiler: `npx tsc --noEmit`
