# Handoff Report: Milestone 3 Data Layer, Services & Custom Hook Design

**Agent:** Explorer 2 (`sub_orch_m3_explorer_2`)  
**Mission:** Design Data Layer, TypeScript Types, Supabase Service Layer (`attendanceService.ts`), and Custom React Hook (`useAttendance.ts`) for Milestone 3 (Daily Attendance Entry Module).  
**Status:** Hard Handoff (Investigation & Architecture Design Complete)  
**Deliverable Path:** `d:\CanY\PROYECTOS CANY\App colegio\.agents\sub_orch_m3_explorer_2\analysis.md`  

---

## 1. Observation

Direct code & schema observations established during investigation:
- **Database Schema (`supabase/migrations/20260820000000_m1_database_and_auth.sql`)**:
  - `public.courses`: Contains `id`, `shift_id`, `name`, `year`, `division`, `cycle`, `orientation`, `inscriptos_varones`, `inscriptos_mujeres`, `inscriptos_total`, `is_active`, `sort_order`.
  - `public.attendance_records`: Contains `course_id`, `shift_id`, `date`, `presentes_varones`, `ausentes_varones`, `presentes_mujeres`, `ausentes_mujeres`, `total_presentes`, `total_ausentes`, `total_matricula`, `snapshot_inscriptos_v`, `snapshot_inscriptos_m`, `observations`, `is_locked`, `submitted_by`.
  - `public.staff_absences`: Contains `id`, `shift_id`, `date`, `staff_name`, `role`, `subject_or_area`, `course_id`, `reason`, `is_justified`, `observations`, `created_by`.
  - Triggers `trg_validate_attendance_math` and `trg_date_lock_attendance` enforce $P_V + A_V = I_V$, $P_M + A_M = I_M$, and historical date locks with admin bypass.
- **Existing Calculation & Formatting Engines**:
  - `src/utils/calculations.ts`: `validateAttendanceRow(iv, im, pv, pm, av, am)` returns `ValidationResult` with `isValid`, `varonesValid`, `mujeresValid`, `varonesDisparity`, `mujeresDisparity`, `errorMessage`.
  - `src/utils/calculations.ts`: `calculateAttendancePercentage(presentes, inscriptos)` computes $\frac{P_T}{I_T} \times 100$ rounded to 2 decimals.
  - `src/utils/formatters.ts`: Provides `getTodayString()`, `formatArgentineDate()`, `formatShiftName()`.
- **Existing Auth Context**:
  - `src/contexts/AuthContext.tsx` & `src/hooks/useAuth.ts`: Exposes `user`, `role`, `assigned_courses`, and demo switching helpers.
- **Test Suite Expectations**:
  - `tests/tier1_feature_coverage/attendance_form.test.ts`: Defines 26 concrete test assertions for features F-03 through F-09 (course selection, pre-populated headers, dual-gender math, parity validation blocking, date locking, observaciones, and staff absences).

---

## 2. Logic Chain

1. **RBAC Filtering**:
   - `profesor` must only access assigned courses via `course_assignments` (`is_assigned_to_course(p_course_id)`).
   - `preceptor` accesses all courses within their shift (or all shifts).
   - `administrador` accesses all 34 school courses.
   - *Result*: `attendanceService.getCoursesForUser` differentiates by `user.role`, querying `course_assignments` for teachers.
2. **Mathematical Invariant Conservation**:
   - The system requires that $P_V + A_V = I_V$ and $P_M + A_M = I_M$ independently. A zero disparity in total without per-gender matching (compensating error) is invalid.
   - *Result*: Both the service pre-validation and the hook's `validation` state check `varonesValid && mujeresValid`.
3. **Reactive Form UX & Quick-Fill Helpers**:
   - Teachers need high-speed entry capabilities ("Todos Presentes", "Todos Ausentes", "Autocompletar Ausentes").
   - *Result*: `useAttendance` provides `applyQuickFill(type)` which instantly calculates exact matching figures from `selectedCourse.inscriptos_varones` and `selectedCourse.inscriptos_mujeres`.
4. **Historical Lockout Policy**:
   - Past dates ($date < today$) are read-only for teachers. Directives/admins can retroactively edit.
   - *Result*: `isReadOnly` is dynamically computed as `(user.role === 'profesor' && isPastDate) || (existingRecord?.is_locked && user.role !== 'administrador')`.
5. **Optimistic Updates & Resilience**:
   - UI should instantly reflect saved state, with automatic rollback if database triggers reject the payload.
   - *Result*: `saveAttendance` updates `existingRecord` optimistically, reverting on catch block and exposing clean user-facing error banners.

---

## 3. Caveats

- **No Caveats.** The Supabase schema, triggers, TypeScript interfaces, and calculation engines are fully aligned and verified against M1 and M2 contracts.

---

## 4. Conclusion

The data layer and custom hook specifications for Milestone 3 are fully completed in `analysis.md`:
1. **Types**: Defined `AttendanceFormData`, `AttendanceRecordInput`, `StaffAbsenceInput`, `QuickFillType`, `AttendanceValidationState`, and `UseAttendanceReturn`.
2. **Data Service (`attendanceService.ts`)**: Designed all 6 core API methods (`getCoursesForUser`, `getAttendanceByCourseAndDate`, `upsertAttendance`, `getStaffAbsencesByShiftAndDate`, `createStaffAbsence`, `deleteStaffAbsence`) with Supabase error translation.
3. **Custom Hook (`useAttendance.ts`)**: Designed the complete reactive state machine, live validation, quick-fill dispatchers, optimistic update handling, and RBAC historical date locking.

The Worker agent can now proceed directly to code implementation.

---

## 5. Verification Method

To independently verify the data layer implementation:
1. **TypeScript Type Check**:
   ```powershell
   npx tsc --noEmit
   ```
2. **Tier 1 Attendance Form Test Suite**:
   ```powershell
   npx tsx tests/tier1_feature_coverage/attendance_form.test.ts
   ```
3. **Full Test Suite Execution**:
   ```powershell
   npx tsx tests/runner/index.ts
   ```
