# Changes Summary — Milestone 3 (M3: Teacher & Preceptor Daily Attendance Entry Module)

**Author**: Worker M3 (sub_orch_m3_worker_1)  
**Date**: 2026-08-20  
**Scope**: Implementation of daily attendance entry, dual-gender parity validation, historical lockout, staff absences, services, hooks, and UI components.

---

## 1. Domain Types & Interface Contracts (`src/types/index.ts`)
- Preserved all existing core domain types (`User`, `Role`, `Shift`, `Course`, `AttendanceRecord`, `StaffAbsence`, `ShiftSummary`, etc.).
- Added Milestone 3 attendance entry types:
  - `AttendanceFormData`: controlled form input state supporting empty strings `''` during typing.
  - `QuickFillType`: `'todos_presentes' | 'todos_ausentes' | 'autocompletar_ausentes' | 'reset'`.
  - `AttendanceValidationState`: live keystroke validation state tracking parity per gender, disparity counts, error messages, and attendance percentage.
  - `AttendanceRecordInput`: normalized payload for upserting attendance records.
  - `StaffAbsenceInput`: normalized payload for creating staff absences.
  - `CourseSelectOption`: formatted select item for course pickers.
  - `UseAttendanceReturn` & `UseAttendanceProps`: complete state and dispatcher contract for the `useAttendance` hook.
  - Component props interfaces: `ValidationBadgeProps`, `DisparityAlertProps`, `CourseHeaderCardProps`, `CourseSelectorProps`, `DateSelectorProps`, `ObservacionesFieldProps`, `StaffAbsenceFormProps`, `AttendanceFormProps`.

---

## 2. Data Service Layer (`src/services/attendanceService.ts`)
- Implemented `attendanceService` providing complete CRUD and validation for attendance records and staff absences:
  - `getCoursesForUser(user: User)`: filters active courses by role (`administrador` = all 34 courses, `preceptor` = shift courses or all active, `profesor` = assigned courses from Supabase `course_assignments` or profile with fallback for demo users).
  - `getAllActiveCourses()`: returns all active courses across all shifts.
  - `getCourseById(courseId: string)`: fetches course by ID.
  - `getAttendanceByCourseAndDate(courseId: string, date: string)`: retrieves attendance records from Supabase `attendance_records` or persistent local storage.
  - `upsertAttendance(recordInput, userRole, userId)`:
    - Enforces date rules: rejects future dates (`date > today`), blocks non-admin historical edits (`date < today` for teachers with 403 Forbidden).
    - Enforces mathematical parity invariant ($P_V + A_V = I_V$ and $P_M + A_M = I_M$, non-negative integers).
    - Upserts to Supabase and keeps local store synchronized.
  - `getStaffAbsencesByShiftAndDate(shiftId, date)`: queries staff absences for given shift and date.
  - `createStaffAbsence(absenceInput)`: validates required fields (`staff_name`, `role_type`) and creates absence record.
  - `deleteStaffAbsence(absenceId)`: deletes staff absence record.

---

## 3. Custom Reactive Hook (`src/hooks/useAttendance.ts`)
- Manages complete reactive attendance lifecycle:
  - Course selection, available courses, date management.
  - Controlled inputs for $P_V, P_M, A_V, A_M$, and `observaciones`.
  - Real-time arithmetic and validation engine:
    - Calculates $P_T = P_V + P_M$, $A_T = A_V + A_M$, $\%A = (P_T / I_T) \times 100$.
    - Evaluates `validateAttendanceRow` on every keystroke.
    - Generates specific disparity counts and messages for male and female cohorts.
  - Temporal locks: computes `isToday`, `isPastDate`, `isFutureDate`, `isReadOnly`.
  - Quick-fill dispatchers: `todos_presentes`, `todos_ausentes`, `autocompletar_ausentes`, `reset`.
  - Mutations with optimistic updates and error rollback: `saveAttendance`, `addStaffAbsence`, `removeStaffAbsence`.
  - Feedback management: `error`, `successMessage`, `clearFeedback`, `reload`.

---

## 4. UI Components (`src/components/attendance/`)
- `ValidationBadge.tsx`:
  - Real-time parity status badge. Green "Paridad Verificada" on match; red/amber "Disparidad Detectada" on mismatch.
- `DisparityAlert.tsx`:
  - Detailed breakdown of differences per gender (under-count vs over-count).
  - Explicit warning on compensating errors (when total sum matches but gender breakdowns differ).
  - One-click auto-fix button linking to `autocompletar_ausentes`.
- `CourseHeaderCard.tsx`:
  - High-visibility institutional header showing course name ("6° 1ª"), technical orientation badge (`TECQU`, `TECMM`, `TECET`, `C.TEC.MMO`, Ciclo Básico), shift name, status indicator (Parte Registrado vs Pendiente vs Solo Lectura), and official enrollment matrix ($I_V, I_M, I_T$).
- `CourseSelector.tsx`:
  - Searchable course list filtered by user role with shift grouping.
  - Institutional empty state card for teachers with 0 assigned courses.
- `DateSelector.tsx`:
  - Date picker with "Hoy" and "Ayer" shortcut buttons and previous/next day navigation.
  - Historical lockout warning banner for teachers on past dates.
- `ObservacionesField.tsx`:
  - Textarea with character counter (max 500 characters), diacritics support, and clear button.
- `StaffAbsenceForm.tsx`:
  - Subform and list for logging absent teachers and auxiliaries with staff name, role type (Docente / Auxiliar), subject/area, shift, and reason.
- `AttendanceForm.tsx`:
  - Live dual-gender numeric grid ($P_V, P_M, A_V, A_M$) with touch-friendly >= 44px inputs, quick-action toolbar, live totals, percentage badge, validation alert, observaciones, and sticky bottom action bar.
- `AttendanceView.tsx`:
  - Main page orchestrator supporting 375px mobile and 1280px+ desktop responsive grid, tab switcher between Student Attendance and Staff Absences, feedback banners, and auth context integration.
- `index.ts`: barrel export for all attendance components.

---

## 5. Application Router Integration (`src/App.tsx`)
- Replaced `AttendanceViewPlaceholder` with real `AttendanceView` mounted under `/attendance` with alias `/asistencia`.
