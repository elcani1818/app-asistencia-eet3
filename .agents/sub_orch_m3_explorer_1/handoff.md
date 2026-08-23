# Handoff Report — Explorer 1: M3 Component Architecture & Live Validation UX

**Agent**: Explorer 1 (`sub_orch_m3_explorer_1`)  
**Mission**: Investigate and design the complete Component Architecture and Live Validation UX for the Attendance Module in `src/components/attendance/`.  
**Target Recipient**: M3 Sub-Orchestrator & M3 Worker Agents  
**Timestamp**: 2026-08-20T14:53:00Z  

---

## 1. Observation
- **Existing Foundation (M1 & M2)**:
  - Database schema (`supabase/migrations/20260820000000_m1_database_and_auth.sql`) has `attendance_records` and `staff_absences` tables with mathematical trigger `trg_validate_attendance_math` and date lockout trigger `trg_date_lock_attendance`.
  - Frontend foundation (`src/types/index.ts`, `src/utils/calculations.ts`, `src/utils/formatters.ts`) has `validateAttendanceRow()`, `calculateAttendancePercentage()`, `formatArgentineDate()`, and role types.
  - UI design primitives (`src/components/common/`) include `Button`, `Input`, `Badge`, `Card`, `Modal`, `LoadingSpinner`, and `Navbar`.
  - Placeholder route is configured at `/attendance` in `src/App.tsx`.
- **E2E Test Specifications**:
  - `tests/tier1_feature_coverage/attendance_form.test.ts` expects 10 TV courses, assigned course filtering for teachers, live auto-calculated totals ($P_T = P_V + P_M$, $A_T = A_V + A_M$, $\%A = (P_T / I_T) \times 100$), real-time disparity alerts with exact missing/excess counts, quick actions, date lockout on past dates for teachers, staff absences logging for Docente/Auxiliar, and free-text observaciones.
  - `tests/tier2_boundaries/math_boundaries.test.ts` tests zero-female cohorts (e.g. `5° 4ª TECET`), zero-male cohorts, 100% and 0% attendance boundaries, negative and decimal sanitization, and disparity matrices.

---

## 2. Logic Chain
1. **From Schema & Invariants to Component Structure**:
   - The dual-gender parity invariant $P_V + A_V = I_V$ and $P_M + A_M = I_M$ requires continuous live validation during input without needing a form submit. This requires pairing the dual-gender inputs in `AttendanceForm.tsx` with instant visual indicators (`ValidationBadge.tsx` and `DisparityAlert.tsx`).
2. **From Role-Based Requirements to Scoped Selectors**:
   - `profesor` must only see their assigned courses. `CourseSelector.tsx` receives `courses` pre-filtered by `useCourses` / `useAuth`, and provides feedback if no courses are assigned.
3. **From Date Boundaries to Temporal Lockout Banner**:
   - `DateSelector.tsx` enforces `selectedDate <= today` for teachers and shows a prominent read-only banner if viewing past records, preventing invalid edit attempts before calling the backend.
4. **From Daily Shift Reporting Needs to Staff Absences Subform**:
   - Preceptors and teachers need to log absent staff during the shift. `StaffAbsenceForm.tsx` provides a modal and list for logging Docente/Auxiliar absences with role, subject, and reason.
5. **From Mobile Viewport Invariants to Ergonomic Layout**:
   - 375px mobile screens require `inputMode="numeric"`, `min-h-[44px]` touch targets, and a sticky bottom action bar so teachers can quickly verify and submit attendance without scrolling or zooming.

---

## 3. Caveats
- **Offline / Supabase Fallback**: The component and hook architecture must gracefully support in-memory mock fallback if Supabase credentials are not configured or when running offline unit tests.
- **Orientation Nuance**: `1° 1ª C.TEC.MMO` is classified as `cycle: 'tecnico_especial'` and orientation `'C.TEC.MMO'`, distinct from regular Ciclo Básico `1° 1ª`. Both badges and selector names must reflect this distinction.

---

## 4. Conclusion
The Component Architecture and UX Design for Milestone 3 are fully specified in `analysis.md` across 8 modular components:
1. `AttendanceView.tsx` (Page orchestrator and tab manager)
2. `CourseSelector.tsx` (Role-filtered search and badge selector)
3. `CourseHeaderCard.tsx` (Course display card with $I_V, I_M, I_T$)
4. `AttendanceForm.tsx` (Live dual-gender inputs, totals $P_T, A_T$, live $\%A$, quick-fill helpers)
5. `ValidationBadge.tsx` & `DisparityAlert.tsx` (Real-time parity indicators and arithmetic diagnostics)
6. `DateSelector.tsx` (Date picker, "Hoy" button, past-date lockout banner)
7. `StaffAbsenceForm.tsx` (Modal and table for Docente/Auxiliar absences)
8. `ObservacionesField.tsx` (Notes and incident field)

Plus contracts for `useAttendance.ts` and `attendanceService.ts`.

---

## 5. Verification Method
1. Inspect the complete design specification at `.agents/sub_orch_m3_explorer_1/analysis.md`.
2. Verify alignment with test suites:
   ```bash
   npx tsx tests/runner/index.ts --tier=1 --filter="Attendance"
   npx tsx tests/runner/index.ts --tier=2 --filter="Mathematical"
   ```
3. Verify that all components satisfy the 375px mobile viewport constraint without horizontal overflow and with $\ge 44\text{px}$ touch targets.
