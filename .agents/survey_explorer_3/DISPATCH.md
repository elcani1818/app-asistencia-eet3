## 2026-08-20T14:13:47Z

Task:
Perform a deep specification mining for the web application's frontend, UX, and export engine:
- Read ORIGINAL_REQUEST.md and inspect `d:\CanY\PROYECTOS CANY\App colegio\PARTE GENERALES TV.xlsx - T.V.csv`
- Define the technical stack & architecture:
  - Frontend: React + TypeScript + Vite + Tailwind CSS + Lucide React + Recharts + jsPDF / jspdf-autotable + xlsx (or exceljs).
  - State management & Supabase client integration with real-time subscriptions / optimistic updates.
- Detail the complete UI views and user flows:
  1. Auth / Login view: Supabase auth login, role-based redirection, error handling.
  2. Teacher Attendance Entry View:
     - Course selector (restricted to assigned courses for Profesor; all courses for Preceptor/Admin).
     - Pre-populated course header (year, division, orientation, inscriptos V/M/T).
     - Number inputs for Presentes (V, M) and Ausentes (V, M) with real-time automatic total calculation.
     - Real-time validation warning if Presentes + Ausentes != Inscriptos for either gender. Block submission if invalid.
     - Date selection (defaults to today; past dates read-only for teachers).
     - Observaciones input and Staff Absences (Ausencias de Docentes/Auxiliares) section.
  3. Admin & Preceptor Dashboard:
     - Shift Switcher tabs (Mañana, Tarde, Vespertino) with instant filter.
     - Daily Summary Table mirroring the paper form layout (`PARTE GENERALES TV.xlsx - T.V.csv`) with full breakdown by course and bottom Totals row (Total Inscriptos, Total Presentes, Total Ausentes, Overall % Asistencia).
     - Attendance Trend Charts: Time series of % attendance by shift/course/school over selectable date ranges.
     - Absent Teachers/Auxiliaries panel for the selected date and shift.
     - Export engine: 1-click export to Excel (.xlsx) and PDF formatted precisely like the official school "Parte General" sheet.
  4. Course & User Management Views (Admin only):
     - Course catalog CRUD: Add/edit courses, assign shifts, orientations, enrollment numbers (Inscriptos V/M).
     - User management: List users, assign roles (Admin, Preceptor, Profesor), assign courses to professors.
  5. Responsive Design Specs:
     - Mobile Viewport (375px): clean touch-friendly forms, stacked summary cards or horizontally scrollable table container without breaking layout, responsive navigation bar.
     - Desktop Viewport (1280px+): full multi-column dashboard, wide table layout matching original paper sheet.
  6. Acceptance criteria checklist and test scenarios.

Write your specification report to: `d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_3\analysis.md`
Write your handoff report to: `d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_3\handoff.md`
Send a completion message back when done.
