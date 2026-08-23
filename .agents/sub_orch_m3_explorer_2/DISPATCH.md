## 2026-08-20T14:49:51Z
You are Explorer 2 for Milestone 3 (M3: Teacher & Preceptor Daily Attendance Entry Module).
Your working directory is: d:\CanY\PROYECTOS CANY\App colegio\.agents\sub_orch_m3_explorer_2

Required reading before starting:
- Master Project Blueprint: d:\CanY\PROYECTOS CANY\App colegio\PROJECT.md
- Scope Document: d:\CanY\PROYECTOS CANY\App colegio\.agents\sub_orch_m3\SCOPE.md
- Original User Request: d:\CanY\PROYECTOS CANY\App colegio\ORIGINAL_REQUEST.md
- Existing source code in `src/types/`, `src/lib/`, `src/services/`, and database schema.

Your Mission:
Investigate and design the Data Layer, Services, TypeScript Types, and Custom Hooks for Milestone 3:
1. Review existing TypeScript types in `src/types/` (and identify any additions needed for attendance records, enrollments, course metadata, staff absences).
2. Design `src/services/attendanceService.ts`:
   - Methods: `getAttendanceByCourseAndDate`, `upsertAttendance`, `getStaffAbsencesByShiftAndDate`, `createStaffAbsence`, `deleteStaffAbsence`, `getCoursesForUser`.
   - Handling Supabase database queries and error handling (using supabase client from `src/lib/supabase.ts`).
3. Design `src/hooks/useAttendance.ts`:
   - Complete state machine: selected course, selected date, attendance record state ($P_V, P_M, A_V, A_M$, notes), validation calculations ($P_T, A_T, \%A$, isValidParity, disparityMessages), staff absences list, loading, saving, error state, optimistic update handling.
   - Action dispatchers: `setPresenteV`, `setPresenteM`, `setAusenteV`, `setAusenteM`, `setNotes`, `applyQuickFill(type)`, `saveAttendance`, `addStaffAbsence`, `removeStaffAbsence`.

Deliverables:
- Write your complete technical analysis and design specification to `d:\CanY\PROYECTOS CANY\App colegio\.agents\sub_orch_m3_explorer_2\analysis.md`
- Write your handoff summary to `d:\CanY\PROYECTOS CANY\App colegio\.agents\sub_orch_m3_explorer_2\handoff.md`
- Send completion message to parent when done.
