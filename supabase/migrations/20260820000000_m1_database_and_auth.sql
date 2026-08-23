-- ============================================================================
-- MIGRATION: 20260820000000_m1_database_and_auth.sql
-- Project: Escuela de Educación Secundaria Técnica N° 3 "Ntra. Sra. de la Merced"
-- System: Digital Attendance & Daily General Report ("Parte General de Alumnos")
-- Database: PostgreSQL 15+ (Supabase)
-- Milestone: M1 (Database & Auth Engine)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 2. CUSTOM ENUM TYPES
-- ----------------------------------------------------------------------------
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM (
            'administrador',
            'preceptor',
            'profesor'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'course_cycle') THEN
        CREATE TYPE public.course_cycle AS ENUM (
            'basico',
            'superior',
            'tecnico_especial'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'technical_orientation') THEN
        CREATE TYPE public.technical_orientation AS ENUM (
            'TECQU',
            'TECMM',
            'TECET',
            'C.TEC.MMO',
            'construcciones',
            'electromecanica',
            'quimica',
            'computacion',
            'ciclo_basico',
            'otra'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
        CREATE TYPE public.attendance_status AS ENUM (
            'presente',
            'ausente_justificado',
            'ausente_injustificado',
            'comision_servicio',
            'licencia',
            'guardia',
            'submitted',
            'draft'
        );
    END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 3. CORE RELATIONAL TABLES
-- ----------------------------------------------------------------------------

-- 3.1 SHIFTS (Turnos Escolares: Mañana, Tarde, Vespertino)
CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.2 PROFILES (Perfiles Institucionales Vinculados a auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role public.user_role NOT NULL DEFAULT 'profesor',
    shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
    dni VARCHAR(20),
    phone VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.3 COURSES (Catálogo de Cursos, Divisiones y Matrícula Oficial)
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE RESTRICT,
    year INT NOT NULL CHECK (year BETWEEN 1 AND 7),
    division INT NOT NULL CHECK (division BETWEEN 1 AND 10),
    name VARCHAR(50) NOT NULL,
    cycle public.course_cycle NOT NULL,
    orientation public.technical_orientation,
    inscriptos_varones INT NOT NULL DEFAULT 0 CHECK (inscriptos_varones >= 0),
    inscriptos_mujeres INT NOT NULL DEFAULT 0 CHECK (inscriptos_mujeres >= 0),
    inscriptos_total INT GENERATED ALWAYS AS (inscriptos_varones + inscriptos_mujeres) STORED,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_course_shift_name UNIQUE (shift_id, name)
);

-- 3.4 COURSE ASSIGNMENTS (Asignación de Cursos a Docentes)
CREATE TABLE IF NOT EXISTS public.course_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    role_in_course VARCHAR(50) NOT NULL DEFAULT 'titular',
    is_active BOOLEAN NOT NULL DEFAULT true,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_course UNIQUE (user_id, course_id)
);

-- 3.5 ATTENDANCE RECORDS (Partes Diarios de Asistencia por Curso)
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
    shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE RESTRICT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Present counts
    presentes_varones INT NOT NULL DEFAULT 0 CHECK (presentes_varones >= 0),
    ausentes_varones INT NOT NULL DEFAULT 0 CHECK (ausentes_varones >= 0),
    presentes_mujeres INT NOT NULL DEFAULT 0 CHECK (presentes_mujeres >= 0),
    ausentes_mujeres INT NOT NULL DEFAULT 0 CHECK (ausentes_mujeres >= 0),
    
    -- Generated Stored Totals
    total_presentes INT GENERATED ALWAYS AS (presentes_varones + presentes_mujeres) STORED,
    total_ausentes INT GENERATED ALWAYS AS (ausentes_varones + ausentes_mujeres) STORED,
    total_matricula INT GENERATED ALWAYS AS (presentes_varones + ausentes_varones + presentes_mujeres + ausentes_mujeres) STORED,
    
    -- Immutable Enrollment Snapshot at Submission Time
    snapshot_inscriptos_v INT NOT NULL DEFAULT 0 CHECK (snapshot_inscriptos_v >= 0),
    snapshot_inscriptos_m INT NOT NULL DEFAULT 0 CHECK (snapshot_inscriptos_m >= 0),
    snapshot_inscriptos_total INT GENERATED ALWAYS AS (snapshot_inscriptos_v + snapshot_inscriptos_m) STORED,
    
    -- Submitter attribution & state
    submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status public.attendance_status NOT NULL DEFAULT 'presente',
    observations TEXT,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    submitted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    CONSTRAINT uq_attendance_course_date UNIQUE (course_id, date)
);

-- 3.6 STAFF ABSENCES (Registro de Inasistencias Docentes y Auxiliares)
CREATE TABLE IF NOT EXISTS public.staff_absences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE RESTRICT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    staff_name TEXT NOT NULL,
    role VARCHAR(100) NOT NULL,
    subject_or_area VARCHAR(255),
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    reason TEXT,
    is_justified BOOLEAN NOT NULL DEFAULT false,
    observations TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.7 ATTENDANCE AUDIT LOGS (Auditoría Forense de Modificaciones)
CREATE TABLE IF NOT EXISTS public.attendance_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id UUID,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);


-- ----------------------------------------------------------------------------
-- 4. PERFORMANCE INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_shifts_code ON public.shifts(code);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role, is_active);
CREATE INDEX IF NOT EXISTS idx_courses_shift_active ON public.courses(shift_id, is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_course_assignments_user ON public.course_assignments(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_course_assignments_course ON public.course_assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date_shift ON public.attendance_records(date, shift_id);
CREATE INDEX IF NOT EXISTS idx_attendance_course_date ON public.attendance_records(course_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_created_by ON public.attendance_records(created_by);
CREATE INDEX IF NOT EXISTS idx_attendance_submitted_by ON public.attendance_records(submitted_by);
CREATE INDEX IF NOT EXISTS idx_staff_absences_date_shift ON public.staff_absences(date, shift_id);
CREATE INDEX IF NOT EXISTS idx_attendance_audit_log_att ON public.attendance_audit_logs(attendance_id, created_at DESC);


-- ----------------------------------------------------------------------------
-- 5. SECURITY DEFINER HELPER FUNCTIONS (RECURSION-SAFE)
-- ----------------------------------------------------------------------------

-- 5.1 Helper: Get Current User Role
CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT role 
    FROM public.profiles 
    WHERE id = auth.uid() 
      AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT public.auth_user_role();
$$;

-- 5.2 Helper: Check if Current User is Administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE id = auth.uid() 
          AND role = 'administrador'::public.user_role 
          AND is_active = true
    );
$$;

-- 5.3 Helper: Check if Current User is Preceptor
CREATE OR REPLACE FUNCTION public.is_preceptor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE id = auth.uid() 
          AND role = 'preceptor'::public.user_role 
          AND is_active = true
    );
$$;

-- 5.4 Helper: Check if Current User is Admin or Preceptor
CREATE OR REPLACE FUNCTION public.is_admin_or_preceptor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE id = auth.uid() 
          AND role IN ('administrador'::public.user_role, 'preceptor'::public.user_role) 
          AND is_active = true
    );
$$;

-- 5.5 Helper: Check if Current User is Assigned to Course
CREATE OR REPLACE FUNCTION public.is_assigned_to_course(p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.course_assignments
        WHERE course_id = p_course_id 
          AND user_id = auth.uid()
          AND is_active = true
    );
$$;

-- 5.6 Helper: Check Edit Permission on Attendance Record
CREATE OR REPLACE FUNCTION public.can_edit_attendance(p_course_id UUID, p_date DATE)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT 
        public.is_admin_or_preceptor()
        OR (
            public.is_assigned_to_course(p_course_id)
            AND p_date = CURRENT_DATE
        );
$$;


-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

-- Enable RLS on all 7 tables
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_audit_logs ENABLE ROW LEVEL SECURITY;

-- 6.1 Shifts Policies
DROP POLICY IF EXISTS "shifts_select_authenticated" ON public.shifts;
CREATE POLICY "shifts_select_authenticated"
    ON public.shifts FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "shifts_admin_all" ON public.shifts;
CREATE POLICY "shifts_admin_all"
    ON public.shifts FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6.2 Profiles Policies
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid()
        AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
        AND is_active = (SELECT p.is_active FROM public.profiles p WHERE p.id = auth.uid())
    );

-- 6.3 Courses Policies
DROP POLICY IF EXISTS "courses_select_policy" ON public.courses;
CREATE POLICY "courses_select_policy"
    ON public.courses FOR SELECT
    TO authenticated
    USING (
        public.is_admin_or_preceptor()
        OR public.is_assigned_to_course(id)
    );

DROP POLICY IF EXISTS "courses_admin_all" ON public.courses;
CREATE POLICY "courses_admin_all"
    ON public.courses FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6.4 Course Assignments Policies
DROP POLICY IF EXISTS "assignments_select_policy" ON public.course_assignments;
CREATE POLICY "assignments_select_policy"
    ON public.course_assignments FOR SELECT
    TO authenticated
    USING (
        public.is_admin_or_preceptor()
        OR user_id = auth.uid()
    );

DROP POLICY IF EXISTS "assignments_admin_all" ON public.course_assignments;
CREATE POLICY "assignments_admin_all"
    ON public.course_assignments FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6.5 Attendance Records Policies
DROP POLICY IF EXISTS "attendance_select_policy" ON public.attendance_records;
CREATE POLICY "attendance_select_policy"
    ON public.attendance_records FOR SELECT
    TO authenticated
    USING (
        public.is_admin_or_preceptor()
        OR public.is_assigned_to_course(course_id)
    );

DROP POLICY IF EXISTS "attendance_insert_policy" ON public.attendance_records;
CREATE POLICY "attendance_insert_policy"
    ON public.attendance_records FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin_or_preceptor()
        OR (
            public.is_assigned_to_course(course_id)
            AND date = CURRENT_DATE
        )
    );

DROP POLICY IF EXISTS "attendance_update_policy" ON public.attendance_records;
CREATE POLICY "attendance_update_policy"
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

DROP POLICY IF EXISTS "attendance_delete_policy" ON public.attendance_records;
CREATE POLICY "attendance_delete_policy"
    ON public.attendance_records FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- 6.6 Staff Absences Policies
DROP POLICY IF EXISTS "staff_absences_select_authenticated" ON public.staff_absences;
CREATE POLICY "staff_absences_select_authenticated"
    ON public.staff_absences FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "staff_absences_manage_admin_preceptor" ON public.staff_absences;
CREATE POLICY "staff_absences_manage_admin_preceptor"
    ON public.staff_absences FOR ALL
    TO authenticated
    USING (public.is_admin_or_preceptor())
    WITH CHECK (public.is_admin_or_preceptor());

-- 6.7 Attendance Audit Logs Policies
DROP POLICY IF EXISTS "audit_logs_select_admin_only" ON public.attendance_audit_logs;
CREATE POLICY "audit_logs_select_admin_only"
    ON public.attendance_audit_logs FOR SELECT
    TO authenticated
    USING (public.is_admin());

DROP POLICY IF EXISTS "audit_logs_prevent_direct_writes" ON public.attendance_audit_logs;
CREATE POLICY "audit_logs_prevent_direct_writes"
    ON public.attendance_audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (false);


-- ----------------------------------------------------------------------------
-- 7. INTEGRITY TRIGGERS & BUSINESS LOGIC
-- ----------------------------------------------------------------------------

-- 7.1 Mathematical Parity & Snapshotting Trigger
CREATE OR REPLACE FUNCTION public.fn_validate_attendance_math()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_inscriptos_v INT;
    v_inscriptos_m INT;
    v_course_shift UUID;
    v_is_active BOOLEAN;
BEGIN
    -- 1. Fetch active course enrollment and shift
    SELECT inscriptos_varones, inscriptos_mujeres, shift_id, is_active
    INTO v_inscriptos_v, v_inscriptos_m, v_course_shift, v_is_active
    FROM public.courses
    WHERE id = NEW.course_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Error de Integridad: El curso con ID % no existe.', NEW.course_id;
    END IF;

    IF v_is_active IS NOT TRUE THEN
        RAISE EXCEPTION 'Error de Integridad: El curso especificado (%) no se encuentra activo.', NEW.course_id;
    END IF;

    -- 2. Synchronize shift_id with course's shift
    NEW.shift_id := v_course_shift;

    -- 3. Populate enrollment snapshots on INSERT or if 0
    IF TG_OP = 'INSERT' OR (COALESCE(NEW.snapshot_inscriptos_v, 0) = 0 AND COALESCE(NEW.snapshot_inscriptos_m, 0) = 0) THEN
        NEW.snapshot_inscriptos_v := v_inscriptos_v;
        NEW.snapshot_inscriptos_m := v_inscriptos_m;
    END IF;

    -- 4. Check for negative quantities
    IF NEW.presentes_varones < 0 OR NEW.ausentes_varones < 0 OR
       NEW.presentes_mujeres < 0 OR NEW.ausentes_mujeres < 0 THEN
        RAISE EXCEPTION 'Error de Validación: Las cantidades de presentes y ausentes no pueden ser negativas.';
    END IF;

    -- 5. Mathematical parity check for Varones (P_V + A_V = I_V)
    IF (NEW.presentes_varones + NEW.ausentes_varones) <> NEW.snapshot_inscriptos_v THEN
        RAISE EXCEPTION 'Inconsistencia en Varones para curso %: Presentes (%) + Ausentes (%) = %, pero la matrícula de inscriptos es %.',
            NEW.course_id, NEW.presentes_varones, NEW.ausentes_varones,
            (NEW.presentes_varones + NEW.ausentes_varones),
            NEW.snapshot_inscriptos_v;
    END IF;

    -- 6. Mathematical parity check for Mujeres (P_M + A_M = I_M)
    IF (NEW.presentes_mujeres + NEW.ausentes_mujeres) <> NEW.snapshot_inscriptos_m THEN
        RAISE EXCEPTION 'Inconsistencia en Mujeres para curso %: Presentes (%) + Ausentes (%) = %, pero la matrícula de inscriptos es %.',
            NEW.course_id, NEW.presentes_mujeres, NEW.ausentes_mujeres,
            (NEW.presentes_mujeres + NEW.ausentes_mujeres),
            NEW.snapshot_inscriptos_m;
    END IF;

    -- 7. Attribution & Timestamp Maintenance
    IF NEW.created_by IS NULL THEN
        NEW.created_by := COALESCE(NEW.submitted_by, auth.uid());
    END IF;
    IF NEW.submitted_by IS NULL THEN
        NEW.submitted_by := COALESCE(NEW.created_by, auth.uid());
    END IF;
    IF TG_OP = 'UPDATE' THEN
        NEW.updated_by := COALESCE(auth.uid(), NEW.updated_by);
    END IF;
    NEW.updated_at := timezone('utc'::text, now());

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_attendance_math ON public.attendance_records;
CREATE TRIGGER trg_validate_attendance_math
    BEFORE INSERT OR UPDATE ON public.attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_validate_attendance_math();


-- 7.2 Historical Date Locking & Admin Bypass Trigger
CREATE OR REPLACE FUNCTION public.fn_date_lock_attendance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Admin bypass: Administrators are permitted full retroactive editing and deletion
    IF public.is_admin() THEN
        RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF NEW.date < CURRENT_DATE THEN
            RAISE EXCEPTION 'Bloqueo de Fecha: No se permite registrar partes de asistencia de fechas pasadas (%). Solo administradores pueden realizar cargas retroactivas.', NEW.date;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.date < CURRENT_DATE THEN
            RAISE EXCEPTION 'Bloqueo de Fecha: No se permite modificar partes de asistencia de fechas pasadas (%). Contacte a un directivo para solicitar una corrección.', OLD.date;
        END IF;
        IF OLD.is_locked = true THEN
            RAISE EXCEPTION 'Bloqueo Administrativo: El parte de asistencia del % se encuentra bloqueado contra modificaciones.', OLD.date;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.date < CURRENT_DATE THEN
            RAISE EXCEPTION 'Bloqueo de Fecha: No se permite eliminar partes de asistencia históricos sin permisos de administrador.';
        END IF;
    END IF;

    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS trg_date_lock_attendance ON public.attendance_records;
CREATE TRIGGER trg_date_lock_attendance
    BEFORE INSERT OR UPDATE OR DELETE ON public.attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_date_lock_attendance();


-- 7.3 Forensic Attendance Audit Trigger
CREATE OR REPLACE FUNCTION public.fn_attendance_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.attendance_audit_logs (
            attendance_id,
            course_id,
            changed_by,
            action,
            old_values,
            new_values,
            created_at
        ) VALUES (
            NEW.id,
            NEW.course_id,
            COALESCE(NEW.created_by, NEW.submitted_by, auth.uid()),
            'INSERT',
            NULL,
            to_jsonb(NEW),
            timezone('utc'::text, now())
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.attendance_audit_logs (
            attendance_id,
            course_id,
            changed_by,
            action,
            old_values,
            new_values,
            created_at
        ) VALUES (
            NEW.id,
            NEW.course_id,
            COALESCE(NEW.updated_by, auth.uid()),
            'UPDATE',
            to_jsonb(OLD),
            to_jsonb(NEW),
            timezone('utc'::text, now())
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.attendance_audit_logs (
            attendance_id,
            course_id,
            changed_by,
            action,
            old_values,
            new_values,
            created_at
        ) VALUES (
            OLD.id,
            OLD.course_id,
            auth.uid(),
            'DELETE',
            to_jsonb(OLD),
            NULL,
            timezone('utc'::text, now())
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_attendance_audit ON public.attendance_records;
CREATE TRIGGER trg_attendance_audit
    AFTER INSERT OR UPDATE OR DELETE ON public.attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_attendance_audit();


-- 7.4 Supabase Auth User Synchronization Trigger
CREATE OR REPLACE FUNCTION public.fn_handle_new_auth_user()
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
        is_active,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'profesor'::public.user_role),
        true,
        timezone('utc'::text, now()),
        timezone('utc'::text, now())
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_handle_new_auth_user();


-- ----------------------------------------------------------------------------
-- 8. STORED PROCEDURES & REPORTING ENGINE
-- ----------------------------------------------------------------------------

-- 8.1 Official Shift "Parte General" Procedure by Shift UUID
CREATE OR REPLACE FUNCTION public.fn_get_shift_parte_general(
    p_shift_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_shift RECORD;
    v_courses_json JSONB;
    v_cycle_subtotals JSONB;
    v_totals_json JSONB;
    v_absences_json JSONB;
    v_result JSONB;
BEGIN
    -- 1. Identify Shift Metadata
    SELECT id, code, name INTO v_shift
    FROM public.shifts
    WHERE id = p_shift_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Turno con ID % no encontrado.', p_shift_id;
    END IF;

    -- 2. Aggregate Course Lines (Preserving catalog order and unsubmitted state)
    WITH course_data AS (
        SELECT 
            c.id AS course_id,
            c.name AS course_name,
            c.year,
            c.division,
            c.cycle,
            c.orientation,
            c.sort_order,
            COALESCE(a.snapshot_inscriptos_v, c.inscriptos_varones) AS inscriptos_v,
            COALESCE(a.snapshot_inscriptos_m, c.inscriptos_mujeres) AS inscriptos_m,
            COALESCE(a.snapshot_inscriptos_total, c.inscriptos_total) AS inscriptos_t,
            COALESCE(a.presentes_varones, 0) AS presentes_v,
            COALESCE(a.presentes_mujeres, 0) AS presentes_m,
            COALESCE(a.total_presentes, 0) AS presentes_t,
            COALESCE(a.ausentes_varones, 0) AS ausentes_v,
            COALESCE(a.ausentes_mujeres, 0) AS ausentes_m,
            COALESCE(a.total_ausentes, 0) AS ausentes_t,
            ROUND(
                CASE 
                    WHEN a.id IS NOT NULL AND COALESCE(a.snapshot_inscriptos_total, c.inscriptos_total) > 0 
                    THEN (COALESCE(a.total_presentes, 0)::NUMERIC / COALESCE(a.snapshot_inscriptos_total, c.inscriptos_total)::NUMERIC) * 100.0
                    ELSE 0.0
                END, 2
            ) AS porcentaje_asistencia,
            COALESCE(a.observations, '') AS observations,
            (a.id IS NOT NULL) AS is_submitted,
            p.full_name AS submitted_by_name,
            a.submitted_at,
            COALESCE(a.is_locked, false) AS is_locked
        FROM public.courses c
        LEFT JOIN public.attendance_records a ON c.id = a.course_id AND a.date = p_date
        LEFT JOIN public.profiles p ON COALESCE(a.submitted_by, a.created_by) = p.id
        WHERE c.shift_id = p_shift_id AND c.is_active = true
        ORDER BY c.sort_order, c.year, c.division
    )
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'course_id', course_id,
                'course_name', course_name,
                'year', year,
                'division', division,
                'cycle', cycle,
                'orientation', COALESCE(orientation::text, '-'),
                'sort_order', sort_order,
                'inscriptos_v', inscriptos_v,
                'inscriptos_m', inscriptos_m,
                'inscriptos_t', inscriptos_t,
                'presentes_v', CASE WHEN is_submitted THEN presentes_v ELSE NULL END,
                'presentes_m', CASE WHEN is_submitted THEN presentes_m ELSE NULL END,
                'presentes_t', CASE WHEN is_submitted THEN presentes_t ELSE NULL END,
                'ausentes_v', CASE WHEN is_submitted THEN ausentes_v ELSE NULL END,
                'ausentes_m', CASE WHEN is_submitted THEN ausentes_m ELSE NULL END,
                'ausentes_t', CASE WHEN is_submitted THEN ausentes_t ELSE NULL END,
                'porcentaje_asistencia', CASE WHEN is_submitted THEN porcentaje_asistencia ELSE NULL END,
                'observations', observations,
                'is_submitted', is_submitted,
                'submitted_by_name', submitted_by_name,
                'submitted_at', submitted_at,
                'is_locked', is_locked
            )
        ), 
        '[]'::jsonb
    ) INTO v_courses_json
    FROM course_data;

    -- 3. Cycle Subtotals (basico, superior, tecnico_especial)
    WITH cycle_metrics AS (
        SELECT 
            c.cycle,
            COUNT(c.id) AS courses_count,
            COUNT(a.id) AS submitted_count,
            SUM(COALESCE(a.snapshot_inscriptos_v, c.inscriptos_varones)) AS inscriptos_v,
            SUM(COALESCE(a.snapshot_inscriptos_m, c.inscriptos_mujeres)) AS inscriptos_m,
            SUM(COALESCE(a.snapshot_inscriptos_total, c.inscriptos_total)) AS inscriptos_t,
            SUM(COALESCE(a.presentes_varones, 0)) AS presentes_v,
            SUM(COALESCE(a.presentes_mujeres, 0)) AS presentes_m,
            SUM(COALESCE(a.total_presentes, 0)) AS presentes_t,
            SUM(COALESCE(a.ausentes_varones, 0)) AS ausentes_v,
            SUM(COALESCE(a.ausentes_mujeres, 0)) AS ausentes_m,
            SUM(COALESCE(a.total_ausentes, 0)) AS ausentes_t
        FROM public.courses c
        LEFT JOIN public.attendance_records a ON c.id = a.course_id AND a.date = p_date
        WHERE c.shift_id = p_shift_id AND c.is_active = true
        GROUP BY c.cycle
    )
    SELECT COALESCE(
        jsonb_object_agg(
            cycle::text,
            jsonb_build_object(
                'courses_count', courses_count,
                'submitted_count', submitted_count,
                'inscriptos_v', COALESCE(inscriptos_v, 0),
                'inscriptos_m', COALESCE(inscriptos_m, 0),
                'inscriptos_t', COALESCE(inscriptos_t, 0),
                'presentes_v', COALESCE(presentes_v, 0),
                'presentes_m', COALESCE(presentes_m, 0),
                'presentes_t', COALESCE(presentes_t, 0),
                'ausentes_v', COALESCE(ausentes_v, 0),
                'ausentes_m', COALESCE(ausentes_m, 0),
                'ausentes_t', COALESCE(ausentes_t, 0),
                'porcentaje_asistencia', ROUND(
                    CASE 
                        WHEN COALESCE(inscriptos_t, 0) > 0 
                        THEN (COALESCE(presentes_t, 0)::NUMERIC / inscriptos_t::NUMERIC) * 100.0 
                        ELSE 0.0 
                    END, 2
                )
            )
        ),
        '{}'::jsonb
    ) INTO v_cycle_subtotals
    FROM cycle_metrics;

    -- 4. Overall Shift Grand Totals
    SELECT jsonb_build_object(
        'inscriptos_v', COALESCE(SUM(COALESCE(a.snapshot_inscriptos_v, c.inscriptos_varones)), 0),
        'inscriptos_m', COALESCE(SUM(COALESCE(a.snapshot_inscriptos_m, c.inscriptos_mujeres)), 0),
        'inscriptos_t', COALESCE(SUM(COALESCE(a.snapshot_inscriptos_total, c.inscriptos_total)), 0),
        'presentes_v', COALESCE(SUM(a.presentes_varones), 0),
        'presentes_m', COALESCE(SUM(a.presentes_mujeres), 0),
        'presentes_t', COALESCE(SUM(a.total_presentes), 0),
        'ausentes_v', COALESCE(SUM(a.ausentes_varones), 0),
        'ausentes_m', COALESCE(SUM(a.ausentes_mujeres), 0),
        'ausentes_t', COALESCE(SUM(a.total_ausentes), 0),
        'porcentaje_asistencia', ROUND(
            CASE 
                WHEN COALESCE(SUM(COALESCE(a.snapshot_inscriptos_total, c.inscriptos_total)), 0) > 0
                THEN (COALESCE(SUM(a.total_presentes), 0)::NUMERIC / SUM(COALESCE(a.snapshot_inscriptos_total, c.inscriptos_total))::NUMERIC) * 100.0
                ELSE 0.0
            END, 2
        ),
        'total_courses_count', COUNT(c.id),
        'submitted_courses_count', COUNT(a.id),
        'pending_courses_count', (COUNT(c.id) - COUNT(a.id))
    ) INTO v_totals_json
    FROM public.courses c
    LEFT JOIN public.attendance_records a ON c.id = a.course_id AND a.date = p_date
    WHERE c.shift_id = p_shift_id AND c.is_active = true;

    -- 5. Absent Staff List for Shift & Date
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', sa.id,
                'staff_name', sa.staff_name,
                'role', sa.role,
                'subject_or_area', COALESCE(sa.subject_or_area, ''),
                'course_id', sa.course_id,
                'course_name', crs.name,
                'reason', COALESCE(sa.reason, ''),
                'is_justified', sa.is_justified,
                'observations', COALESCE(sa.observations, ''),
                'created_by_name', prf.full_name
            ) ORDER BY sa.role, sa.staff_name
        ), 
        '[]'::jsonb
    ) INTO v_absences_json
    FROM public.staff_absences sa
    LEFT JOIN public.courses crs ON sa.course_id = crs.id
    LEFT JOIN public.profiles prf ON sa.created_by = prf.id
    WHERE sa.shift_id = p_shift_id AND sa.date = p_date;

    -- 6. Combine Final JSON Structure
    v_result := jsonb_build_object(
        'date', p_date,
        'shift_id', v_shift.id,
        'shift_code', v_shift.code,
        'shift_name', v_shift.name,
        'courses', v_courses_json,
        'cycle_subtotals', v_cycle_subtotals,
        'totals', v_totals_json,
        'staff_absences', v_absences_json
    );

    RETURN v_result;
END;
$$;

-- 8.2 Overloaded Procedure: Query by Shift Code Slug ('manana', 'tarde', 'vespertino')
CREATE OR REPLACE FUNCTION public.fn_get_shift_parte_general(
    p_shift_code VARCHAR,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_shift_id UUID;
BEGIN
    SELECT id INTO v_shift_id
    FROM public.shifts
    WHERE code = p_shift_code;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Turno con código "%" no encontrado.', p_shift_code;
    END IF;

    RETURN public.fn_get_shift_parte_general(v_shift_id, p_date);
END;
$$;
