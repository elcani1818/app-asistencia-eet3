# Milestone 1: Changes Log (Worker 1)

**Date:** 2026-08-20  
**Milestone:** M1 — Database & Auth Engine  
**Author:** Worker 1 (`m1_worker_1`)  
**Status:** Completed & Verified  

---

## Summary of Deliverables & Files Created

### 1. `supabase/migrations/20260820000000_m1_database_and_auth.sql`
- **Purpose**: Foundational PostgreSQL 15+ DDL migration script for Supabase.
- **Components Included**:
  - **Extensions**: `uuid-ossp`, `pgcrypto`.
  - **Custom ENUMs**:
    - `public.user_role`: `('administrador', 'preceptor', 'profesor')`
    - `public.course_cycle`: `('basico', 'superior', 'tecnico_especial')`
    - `public.technical_orientation`: `('TECQU', 'TECMM', 'TECET', 'C.TEC.MMO', 'construcciones', 'electromecanica', 'quimica', 'computacion', 'ciclo_basico', 'otra')`
    - `public.attendance_status`: `('presente', 'ausente_justificado', 'ausente_injustificado', 'comision_servicio', 'licencia', 'guardia', 'submitted', 'draft')`
  - **Relational Tables**:
    - `public.shifts` (Turnos: Mañana, Tarde, Vespertino)
    - `public.profiles` (Institutional profiles linked 1:1 to `auth.users` with cascading deletion)
    - `public.courses` (Catalog of courses/divisions with stored generated `inscriptos_total`)
    - `public.course_assignments` (Teacher-course mapping with uniqueness on `(user_id, course_id)`)
    - `public.attendance_records` (Fact table with stored generated `total_presentes`, `total_ausentes`, `total_matricula`, and `snapshot_inscriptos_total`)
    - `public.staff_absences` (Teacher & auxiliary daily absence registry)
    - `public.attendance_audit_logs` (Forensic audit trail capturing JSONB diffs)
  - **Performance Indexes**: Foreign keys, date/shift composite indexes, role lookup indexes.
  - **Security Definer Functions (Recursion-Free)**:
    - `auth_user_role()`, `user_role()`
    - `is_admin()`, `is_preceptor()`, `is_admin_or_preceptor()`
    - `is_assigned_to_course(p_course_id UUID)`
    - `can_edit_attendance(p_course_id UUID, p_date DATE)`
  - **Row Level Security (RLS) Policies**: Granular policies across all 7 tables for Administrador, Preceptor, and Profesor.
  - **Business Logic Triggers**:
    - `trg_validate_attendance_math` (`fn_validate_attendance_math`): Enforces $P_V + A_V = I_V$ and $P_M + A_M = I_M$, populates snapshot enrollments, prevents negative values.
    - `trg_date_lock_attendance` (`fn_date_lock_attendance`): Prevents non-admin editing/insertion of historical dates and locked records.
    - `trg_attendance_audit` (`fn_attendance_audit`): Captures `old_values` and `new_values` JSONB state on INSERT, UPDATE, and DELETE.
    - `trg_on_auth_user_created` (`fn_handle_new_auth_user`): Synchronizes Supabase `auth.users` sign-ups to `public.profiles`.
  - **Stored Procedures**:
    - `fn_get_shift_parte_general(p_shift_id UUID, p_date DATE)`
    - `fn_get_shift_parte_general(p_shift_code VARCHAR, p_date DATE)` (Overloaded)
    - Generates unified JSON with course breakdowns, cycle subtotals (*Básico*, *Superior*, *Técnico Especial*), grand shift totals, and staff absence roster.

### 2. `supabase/seed.sql`
- **Purpose**: Idempotent seed data for immediate zero-setup testing and development.
- **Data Provided**:
  - **3 Shifts**: `Turno Mañana` (`11111111-...`), `Turno Tarde` (`22222222-...`), `Turno Vespertino` (`33333333-...`).
  - **5 Bootstrap Accounts** (Dual `auth.users` + `public.profiles` with bcrypt hashed passwords):
    - `admin@colegio.edu.ar` (`Admin2026!`) — Director / Admin
    - `preceptor.vespertino@colegio.edu.ar` (`Preceptor2026!`) — Preceptor Vespertino
    - `profesor.mecanica@colegio.edu.ar` (`Profesor2026!`) — Teacher (Electromecánica)
    - `profesora.quimica@colegio.edu.ar` (`Profesor2026!`) — Teacher (Química)
    - `preceptor.manana@colegio.edu.ar` (`Preceptor2026!`) — Preceptor Mañana
  - **Exact Vespertino CSV Dataset**:
    - 10 courses with exact enrollment matching `PARTE GENERALES TV.xlsx - T.V.csv`:
      - 5° 4ª (8 V, 0 M = 8)
      - 6° 1ª (11 V, 4 M = 15)
      - 6° 2ª (9 V, 14 M = 23)
      - 6° 3ª (23 V, 2 M = 25)
      - 6° 4ª (6 V, 0 M = 6)
      - 7° 1ª (5 V, 8 M = 13)
      - 7° 2ª (9 V, 9 M = 18)
      - 7° 3ª (20 V, 9 M = 29)
      - 7° 4ª (8 V, 0 M = 8)
      - 1° 1ª C.TEC.MMO (20 V, 7 M = 27)
    - Total: 119 Varones + 53 Mujeres = 172 Inscriptos Total.
  - **Turno Mañana & Turno Tarde Catalogs**: 26 courses per shift (14 Ciclo Básico, 12 Ciclo Superior).
  - **Teacher Course Assignments**: Linkages for Ing. Rossi and Lic. Benítez to their respective courses.
  - **Sample Daily Attendance Entries**: Validated test submissions for today.
  - **Sample Staff Absences**: Demo teacher and auxiliary absences.

### 3. `src/types/database.ts`
- **Purpose**: Full TypeScript typing for Supabase Client and frontend modules.
- **Includes**:
  - `Database` interface matching `public` schema (`Tables`, `Views`, `Functions`, `Enums`).
  - Row, Insert, and Update helper types for every table (`Shift`, `Profile`, `Course`, `CourseAssignment`, `AttendanceRecord`, `StaffAbsence`, `AttendanceAuditLog`).
  - Stored procedure payload interfaces: `ParteGeneralPayload`, `ParteGeneralCourseRow`, `ParteGeneralCycleSubtotal`, `ParteGeneralTotals`, `ParteGeneralStaffAbsence`.
  - Type aliases aligning with `PROJECT.md` contracts (`AppRole`, `CycleType`, `OrientationType`, `SubmissionStatus`).

### 4. `src/lib/supabase.ts`
- **Purpose**: Typed Supabase client singleton instance.
- **Features**:
  - Validates environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
  - Browser and SSR safe configuration with localStorage session persistence.
  - Passes global client identification header (`x-application-name: eest3-parte-general`).

### 5. `.env.example`
- **Purpose**: Environment template for developers and deployment environments.
- **Variables**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
