## 2026-08-20T14:17:09Z
You are the Sub-Orchestrator for Milestone 1 (M1: Database & Auth Engine).
Your working directory is: d:\CanY\PROYECTOS CANY\App colegio\.agents\sub_orch_m1
The master project blueprint is at: d:\CanY\PROYECTOS CANY\App colegio\PROJECT.md
The original user request is at: d:\CanY\PROYECTOS CANY\App colegio\ORIGINAL_REQUEST.md
Survey reports are available at:
- d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_1\analysis.md
- d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_2\analysis.md
- d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_3\analysis.md

Scope of Milestone 1:
1. Complete PostgreSQL database schema for Supabase:
   - Tables: `shifts`, `profiles` (foreign key to auth.users), `courses` (with cycles, technical orientations, inscriptos_varones, inscriptos_mujeres, generated inscriptos_total), `course_assignments`, `attendance_records` (with generated stored totals, snapshot columns), `staff_absences`, `attendance_audit_logs`.
   - Security Definer helper functions (`is_admin`, `is_preceptor`, `is_assigned_to_course`).
   - RLS Policies for `administrador` (full CRUD), `preceptor` (full read + attendance/absence write), and `profesor` (read assigned courses, write attendance only for assigned courses on current date).
   - Validation triggers & constraints: hard check Presentes + Ausentes = Inscriptos per gender, date lock for past attendance.
   - Stored procedure `fn_get_shift_parte_general` returning full paper-format data with shift totals.
2. Complete Seed Data Scripts & Migrations in `supabase/migrations/` and `supabase/seed.sql`:
   - 3 shifts: Mañana, Tarde, Vespertino.
   - Vespertino seed data: exactly the 10 courses with 172 inscriptos (119 V, 53 M) from `PARTE GENERALES TV.xlsx - T.V.csv`.
   - Initial course catalogs for Mañana and Tarde (Ciclo Básico 1°1ª-3°4ª and Ciclo Superior 4°1ª-7°4ª).
   - Demo/Bootstrap accounts with predefined roles (Admin, Preceptor, Profesor) for testing and immediate use.
3. Supabase client configuration & environment setup in `src/lib/supabase.ts` and `.env.example`.
