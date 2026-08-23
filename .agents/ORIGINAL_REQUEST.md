# Original User Request

## Initial Request — 2026-08-20T14:12:07Z

Build a responsive web application for the "Escuela de Educación Secundaria Técnica N° 3 — Ntra. Sra. de la Merced" (Loma Hermosa) that digitizes their daily attendance report ("Parte General de Alumnos"). Teachers log in and submit daily attendance data for their assigned courses; an admin dashboard aggregates and visualizes all submissions in real time. The app must use Supabase (Auth + PostgreSQL database) as the backend.

Working directory: d:\CanY\PROYECTOS CANY\App colegio
Integrity mode: development

Reference data — the current paper-based attendance form for the evening shift (turno vespertino) is available as a CSV file at `d:\CanY\PROYECTOS CANY\App colegio\PARTE GENERALES TV.xlsx - T.V.csv`. This file shows the layout and structure of the daily attendance form. The app must replicate this layout for ALL three shifts.

### Complete School Structure

The school has **three shifts** (turnos): **Mañana** (morning), **Tarde** (afternoon), and **Vespertino** (evening). Each shift has its own daily attendance form ("Parte General"). The CSV example is for the Vespertino shift only.

**Ciclo Básico** (years 1-3, no technical orientation):
- 1°1ª, 1°2ª, 1°3ª, 1°4ª, 1°5ª
- 2°1ª, 2°2ª, 2°3ª, 2°4ª, 2°5ª
- 3°1ª, 3°2ª, 3°3ª, 3°4ª

**Ciclo Superior** (years 4-7, with technical orientation):
- Divisions ending in **1ª** → orientation **TECQU** (Técnico Químico): 4°1ª, 5°1ª, 6°1ª, 7°1ª
- Divisions ending in **2ª** → orientation **TECMM** (Técnico Maestro Mayor de Obra): 4°2ª, 5°2ª, 6°2ª, 7°2ª
- Divisions ending in **3ª** → orientation **TECET** (Técnico Electromecánico): 4°3ª, 5°3ª, 6°3ª, 7°3ª
- Divisions ending in **4ª** → orientation **TECET** (Técnico Electromecánico): 5°4ª, 6°4ª, 7°4ª

**Ciclo Técnico especial**:
- 1°1ª C.TEC.MMO (Ciclo Técnico en Maestro Mayor de Obras) — this is a separate course from the Ciclo Básico 1°1ª.

The administrator must be able to configure which courses belong to each shift, and the enrollment numbers (Inscriptos V/M/T) for each course. The CSV provides the initial enrollment data for the Vespertino shift; the admin will enter enrollment data for Mañana and Tarde shifts.

## Requirements

### R1. Authentication & Role-Based Access
The app must support three user roles: **Administrador** (admin/directivo), **Preceptor**, and **Profesor** (teacher). Each user registers with a username and password. The Administrador can create users, assign roles, and assign which courses each Profesor can access. Professors can only view and submit data for their assigned courses. Preceptores can view all courses but cannot modify admin settings. Use Supabase Auth for authentication and Supabase (PostgreSQL) as the database backend.

### R2. Daily Attendance Submission
Each Profesor sees a form for their assigned course(s) for the current date. The form must show the pre-loaded data (course name, orientation if applicable, inscriptos V/M/T) and allow the teacher to fill in: **Presentes** (Varones, Mujeres — Total auto-calculated) and **Ausentes** (Varones, Mujeres — Total auto-calculated). The system must validate that Presentes + Ausentes = Inscriptos for each gender (V and M). Teachers can also add free-text **Observaciones** and report **Ausencias de Docentes y Auxiliares**. Each submission is tied to a specific date and shift, and teachers should be able to edit their submission for the current day until end-of-day.

### R3. Admin Dashboard & Reporting
The Administrador and Preceptor roles see a dashboard that shows:
- **Daily summary per shift**: a table mirroring the original paper form layout (as shown in the CSV), showing all courses in that shift with their attendance data for a selected date, with totals row. The user must be able to switch between the three shifts (Mañana, Tarde, Vespertino).
- **Attendance trends**: charts showing attendance evolution over time (filterable by course, shift, and school-wide).
- **Absent teachers/auxiliaries list** for the selected day and shift.
- **Export**: ability to export the daily report or date-range data to Excel (.xlsx) and PDF, matching the original paper form layout as closely as possible.

### R4. Course & Shift Management
The Administrador can manage the complete course catalog: add/edit/remove courses, assign them to shifts, set their orientation, and update enrollment numbers (Inscriptos V/M/T). The seed data from the CSV must be pre-loaded for the Vespertino shift. The admin must also be able to set up Mañana and Tarde shifts with their respective courses.

### R5. Responsive Web Design
The application must be a responsive web app that works well on both desktop browsers and mobile phone browsers (primarily Android). No native app is needed — a well-designed responsive web interface is sufficient.

## Acceptance Criteria

### Authentication & Roles
- [ ] A new user can register, and an admin can assign them a role (Administrador, Preceptor, Profesor) and assign courses.
- [ ] A Profesor can only see and submit attendance for their assigned courses — attempting to access another course returns an error or shows nothing.
- [ ] A Preceptor can view all attendance data but cannot modify admin settings or user assignments.
- [ ] An Administrador can perform all actions: manage users, assign courses, view dashboard, and submit attendance.

### Attendance Form
- [ ] The form pre-populates course name, orientation (for Ciclo Superior), and inscriptos (V/M/T) from the database.
- [ ] Submitting attendance correctly stores Presentes V/M/T, Ausentes V/M/T, Observaciones, and Ausencia de Docentes for the given date, course, and shift.
- [ ] Validation prevents submission where Presentes + Ausentes ≠ Inscriptos for either gender (V or M).
- [ ] A teacher can edit their submission for the current day; past days are read-only.

### Dashboard
- [ ] The daily summary table displays all courses for the selected shift with their attendance data for a selected date, including a totals row, matching the layout of the original paper form.
- [ ] The user can switch between Mañana, Tarde, and Vespertino views.
- [ ] At least one chart visualizes attendance trends over a selectable date range.
- [ ] The export function produces a downloadable .xlsx or .pdf file with the daily attendance data.

### Course Management
- [ ] The seed data from the CSV (Vespertino shift courses with their orientations and enrollment numbers) is correctly loaded into the database on first setup.
- [ ] The admin can add courses, assign them to shifts, set orientations, and update enrollment numbers.
- [ ] The complete school structure (Ciclo Básico 1°-3°, Ciclo Superior 4°-7° with TECQU/TECMM/TECET orientations, and C.TEC.MMO) is represented in the data model.

### Responsiveness
- [ ] The app is usable on a 375px-wide mobile viewport without horizontal scrolling on the main views (login, attendance form, dashboard summary).
- [ ] The app is usable on a standard desktop viewport (1280px+).

### Data Integrity
- [ ] All attendance records are associated with the correct user, course, shift, and date.
- [ ] The three shifts operate independently — submitting attendance in one shift does not affect another.
