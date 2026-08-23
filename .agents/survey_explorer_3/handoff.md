# Handoff Report — survey_explorer_3

**Agent**: `survey_explorer_3` (Frontend & UI/UX Specification Specialist)  
**Role**: Specification Miner / Frontend Architect  
**Task**: Deep specification mining for the web application's frontend, UX, export engine, and state management.  
**Date**: 2026-08-20  

---

## 1. Observation

1. **User Requirements (`ORIGINAL_REQUEST.md`)**:
   - Lines 5-10: Requirement to build a responsive web application for "Escuela de Educación Secundaria Técnica N° 3 — Ntra. Sra. de la Merced" (Loma Hermosa) digitizing the daily attendance report ("Parte General de Alumnos"). Supabase backend (Auth + PostgreSQL).
   - Lines 12-30: Complete school structure defined: 3 shifts (*Mañana*, *Tarde*, *Vespertino*), Ciclo Básico (1°-3°), Ciclo Superior (4°-7° with TECQU, TECMM, TECET orientations), and specialized 1° 1° C.TEC.MMO.
   - Lines 34-52: Five core requirement modules: R1 (Auth & Roles: Admin, Preceptor, Profesor), R2 (Daily Attendance Submission with gender breakdown V/M, real-time validation $P+A=I$, observations, staff absences), R3 (Admin/Preceptor Dashboard with shift tabs, daily summary table mirroring CSV, trend charts, staff absences panel, Excel & PDF export), R4 (Course & Shift Management, CSV seed data preloading), R5 (Responsive Web Design on 375px mobile and 1280px+ desktop).
   - Lines 53-85: Complete Acceptance Criteria and verification scenarios.

2. **Reference Paper Form Structure (`PARTE GENERALES TV.xlsx - T.V.csv`)**:
   - Lines 1-7: Header with school title `"ESCUELA DE EDUCACIÓN SECUNDARIA TÉCNICA N° 3 \"Ntra. Sra. de la Merced\""`, `"PARTE GENERAL"`, `"ALUMNOS"`, and date format `"LOMA HERMOSA, ……de ……………………………… de 20 ......"`.
   - Lines 9-10: Table column structure: `CURSOS`, `ORIENTACIÓN`, `INSCRIPTOS (V, M, T)`, `PRESENTES (V, M, T)`, `AUSENTES (V, M, T)`.
   - Lines 11-20: Seed data for Turno Vespertino:
     * 5º4º TECET (8 V, 0 M, 8 Total)
     * 6º1º TECQU (11 V, 4 M, 15 Total)
     * 6º2º TECMM (9 V, 14 M, 23 Total)
     * 6º3º TECET (23 V, 2 M, 25 Total)
     * 6º4º TECET (6 V, 0 M, 6 Total)
     * 7º1º TECQU (5 V, 8 M, 13 Total)
     * 7º2º TECMM (9 V, 9 M, 18 Total)
     * 7º3º TECET (20 V, 9 M, 29 Total)
     * 7º4º TECET (8 V, 0 M, 8 Total)
     * 1° 1° C.TEC.MMO (20 V, 7 M, 27 Total)
   - Line 23: Totals: 119 V, 53 M, 172 Total Inscriptos.
   - Lines 24-25: `OBSERVACIONES` section and `AUSENTE DE DOCENTES Y AUXILIARES:` section.

3. **Workspace Deliverable**:
   - Detailed specification analysis compiled to `d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_3\analysis.md`.

---

## 2. Logic Chain

1. **Mapping Paper Form to Digital UX**:
   - The CSV demonstrates that the physical school form operates strictly on gender breakdown ($V$ and $M$) for enrollment, presence, and absence, with an overall row and column total.
   - Therefore, the digital form must enforce immediate mathematical equality ($Presentes_V + Ausentes_V = Inscriptos_V$ and $Presentes_M + Ausentes_M = Inscriptos_M$) before permitting submission, eliminating human arithmetic errors at the source.

2. **Role-Based Workflows**:
   - Professors only need access to submit attendance for their assigned classes for the current date, requiring a focused, mobile-friendly input view (`/attendance`) with large touch targets.
   - Preceptors and Administrators require a macro perspective across all three shifts (`/dashboard`), with instant shift-filtering tabs, live aggregation of missing/completed submissions, trend analytics, and 1-click export to official PDF and Excel formats.

3. **State Management & Realtime Sync**:
   - Because multiple teachers in different classrooms may submit data concurrently while preceptors monitor the shift in real time, Supabase Realtime subscriptions (`postgres_changes`) combined with optimistic React state updates provide an instantaneous feedback loop.

4. **Export Engine Precision**:
   - The official physical form contains specific institutional headers, date strings in Argentine formal syntax, multi-level headers, and signature placeholders. `jspdf-autotable` and SheetJS (`xlsx`) are specified to generate exact replicas suitable for official institutional filing.

---

## 3. Caveats

- The CSV reference provides seed enrollment numbers specifically for the *Vespertino* (evening) shift. Initial enrollment numbers for *Mañana* and *Tarde* shifts will be configured by the Administrator via the course management view or an administrative onboarding setup.
- Past dates are strictly read-only for standard teachers, while Administrators and Preceptors have administrative edit overrides.

---

## 4. Conclusion

A complete, granular specification for the frontend architecture, UI/UX flows, state management, component tree, responsive layouts (375px mobile and 1280px+ desktop), and export engine (Excel/PDF) has been established and documented in `analysis.md`. The design is fully aligned with all requirements in `ORIGINAL_REQUEST.md` and the reference paper layout in `PARTE GENERALES TV.xlsx - T.V.csv`.

---

## 5. Verification Method

To independently verify the specification and deliverables:
1. **Inspect Specification Document**:
   - View `d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_3\analysis.md` and verify all 20 discovered features, 12 edge cases, 5 acceptance test suites, and detailed UI/UX wireframe flows.
2. **Verify Layout Match**:
   - Cross-check the table column hierarchy in Section 3 and Section 4 of `analysis.md` against `d:\CanY\PROYECTOS CANY\App colegio\PARTE GENERALES TV.xlsx - T.V.csv`.
3. **Verify Acceptance Criteria Coverage**:
   - Confirm that all criteria from `ORIGINAL_REQUEST.md` (R1 through R5) have corresponding implementation specifications and test scenarios in `analysis.md`.
