## 2026-08-20T14:49:51Z
You are Explorer 1 for Milestone 3 (M3: Teacher & Preceptor Daily Attendance Entry Module).
Your working directory is: d:\CanY\PROYECTOS CANY\App colegio\.agents\sub_orch_m3_explorer_1

Required reading before starting:
- Master Project Blueprint: d:\CanY\PROYECTOS CANY\App colegio\PROJECT.md
- Scope Document: d:\CanY\PROYECTOS CANY\App colegio\.agents\sub_orch_m3\SCOPE.md
- Original User Request: d:\CanY\PROYECTOS CANY\App colegio\ORIGINAL_REQUEST.md
- Test Infra: d:\CanY\PROYECTOS CANY\App colegio\TEST_INFRA.md

Your Mission:
Investigate and design the complete Component Architecture and Live Validation UX for the Attendance Module in `src/components/attendance/`:
1. Detailed breakdown and props/state specification for:
   - `AttendanceView.tsx` (Main container orchestrating all subcomponents, tabs/sections, date/course sync).
   - `CourseSelector.tsx` (Dropdown & searchable course list with cycle, technical orientation badges, shift info).
   - `CourseHeaderCard.tsx` (Course display card showing name e.g. "6° 1°", division, shift, orientation badge, and official enrollment $I_V, I_M, I_T$).
   - `AttendanceForm.tsx` (Live dual-gender inputs for $P_V, P_M, A_V, A_M$, auto-calculated totals $P_T, A_T$, live percentage $\%A = (P_T / I_T) \times 100$, quick-fill helpers: "Todos Presentes", "Todos Ausentes", "Autocompletar Ausentes", Submit/Update buttons).
   - `ValidationBadge.tsx` and `DisparityAlert.tsx` (Real-time parity status: green badge when $P_V + A_V = I_V$ and $P_M + A_M = I_M$; disparity warnings detailing exact differences like "Varones: faltan 2" or "Mujeres: sobran 1"; hard blocking submit when invalid).
   - `DateSelector.tsx` (Date picker, today shortcut, past date lockout banner).
   - `StaffAbsenceForm.tsx` (Modal/subform to log absent teachers or auxiliaries with staff name, role Docente/Auxiliar, subject/area, shift, reason).
   - `ObservacionesField.tsx` (Daily incidents & notes field).
2. Mobile (375px) and Desktop (1280px+) UX & Tailwind CSS specifications (sticky action bar, numeric input ergonomics, touch targets >= 44px).

Deliverables:
- Write your complete technical analysis and design specification to `d:\CanY\PROYECTOS CANY\App colegio\.agents\sub_orch_m3_explorer_1\analysis.md`
- Write your handoff summary to `d:\CanY\PROYECTOS CANY\App colegio\.agents\sub_orch_m3_explorer_1\handoff.md`
- Send completion message to parent when done.
