## 2026-08-20T14:53:19Z
You are the Worker for Milestone 3 (M3: Teacher & Preceptor Daily Attendance Entry Module).
Your working directory is: d:\CanY\PROYECTOS CANY\App colegio\.agents\sub_orch_m3_worker_1

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Required Reading:
- Master Project Blueprint: d:\CanY\PROYECTOS CANY\App colegio\PROJECT.md
- Scope Document: d:\CanY\PROYECTOS CANY\App colegio\.agents\sub_orch_m3\SCOPE.md
- Original User Request: d:\CanY\PROYECTOS CANY\App colegio\ORIGINAL_REQUEST.md
- Explorer 1 Analysis (Components & UX): d:\CanY\PROYECTOS CANY\App colegio\.agents\sub_orch_m3_explorer_1\analysis.md
- Explorer 2 Analysis (Data Layer, Services & Hook): d:\CanY\PROYECTOS CANY\App colegio\.agents\sub_orch_m3_explorer_2\analysis.md
- Explorer 3 Analysis (RBAC, Historical Lockout, Routing & Tests): d:\CanY\PROYECTOS CANY\App colegio\.agents\sub_orch_m3_explorer_3\analysis.md
- Test Suite: `tests/tier1_feature_coverage/attendance_form.test.ts`, `tests/tier2_boundaries/math_boundaries.test.ts`, `tests/tier2_boundaries/date_boundaries.test.ts`

Your Exclusive Write Ownership:
1. `src/types/index.ts` (export all attendance types: `AttendanceFormData`, `AttendanceRecordInput`, `StaffAbsenceInput`, `QuickFillType`, `AttendanceValidationState`, `UseAttendanceReturn`, etc.)
2. `src/services/attendanceService.ts` (complete CRUD + mock fallback for courses, attendance records, and staff absences)
3. `src/hooks/useAttendance.ts` (complete reactive hook managing courses, date, attendance records, dual-gender math, parity validation, quick actions, historical lockout, staff absences, optimistic updates, and errors)
4. `src/components/attendance/ValidationBadge.tsx` (Real-time parity status badge: green when valid, red/amber when invalid)
5. `src/components/attendance/DisparityAlert.tsx` (Detailed disparity breakdown for varones and mujeres: "Varones: faltan 2", "Mujeres: sobran 1", etc.)
6. `src/components/attendance/CourseHeaderCard.tsx` (Display course name e.g. "6° 1°", division, orientation badge, shift, and official enrollment $I_V, I_M, I_T$)
7. `src/components/attendance/CourseSelector.tsx` (Course selector filtered by role: profesor sees assigned courses, preceptor/admin see all active courses; search filter; empty state for 0 assigned courses)
8. `src/components/attendance/DateSelector.tsx` (Date picker with "Hoy" shortcut; historical date lockout warning banner for teachers)
9. `src/components/attendance/ObservacionesField.tsx` (Daily incidents & notes field)
10. `src/components/attendance/StaffAbsenceForm.tsx` (Modal/subform to log absent teachers or auxiliaries with staff name, role Docente/Auxiliar, subject/area, shift, reason, and list of absences)
11. `src/components/attendance/AttendanceForm.tsx` (Live dual-gender input grid for $P_V, P_M, A_V, A_M$, live totals $P_T, A_T$, live $\%A = (P_T / I_T) \times 100$, quick-fill buttons "Todos Presentes", "Todos Ausentes", "Autocompletar Ausentes", sticky bottom action bar on mobile, submit/update buttons with loading state)
12. `src/components/attendance/AttendanceView.tsx` (Main page orchestrating all components, responsive 375px mobile and 1280px+ desktop layout)
13. `src/App.tsx` (Replace `AttendanceViewPlaceholder` with real `AttendanceView` import)
