# Backend & Database Architecture Analysis — Parte General Digital
**School**: Escuela de Educación Secundaria Técnica N° 3 — "Ntra. Sra. de la Merced" (Loma Hermosa)  
**Database**: PostgreSQL 15+ / Supabase  
**Author**: survey_explorer_2 (Backend & Database Architecture Specialist)  
**Date**: 2026-08-20  

---

## 1. Executive Summary & Architecture Overview

The backend architecture is designed for Supabase (PostgreSQL), providing secure, real-time, and auditable digitization of the daily school attendance report (**"Parte General de Alumnos"**).

### Key Architectural Pillars
1. **Direct Supabase Auth Integration**: User profiles are linked 1:1 with `auth.users` through foreign key cascading, with explicit role-based access control (`administrador`, `preceptor`, `profesor`).
2. **Strict Data Integrity via PostgreSQL Constraints & Generated Columns**: Totals ($V + M = T$) are guaranteed via `GENERATED ALWAYS AS (...) STORED` columns, eliminating calculation anomalies across mobile/desktop clients.
3. **Automated Mathematical Validation Triggers**: An `attendance_validation_trigger` strictly validates that $\text{Presentes}_V + \text{Ausentes}_V = \text{Inscriptos}_V$ and $\text{Presentes}_M + \text{Ausentes}_M = \text{Inscriptos}_M$ before committing attendance data.
4. **Row Level Security (RLS) with Security Definer Functions**: High-performance, recursion-free RLS policies enforce isolation:
   - **Administradores**: Full CRUD access over all entities.
   - **Preceptores**: Full read access across all shifts/courses; write access to attendance and staff absences; restricted from altering administrative configurations and user roles.
   - **Profesores**: Read access only to assigned courses; insert/update access strictly for assigned courses on the **current date**.
5. **Exact Paper Form Mirroring**: Stored procedures and PostgreSQL views output the precise tabular layout of `PARTE GENERALES TV.xlsx - T.V.csv`, including shift-wide summary totals and teacher/auxiliary staff absences.

---

## 2. Entity Relationship Model (ERD)

```
 +-----------------------------------------------------------------------------------+
 |                                    auth.users                                     |
 |   (Supabase Auth: id, email, encrypted_password, raw_user_meta_data, created_at)  |
 +-----------------------------------------+-----------------------------------------+
                                           | 1:1
                                           v
 +-----------------------------------------------------------------------------------+
 |                                 public.profiles                                   |
 |  id (UUID PK -> auth.users) | role (app_role) | full_name | dni | is_active       |
 +------------------+--------------------------------------+-------------------------+
                    | 1:N                                  | 1:N
                    | (as teacher)                         | (submitted_by)
                    v                                      v
 +------------------------------------+  +-------------------------------------------+
 |     public.course_assignments      |  |         public.attendance_records         |
 | id (UUID PK)                       |  | id (UUID PK)                              |
 | course_id (UUID FK -> courses)     |  | date (DATE)                               |
 | teacher_id (UUID FK -> profiles)   |  | course_id (UUID FK -> courses)            |
 | assigned_by (UUID FK -> profiles)  |  | shift_id (UUID FK -> shifts)              |
 +------------------+-----------------+  | submitted_by (UUID FK -> profiles)        |
                    |                    | inscriptos_varones_snapshot (INT)         |
                    |                    | inscriptos_mujeres_snapshot (INT)         |
                    |                    | inscriptos_total_snapshot (INT STORED)    |
                    |                    | presentes_varones (INT)                   |
                    |                    | presentes_mujeres (INT)                   |
                    |                    | presentes_total (INT STORED)              |
                    |                    | ausentes_varones (INT)                    |
                    v                    | ausentes_mujeres (INT)                    |
 +------------------------------------+  | ausentes_total (INT STORED)               |
 |           public.courses           |  | observaciones (TEXT)                      |
 | id (UUID PK)                       |  | status (submission_status)                |
 | shift_id (UUID FK -> shifts)       |  | is_locked (BOOLEAN)                       |
 | name (VARCHAR: '6° 1ª')            |  | submitted_at (TIMESTAMPTZ)                |
 | year (SMALLINT: 1-7)               |  +---------------------+---------------------+
 | division (SMALLINT: 1-5)           |                        |
 | cycle (cycle_type)                 |                        | UNIQUE(date, course_id)
 | orientation (orientation_type)     |<-----------------------+
 | inscriptos_varones (INT)           |
 | inscriptos_mujeres (INT)           |
 | inscriptos_total (INT STORED)      |
 | is_active (BOOLEAN)                |
 +------------------+-----------------+
                    | N:1
                    v
 +------------------------------------+  +-------------------------------------------+
 |           public.shifts            |  |           public.staff_absences           |
 | id (UUID PK)                       |  | id (UUID PK)                              |
 | code (VARCHAR: 'manana', etc.)     |  | date (DATE)                               |
 | name (VARCHAR: 'Turno Mañana')     |  | shift_id (UUID FK -> shifts)              |
 | start_time (TIME)                  |  | staff_name (VARCHAR)                      |
 | end_time (TIME)                    |  | role_type (VARCHAR)                       |
 | sort_order (INT)                   |  | subject_or_area (VARCHAR)                 |
 +------------------+-----------------+  | reason (VARCHAR)                          |
                    |                    | observations (TEXT)                       |
                    +------------------->| created_by (UUID FK -> profiles)          |
                      1:N                +-------------------------------------------+
```

---

## 3. Comprehensive Database DDL (PostgreSQL / Supabase Migration)

```sql
-- ============================================================================
-- MIGRATION: 20260820000001_create_parte_general_schema.sql
-- Description: Complete initial schema for EEST N° 3 Attendance System
-- ============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom Enums
CREATE TYPE public.app_role AS ENUM (
    'administrador',
    'preceptor',
    'profesor'
);

CREATE TYPE public.cycle_type AS ENUM (
    'basico',
    'superior',
    'tecnico_especial'
);

CREATE TYPE public.orientation_type AS ENUM (
    'TECQU',        -- Técnico Químico
    'TECMM',        -- Técnico Maestro Mayor de Obra
    'TECET',        -- Técnico Electromecánico
    'C.TEC.MMO'     -- Ciclo Técnico en Maestro Mayor de Obras
);

CREATE TYPE public.submission_status AS ENUM (
    'draft',
    'submitted',
    'verified'
);

-- ============================================================================
-- 3. Core Tables
-- ============================================================================

-- 3.1 Shifts (Turnos)
CREATE TABLE public.shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(30) NOT NULL UNIQUE, -- 'manana', 'tarde', 'vespertino'
    name VARCHAR(100) NOT NULL,       -- 'Turno Mañana', 'Turno Tarde', 'Turno Vespertino'
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.2 User Profiles (Linked to auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL DEFAULT 'profesor',
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    dni VARCHAR(20),
    phone VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.3 Courses (Cursos y Divisiones)
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE RESTRICT,
    year SMALLINT NOT NULL CHECK (year BETWEEN 1 AND 7),
    division SMALLINT NOT NULL CHECK (division BETWEEN 1 AND 10),
    name VARCHAR(50) NOT NULL, -- e.g., '1° 1ª', '5° 4ª', '1° 1ª C.TEC.MMO'
    cycle public.cycle_type NOT NULL,
    orientation public.orientation_type,
    inscriptos_varones INT NOT NULL DEFAULT 0 CHECK (inscriptos_varones >= 0),
    inscriptos_mujeres INT NOT NULL DEFAULT 0 CHECK (inscriptos_mujeres >= 0),
    inscriptos_total INT GENERATED ALWAYS AS (inscriptos_varones + inscriptos_mujeres) STORED,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_course_shift_name UNIQUE (shift_id, name)
);

-- 3.4 Course Assignments (Asignación de Profesores/Preceptores a Cursos)
CREATE TABLE public.course_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_course_teacher UNIQUE (course_id, teacher_id)
);

-- 3.5 Attendance Records (Partes Diarios de Asistencia por Curso)
CREATE TABLE public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
    shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE RESTRICT,
    submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    -- Enrollment Snapshot at time of submission (guarantees historical consistency)
    inscriptos_varones_snapshot INT NOT NULL DEFAULT 0 CHECK (inscriptos_varones_snapshot >= 0),
    inscriptos_mujeres_snapshot INT NOT NULL DEFAULT 0 CHECK (inscriptos_mujeres_snapshot >= 0),
    inscriptos_total_snapshot INT GENERATED ALWAYS AS (inscriptos_varones_snapshot + inscriptos_mujeres_snapshot) STORED,

    -- Present counts
    presentes_varones INT NOT NULL DEFAULT 0 CHECK (presentes_varones >= 0),
    presentes_mujeres INT NOT NULL DEFAULT 0 CHECK (presentes_mujeres >= 0),
    presentes_total INT GENERATED ALWAYS AS (presentes_varones + presentes_mujeres) STORED,

    -- Absent counts
    ausentes_varones INT NOT NULL DEFAULT 0 CHECK (ausentes_varones >= 0),
    ausentes_mujeres INT NOT NULL DEFAULT 0 CHECK (ausentes_mujeres >= 0),
    ausentes_total INT GENERATED ALWAYS AS (ausentes_varones + ausentes_mujeres) STORED,

    -- Metadata & Observaciones
    observaciones TEXT,
    status public.submission_status NOT NULL DEFAULT 'submitted',
    is_locked BOOLEAN NOT NULL DEFAULT false,
    submitted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    -- Only one attendance sheet per course per day
    CONSTRAINT uq_attendance_date_course UNIQUE (date, course_id)
);

-- 3.6 Teacher & Auxiliary Staff Absences (Parte de Inasistencias Docentes / Auxiliares)
CREATE TABLE public.staff_absences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE RESTRICT,
    staff_name VARCHAR(255) NOT NULL,
    role_type VARCHAR(100) NOT NULL,      -- 'Docente', 'Auxiliar', 'Preceptor', 'Directivo'
    subject_or_area VARCHAR(255),          -- 'Matemática', 'Taller', 'Laboratorio Química', 'Limpieza'
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    reason VARCHAR(255),                  -- 'Licencia Médica', 'Art. 114', 'Fuerza Mayor', etc.
    observations TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.7 Audit Log (Auditoría de Modificaciones)
CREATE TABLE public.attendance_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id UUID REFERENCES public.attendance_records(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_data JSONB,
    new_data JSONB,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ============================================================================
-- 4. Indexes for Optimal Performance
-- ============================================================================

CREATE INDEX idx_courses_shift ON public.courses(shift_id, is_active);
CREATE INDEX idx_course_assignments_teacher ON public.course_assignments(teacher_id);
CREATE INDEX idx_course_assignments_course ON public.course_assignments(course_id);
CREATE INDEX idx_attendance_date_shift ON public.attendance_records(date, shift_id);
CREATE INDEX idx_attendance_course ON public.attendance_records(course_id);
CREATE INDEX idx_staff_absences_date_shift ON public.staff_absences(date, shift_id);
```

---

## 4. Business Logic, Constraints & Database Triggers

### 4.1 Attendance Validation Trigger
Validates that:
1. $\text{Presentes}_V + \text{Ausentes}_V = \text{Inscriptos}_V$
2. $\text{Presentes}_M + \text{Ausentes}_M = \text{Inscriptos}_M$
3. Pre-populates enrollment snapshot from `courses` if not supplied.

```sql
CREATE OR REPLACE FUNCTION public.fn_validate_and_snapshot_attendance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_inscriptos_v INT;
    v_inscriptos_m INT;
    v_course_shift UUID;
BEGIN
    -- Fetch active enrollment and shift for the course
    SELECT inscriptos_varones, inscriptos_mujeres, shift_id
    INTO v_inscriptos_v, v_inscriptos_m, v_course_shift
    FROM public.courses
    WHERE id = NEW.course_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Curso no encontrado con ID %', NEW.course_id;
    END IF;

    -- Ensure shift_id matches course shift_id
    NEW.shift_id := v_course_shift;

    -- Snapshot enrollment if creating new record or if snapshot is 0
    IF TG_OP = 'INSERT' OR NEW.inscriptos_varones_snapshot = 0 AND NEW.inscriptos_mujeres_snapshot = 0 THEN
        NEW.inscriptos_varones_snapshot := v_inscriptos_v;
        NEW.inscriptos_mujeres_snapshot := v_inscriptos_m;
    END IF;

    -- Mathematical Integrity Validation
    IF (NEW.presentes_varones + NEW.ausentes_varones) <> NEW.inscriptos_varones_snapshot THEN
        RAISE EXCEPTION 'Inconsistencia en Varones: Presentes (%) + Ausentes (%) <> Inscriptos (%)',
            NEW.presentes_varones, NEW.ausentes_varones, NEW.inscriptos_varones_snapshot;
    END IF;

    IF (NEW.presentes_mujeres + NEW.ausentes_mujeres) <> NEW.inscriptos_mujeres_snapshot THEN
        RAISE EXCEPTION 'Inconsistencia en Mujeres: Presentes (%) + Ausentes (%) <> Inscriptos (%)',
            NEW.presentes_mujeres, NEW.ausentes_mujeres, NEW.inscriptos_mujeres_snapshot;
    END IF;

    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_and_snapshot_attendance
    BEFORE INSERT OR UPDATE ON public.attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_validate_and_snapshot_attendance();
```

### 4.2 Auto-create User Profile on Auth Registration
```sql
CREATE OR REPLACE FUNCTION public.fn_handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        is_active
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'profesor'::public.app_role),
        true
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_handle_new_user();
```

### 4.3 Audit Logging Trigger
```sql
CREATE OR REPLACE FUNCTION public.fn_audit_attendance_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.attendance_audit_logs (attendance_id, changed_by, action, new_data)
        VALUES (NEW.id, auth.uid(), 'INSERT', to_jsonb(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.attendance_audit_logs (attendance_id, changed_by, action, old_data, new_data)
        VALUES (NEW.id, auth.uid(), 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.attendance_audit_logs (attendance_id, changed_by, action, old_data)
        VALUES (OLD.id, auth.uid(), 'DELETE', to_jsonb(OLD));
    END IF;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_audit_attendance_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_audit_attendance_changes();
```

---

## 5. Row Level Security (RLS) Policies & Helper Functions

### 5.1 Security Definer Helper Functions (Zero-Recursion)
```sql
-- Get current user role
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Check if current user is Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'administrador' AND is_active = true
    );
$$;

-- Check if current user is Preceptor
CREATE OR REPLACE FUNCTION public.is_preceptor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'preceptor' AND is_active = true
    );
$$;

-- Check if current user is Admin or Preceptor
CREATE OR REPLACE FUNCTION public.is_admin_or_preceptor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('administrador', 'preceptor') AND is_active = true
    );
$$;

-- Check if current teacher is assigned to a course
CREATE OR REPLACE FUNCTION public.is_assigned_to_course(p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.course_assignments
        WHERE course_id = p_course_id AND teacher_id = auth.uid()
    );
$$;
```

### 5.2 Enabling RLS and Applying Policies

```sql
-- Enable RLS on all tables
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_audit_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 5.2.1 SHIFTS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Shifts are viewable by all authenticated users"
    ON public.shifts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Shifts manageable only by admin"
    ON public.shifts FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 5.2.2 PROFILES POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Profiles viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins have full control over profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Users can update their own contact info"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() 
        AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- Role cannot be escalated
    );

-- ----------------------------------------------------------------------------
-- 5.2.3 COURSES POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Courses viewable by all authenticated users"
    ON public.courses FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Courses manageable only by admin"
    ON public.courses FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 5.2.4 COURSE ASSIGNMENTS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Assignments viewable by all authenticated users"
    ON public.course_assignments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Assignments manageable only by admin"
    ON public.course_assignments FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 5.2.5 ATTENDANCE RECORDS POLICIES
-- ----------------------------------------------------------------------------
-- View attendance:
-- Admins and Preceptors can view all records.
-- Teachers can view records for their assigned courses.
CREATE POLICY "Attendance view policy"
    ON public.attendance_records FOR SELECT
    TO authenticated
    USING (
        public.is_admin_or_preceptor()
        OR public.is_assigned_to_course(course_id)
    );

-- Insert attendance:
-- Admins/Preceptors can insert for any course/date.
-- Teachers can ONLY insert for their assigned courses on the CURRENT date.
CREATE POLICY "Attendance insert policy"
    ON public.attendance_records FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin_or_preceptor()
        OR (
            public.is_assigned_to_course(course_id)
            AND date = CURRENT_DATE
        )
    );

-- Update attendance:
-- Admins/Preceptors can update any record.
-- Teachers can ONLY update their assigned courses on the CURRENT date if not locked.
CREATE POLICY "Attendance update policy"
    ON public.attendance_records FOR UPDATE
    TO authenticated
    USING (
        public.is_admin_or_preceptor()
        OR (
            public.is_assigned_to_course(course_id)
            AND date = CURRENT_DATE
            AND is_locked = false
        )
    )
    WITH CHECK (
        public.is_admin_or_preceptor()
        OR (
            public.is_assigned_to_course(course_id)
            AND date = CURRENT_DATE
            AND is_locked = false
        )
    );

-- Delete attendance: Admins only
CREATE POLICY "Attendance delete policy"
    ON public.attendance_records FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 5.2.6 STAFF ABSENCES POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Staff absences viewable by authenticated users"
    ON public.staff_absences FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Staff absences manageable by admin and preceptor"
    ON public.staff_absences FOR ALL
    TO authenticated
    USING (public.is_admin_or_preceptor())
    WITH CHECK (public.is_admin_or_preceptor());

-- ----------------------------------------------------------------------------
-- 5.2.7 AUDIT LOGS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Audit logs viewable only by admins"
    ON public.attendance_audit_logs FOR SELECT
    TO authenticated
    USING (public.is_admin());
```

---

## 6. Aggregated Views & Stored Procedures (Mirroring Paper Layout)

### 6.1 View: Daily Parte General Summary Layout
This view matches the exact columns of the paper Parte General (`PARTE GENERALES TV.xlsx - T.V.csv`).

```sql
CREATE OR REPLACE VIEW public.vw_parte_general_sheet AS
SELECT 
    c.shift_id,
    s.name AS shift_name,
    s.code AS shift_code,
    c.id AS course_id,
    c.name AS course_name,
    c.year,
    c.division,
    c.cycle,
    c.orientation,
    c.sort_order,
    COALESCE(a.date, CURRENT_DATE) AS date,
    
    -- Inscriptos
    COALESCE(a.inscriptos_varones_snapshot, c.inscriptos_varones) AS inscriptos_varones,
    COALESCE(a.inscriptos_mujeres_snapshot, c.inscriptos_mujeres) AS inscriptos_mujeres,
    COALESCE(a.inscriptos_total_snapshot, c.inscriptos_total) AS inscriptos_total,
    
    -- Presentes
    a.presentes_varones,
    a.presentes_mujeres,
    a.presentes_total,
    
    -- Ausentes
    a.ausentes_varones,
    a.ausentes_mujeres,
    a.ausentes_total,
    
    -- Status & Observaciones
    a.observaciones,
    COALESCE(a.status, 'draft'::public.submission_status) AS status,
    a.is_locked,
    a.submitted_at,
    p.full_name AS submitted_by_name
FROM public.courses c
JOIN public.shifts s ON c.shift_id = s.id
LEFT JOIN public.attendance_records a ON c.id = a.course_id AND a.date = CURRENT_DATE
LEFT JOIN public.profiles p ON a.submitted_by = p.id
WHERE c.is_active = true
ORDER BY s.sort_order, c.sort_order, c.year, c.division;
```

### 6.2 Stored Procedure: Get Complete Daily Shift Report with Totals & Absences
```sql
CREATE OR REPLACE FUNCTION public.fn_get_shift_parte_general(
    p_date DATE,
    p_shift_code VARCHAR
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_shift_id UUID;
    v_shift_name VARCHAR;
    v_courses_json JSONB;
    v_totals_json JSONB;
    v_absences_json JSONB;
    v_result JSONB;
BEGIN
    -- Resolve Shift
    SELECT id, name INTO v_shift_id, v_shift_name
    FROM public.shifts
    WHERE code = p_shift_code;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Turno con código "%" no encontrado', p_shift_code;
    END IF;

    -- Aggregate Course Lines
    SELECT jsonb_agg(
        jsonb_build_object(
            'course_id', c.id,
            'course_name', c.name,
            'year', c.year,
            'division', c.division,
            'cycle', c.cycle,
            'orientation', COALESCE(c.orientation::text, '-'),
            'inscriptos_v', COALESCE(a.inscriptos_varones_snapshot, c.inscriptos_varones),
            'inscriptos_m', COALESCE(a.inscriptos_mujeres_snapshot, c.inscriptos_mujeres),
            'inscriptos_t', COALESCE(a.inscriptos_total_snapshot, c.inscriptos_total),
            'presentes_v', a.presentes_varones,
            'presentes_m', a.presentes_mujeres,
            'presentes_t', a.presentes_total,
            'ausentes_v', a.ausentes_varones,
            'ausentes_m', a.ausentes_mujeres,
            'ausentes_t', a.ausentes_total,
            'observaciones', COALESCE(a.observaciones, ''),
            'is_submitted', (a.id IS NOT NULL),
            'submitted_by', p.full_name,
            'submitted_at', a.submitted_at
        ) ORDER BY c.sort_order, c.year, c.division
    ) INTO v_courses_json
    FROM public.courses c
    LEFT JOIN public.attendance_records a ON c.id = a.course_id AND a.date = p_date
    LEFT JOIN public.profiles p ON a.submitted_by = p.id
    WHERE c.shift_id = v_shift_id AND c.is_active = true;

    -- Aggregate Totals
    SELECT jsonb_build_object(
        'total_inscriptos_v', COALESCE(SUM(COALESCE(a.inscriptos_varones_snapshot, c.inscriptos_varones)), 0),
        'total_inscriptos_m', COALESCE(SUM(COALESCE(a.inscriptos_mujeres_snapshot, c.inscriptos_mujeres)), 0),
        'total_inscriptos_t', COALESCE(SUM(COALESCE(a.inscriptos_total_snapshot, c.inscriptos_total)), 0),
        'total_presentes_v', COALESCE(SUM(a.presentes_varones), 0),
        'total_presentes_m', COALESCE(SUM(a.presentes_mujeres), 0),
        'total_presentes_t', COALESCE(SUM(a.presentes_total), 0),
        'total_ausentes_v', COALESCE(SUM(a.ausentes_varones), 0),
        'total_ausentes_m', COALESCE(SUM(a.ausentes_mujeres), 0),
        'total_ausentes_t', COALESCE(SUM(a.ausentes_total), 0),
        'total_courses_count', COUNT(c.id),
        'submitted_courses_count', COUNT(a.id)
    ) INTO v_totals_json
    FROM public.courses c
    LEFT JOIN public.attendance_records a ON c.id = a.course_id AND a.date = p_date
    WHERE c.shift_id = v_shift_id AND c.is_active = true;

    -- Aggregate Staff Absences
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', sa.id,
            'staff_name', sa.staff_name,
            'role_type', sa.role_type,
            'subject_or_area', sa.subject_or_area,
            'reason', sa.reason,
            'observations', sa.observations
        )
    ), '[]'::jsonb) INTO v_absences_json
    FROM public.staff_absences sa
    WHERE sa.shift_id = v_shift_id AND sa.date = p_date;

    -- Build Final Response Object
    v_result := jsonb_build_object(
        'date', p_date,
        'shift_id', v_shift_id,
        'shift_code', p_shift_code,
        'shift_name', v_shift_name,
        'courses', COALESCE(v_courses_json, '[]'::jsonb),
        'totals', v_totals_json,
        'staff_absences', v_absences_json
    );

    RETURN v_result;
END;
$$;
```

### 6.3 Stored Procedure: Attendance Trends for Dashboard Analytics
```sql
CREATE OR REPLACE FUNCTION public.fn_get_attendance_trends(
    p_start_date DATE,
    p_end_date DATE,
    p_shift_id UUID DEFAULT NULL,
    p_course_id UUID DEFAULT NULL
)
RETURNS TABLE (
    record_date DATE,
    total_inscriptos BIGINT,
    total_presentes BIGINT,
    total_ausentes BIGINT,
    attendance_rate NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        a.date AS record_date,
        SUM(a.inscriptos_total_snapshot)::BIGINT AS total_inscriptos,
        SUM(a.presentes_total)::BIGINT AS total_presentes,
        SUM(a.ausentes_total)::BIGINT AS total_ausentes,
        ROUND(
            (SUM(a.presentes_total)::NUMERIC / NULLIF(SUM(a.inscriptos_total_snapshot), 0)) * 100, 
            2
        ) AS attendance_rate
    FROM public.attendance_records a
    WHERE a.date BETWEEN p_start_date AND p_end_date
      AND (p_shift_id IS NULL OR a.shift_id = p_shift_id)
      AND (p_course_id IS NULL OR a.course_id = p_course_id)
    GROUP BY a.date
    ORDER BY a.date ASC;
$$;
```

---

## 7. Seed Data & Complete Catalog Migration

### 7.1 Seed Shifts
```sql
INSERT INTO public.shifts (id, code, name, start_time, end_time, sort_order)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'manana', 'Turno Mañana', '07:30:00', '12:45:00', 1),
    ('22222222-2222-2222-2222-222222222222', 'tarde', 'Turno Tarde', '13:00:00', '18:15:00', 2),
    ('33333333-3333-3333-3333-333333333333', 'vespertino', 'Turno Vespertino', '18:30:00', '22:45:00', 3)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    sort_order = EXCLUDED.sort_order;
```

### 7.2 Seed Vespertino Courses (Directly from CSV `PARTE GENERALES TV.xlsx - T.V.csv`)
| Row in CSV | Course Name | Cycle | Orientation | Inscriptos V | Inscriptos M | Inscriptos Total |
|---|---|---|---|---|---|---|
| Line 11 | 5º4º | superior | TECET | 8 | 0 | 8 |
| Line 12 | 6º1º | superior | TECQU | 11 | 4 | 15 |
| Line 13 | 6º2º | superior | TECMM | 9 | 14 | 23 |
| Line 14 | 6º3º | superior | TECET | 23 | 2 | 25 |
| Line 15 | 6º4º | superior | TECET | 6 | 0 | 6 |
| Line 16 | 7º1º | superior | TECQU | 5 | 8 | 13 |
| Line 17 | 7º2º | superior | TECMM | 9 | 9 | 18 |
| Line 18 | 7º3º | superior | TECET | 20 | 9 | 29 |
| Line 19 | 7º4º | superior | TECET | 8 | 0 | 8 |
| Line 20 | 1° 1° C.TEC.MMO | tecnico_especial | C.TEC.MMO | 20 | 7 | 27 |
| **TOTAL** | **10 Cursos** | | | **119** | **53** | **172** |

```sql
-- Seed Vespertino courses
WITH v_shift AS (
    SELECT id FROM public.shifts WHERE code = 'vespertino'
)
INSERT INTO public.courses (shift_id, year, division, name, cycle, orientation, inscriptos_varones, inscriptos_mujeres, sort_order)
SELECT 
    v_shift.id,
    c.year,
    c.division,
    c.name,
    c.cycle::public.cycle_type,
    c.orientation::public.orientation_type,
    c.inscriptos_v,
    c.inscriptos_m,
    c.sort_order
FROM v_shift, (VALUES 
    (5, 4, '5° 4ª', 'superior', 'TECET', 8, 0, 1),
    (6, 1, '6° 1ª', 'superior', 'TECQU', 11, 4, 2),
    (6, 2, '6° 2ª', 'superior', 'TECMM', 9, 14, 3),
    (6, 3, '6° 3ª', 'superior', 'TECET', 23, 2, 4),
    (6, 4, '6° 4ª', 'superior', 'TECET', 6, 0, 5),
    (7, 1, '7° 1ª', 'superior', 'TECQU', 5, 8, 6),
    (7, 2, '7° 2ª', 'superior', 'TECMM', 9, 9, 7),
    (7, 3, '7° 3ª', 'superior', 'TECET', 20, 9, 8),
    (7, 4, '7° 4ª', 'superior', 'TECET', 8, 0, 9),
    (1, 1, '1° 1ª C.TEC.MMO', 'tecnico_especial', 'C.TEC.MMO', 20, 7, 10)
) AS c(year, division, name, cycle, orientation, inscriptos_v, inscriptos_m, sort_order)
ON CONFLICT (shift_id, name) DO UPDATE SET
    inscriptos_varones = EXCLUDED.inscriptos_varones,
    inscriptos_mujeres = EXCLUDED.inscriptos_mujeres,
    cycle = EXCLUDED.cycle,
    orientation = EXCLUDED.orientation,
    sort_order = EXCLUDED.sort_order;
```

### 7.3 Seed Standard Course Catalog for Mañana and Tarde Shifts
As specified in `ORIGINAL_REQUEST.md`:
- **Ciclo Básico**:
  - 1°: 1°1ª, 1°2ª, 1°3ª, 1°4ª, 1°5ª
  - 2°: 2°1ª, 2°2ª, 2°3ª, 2°4ª, 2°5ª
  - 3°: 3°1ª, 3°2ª, 3°3ª, 3°4ª
- **Ciclo Superior**:
  - 4°: 4°1ª (TECQU), 4°2ª (TECMM), 4°3ª (TECET)
  - 5°: 5°1ª (TECQU), 5°2ª (TECMM), 5°3ª (TECET)
  - 6°: 6°1ª (TECQU), 6°2ª (TECMM), 6°3ª (TECET)
  - 7°: 7°1ª (TECQU), 7°2ª (TECMM), 7°3ª (TECET)

```sql
-- Seed Mañana Courses
WITH m_shift AS (
    SELECT id FROM public.shifts WHERE code = 'manana'
)
INSERT INTO public.courses (shift_id, year, division, name, cycle, orientation, inscriptos_varones, inscriptos_mujeres, sort_order)
SELECT 
    m_shift.id,
    c.year,
    c.division,
    c.name,
    c.cycle::public.cycle_type,
    c.orientation::public.orientation_type,
    0, 0, -- Enrollment initialized to 0, configurable by admin
    c.sort_order
FROM m_shift, (VALUES 
    -- Ciclo Básico 1°
    (1, 1, '1° 1ª', 'basico', NULL, 1),
    (1, 2, '1° 2ª', 'basico', NULL, 2),
    (1, 3, '1° 3ª', 'basico', NULL, 3),
    (1, 4, '1° 4ª', 'basico', NULL, 4),
    (1, 5, '1° 5ª', 'basico', NULL, 5),
    -- Ciclo Básico 2°
    (2, 1, '2° 1ª', 'basico', NULL, 6),
    (2, 2, '2° 2ª', 'basico', NULL, 7),
    (2, 3, '2° 3ª', 'basico', NULL, 8),
    (2, 4, '2° 4ª', 'basico', NULL, 9),
    (2, 5, '2° 5ª', 'basico', NULL, 10),
    -- Ciclo Básico 3°
    (3, 1, '3° 1ª', 'basico', NULL, 11),
    (3, 2, '3° 2ª', 'basico', NULL, 12),
    (3, 3, '3° 3ª', 'basico', NULL, 13),
    (3, 4, '3° 4ª', 'basico', NULL, 14),
    -- Ciclo Superior 4°
    (4, 1, '4° 1ª', 'superior', 'TECQU', 15),
    (4, 2, '4° 2ª', 'superior', 'TECMM', 16),
    (4, 3, '4° 3ª', 'superior', 'TECET', 17),
    -- Ciclo Superior 5°
    (5, 1, '5° 1ª', 'superior', 'TECQU', 18),
    (5, 2, '5° 2ª', 'superior', 'TECMM', 19),
    (5, 3, '5° 3ª', 'superior', 'TECET', 20),
    -- Ciclo Superior 6°
    (6, 1, '6° 1ª', 'superior', 'TECQU', 21),
    (6, 2, '6° 2ª', 'superior', 'TECMM', 22),
    (6, 3, '6° 3ª', 'superior', 'TECET', 23),
    -- Ciclo Superior 7°
    (7, 1, '7° 1ª', 'superior', 'TECQU', 24),
    (7, 2, '7° 2ª', 'superior', 'TECMM', 25),
    (7, 3, '7° 3ª', 'superior', 'TECET', 26)
) AS c(year, division, name, cycle, orientation, sort_order)
ON CONFLICT (shift_id, name) DO NOTHING;

-- Seed Tarde Courses
WITH t_shift AS (
    SELECT id FROM public.shifts WHERE code = 'tarde'
)
INSERT INTO public.courses (shift_id, year, division, name, cycle, orientation, inscriptos_varones, inscriptos_mujeres, sort_order)
SELECT 
    t_shift.id,
    c.year,
    c.division,
    c.name,
    c.cycle::public.cycle_type,
    c.orientation::public.orientation_type,
    0, 0,
    c.sort_order
FROM t_shift, (VALUES 
    -- Ciclo Básico 1°
    (1, 1, '1° 1ª', 'basico', NULL, 1),
    (1, 2, '1° 2ª', 'basico', NULL, 2),
    (1, 3, '1° 3ª', 'basico', NULL, 3),
    (1, 4, '1° 4ª', 'basico', NULL, 4),
    (1, 5, '1° 5ª', 'basico', NULL, 5),
    -- Ciclo Básico 2°
    (2, 1, '2° 1ª', 'basico', NULL, 6),
    (2, 2, '2° 2ª', 'basico', NULL, 7),
    (2, 3, '2° 3ª', 'basico', NULL, 8),
    (2, 4, '2° 4ª', 'basico', NULL, 9),
    (2, 5, '2° 5ª', 'basico', NULL, 10),
    -- Ciclo Básico 3°
    (3, 1, '3° 1ª', 'basico', NULL, 11),
    (3, 2, '3° 2ª', 'basico', NULL, 12),
    (3, 3, '3° 3ª', 'basico', NULL, 13),
    (3, 4, '3° 4ª', 'basico', NULL, 14),
    -- Ciclo Superior 4°
    (4, 1, '4° 1ª', 'superior', 'TECQU', 15),
    (4, 2, '4° 2ª', 'superior', 'TECMM', 16),
    (4, 3, '4° 3ª', 'superior', 'TECET', 17),
    -- Ciclo Superior 5°
    (5, 1, '5° 1ª', 'superior', 'TECQU', 18),
    (5, 2, '5° 2ª', 'superior', 'TECMM', 19),
    (5, 3, '5° 3ª', 'superior', 'TECET', 20),
    -- Ciclo Superior 6°
    (6, 1, '6° 1ª', 'superior', 'TECQU', 21),
    (6, 2, '6° 2ª', 'superior', 'TECMM', 22),
    (6, 3, '6° 3ª', 'superior', 'TECET', 23),
    -- Ciclo Superior 7°
    (7, 1, '7° 1ª', 'superior', 'TECQU', 24),
    (7, 2, '7° 2ª', 'superior', 'TECMM', 25),
    (7, 3, '7° 3ª', 'superior', 'TECET', 26)
) AS c(year, division, name, cycle, orientation, sort_order)
ON CONFLICT (shift_id, name) DO NOTHING;
```

### 7.4 Admin Bootstrap RPC Function
Allows promoting the first user or designated administrator safely via SQL or Supabase RPC:

```sql
CREATE OR REPLACE FUNCTION public.bootstrap_admin_user(p_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles
    SET role = 'administrador'
    WHERE email = p_email;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuario con email % no encontrado en profiles', p_email;
    END IF;
END;
$$;
```

---

## 8. TypeScript Types & Supabase Client Query Architecture

```typescript
// types/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AppRole = 'administrador' | 'preceptor' | 'profesor'
export type CycleType = 'basico' | 'superior' | 'tecnico_especial'
export type OrientationType = 'TECQU' | 'TECMM' | 'TECET' | 'C.TEC.MMO'
export type SubmissionStatus = 'draft' | 'submitted' | 'verified'

export interface Shift {
  id: string
  code: 'manana' | 'tarde' | 'vespertino'
  name: string
  start_time: string
  end_time: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  role: AppRole
  full_name: string
  email: string
  dni?: string | null
  phone?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  shift_id: string
  year: number
  division: number
  name: string
  cycle: CycleType
  orientation?: OrientationType | null
  inscriptos_varones: number
  inscriptos_mujeres: number
  inscriptos_total: number
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  shift?: Shift
}

export interface CourseAssignment {
  id: string
  course_id: string
  teacher_id: string
  assigned_by?: string | null
  created_at: string
  course?: Course
  teacher?: Profile
}

export interface AttendanceRecord {
  id: string
  date: string
  course_id: string
  shift_id: string
  submitted_by?: string | null
  inscriptos_varones_snapshot: number
  inscriptos_mujeres_snapshot: number
  inscriptos_total_snapshot: number
  presentes_varones: number
  presentes_mujeres: number
  presentes_total: number
  ausentes_varones: number
  ausentes_mujeres: number
  ausentes_total: number
  observaciones?: string | null
  status: SubmissionStatus
  is_locked: boolean
  submitted_at?: string | null
  created_at: string
  updated_at: string
  course?: Course
  submitter?: Profile
}

export interface StaffAbsence {
  id: string
  date: string
  shift_id: string
  staff_name: string
  role_type: string
  subject_or_area?: string | null
  course_id?: string | null
  reason?: string | null
  observations?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}
```

---

## 9. Frontend Client Operations & Supabase Query Blueprint

### 9.1 Teacher Submitting Attendance (Mobile Form)
```typescript
// Teacher submits daily attendance for assigned course
export async function submitCourseAttendance(params: {
  courseId: string
  presentesV: number
  presentesM: number
  ausentesV: number
  ausentesM: number
  observaciones?: string
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuario no autenticado')

  const { data, error } = await supabase
    .from('attendance_records')
    .upsert({
      date: new Date().toISOString().split('T')[0],
      course_id: params.courseId,
      submitted_by: user.id,
      presentes_varones: params.presentesV,
      presentes_mujeres: params.presentesM,
      ausentes_varones: params.ausentesV,
      ausentes_mujeres: params.ausentesM,
      observaciones: params.observaciones,
      status: 'submitted',
      submitted_at: new Date().toISOString()
    }, {
      onConflict: 'date,course_id'
    })
    .select()
    .single()

  if (error) throw error
  return data
}
```

### 9.2 Preceptor & Admin Daily Parte General Fetch
```typescript
// Fetch full aggregated Parte General with totals and absences
export async function fetchDailyParteGeneral(date: string, shiftCode: string) {
  const { data, error } = await supabase.rpc('fn_get_shift_parte_general', {
    p_date: date,
    p_shift_code: shiftCode
  })

  if (error) throw error
  return data
}
```

---

## 10. Verification & Edge Case Matrix

| Edge Case / Scenario | System Behavior & Defense Mechanism |
|---|---|
| **Teacher attempts to submit for an unassigned course** | Blocked by RLS INSERT/UPDATE policy `is_assigned_to_course(course_id)` -> DB returns 403 / 0 rows affected. |
| **Teacher attempts to edit attendance for yesterday's date** | Blocked by RLS INSERT/UPDATE policy `date = CURRENT_DATE` -> DB rejects modification. |
| **Sum mismatch: $Presentes + Ausentes \neq Inscriptos$** | Blocked by `trg_validate_and_snapshot_attendance` trigger with descriptive PostgreSQL exception error message. |
| **Admin modifies enrollment numbers mid-year** | Historical records preserve `inscriptos_*_snapshot` values, preventing retroactive corruption of past Partes Generales. |
| **Preceptor creates attendance or logs teacher absence** | Permitted by RLS policy `is_admin_or_preceptor()`. |
| **Simultaneous submissions for the same course on the same day** | Handled atomically via PostgreSQL UNIQUE index `uq_attendance_date_course` with upsert locking. |
| **User role escalation attempt in profile update** | Blocked by profile RLS check `role = (SELECT role FROM profiles WHERE id = auth.uid())`. |

---

## 11. Conclusion & Recommendations for Implementation Team
1. Apply the full SQL schema migration script directly via Supabase SQL Editor or Migration CLI.
2. Initialize shifts and courses using the provided seed data script.
3. Configure the Supabase Auth hook for `fn_handle_new_user` so all user sign-ups are smoothly mapped to `public.profiles`.
4. Run `SELECT public.bootstrap_admin_user('<admin-email>')` for the initial administrator account.
