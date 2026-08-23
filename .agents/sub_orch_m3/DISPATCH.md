# Dispatch Log

## 2026-08-20T14:49:14Z
You are the Sub-Orchestrator for Milestone 3 (M3: Teacher & Preceptor Daily Attendance Entry Module).
Your working directory is: d:\CanY\PROYECTOS CANY\App colegio\.agents\sub_orch_m3
The master project blueprint is at: d:\CanY\PROYECTOS CANY\App colegio\PROJECT.md
The original user request is at: d:\CanY\PROYECTOS CANY\App colegio\ORIGINAL_REQUEST.md
The E2E Test Suite documentation is at: d:\CanY\PROYECTOS CANY\App colegio\TEST_INFRA.md and d:\CanY\PROYECTOS CANY\App colegio\TEST_READY.md
Survey reports are available at:
- d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_1\analysis.md
- d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_2\analysis.md
- d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_3\analysis.md

Scope of Milestone 3:
1. Implement the complete Daily Attendance Entry Module in `src/components/attendance/`:
   - `AttendanceView.tsx`: Main container orchestrating course selection, date picking, attendance recording, and staff absence reporting.
   - `CourseSelector.tsx`: Dropdown / search selector showing only assigned courses for `profesor` and all courses for `preceptor` and `administrador`. Shows cycle, orientation badge, and shift info.
   - `CourseHeaderCard.tsx`: Display course name (e.g., "6° 1°"), division, technical orientation (TECQU, TECMM, TECET, C.TEC.MMO), shift name, and official enrolled students breakdown ($I_V, I_M, I_T$).
   - `AttendanceForm.tsx`: Live dual-gender inputs for Presentes ($P_V, P_M$) and Ausentes ($A_V, A_M$) with:
     * Live auto-calculation of row totals: $P_T = P_V + P_M$, $A_T = A_V + A_M$.
     * Live attendance percentage $\%A = (P_T / I_T) \times 100$.
     * Quick-fill helpers ("Todos Presentes", "Todos Ausentes", "Autocompletar Ausentes").
     * Submit / Update buttons with loading states.
   - `ValidationBadge.tsx` and `DisparityAlert.tsx`:
     * Real-time parity status with clear visual feedback: Green badge when $P_V + A_V = I_V$ and $P_M + A_M = I_M$.
     * Disparity warnings detailing exact difference if sum does not match enrollment (e.g. "Varones: faltan 2" or "Mujeres: sobran 1").
     * Hard-blocks submit action until both genders match enrolled count exactly.
   - `DateSelector.tsx`: Date picker with today shortcut; enforces read-only mode with visual banner when viewing past dates for teachers.
   - `StaffAbsenceForm.tsx`: Subform / modal to log absent teachers or auxiliaries (*Ausencias de Docentes y Auxiliares*) with staff name, role type (Docente / Auxiliar), subject/area, shift, and reason.
   - `Observaciones`: Free-text field for daily incidents or notes.
2. Services & Hooks in `src/services/` and `src/hooks/`:
   - `attendanceService.ts`: CRUD methods for attendance records (`getAttendanceByCourseAndDate`, `upsertAttendance`, `getStaffAbsencesByShiftAndDate`, `createStaffAbsence`, `deleteStaffAbsence`).
   - `useAttendance.ts`: Custom hook managing local form state, validation, optimistic updates, and Supabase interaction.
3. Responsive UX:
   - Full 375px mobile responsiveness (large touch targets, sticky bottom action bar with validation status, clean numeric keypad inputs).
   - Desktop 1280px+ layout with multi-column card presentation.
4. Integrate with `App.tsx` router under `/attendance` and verify route protection for authenticated users.

Your Execution Protocol (Project Pattern 2B):
1. Initialize your BRIEFING.md, SCOPE.md, progress.md.
2. Run the iteration loop:
   a. Spawn 3 Explorers (teamwork_preview_explorer) with SCOPE.md.
   b. Spawn 1 Worker (teamwork_preview_worker) with explorer findings. Worker implements all M3 files. Include mandatory integrity warning verbatim!
   c. Spawn 2 Reviewers (teamwork_preview_reviewer).
   d. Spawn 2 Challengers (teamwork_preview_challenger) to verify build, typecheck, validation edge cases, and E2E feature coverage for F-03 through F-09.
   e. Spawn 1 Forensic Auditor (teamwork_preview_auditor).
   f. Gate check: record in GATE_STATUS.md. All must pass (CLEAN audit is mandatory).
3. Update progress.md, write handoff.md, and send completion message to parent.
