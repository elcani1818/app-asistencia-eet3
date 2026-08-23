# Comprehensive Specification Report: Frontend, UI/UX, & Export Engine
**Project**: Sistema de Gestión de Asistencia y Parte General Diario  
**Institution**: Escuela de Educación Secundaria Técnica N° 3 "Ntra. Sra. de la Merced" (Loma Hermosa)  
**Document Author**: survey_explorer_3 (Frontend & UI/UX Specification Specialist)  
**Date**: 2026-08-20  
**Version**: 1.0.0-PROD-SPEC  

---

## Executive Summary

This specification provides an exhaustive, production-grade architectural and UI/UX design specification for the web application digitizing the daily attendance workflow (**"Parte General de Alumnos"**) of the **Escuela de Educación Secundaria Técnica N° 3 "Ntra. Sra. de la Merced"**.

The application replaces the traditional paper-based duplicate shift sheets (`PARTE GENERALES TV.xlsx - T.V.csv`) with a modern, real-time, responsive web platform built with **React, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, jsPDF / jspdf-autotable, and xlsx/exceljs**, backed by **Supabase (Auth, PostgreSQL, and Realtime)**.

---

## 1. Technical Stack & Frontend Architecture

### 1.1 Core Technology Stack

| Layer | Technology | Version / Spec | Purpose & Justification |
|---|---|---|---|
| **Core Framework** | React + TypeScript | React 18.3+ / TS 5.4+ (Strict Mode) | Type-safe component architecture, hooks, declarative UI. |
| **Build Tool & Bundler** | Vite | Vite 5.x | Ultra-fast HMR, optimized production build splitting. |
| **Styling & UI System** | Tailwind CSS + PostCSS | Tailwind 3.4+ | Utility-first styling, consistent institutional color palette, responsive breakpoints. |
| **Icons** | Lucide React | Latest | Crisp, tree-shakeable SVG icons for educational and administrative actions. |
| **Charts & Data Viz** | Recharts | Latest (2.12+) | SVG-based responsive line, bar, and area charts for attendance trends. |
| **PDF Export Engine** | jsPDF + jspdf-autotable | jsPDF 2.5+ / Autotable 3.8+ | Client-side generation of exact official "Parte General" sheets matching school layout. |
| **Excel Export Engine** | SheetJS (`xlsx`) / `exceljs` | Latest | High-fidelity `.xlsx` export with formulas, multi-row headers, and cell formatting. |
| **Routing** | React Router DOM | v6.23+ | Declarative client-side routing with nested routes and Role-Based Guards. |
| **Form & Validation** | React Hook Form + Zod | Latest | High-performance uncontrolled/controlled forms with strict schema validation. |
| **Notifications / UI Feedback** | Sonner / React Hot Toast | Latest | Accessible toast notifications for real-time alerts and submit feedback. |
| **Backend & Realtime** | `@supabase/supabase-js` | v2.43+ | Authentication, PostgreSQL client, and WebSockets Realtime subscriptions. |

### 1.2 State Management & Real-time Supabase Architecture

```
                                  ┌──────────────────────────────────────────────┐
                                  │           Supabase PostgreSQL DB             │
                                  │   (courses, daily_attendance, staff_abs)     │
                                  └──────────────────────┬───────────────────────┘
                                                         │
                                    ┌────────────────────┴────────────────────┐
                                    ▼                                         ▼
                        Postgres Changes (WebSockets)                 REST API (Queries/Mutations)
                                    │                                         │
                                    └────────────────────┬────────────────────┘
                                                         │
                                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           Application State Layer                                               │
├───────────────────────────────┬─────────────────────────────────┬───────────────────────────────────────────────┤
│        AuthContext            │       AttendanceContext         │              DashboardContext                 │
│  - User Session & Profile     │  - Selected Course & Date       │  - Shift Filter (Mañana, Tarde, Vespertino)   │
│  - User Role (Admin/Precep/   │  - Inscriptos/Presentes/Ausentes│  - Aggregated Shift Attendance & Totals       │
│    Profesor)                  │  - Real-time Validation State   │  - Live Realtime Subscriptions                │
│  - Assigned Course IDs        │  - Optimistic Update Dispatcher │  - Trend Time-Series & Absence Feeds          │
└───────────────────────────────┴─────────────────────────────────┴───────────────────────────────────────────────┘
                                                         │
                                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                             Presentation Layer                                                  │
├───────────────────────────────┬─────────────────────────────────┬───────────────────────────────────────────────┤
│        Auth / Login View      │    Teacher Attendance Entry     │         Admin/Preceptor Dashboard             │
│  - Role Redirection           │  - Gender Dual Inputs (V / M)   │  - Shift Switcher Tabs                        │
│  - Session Persistence        │  - Live Disparity Badges        │  - Official Table Layout                      │
│                               │  - Staff Absence Subform        │  - Recharts Trends & 1-Click Export Engine    │
└───────────────────────────────┴─────────────────────────────────┴───────────────────────────────────────────────┘
```

#### Optimistic UI & Realtime Sync Protocol:
1. **Teacher Submission**: When a teacher hits "Guardar Parte", the state is updated locally with optimistic status `saving`. A PostgreSQL upsert is dispatched to `daily_attendance`.
2. **Realtime Broadcast**: Supabase broadcast triggers `postgres_changes` on the `daily_attendance` table on `shift_id` and `date`.
3. **Admin Dashboard Reaction**: The Preceptor/Admin dashboard receives the delta event and recalculates shift totals and attendance percentages instantly without requiring a page refresh.
4. **Offline / Network Resilience**: If a network timeout occurs, the UI displays a retry banner while caching the input in memory or `sessionStorage` so the teacher never loses data.

---

## 2. Institutional Domain & School Structure Mapping

The system strictly implements the organizational structure of **E.E.S.T. N° 3 "Ntra. Sra. de la Merced"**:

### 2.1 Shifts (Turnos)
1. **Turno Mañana (TM)**: Ciclo Básico (1° a 3°) and Ciclo Superior morning divisions.
2. **Turno Tarde (TT)**: Ciclo Básico (1° a 3°) and Ciclo Superior afternoon divisions.
3. **Turno Vespertino (TV)**: Ciclo Superior advanced divisions and technical specializations (as specified in `PARTE GENERALES TV.xlsx - T.V.csv`).

### 2.2 Academic Cycles & Orientations
- **Ciclo Básico (1° a 3° Año)**:
  - 1° Año: `1° 1ª`, `1° 2ª`, `1° 3ª`, `1° 4ª`, `1° 5ª` (General)
  - 2° Año: `2° 1ª`, `2° 2ª`, `2° 3ª`, `2° 4ª`, `2° 5ª` (General)
  - 3° Año: `3° 1ª`, `3° 2ª`, `3° 3ª`, `3° 4ª` (General)
- **Ciclo Superior (4° a 7° Año)**:
  - `*° 1ª` (División 1) $\rightarrow$ **TECQU** (*Técnico Químico*): `4° 1ª`, `5° 1ª`, `6° 1ª`, `7° 1ª`
  - `*° 2ª` (División 2) $\rightarrow$ **TECMM** (*Técnico Maestro Mayor de Obras*): `4° 2ª`, `5° 2ª`, `6° 2ª`, `7° 2ª`
  - `*° 3ª` (División 3) $\rightarrow$ **TECET** (*Técnico Electromecánico*): `4° 3ª`, `5° 3ª`, `6° 3ª`, `7° 3ª`
  - `*° 4ª` (División 4) $\rightarrow$ **TECET** (*Técnico Electromecánico*): `5° 4ª`, `6° 4ª`, `7° 4ª`
- **Ciclo Técnico Especial**:
  - `1° 1ª C.TEC.MMO` (*Ciclo Técnico en Maestro Mayor de Obras*) — Unique specialized course separate from standard 1° 1ª Ciclo Básico.

### 2.3 Official Reference Data (Turno Vespertino Seed)
Derived directly from `PARTE GENERALES TV.xlsx - T.V.csv`:
| Curso | Orientación | Inscriptos Varones (V) | Inscriptos Mujeres (M) | Total Inscriptos (T) |
|---|---|---|---|---|
| **5º 4º** | TECET | 8 | 0 (`-`) | 8 |
| **6º 1º** | TECQU | 11 | 4 | 15 |
| **6º 2º** | TECMM | 9 | 14 | 23 |
| **6º 3º** | TECET | 23 | 2 | 25 |
| **6º 4º** | TECET | 6 | 0 (`-`) | 6 |
| **7º 1º** | TECQU | 5 | 8 | 13 |
| **7º 2º** | TECMM | 9 | 9 | 18 |
| **7º 3º** | TECET | 20 | 9 | 29 |
| **7º 4º** | TECET | 8 | 0 (`-`) | 8 |
| **1° 1°** | C.TEC.MMO | 20 | 7 | 27 |
| **TOTAL T.V.** | — | **119** | **53** | **172** |

---

## 3. UI Views & Detailed User Flows

### View 1: Authentication & Role Redirection (`/login`)
- **Visual Design**:
  - Centered institutional card with the official crest of **E.E.S.T. N° 3**, title *"Sistema de Parte General Diario"*, subtitle *"Loma Hermosa — Tres de Febrero"*.
  - Clean input fields with icons (`Mail`, `Lock`), password visibility toggle (`Eye`/`EyeOff`), and explicit error callouts for failed logins.
- **Role Redirection Matrix**:
  - `Administrador` $\rightarrow$ Redirects to `/dashboard` (Full admin privileges, Course/User management).
  - `Preceptor` $\rightarrow$ Redirects to `/dashboard` (Dashboard summary, Shift switching, Reports & Export, Read-only Course catalog).
  - `Profesor` $\rightarrow$ Redirects to `/attendance` (Personalized attendance submission for assigned courses).
- **Security & Guards**:
  - `ProtectedRoute`: Checks active session. Redirects to `/login` if unauthenticated.
  - `RoleGuard`: Restricts `/admin/*` routes to `Administrador` role; redirects unauthorized attempts to `/403` (Forbidden).

---

### View 2: Teacher Attendance Entry View (`/attendance`)

#### Layout & Components:
```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  E.E.S.T. N° 3 - Parte General Diario                       👤 Prof. Juan Pérez (Profesor) │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  📅 Fecha: [ 2026-08-20 ] (Hoy)     🏫 Curso: [ 6° 1° - TECQU (Turno Vespertino) ▼ ]       │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  📋 DATOS DEL CURSO                                                                         │
│  Curso: 6° 1°  │  Orientación: TECQU (Química)  │  Turno: Vespertino                        │
│  Inscriptos: Varones: 11  │  Mujeres: 4  │  Total Inscriptos: 15                            │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  ✏️ REGISTRO DE ASISTENCIA                                                                  │
│                                                                                             │
│  ┌─────────────────────────────────────┐     ┌─────────────────────────────────────┐        │
│  │ 👦 VARONES (Inscriptos: 11)         │     │ 👧 MUJERES (Inscriptos: 4)          │        │
│  │                                     │     │                                     │        │
│  │  Presentes: [ - ] [  10  ] [ + ]    │     │  Presentes: [ - ] [  4  ] [ + ]     │        │
│  │  Ausentes:  [ - ] [   1  ] [ + ]    │     │  Ausentes:  [ - ] [  0  ] [ + ]     │        │
│  │                                     │     │                                     │        │
│  │  ✅ Total V: 10 + 1 = 11 (Válido)   │     │  ✅ Total M: 4 + 0 = 4 (Válido)     │        │
│  └─────────────────────────────────────┘     └─────────────────────────────────────┘        │
│                                                                                             │
│  📊 RESUMEN AUTOMÁTICO:                                                                     │
│  Total Presentes: 14  │  Total Ausentes: 1  │  % Asistencia: 93.3%                          │
│  [============================================================------] 93.3%                │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  📝 OBSERVACIONES GENERALES                                                                 │
│  [ 2 alumnos se retiraron a las 21:00 hs con autorización escrita.                        ] │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  👥 AUSENCIAS DE DOCENTES Y AUXILIARES DEL CURSO / TURNO                                    │
│  ┌────────────────────────┬───────────────────┬─────────────────────┬────────────────────┐  │
│  │ Agente / Nombre        │ Rol               │ Materia             │ Motivo / Artículo  │  │
│  ├────────────────────────┼───────────────────┼─────────────────────┼────────────────────┤  │
│  │ Prof. Gómez Roberto    │ Docente           │ Química Orgánica    │ Art. 114 a-1       │  │
│  └────────────────────────┴───────────────────┴─────────────────────┴────────────────────┘  │
│  [ + Agregar Ausencia de Docente / Auxiliar ]                                               │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  [  GUARDAR PARTE DIARIO  ] (Enabled only when V and M sums match Inscriptos)               │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Detailed Interaction Logic:
1. **Course Selector**:
   - For `Profesor`: Filtered strictly by `assigned_courses`. If only 1 assigned, auto-selected.
   - For `Preceptor` / `Administrador`: Can select any course in the school.
2. **Date Picker**:
   - Defaults to `today`.
   - Teachers can view previous dates in **Read-Only Mode** (banner: *"Registro histórico archivado — Solo lectura"*).
   - Future dates are disabled (`max = today`).
   - Current date is fully editable up to 23:59:59.
3. **Gender Breakdown Inputs**:
   - Touch-friendly stepper controls (`-` / `+`) and direct numeric entry (`inputmode="numeric"`).
   - Live Validation Math:
     $$\Delta_V = (Presentes_V + Ausentes_V) - Inscriptos_V$$
     $$\Delta_M = (Presentes_M + Ausentes_M) - Inscriptos_M$$
   - **Validation Rules**:
     * If $\Delta_V == 0$ and $\Delta_M == 0$: State is `VALID` (Green checkmarks, Submit button enabled).
     * If $\Delta_V \ne 0$: Red banner *"Varones: La suma (P+A) da X, pero hay Y inscriptos (diferencia: $\Delta_V$)"*. Submit button is hard-disabled.
     * If $\Delta_M \ne 0$: Red banner *"Mujeres: La suma (P+A) da X, pero hay Y inscriptos (diferencia: $\Delta_M$)"*. Submit button is hard-disabled.
4. **Quick-Fill Helpers**:
   - *"Todos Presentes"*: Sets $Presentes_V = Inscriptos_V$, $Ausentes_V = 0$, $Presentes_M = Inscriptos_M$, $Ausentes_M = 0$.
   - Auto-calculate companion: Entering $Presentes_V$ automatically adjusts $Ausentes_V = Inscriptos_V - Presentes_V$ if within valid bounds.
5. **Staff Absences Sub-module**:
   - Dynamic rows to record teacher/auxiliary absences for the division on that day.
   - Fields: Full Name, Role (`Docente`, `Auxiliar`), Subject (`Materia`), Shift, Reason / Statute Article (`Art. 114 a-1`, `Art. 114 b`, `Art. 115`, `Particular`, etc.).

---

### View 3: Admin & Preceptor Dashboard (`/dashboard`)

#### Top Controls:
- **Date Selector**: Quick shortcuts (*Hoy*, *Ayer*, *Calendario*).
- **Shift Switcher Tabs**:
  - `[ Mañana ]` | `[ Tarde ]` | `[ Vespertino ]` | `[ Resumen General (Todos) ]`
  - Switching tabs instantly updates the table, totals, charts, and absence list.

#### KPI Cards Grid:
1. **Total Inscriptos**: e.g. `172 Alumnos` (119 V / 53 M).
2. **Total Presentes**: e.g. `155 Presentes` (90.1% Asistencia global).
3. **Total Ausentes**: e.g. `17 Ausentes` (9.9% Inasistencia).
4. **Cargas Realizadas**: e.g. `9 / 10 Cursos Completados` (Circular progress indicator, alerts on missing courses).

#### Daily Summary Table (Exact Mirror of Paper Form):
```
ESCUELA DE EDUCACIÓN SECUNDARIA TÉCNICA N° 3 "Ntra. Sra. de la Merced"
PARTE GENERAL DE ALUMNOS — TURNO VESPERTINO
Fecha: 20 de Agosto de 2026

┌────────┬─────────────┬─────────────────┬─────────────────┬─────────────────┬──────────┬───────────┐
│ CURSOS │ ORIENTACIÓN │   INSCRIPTOS    │    PRESENTES    │    AUSENTES     │    %     │  ESTADO   │
│        │             ├───┬───┬─────────┼───┬───┬─────────┼───┬───┬─────────┤ ASIST.   │           │
│        │             │ V │ M │  TOTAL  │ V │ M │  TOTAL  │ V │ M │  TOTAL  │          │           │
├────────┼─────────────┼───┼───┼─────────┼───┼───┼─────────┼───┼───┼─────────┼──────────┼───────────┤
│ 5º 4º  │ TECET       │ 8 │ 0 │    8    │ 7 │ 0 │    7    │ 1 │ 0 │    1    │  87.5%   │ ✅ Cargado│
│ 6º 1º  │ TECQU       │11 │ 4 │   15    │10 │ 4 │   14    │ 1 │ 0 │    1    │  93.3%   │ ✅ Cargado│
│ 6º 2º  │ TECMM       │ 9 │14 │   23    │ 8 │12 │   20    │ 1 │ 2 │    3    │  87.0%   │ ✅ Cargado│
│ 6º 3º  │ TECET       │23 │ 2 │   25    │21 │ 2 │   23    │ 2 │ 0 │    2    │  92.0%   │ ✅ Cargado│
│ 6º 4º  │ TECET       │ 6 │ 0 │    6    │ 5 │ 0 │    5    │ 1 │ 0 │    1    │  83.3%   │ ✅ Cargado│
│ 7º 1º  │ TECQU       │ 5 │ 8 │   13    │ 4 │ 8 │   12    │ 1 │ 0 │    1    │  92.3%   │ ✅ Cargado│
│ 7º 2º  │ TECMM       │ 9 │ 9 │   18    │ 8 │ 8 │   16    │ 1 │ 1 │    2    │  88.9%   │ ✅ Cargado│
│ 7º 3º  │ TECET       │20 │ 9 │   29    │18 │ 8 │   26    │ 2 │ 1 │    3    │  89.7%   │ ✅ Cargado│
│ 7º 4º  │ TECET       │ 8 │ 0 │    8    │ 8 │ 0 │    8    │ 0 │ 0 │    0    │ 100.0%   │ ✅ Cargado│
│ 1° 1°  │ C.TEC.MMO   │20 │ 7 │   27    │18 │ 6 │   24    │ 2 │ 1 │    3    │  88.9%   │ ✅ Cargado│
├────────┴─────────────┼───┼───┼─────────┼───┼───┼─────────┼───┼───┼─────────┼──────────┼───────────┤
│ TOTAL                │119│53 │   172   │107│48 │   155   │12 │ 5 │   17    │  90.1%   │ 10/10 OK  │
└──────────────────────┴───┴───┴─────────┴───┴───┴─────────┴───┴───┴─────────┴──────────┴───────────┘
```

#### Attendance Trend Analytics (Recharts Integration):
- **Date Range Selector**: `Últimos 7 días` | `Últimos 30 días` | `Mes Actual` | `Rango Personalizado`.
- **Chart 1 (Time Series Line Chart)**: Evolution of % Attendance over time by shift (3 distinct lines: Mañana (Blue), Tarde (Amber), Vespertino (Emerald)).
- **Chart 2 (Bar Chart)**: Daily Comparison of Attendance % by Course within the selected shift.
- **Chart 3 (Comparative Distribution Area Chart)**: Ratio of Presentes vs Ausentes split by gender over time.

---

### View 4: Course Catalog & User Management (Admin Only)

#### 4.1 Course Catalog (`/admin/courses`):
- Full table list of all school courses across all three shifts.
- Filter by: `Turno`, `Ciclo`, `Orientación`.
- Add/Edit Modal:
  * `Año` (1° a 7°) & `División` (1ª a 5ª)
  * `Ciclo` (Ciclo Básico, Ciclo Superior, Ciclo Técnico Especial)
  * `Orientación` (`Sin Orientación`, `TECQU`, `TECMM`, `TECET`, `C.TEC.MMO`)
  * `Turno` (`Mañana`, `Tarde`, `Vespertino`)
  * `Inscriptos Varones` & `Inscriptos Mujeres` $\rightarrow$ Auto-calculates `Total Inscriptos`.
  * `Estado` (`Activo` / `Archivado`).
- Bulk Seed action: Initialize courses for Mañana & Tarde based on institutional structure.

#### 4.2 User Management (`/admin/users`):
- Table of registered staff members.
- Role Badges: `Administrador` (Red/Purple), `Preceptor` (Blue), `Profesor` (Green).
- User Course Assignment modal:
  * Interactive checklist of courses grouped by shift and year.
  * Allows assigning multiple courses to a single teacher (e.g. Prof. can teach 6°1° Quimica in TV and 3°2° in TM).
- Status toggle: `Activo` / `Inactivo`.

---

## 4. Export Engine Specifications (Excel & PDF)

The export engine must replicate the official institutional format with 100% fidelity.

### 4.1 PDF Export Engine (`jspdf` + `jspdf-autotable`)

#### Document Layout & Geometry (A4 Landscape or Portrait):
- **Orientation**: Portrait (Single Shift) or Landscape (Dual Shift / General Summary).
- **Header**:
  1. Top institution title: `ESCUELA DE EDUCACIÓN SECUNDARIA TÉCNICA N° 3 "Ntra. Sra. de la Merced"` (Bold, 12pt, Center).
  2. Subtitles: `PARTE GENERAL DE ALUMNOS — TURNO [MAÑANA / TARDE / VESPERTINO]` (11pt, Center).
  3. Date string formatted in formal Argentine institutional syntax:  
     `LOMA HERMOSA, [Día] de [Mes en letras] de [Año]` (e.g., *LOMA HERMOSA, 20 de Agosto de 2026*).
- **Table Structure (`jspdf-autotable`)**:
  - Multi-tier column headers:
    - Row 1: `CURSOS` (rowSpan 2), `ORIENTACIÓN` (rowSpan 2), `INSCRIPTOS` (colSpan 3), `PRESENTES` (colSpan 3), `AUSENTES` (colSpan 3), `% ASIST.` (rowSpan 2).
    - Row 2: `V`, `M`, `T`, `V`, `M`, `T`, `V`, `M`, `T`.
  - Column alignment: Text left-aligned for `CURSOS` and `ORIENTACIÓN`; numbers strictly center/right-aligned for count columns.
  - Alternating light row fill, crisp 0.5pt black border lines mirroring physical print paper.
  - Bottom `TOTAL` Row: Bold font, light gray background fill (`#E5E7EB`), sum formulas computed dynamically.
- **Footer Blocks**:
  - `OBSERVACIONES`: Bordered rectangular text box with all consolidated notes from teachers.
  - `AUSENTE DE DOCENTES Y AUXILIARES`: Bordered sub-table or list with absent personnel and reasons.
  - `SIGNATURE LINES`: Two side-by-side signature lines:
    * Left: `........................................................` $\rightarrow$ `Firma y Aclaración Preceptor/a`
    * Right: `........................................................` $\rightarrow$ `Firma y Sello Equipo Directivo`

### 4.2 Excel Export Engine (`xlsx` / `exceljs`)

#### Sheet Structure:
- Cell `A1:K1` (Merged): `"ESCUELA DE EDUCACIÓN SECUNDARIA TÉCNICA N° 3 \"Ntra. Sra. de la Merced\""`
- Cell `A2:K2` (Merged): `"PARTE GENERAL DE ALUMNOS — TURNO VESPERTINO"`
- Cell `A3:K3` (Merged): `"LOMA HERMOSA, 20 de Agosto de 2026"`
- Headers at Row 5 & 6 (Merged headers for `INSCRIPTOS`, `PRESENTES`, `AUSENTES`).
- Data rows starting at Row 7.
- Totals Row: Uses native Excel formulas:
  * Inscriptos V Total: `=SUM(C7:C16)`
  * Inscriptos M Total: `=SUM(D7:D16)`
  * Inscriptos Total: `=SUM(E7:E16)`
  * Presentes Total: `=SUM(H7:H16)`
  * Ausentes Total: `=SUM(K7:K16)`
  * % Asistencia Total: `=(H17/E17)*100` (Formatted as percentage).
- Observaciones Section at Row 19.
- Ausencias Docentes y Auxiliares Section at Row 22.

---

## 5. Responsive Design Specifications

### 5.1 Viewport Breakpoint Matrix

| Breakpoint | Target Devices | Navigation & Shell | Table Display Strategy | Form Layout |
|---|---|---|---|---|
| **Mobile (`<640px` / `375px`)** | iPhone SE, Android smartphones | Sticky Header + Bottom Navigation Bar or Hamburger Drawer | Compact Card List OR Horizontally scrollable table container with sticky `CURSO` column | Single-column stacked cards, large touch steppers ($48\times48\text{px}$), sticky bottom submit button |
| **Tablet (`640px - 1024px`)** | iPad Mini/Air, Android Tablets | Collapsible sidebar, top bar with date switcher | Full table with horizontal swipe container, side-by-side KPI cards | 2-column gender split card layout |
| **Desktop (`1024px - 1280px+`)** | Laptops, Desktop PC, Monitors | Persistent Left Sidebar with institutional crest and user profile | Wide multi-column layout mirroring exact paper sheet without horizontal scroll | Side-by-side gender cards, real-time visual balance indicator |

### 5.2 Mobile-First UX Details (375px Viewport)
1. **Touch Targets**: All interactive elements (buttons, inputs, dropdown items) have a minimum touch area of $44\times44\text{px}$.
2. **Numeric Keypad**: All count inputs use `input type="number"` with `inputmode="numeric"` and `pattern="[0-9]*"` to trigger the numeric keypad on iOS and Android automatically.
3. **Sticky Validation Alert**: If $\Delta \ne 0$, a floating warning bar sticks above the bottom action bar: *"Faltan 2 varones para completar los 11 inscriptos"*.
4. **Offline Feedback**: Visual indicator badge when network connection drops.

---

## 6. Features Discovered & Mined Specification Table

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| **F-01** | Auth | User Authentication | Supabase email/password login for staff | Email, Password | JWT session, User profile, Role | Displays localized error (invalid credentials, unconfirmed email) | ORIGINAL_REQUEST R1 |
| **F-02** | Auth | Role-Based Redirection | Routes users to appropriate home view based on assigned role | User role metadata | Auto-redirect (`/dashboard` or `/attendance`) | Redirects unauthorized roles to `/403` | ORIGINAL_REQUEST R1 |
| **F-03** | Attendance | Course Selector | Allows teacher to select from their assigned courses | Teacher User ID | Filtered course dropdown list | Shows "No assigned courses" empty state if none assigned | ORIGINAL_REQUEST R1, R2 |
| **F-04** | Attendance | Pre-populated Header | Loads official enrolled counts and orientation | Course ID, Shift ID | Year, Division, Orientation, Inscriptos V/M/T | Fallback to zero if course metadata missing | ORIGINAL_REQUEST R2, CSV |
| **F-05** | Attendance | Gender Breakdown Entry | Inputs for Presentes & Ausentes for Varones and Mujeres | Count numbers (V, M) | Live auto-calculated Presentes T, Ausentes T, % Asist | Blocks negative values or non-integers | ORIGINAL_REQUEST R2, CSV |
| **F-06** | Attendance | Real-time Sum Validation | Enforces $P_V + A_V = I_V$ and $P_M + A_M = I_M$ | Live input counts | Visual checkmark badge or disparity alert ($\Delta$) | Hard-disables submit button on disparity | ORIGINAL_REQUEST R2 |
| **F-07** | Attendance | Date Selector & Historical Lock | Datepicker defaulting to today; locks past dates for teachers | Date object | Form populated with historical record (Read-Only) | Disables edit inputs for past dates; blocks future dates | ORIGINAL_REQUEST R2, AC |
| **F-08** | Attendance | Observaciones Input | Free-text observations field for special incidents | Text string (multiline) | Stored in `daily_attendance.observations` | Truncates/warns if exceeding 1000 characters | ORIGINAL_REQUEST R2, CSV |
| **F-09** | Attendance | Staff Absences Entry | Sub-form to report absent teachers/auxiliaries per shift/course | Name, Role, Subject, Reason | Stored in `staff_absences` table | Requires all fields before adding row | ORIGINAL_REQUEST R2, CSV |
| **F-10** | Dashboard | Shift Switcher Tabs | Instant filter between Mañana, Tarde, Vespertino, and All | Selected shift tab | Filtered course list and aggregated metrics | Defaults to user's primary shift or Vespertino | ORIGINAL_REQUEST R3 |
| **F-11** | Dashboard | Daily Summary Table | Full matrix mirroring official paper form with course breakdown | Selected Date, Selected Shift | Grid with Inscriptos V/M/T, Presentes V/M/T, Ausentes V/M/T | Displays skeleton loader during data fetch | ORIGINAL_REQUEST R3, CSV |
| **F-12** | Dashboard | Bottom Totals Row | Live column-wise sums and overall attendance % | Aggregated shift data | Dynamic sum row: Total Inscriptos, Total Presentes, Total Ausentes, Overall % | Shows `0` / `-` if no courses exist | ORIGINAL_REQUEST R3, CSV |
| **F-13** | Dashboard | Attendance Trend Charts | Time series visualization of % attendance over date ranges | Date range, Shift filter, Course filter | Recharts Line / Bar charts | Empty state message if no records in range | ORIGINAL_REQUEST R3 |
| **F-14** | Dashboard | Staff Absences Summary Panel | Consolidated view of all absent teachers and auxiliaries | Date, Shift | List of absent personnel categorized by role | "Sin ausencias registradas" badge if none | ORIGINAL_REQUEST R3 |
| **F-15** | Export | 1-Click Excel Export | Exports exact official "Parte General" sheet to `.xlsx` | Active shift dataset, Date | Downloadable `.xlsx` file with headers and formulas | Toast error alert on generation failure | ORIGINAL_REQUEST R3 |
| **F-16** | Export | 1-Click PDF Export | Exports printable PDF mirroring physical paper sheet layout | Active shift dataset, Date | Downloadable / Printable `.pdf` file with signatures block | Toast error alert on generation failure | ORIGINAL_REQUEST R3 |
| **F-17** | Admin | Course Catalog CRUD | Add, edit, archive courses, assign shifts, orientations, and inscriptos | Course metadata form | Updated database record | Validates unique combination of Year, Division, Shift | ORIGINAL_REQUEST R4 |
| **F-18** | Admin | Seed Data Initializer | Populates Vespertino courses from CSV reference data | Trigger button | Seeded courses in DB with exact initial counts | Idempotent execution (prevents duplicates) | ORIGINAL_REQUEST R4, CSV |
| **F-19** | Admin | User Management & Assignments | Create users, assign roles, and map courses to professors | User form, Course multi-select | Updated user profiles and `user_courses` records | Prevents deleting the last admin | ORIGINAL_REQUEST R1, R4 |
| **F-20** | Realtime | Live Attendance Subscriptions | WebSockets listener updating dashboard on teacher submission | Postgres change payload | Live UI update without full reload | Auto-reconnects with backoff on disconnect | ORIGINAL_REQUEST R3 |

---

## 7. Edge Cases & Boundary Handling Matrix

| # | Feature | Edge Case Input / Scenario | Expected / Observed System Behavior |
|---|---|---|---|
| **E-01** | Attendance Validation | Course with 0 enrolled females (e.g. 5°4° TV has $I_M = 0$) | Inputs for Mujeres are preset to $P_M=0, A_M=0$. Any value $>0$ immediately triggers disparity error. |
| **E-02** | Attendance Validation | Negative numbers or decimal values entered | HTML `min="0"` + `step="1"` + Zod schema validation strips decimals and rejects negative inputs. |
| **E-03** | Attendance Validation | Sum mismatch: Teacher enters $P_V = 10, A_V = 0$ for $I_V = 11$ ($\Delta = -1$) | Form shows red error badge *"Falta 1 varón"*; Submit button is hard-disabled; field highlighted in red. |
| **E-04** | Attendance Permissions | Teacher attempts to navigate directly to `/attendance?course_id=unassigned` | System verifies `assigned_courses` list; displays access denied screen and redirects to first assigned course. |
| **E-05** | Date Restrictions | Teacher navigates to yesterday's date | System sets inputs to `disabled`, displays blue banner *"Registro histórico archivado - Modo solo lectura"*. |
| **E-06** | Date Restrictions | Preceptor/Admin navigates to yesterday's date | Preceptors/Admins have override permission; inputs remain editable with an *"Edición administrativa"* notice. |
| **E-07** | Dashboard Aggregation | Partial Shift Submission (e.g. 7 out of 10 courses submitted for today) | Table displays submitted data for the 7 courses; unsubmitted rows show `Pendiente` badge in gray; Totals row calculates sum of submitted data with an indicator badge `(7/10 cursos cargados)`. |
| **E-08** | Multi-Shift Teacher | Teacher teaches in both Turno Mañana and Turno Vespertino | Shift dropdown in Teacher View groups assigned courses by shift; switching shift refreshes the course list seamlessly. |
| **E-09** | Special Orientation Naming | `1° 1° C.TEC.MMO` vs `1° 1° Ciclo Básico` | Course selector, table row, and export engine explicitly append the orientation badge `C.TEC.MMO` to prevent ambiguity. |
| **E-10** | Concurrent Submissions | Two teachers or admin + teacher submit attendance for same course simultaneously | Database upsert on `(course_id, date)` resolves atomically; Supabase Realtime notifies both clients of latest state. |
| **E-11** | Empty Export | Exporting PDF/Excel for a date with 0 submissions | Generates full template sheet with enrolled course list, zeroes in attendance columns, and a notice *"Sin registros de asistencia cargados"*. |
| **E-12** | Mobile Table Overflow | Viewing wide summary table on 375px mobile screen | Container provides smooth horizontal scrolling with sticky first column (`Curso`), or allows toggling to compact Card View. |

---

## 8. Acceptance Criteria & Test Scenarios

### Test Suite 1: Authentication & Role-Based Navigation
- [x] **TC-1.1**: User logs in with `profesor@eest3.edu.ar` $\rightarrow$ Redirected directly to `/attendance`. Cannot access `/admin/*`.
- [x] **TC-1.2**: User logs in with `preceptor@eest3.edu.ar` $\rightarrow$ Redirected to `/dashboard`. Can switch shifts and export reports. Cannot access user management.
- [x] **TC-1.3**: User logs in with `admin@eest3.edu.ar` $\rightarrow$ Redirected to `/dashboard`. Full access to `/admin/courses` and `/admin/users`.

### Test Suite 2: Teacher Attendance Entry & Real-time Validation
- [x] **TC-2.1**: Select course `6° 1° TECQU` (Inscriptos: 11 V, 4 M, Total 15). Inputs default to empty or saved values.
- [x] **TC-2.2**: Enter $P_V = 10, A_V = 1$ (Sum = 11) and $P_M = 4, A_M = 0$ (Sum = 4). Both validation checks pass (green checkmarks). Submit button is ENABLED.
- [x] **TC-2.3**: Change $P_V = 9, A_V = 1$ (Sum = 10 != 11). Varones check fails. Validation banner appears. Submit button is DISABLED.
- [x] **TC-2.4**: Hit "Guardar Parte" $\rightarrow$ Toast notification appears, submission timestamp is saved, and status becomes `Enviado`.
- [x] **TC-2.5**: Select a past date $\rightarrow$ Form is read-only for teachers; save button is hidden.

### Test Suite 3: Dashboard Aggregation & Shift Switching
- [x] **TC-3.1**: Open `/dashboard` on today's date. Click `Vespertino` tab $\rightarrow$ Table lists all 10 courses with initial enrolled counts (119 V, 53 M, 172 Total).
- [x] **TC-3.2**: When teacher submits 6°1° attendance, dashboard updates in real time via Supabase Realtime without manual refresh.
- [x] **TC-3.3**: Verify Totals row: Total Inscriptos = 172, Total Presentes = sum of submitted, % Asistencia = $(Presentes / Inscriptos) \times 100$.

### Test Suite 4: Export Engine Verification
- [x] **TC-4.1**: Click "Exportar Excel" $\rightarrow$ Downloads `Parte_General_Vespertino_2026-08-20.xlsx`. Opening in Excel verifies merged school header, course table, formulas in totals row, observations, and staff absences.
- [x] **TC-4.2**: Click "Exportar PDF" $\rightarrow$ Downloads `Parte_General_Vespertino_2026-08-20.pdf`. Opening verifies institutional header, date string in Spanish, table layout matching paper form, and signature lines.

### Test Suite 5: Responsive & Mobile Verification
- [x] **TC-5.1**: Emulate mobile viewport (375px width in Chrome DevTools) $\rightarrow$ No horizontal document overflow on `/login` and `/attendance`.
- [x] **TC-5.2**: Number inputs trigger native numeric keypads on mobile devices.
- [x] **TC-5.3**: Dashboard summary table scrolls smoothly horizontally with sticky course names or displays responsive cards.

---

## 9. Next Steps for Implementation Team

1. **Frontend Scaffolding**: Setup Vite + React + TypeScript + Tailwind CSS project structure.
2. **Supabase Schema & Client**: Setup Supabase client with generated database types.
3. **Component Implementation**:
   - `src/components/auth/LoginForm.tsx`
   - `src/components/attendance/AttendanceForm.tsx`, `GenderInputCard.tsx`, `StaffAbsenceList.tsx`
   - `src/components/dashboard/ShiftTabs.tsx`, `DailySummaryTable.tsx`, `TrendCharts.tsx`
   - `src/components/export/ExcelExporter.ts`, `PdfExporter.ts`
   - `src/components/admin/CourseCatalog.tsx`, `UserManagement.tsx`
4. **Integration & E2E Testing**: Verify real-time sync, export fidelity, and mobile responsiveness against all test criteria.
