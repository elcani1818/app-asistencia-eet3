## 2026-08-20T14:13:47Z

You are survey_explorer_2, a backend & database architecture specialist.
Your working directory is: d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_2
The user request is at: d:\CanY\PROYECTOS CANY\App colegio\ORIGINAL_REQUEST.md

Task:
Perform a comprehensive survey of backend requirements and Supabase architecture:
- Read ORIGINAL_REQUEST.md and inspect existing files in `d:\CanY\PROYECTOS CANY\App colegio\`
- Investigate Supabase environment (check available Supabase MCP tools or database state)
- Design the complete PostgreSQL database schema:
  1. Roles: Administrador, Preceptor, Profesor. User profiles table linked to `auth.users`.
  2. Shifts table: Mañana, Tarde, Vespertino.
  3. Courses table: year, division, shift_id, orientation (TECQU, TECMM, TECET, C.TEC.MMO, or null for basic), inscriptos_varones, inscriptos_mujeres, inscriptos_total (generated/stored), active status.
  4. Course assignments table: teacher_id (user) <-> course_id.
  5. Attendance records table: date, course_id, shift_id, submitted_by (user), presentes_varones, presentes_mujeres, presentes_total, ausentes_varones, ausentes_mujeres, ausentes_total, observaciones, is_locked/submitted_at.
  6. Teacher/Staff absences table: date, shift_id, staff_name, role/subject, reason/observaciones.
  7. Row Level Security (RLS) policies for all tables enforcing:
     - Admins: full access (CRUD on courses, users, assignments, attendance, absences).
     - Preceptors: read access to all attendance and courses; manage attendance and absences for any course/shift; no admin settings.
     - Teachers (Profesores): read only assigned courses; insert/update attendance ONLY for their assigned courses and ONLY for current date (past days locked).
  8. Seed data SQL / migration scripts to initialize:
     - Turnos (Mañana, Tarde, Vespertino).
     - Vespertino courses populated directly from `PARTE GENERALES TV.xlsx - T.V.csv`.
     - Standard course catalogs for Mañana and Tarde shifts.
     - Default roles and admin bootstrap mechanism.

Write your findings and SQL schema design to: `d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_2\analysis.md`
Write your handoff report to: `d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_2\handoff.md`
Send a completion message back when done.
