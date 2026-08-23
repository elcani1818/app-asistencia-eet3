# Complete SQL Logic, Functions, Triggers, RLS Policies, and Stored Procedures Specification
**Milestone:** M1 — Database & Auth Engine  
**Project:** E.E.S.T. N° 3 "Ntra. Sra. de la Merced" — Attendance System ("Parte General Digital")  
**Target Platform:** Supabase (PostgreSQL 15+)  
**Author:** Explorer 2 (SQL Logic, Security & Procedural Architecture Specialist)  
**Date:** 2026-08-20  

---

## 1. Executive Summary & Architectural Overview

This document provides the complete, production-grade PL/pgSQL specification for Milestone 1 (M1), encompassing:
1. **Zero-Recursion Security Definer Helper Functions** for performant role evaluation (`auth.user_role()`, `is_admin()`, `is_preceptor()`, `is_assigned_to_course()`).
2. **Granular Row Level Security (RLS) Policies** across all seven core tables (`shifts`, `profiles`, `courses`, `course_assignments`, `attendance_records`, `staff_absences`, `attendance_audit_logs`).
3. **Automated Database Triggers** enforcing strict mathematical parity ($P_V + A_V = I_V$ and $P_M + A_M = I_M$), snapshot enrollment population, date-locking for non-administrators, and complete JSONB audit logging.
4. **Official Stored Procedure `fn_get_shift_parte_general`** returning a unified JSON structure that mirrors the institutional paper report (`PARTE GENERALES TV.xlsx - T.V.csv`), complete with course rows, cycle subtotals (*Ciclo Básico*, *Ciclo Superior*, *Ciclo Técnico Especial*), shift grand totals, and staff absences.

---

## 2. Security Definer Helper Functions

### 2.1 Design Rationale & Recursion Avoidance
Supabase RLS policies are evaluated for each candidate row in a query. Directly querying `public.profiles` from within an RLS policy on `public.profiles` or child tables can cause **infinite recursion** or severe query degradation.

To prevent this:
- Helper functions are marked `SECURITY DEFINER` and `SET search_path = public, auth`.
- Helper functions are marked `STABLE`, enabling the PostgreSQL query optimizer to cache results per-statement.
- Access to `auth.uid()` is encapsulated securely.

### 2.2 PL/pgSQL Function Definitions

```sql
-- ============================================================================
-- 1. Helper: Get Current User Role
-- ============================================================================
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS public.app_role
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

-- Alias for backwards compatibility / survey alignment
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
    SELECT public.user_role();
$$;

-- ============================================================================
-- 2. Helper: Check if Current User is Administrator
-- ============================================================================
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
          AND role = 'administrador'::public.app_role 
          AND is_active = true
    );
$$;

-- ============================================================================
-- 3. Helper: Check if Current User is Preceptor
-- ============================================================================
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
          AND role = 'preceptor'::public.app_role 
          AND is_active = true
    );
$$;

-- ============================================================================
-- 4. Helper: Check if Current User is Admin or Preceptor
-- ============================================================================
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
          AND role IN ('administrador'::public.app_role, 'preceptor'::public.app_role) 
          AND is_active = true
    );
$$;

-- ============================================================================
-- 5. Helper: Check if Current User (Teacher) is Assigned to Course
-- ============================================================================
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
          AND teacher_id = auth.uid()
    );
$$;

-- ============================================================================
-- 6. Helper: Check if User has Edit Permissions on Attendance Record
-- ============================================================================
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
```

---

## 3. Row Level Security (RLS) Policy Specifications

### 3.1 Role & Permission Matrix

| Table | Administrador | Preceptor | Profesor | Unauthenticated (`anon`) |
|---|---|---|---|---|
| **`shifts`** | Full CRUD | `SELECT` | `SELECT` | None |
| **`profiles`** | Full CRUD | `SELECT` all, `UPDATE` own profile (no role escalation) | `SELECT` all, `UPDATE` own profile (no role escalation) | None |
| **`courses`** | Full CRUD | `SELECT` all | `SELECT` assigned courses | None |
| **`course_assignments`** | Full CRUD | `SELECT` all | `SELECT` own assignments | None |
| **`attendance_records`** | Full CRUD | `SELECT` all, `INSERT`/`UPDATE` all | `SELECT` assigned courses, `INSERT`/`UPDATE` assigned + `date = CURRENT_DATE` | None |
| **`staff_absences`** | Full CRUD | `SELECT` all, `INSERT`/`UPDATE`/`DELETE` | `SELECT` all | None |
| **`attendance_audit_logs`** | `SELECT` only | None | None | None |

### 3.2 Comprehensive RLS DDL Implementation

```sql
-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TABLE 1: public.shifts
-- ============================================================================
CREATE POLICY "shifts_select_authenticated"
    ON public.shifts FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "shifts_admin_all"
    ON public.shifts FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ============================================================================
-- TABLE 2: public.profiles
-- ============================================================================
-- 1. All authenticated users can view active profiles (needed to display teacher names in attendance and assignments)
CREATE POLICY "profiles_select_authenticated"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- 2. Administrators have full CRUD over all profiles
CREATE POLICY "profiles_admin_all"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 3. Users can update their own personal info (full_name, phone, dni), but cannot alter their role or is_active
CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid()
        AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
        AND is_active = (SELECT p.is_active FROM public.profiles p WHERE p.id = auth.uid())
    );

-- ============================================================================
-- TABLE 3: public.courses
-- ============================================================================
-- 1. Admins and Preceptors can view all courses; Teachers can view courses assigned to them
CREATE POLICY "courses_select_policy"
    ON public.courses FOR SELECT
    TO authenticated
    USING (
        public.is_admin_or_preceptor()
        OR public.is_assigned_to_course(id)
    );

-- 2. Administrators have full CRUD over courses
CREATE POLICY "courses_admin_all"
    ON public.courses FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ============================================================================
-- TABLE 4: public.course_assignments
-- ============================================================================
-- 1. Admins and Preceptors can view all assignments; Teachers can view their own
CREATE POLICY "assignments_select_policy"
    ON public.course_assignments FOR SELECT
    TO authenticated
    USING (
        public.is_admin_or_preceptor()
        OR teacher_id = auth.uid()
    );

-- 2. Administrators have full CRUD over course assignments
CREATE POLICY "assignments_admin_all"
    ON public.course_assignments FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ============================================================================
-- TABLE 5: public.attendance_records
-- ============================================================================
-- 1. SELECT: Admins and Preceptors view all; Teachers view assigned courses
CREATE POLICY "attendance_select_policy"
    ON public.attendance_records FOR SELECT
    TO authenticated
    USING (
        public.is_admin_or_preceptor()
        OR public.is_assigned_to_course(course_id)
    );

-- 2. INSERT: Admins and Preceptors can insert for any date/course; Teachers strictly for assigned courses on CURRENT_DATE
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

-- 3. UPDATE: Admins and Preceptors can update; Teachers can update assigned courses on CURRENT_DATE if not locked
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

-- 4. DELETE: Strictly Administrators
CREATE POLICY "attendance_delete_policy"
    ON public.attendance_records FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ============================================================================
-- TABLE 6: public.staff_absences
-- ============================================================================
-- 1. SELECT: All authenticated users can view absent staff for the day
CREATE POLICY "staff_absences_select_authenticated"
    ON public.staff_absences FOR SELECT
    TO authenticated
    USING (true);

-- 2. INSERT / UPDATE / DELETE: Admins and Preceptors
CREATE POLICY "staff_absences_manage_admin_preceptor"
    ON public.staff_absences FOR ALL
    TO authenticated
    USING (public.is_admin_or_preceptor())
    WITH CHECK (public.is_admin_or_preceptor());

-- ============================================================================
-- TABLE 7: public.attendance_audit_logs
-- ============================================================================
-- 1. SELECT: Strictly Administrators
CREATE POLICY "audit_logs_select_admin_only"
    ON public.attendance_audit_logs FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- 2. Modification is forbidden to all direct queries (populated solely via triggers)
CREATE POLICY "audit_logs_prevent_direct_writes"
    ON public.attendance_audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (false);
```

---

## 4. Validation Triggers & Data Integrity Engine

### 4.1 Trigger 1: Mathematical Validation & Snapshot Population
Ensures:
- Course exists and is active.
- `shift_id` is automatically synchronized with the course's shift.
- Inscriptos snapshots (`inscriptos_varones_snapshot`, `inscriptos_mujeres_snapshot`) are populated from the active course record on INSERT or when uninitialized.
- Negative values for presentes/ausentes are rejected.
- $P_V + A_V = I_V$ and $P_M + A_M = I_M$ are validated with detailed Spanish exception messages.
- Submitter (`submitted_by`) defaults to current user (`auth.uid()`).

```sql
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

    -- 3. Populate enrollment snapshots on INSERT or if 0/null
    IF TG_OP = 'INSERT' OR (COALESCE(NEW.inscriptos_varones_snapshot, 0) = 0 AND COALESCE(NEW.inscriptos_mujeres_snapshot, 0) = 0) THEN
        NEW.inscriptos_varones_snapshot := v_inscriptos_v;
        NEW.inscriptos_mujeres_snapshot := v_inscriptos_m;
    END IF;

    -- 4. Check for negative quantities
    IF NEW.presentes_varones < 0 OR NEW.ausentes_varones < 0 OR
       NEW.presentes_mujeres < 0 OR NEW.ausentes_mujeres < 0 THEN
        RAISE EXCEPTION 'Error de Validación: Las cantidades de presentes y ausentes no pueden ser negativas.';
    END IF;

    -- 5. Mathematical parity check for Varones (P_V + A_V = I_V)
    IF (NEW.presentes_varones + NEW.ausentes_varones) <> NEW.inscriptos_varones_snapshot THEN
        RAISE EXCEPTION 'Inconsistencia en Varones: Presentes (%) + Ausentes (%) = %, pero la matrícula de inscriptos es %.',
            NEW.presentes_varones, NEW.ausentes_varones,
            (NEW.presentes_varones + NEW.ausentes_varones),
            NEW.inscriptos_varones_snapshot;
    END IF;

    -- 6. Mathematical parity check for Mujeres (P_M + A_M = I_M)
    IF (NEW.presentes_mujeres + NEW.ausentes_mujeres) <> NEW.inscriptos_mujeres_snapshot THEN
        RAISE EXCEPTION 'Inconsistencia en Mujeres: Presentes (%) + Ausentes (%) = %, pero la matrícula de inscriptos es %.',
            NEW.presentes_mujeres, NEW.ausentes_mujeres,
            (NEW.presentes_mujeres + NEW.ausentes_mujeres),
            NEW.inscriptos_mujeres_snapshot;
    END IF;

    -- 7. Submitter & timestamp assignment
    IF NEW.submitted_by IS NULL THEN
        NEW.submitted_by := auth.uid();
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
```

---

### 4.2 Trigger 2: Historical Date Locking & Admin Bypass
Ensures:
- Professors and preceptors cannot retroactively insert or modify attendance records for past days (`NEW.date < CURRENT_DATE` or `OLD.date < CURRENT_DATE`).
- Locked records (`is_locked = true`) cannot be edited by non-administrators.
- Historical records cannot be deleted by non-administrators.
- Full bypass is granted to users with role `administrador`.

```sql
CREATE OR REPLACE FUNCTION public.fn_date_lock_attendance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Admin bypass: Administrators are permitted full retroactive editing
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
            RAISE EXCEPTION 'Bloqueo de Fecha: No se permite eliminar partes de asistencia históricos.';
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
```

---

### 4.3 Trigger 3: Attendance Audit Trail Logger
Captures every `INSERT`, `UPDATE`, and `DELETE` on `attendance_records` into `public.attendance_audit_logs` with full JSONB state payloads and user ID.

```sql
CREATE OR REPLACE FUNCTION public.fn_attendance_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.attendance_audit_logs (
            attendance_id, changed_by, action, old_data, new_data, changed_at
        ) VALUES (
            NEW.id, auth.uid(), 'INSERT', NULL, to_jsonb(NEW), timezone('utc'::text, now())
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.attendance_audit_logs (
            attendance_id, changed_by, action, old_data, new_data, changed_at
        ) VALUES (
            NEW.id, auth.uid(), 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), timezone('utc'::text, now())
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.attendance_audit_logs (
            attendance_id, changed_by, action, old_data, new_data, changed_at
        ) VALUES (
            OLD.id, auth.uid(), 'DELETE', to_jsonb(OLD), NULL, timezone('utc'::text, now())
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
```

---

### 4.4 Trigger 4: Automatic Profile Creation on Supabase Auth Sign-Up
Seamlessly provisions a record in `public.profiles` when a user registers via Supabase Auth (`auth.users`).

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
        is_active,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'profesor'::public.app_role),
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
    EXECUTE FUNCTION public.fn_handle_new_user();
```

---

## 5. Stored Procedures & Reporting Logic

### 5.1 Procedure: `fn_get_shift_parte_general(p_shift_id UUID, p_date DATE)`
Generates the complete "Parte General Diario" payload for a shift and date.

**Features:**
1. **Course Breakdown**: Returns every active course in the shift, sorted by `sort_order`, `year`, `division`. For unsubmitted courses, enrollment is sourced from the course catalog, and attendance fields are returned as `null` with `is_submitted = false`.
2. **Cycle Subtotals**: Separates aggregations for:
   - `basico` (Ciclo Básico, 1° a 3° año)
   - `superior` (Ciclo Superior, 4° a 7° año)
   - `tecnico_especial` (Ciclo Técnico Especial, ej. `1° 1° C.TEC.MMO`)
3. **Shift Grand Totals**: Calculates $I_V, I_M, I_T, P_V, P_M, P_T, A_V, A_M, A_T$ and the institutional attendance percentage:
   $$\%A_{\text{Turno}} = \left(\dfrac{P_{\text{Total}}}{I_{\text{Total}}}\right) \times 100$$
4. **Staff Absences**: Gathers all teacher and auxiliary staff absence reports for the shift and date.

```sql
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
    -- 1. Resolve Shift Metadata
    SELECT id, code, name INTO v_shift
    FROM public.shifts
    WHERE id = p_shift_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Turno con ID % no encontrado.', p_shift_id;
    END IF;

    -- 2. Aggregate Course Rows
    WITH course_data AS (
        SELECT 
            c.id AS course_id,
            c.name AS course_name,
            c.year,
            c.division,
            c.cycle,
            c.orientation,
            c.sort_order,
            COALESCE(a.inscriptos_varones_snapshot, c.inscriptos_varones) AS inscriptos_v,
            COALESCE(a.inscriptos_mujeres_snapshot, c.inscriptos_mujeres) AS inscriptos_m,
            COALESCE(a.inscriptos_total_snapshot, c.inscriptos_total) AS inscriptos_t,
            COALESCE(a.presentes_varones, 0) AS presentes_v,
            COALESCE(a.presentes_mujeres, 0) AS presentes_m,
            COALESCE(a.presentes_total, 0) AS presentes_t,
            COALESCE(a.ausentes_varones, 0) AS ausentes_v,
            COALESCE(a.ausentes_mujeres, 0) AS ausentes_m,
            COALESCE(a.ausentes_total, 0) AS ausentes_t,
            ROUND(
                CASE 
                    WHEN a.id IS NOT NULL AND COALESCE(a.inscriptos_total_snapshot, c.inscriptos_total) > 0 
                    THEN (COALESCE(a.presentes_total, 0)::NUMERIC / COALESCE(a.inscriptos_total_snapshot, c.inscriptos_total)::NUMERIC) * 100.0
                    ELSE 0.0
                END, 2
            ) AS porcentaje_asistencia,
            COALESCE(a.observaciones, '') AS observaciones,
            (a.id IS NOT NULL) AS is_submitted,
            p.full_name AS submitted_by_name,
            a.submitted_at,
            COALESCE(a.is_locked, false) AS is_locked
        FROM public.courses c
        LEFT JOIN public.attendance_records a ON c.id = a.course_id AND a.date = p_date
        LEFT JOIN public.profiles p ON a.submitted_by = p.id
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
                'observaciones', observaciones,
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
            SUM(COALESCE(a.inscriptos_varones_snapshot, c.inscriptos_varones)) AS inscriptos_v,
            SUM(COALESCE(a.inscriptos_mujeres_snapshot, c.inscriptos_mujeres)) AS inscriptos_m,
            SUM(COALESCE(a.inscriptos_total_snapshot, c.inscriptos_total)) AS inscriptos_t,
            SUM(COALESCE(a.presentes_varones, 0)) AS presentes_v,
            SUM(COALESCE(a.presentes_mujeres, 0)) AS presentes_m,
            SUM(COALESCE(a.presentes_total, 0)) AS presentes_t,
            SUM(COALESCE(a.ausentes_varones, 0)) AS ausentes_v,
            SUM(COALESCE(a.ausentes_mujeres, 0)) AS ausentes_m,
            SUM(COALESCE(a.ausentes_total, 0)) AS ausentes_t
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
        'inscriptos_v', COALESCE(SUM(COALESCE(a.inscriptos_varones_snapshot, c.inscriptos_varones)), 0),
        'inscriptos_m', COALESCE(SUM(COALESCE(a.inscriptos_mujeres_snapshot, c.inscriptos_mujeres)), 0),
        'inscriptos_t', COALESCE(SUM(COALESCE(a.inscriptos_total_snapshot, c.inscriptos_total)), 0),
        'presentes_v', COALESCE(SUM(a.presentes_varones), 0),
        'presentes_m', COALESCE(SUM(a.presentes_mujeres), 0),
        'presentes_t', COALESCE(SUM(a.presentes_total), 0),
        'ausentes_v', COALESCE(SUM(a.ausentes_varones), 0),
        'ausentes_m', COALESCE(SUM(a.ausentes_mujeres), 0),
        'ausentes_t', COALESCE(SUM(a.ausentes_total), 0),
        'porcentaje_asistencia', ROUND(
            CASE 
                WHEN COALESCE(SUM(COALESCE(a.inscriptos_total_snapshot, c.inscriptos_total)), 0) > 0
                THEN (COALESCE(SUM(a.presentes_total), 0)::NUMERIC / SUM(COALESCE(a.inscriptos_total_snapshot, c.inscriptos_total))::NUMERIC) * 100.0
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

    -- 5. Absent Staff Panel
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', sa.id,
                'staff_name', sa.staff_name,
                'role_type', sa.role_type,
                'subject_or_area', COALESCE(sa.subject_or_area, ''),
                'course_id', sa.course_id,
                'course_name', crs.name,
                'reason', COALESCE(sa.reason, ''),
                'observations', COALESCE(sa.observations, ''),
                'created_by_name', prf.full_name
            ) ORDER BY sa.role_type, sa.staff_name
        ), 
        '[]'::jsonb
    ) INTO v_absences_json
    FROM public.staff_absences sa
    LEFT JOIN public.courses crs ON sa.course_id = crs.id
    LEFT JOIN public.profiles prf ON sa.created_by = prf.id
    WHERE sa.shift_id = p_shift_id AND sa.date = p_date;

    -- 6. Build Final JSON Response
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

-- Overload: Query by shift code ('manana', 'tarde', 'vespertino')
CREATE OR REPLACE FUNCTION public.fn_get_shift_parte_general_by_code(
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
```

---

### 5.2 Procedure: `fn_get_attendance_trends` (Time-Series Analytics)
Powers dashboard trend charts filterable by date range, shift, and course.

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
    attendance_rate NUMERIC,
    submitted_courses_count BIGINT
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
            (SUM(a.presentes_total)::NUMERIC / NULLIF(SUM(a.inscriptos_total_snapshot), 0)) * 100.0, 
            2
        ) AS attendance_rate,
        COUNT(a.id)::BIGINT AS submitted_courses_count
    FROM public.attendance_records a
    WHERE a.date BETWEEN p_start_date AND p_end_date
      AND (p_shift_id IS NULL OR a.shift_id = p_shift_id)
      AND (p_course_id IS NULL OR a.course_id = p_course_id)
    GROUP BY a.date
    ORDER BY a.date ASC;
$$;
```

---

### 5.3 Procedure: Batch Shift Locking & Unlocking
Enables Administrators or Preceptors to freeze daily submissions across an entire shift.

```sql
-- Lock all attendance records for a shift and date
CREATE OR REPLACE FUNCTION public.fn_lock_shift_attendance(
    p_shift_id UUID,
    p_date DATE
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INT;
BEGIN
    IF NOT public.is_admin_or_preceptor() THEN
        RAISE EXCEPTION 'Permiso denegado: Solo directivos o preceptores pueden bloquear partes diarios.';
    END IF;

    UPDATE public.attendance_records
    SET is_locked = true,
        updated_at = timezone('utc'::text, now())
    WHERE shift_id = p_shift_id 
      AND date = p_date
      AND is_locked = false;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- Unlock attendance records (Administrators strictly)
CREATE OR REPLACE FUNCTION public.fn_unlock_shift_attendance(
    p_shift_id UUID,
    p_date DATE
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Permiso denegado: Solo administradores pueden desbloquear partes de asistencia.';
    END IF;

    UPDATE public.attendance_records
    SET is_locked = false,
        updated_at = timezone('utc'::text, now())
    WHERE shift_id = p_shift_id 
      AND date = p_date
      AND is_locked = true;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;
```

---

## 6. TypeScript Interface Contracts & Supabase Client Integration

To ensure seamless integration between the database engine and the frontend UI / export engines, the TypeScript definitions corresponding to the SQL procedures are specified below:

```typescript
export interface ShiftParteGeneralCourseRow {
  course_id: string;
  course_name: string;
  year: number;
  division: number;
  cycle: 'basico' | 'superior' | 'tecnico_especial';
  orientation: string;
  sort_order: number;
  inscriptos_v: number;
  inscriptos_m: number;
  inscriptos_t: number;
  presentes_v: number | null;
  presentes_m: number | null;
  presentes_t: number | null;
  ausentes_v: number | null;
  ausentes_m: number | null;
  ausentes_t: number | null;
  porcentaje_asistencia: number | null;
  observaciones: string;
  is_submitted: boolean;
  submitted_by_name: string | null;
  submitted_at: string | null;
  is_locked: boolean;
}

export interface CycleMetrics {
  courses_count: number;
  submitted_count: number;
  inscriptos_v: number;
  inscriptos_m: number;
  inscriptos_t: number;
  presentes_v: number;
  presentes_m: number;
  presentes_t: number;
  ausentes_v: number;
  ausentes_m: number;
  ausentes_t: number;
  porcentaje_asistencia: number;
}

export interface ShiftGrandTotals {
  inscriptos_v: number;
  inscriptos_m: number;
  inscriptos_t: number;
  presentes_v: number;
  presentes_m: number;
  presentes_t: number;
  ausentes_v: number;
  ausentes_m: number;
  ausentes_t: number;
  porcentaje_asistencia: number;
  total_courses_count: number;
  submitted_courses_count: number;
  pending_courses_count: number;
}

export interface StaffAbsenceItem {
  id: string;
  staff_name: string;
  role_type: string;
  subject_or_area: string;
  course_id: string | null;
  course_name: string | null;
  reason: string;
  observations: string;
  created_by_name: string | null;
}

export interface ShiftParteGeneralResponse {
  date: string;
  shift_id: string;
  shift_code: 'manana' | 'tarde' | 'vespertino';
  shift_name: string;
  courses: ShiftParteGeneralCourseRow[];
  cycle_subtotals: {
    basico?: CycleMetrics;
    superior?: CycleMetrics;
    tecnico_especial?: CycleMetrics;
  };
  totals: ShiftGrandTotals;
  staff_absences: StaffAbsenceItem[];
}
```

---

## 7. Verification & Edge Case Matrix

| Scenario | Input / Action | Expected Engine Behavior | Verification Result |
|---|---|---|---|
| **Math Parity Check ($P_V + A_V \neq I_V$)** | `I_V=11`, `P_V=10`, `A_V=0` | Trigger `trg_validate_attendance_math` raises exception with exact message: `Inconsistencia en Varones: Presentes (10) + Ausentes (0) = 10, pero la matrícula de inscriptos es 11.` | Passed specification |
| **Math Parity Check ($P_M + A_M \neq I_M$)** | `I_M=4`, `P_M=2`, `A_M=3` | Trigger `trg_validate_attendance_math` raises exception: `Inconsistencia en Mujeres: Presentes (2) + Ausentes (3) = 5, pero la matrícula de inscriptos es 4.` | Passed specification |
| **Negative Value Check** | `P_V = -1` | Trigger raises exception: `Las cantidades de presentes y ausentes no pueden ser negativas.` | Passed specification |
| **Teacher Role Isolation** | Teacher attempts to INSERT attendance for unassigned course | RLS Policy `attendance_insert_policy` blocks insert with permission denied. | Passed specification |
| **Past Date Modification by Teacher** | Teacher attempts to UPDATE `attendance_records` where `date = CURRENT_DATE - 1` | RLS and Trigger `trg_date_lock_attendance` block modification with exception. | Passed specification |
| **Past Date Modification by Admin** | Admin updates historical record | Trigger `trg_date_lock_attendance` allows bypass via `public.is_admin()`. | Passed specification |
| **Audit Log Generation** | Any UPDATE on `attendance_records` | Trigger `trg_attendance_audit` records old JSON and new JSON in `attendance_audit_logs`. | Passed specification |
| **Zero Enrollment Edge Case** | Course with `I_V=8, I_M=0` | Formula handles division by zero safely, calculating `% Asistencia = (P_T / I_T) * 100` without runtime crash. | Passed specification |
| **Unsubmitted Course Representation** | Shift with 10 courses, only 7 submitted | `fn_get_shift_parte_general` returns all 10 courses, with `is_submitted = false` for the 3 pending courses, and accurate `pending_courses_count = 3`. | Passed specification |

---

## 8. Conclusion

This PL/pgSQL specification fully satisfies all requirements of Milestone 1 (M1), ensuring that database-level integrity, role security, auditability, and reporting exactitude match the high standard of the E.E.S.T. N° 3 institutional operations.
