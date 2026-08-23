# Scope: Milestone 3 (M3: Teacher & Preceptor Daily Attendance Entry Module)

## Architecture & Responsibilities
Milestone 3 implements the comprehensive Daily Attendance Entry module for teachers, preceptors, and administrators.
It interfaces with:
- M1 Database Schema: `daily_attendance` (and `attendance_records`), `staff_absences`, `courses`, `enrollments`, `user_roles`.
- M2 Auth & RBAC: `useAuth` hook, role-based course filtering (`profesor` sees assigned courses; `preceptor` / `administrador` see all courses), route protection under `/attendance`.
- M4 & M5 Consumers: Daily Parte Summary and monthly matrix sheets consume the data persisted by M3.

## Feature Inventory (Mapped to Scope)
| # | Feature | Description | Status |
|---|---------|-------------|--------|
| F-03 | Course Selection & Header Info | Selector filtered by user role; header card displaying course, division, technical orientation, shift, and enrolled student breakdown ($I_V, I_M, I_T$) | DONE |
| F-04 | Dual-Gender Live Attendance Entry | Real-time input for $P_V, P_M, A_V, A_M$ with auto-calculation of $P_T, A_T$, and live attendance $\%A = (P_T / I_T) \times 100$ | DONE |
| F-05 | Real-Time Parity Validation & Disparity Alert | Hard validation requiring $P_V + A_V = I_V$ and $P_M + A_M = I_M$; green badge on match; descriptive disparity alert on mismatch; hard blocking submit | DONE |
| F-06 | Quick-Fill Helpers | "Todos Presentes", "Todos Ausentes", "Autocompletar Ausentes" buttons | DONE |
| F-07 | Date Selector & Historical Edit Lockout | Date selector with today shortcut; past date edit lock with read-only banner for teachers | DONE |
| F-08 | Staff Absences Entry (*Ausencias de Docentes y Auxiliares*) | Modal / subform to log absent teachers/auxiliaries with role, name, subject/area, shift, and reason | DONE |
| F-09 | Daily Incidents / Observaciones | Textarea for daily course observations and incidents | DONE |
| F-10 | Mobile & Desktop Responsive UX | 375px mobile optimization (touch keypad, sticky bottom action bar) and 1280px+ desktop card layout | DONE |

## Component Breakdown (`src/components/attendance/`)
- `AttendanceView.tsx`: Main page orchestrator.
- `CourseSelector.tsx`: Dropdown & search selector for courses.
- `CourseHeaderCard.tsx`: Displays course details, orientation badge, and official enrollment ($I_V, I_M, I_T$).
- `AttendanceForm.tsx`: Dual-gender input grid, live totals, percentage, quick actions, and submit buttons.
- `ValidationBadge.tsx`: Visual parity indicator (valid vs invalid).
- `DisparityAlert.tsx`: Detailed breakdown of student count differences.
- `DateSelector.tsx`: Date picker, today button, past-date lock indicator.
- `StaffAbsenceForm.tsx`: Modal / subform for logging staff absences.
- `ObservacionesField.tsx`: Notes and incident field.
- `index.ts`: Barrel export.

## Services & Hooks (`src/services/` and `src/hooks/`)
- `src/services/attendanceService.ts`:
  - `getAttendanceByCourseAndDate(courseId: string, date: string)`
  - `upsertAttendance(record: AttendanceRecordInput)`
  - `getStaffAbsencesByShiftAndDate(shift: string, date: string)`
  - `createStaffAbsence(absence: StaffAbsenceInput)`
  - `deleteStaffAbsence(absenceId: string)`
  - `getCoursesForUser(user: User)`
- `src/hooks/useAttendance.ts`:
  - Manages course selection, selected date, attendance state ($P_V, P_M, A_V, A_M$, notes), validation state, staff absences, loading/saving states, optimistic UI updates.

## Routing & RBAC Integration (`src/App.tsx`)
- Mounted route `/attendance` with alias `/asistencia` wrapped in auth/role protection.
