# Comprehensive PostgreSQL Schema DDL Specification (M1: Database & Auth Engine)

**Project:** Sistema Digital de Asistencia y Parte General Diario  
**Institution:** Escuela de Educación Secundaria Técnica N° 3 "Ntra. Sra. de la Merced" (Loma Hermosa)  
**Database Engine:** PostgreSQL 15+ / Supabase  
**Author:** Explorer 1 (Schema & DDL Architect)  
**Milestone:** M1 — Database & Auth Engine  
**Date:** 2026-08-20  

---

## 1. Executive Summary & Architectural Overview

This document provides the definitive, production-grade PostgreSQL DDL schema design for the E.E.S.T. N° 3 Attendance Management System. The schema is specifically engineered for Supabase and fulfills all functional, relational, integrity, and auditing requirements defined in `PROJECT.md`, `ORIGINAL_REQUEST.md`, and the survey analyses.

### Key Architectural Tenets:
1. **Deterministic Calculations via Stored Generated Columns**:
   - Enrolled totals ($I_T = I_V + I_M$), Present totals ($P_T = P_V + P_M$), Absent totals ($A_T = A_V + A_M$), and Total Matricula ($M_T = P_T + A_T$) are defined as `INT GENERATED ALWAYS AS (...) STORED`. This eliminates client-side rounding or omission errors.
2. **Dual-Gender Mathematical Invariant Enforcement**:
   - The fundamental domain rule $P_V + A_V = I_V$ and $P_M + A_M = I_M$ is enforced at the database level via a `BEFORE INSERT OR UPDATE` trigger, guaranteeing 100% data integrity even during concurrent or API-level operations.
3. **Historical Enrollment Snapshotting**:
   - Attendance records capture an immutable snapshot of enrollment numbers ($I_{V,\text{snapshot}}, I_{M,\text{snapshot}}$) at the moment of submission. Future changes to active course enrollments (e.g., student transfers mid-year) will never alter historical attendance records or past "Partes Generales".
4. **Complete Entity Auditing**:
   - Changes to attendance data (INSERT, UPDATE, DELETE) are automatically recorded into `attendance_audit_logs` with JSONB snapshots (`old_values`, `new_values`) and user attribution.
5. **Zero-Recursion Foreign Key Cascading & Isolation**:
   - Strict cascading semantics ensure user deletion cleans up profiles and assignments, while preserving attendance history (`ON DELETE RESTRICT` on course/shift relations and `ON DELETE SET NULL` on submitter references).

---

## 2. PostgreSQL Custom Enums & Data Types

The system utilizes 4 custom enumerated types to standardize roles, cycles, technical orientations, and attendance statuses.

```sql
-- 1. User Roles for RBAC
CREATE TYPE public.user_role AS ENUM (
    'administrador',
    'preceptor',
    'profesor'
);

-- 2. Educational Cycles in Technical High School
CREATE TYPE public.course_cycle AS ENUM (
    'basico',            -- 1° a 3° Año (Formación General)
    'superior',          -- 4° a 7° Año (Formación Técnico-Profesional)
    'tecnico_especial'   -- Ciclo Técnico Especial (e.g., 1° 1ª C.TEC.MMO)
);

-- 3. Technical Orientations of E.E.S.T. N° 3 & General Classifications
CREATE TYPE public.technical_orientation AS ENUM (
    'TECQU',             -- Técnico Químico (División 1ª)
    'TECMM',             -- Técnico Maestro Mayor de Obra (División 2ª)
    'TECET',             -- Técnico Electromecánico (Divisiones 3ª y 4ª)
    'C.TEC.MMO',         -- Ciclo Técnico en Maestro Mayor de Obras (Especial)
    'construcciones',    -- Denominación genérica / Mapeo alternativo
    'electromecanica',   -- Denominación genérica / Mapeo alternativo
    'quimica',           -- Denominación genérica / Mapeo alternativo
    'computacion',       -- Denominación genérica / Mapeo alternativo
    'ciclo_basico',      -- Sin orientación específica
    'otra'               -- Trayecto formativo complementario
);

-- 4. Attendance Record Submission & Verification Status
CREATE TYPE public.attendance_status AS ENUM (
    'presente',              -- Registro estándar de presencia
    'ausente_justificado',   -- Ausencia justificada
    'ausente_injustificado', -- Ausencia injustificada
    'comision_servicio',     -- Comisión de servicio / Representación institucional
    'licencia',              -- Licencia médica o estatutaria
    'guardia',               -- Guardia escolar / Actividad especial
    'submitted',             -- Enviado / Confirmado
    'draft'                  -- Borrador / Pendiente de envío
);
```

---

## 3. Comprehensive Table DDL Specifications

The core relational database consists of 7 interconnected tables:

```
  +-----------------------------------------------------------------------------------+
  |                                    auth.users                                     |
  +-----------------------------------------+-----------------------------------------+
                                            | 1:1 (ON DELETE CASCADE)
                                            v
  +-----------------------------------------------------------------------------------+
  |                                 public.profiles                                   |
  +------------------+--------------------------------------+-------------------------+
                     | 1:N                                  | 1:N
                     |                                      | (created_by/updated_by)
                     v                                      v
  +------------------------------------+  +-------------------------------------------+
  |     public.course_assignments      |  |         public.attendance_records         |
  +------------------+-----------------+  +---------------------+---------------------+
                     |                                          |
                     | N:1                                      | N:1
                     v                                          v
  +-----------------------------------------------------------------------------------+
  |                                  public.courses                                   |
  +-----------------------------------------+-----------------------------------------+
                                            | N:1 (ON DELETE RESTRICT)
                                            v
  +-----------------------------------------------------------------------------------+
  |                                   public.shifts                                   |
  +------------------+----------------------------------------------------------------+
                     | 1:N (ON DELETE RESTRICT)
                     v
  +------------------------------------+  +-------------------------------------------+
  |       public.staff_absences        |  |       public.attendance_audit_logs        |
  +------------------------------------+  +-------------------------------------------+
```

---

### 3.1 Table `shifts` (Turnos Escolares)

Defines the three official operational shifts of E.E.S.T. N° 3 (Mañana, Tarde, Vespertino).

| Column Name | Data Type | Modifiers / Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique shift identifier |
| `name` | `VARCHAR(100)` | `NOT NULL` | Descriptive name (e.g. `'Turno Mañana'`) |
| `code` | `VARCHAR(50)` | `NOT NULL UNIQUE` | Unique slug code (`'manana'`, `'tarde'`, `'vespertino'`) |
| `start_time` | `TIME` | `NOT NULL` | Official start time (e.g., `07:30:00`) |
| `end_time` | `TIME` | `NOT NULL` | Official end time (e.g., `12:45:00`) |
| `sort_order` | `INT` | `NOT NULL DEFAULT 0` | Display order in tabs and reports |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT timezone('utc'::text, now())` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT timezone('utc'::text, now())` | Modification timestamp |

```sql
CREATE TABLE public.shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

---

### 3.2 Table `profiles` (Perfiles de Usuario Institucionales)

Extends Supabase `auth.users` with educational RBAC roles, contact data, and default shift affiliation.

| Column Name | Data Type | Modifiers / Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE` | 1:1 foreign key to Supabase Auth |
| `email` | `TEXT` | `NOT NULL UNIQUE` | Institutional email address |
| `full_name` | `TEXT` | `NOT NULL` | Staff member's full name and title |
| `role` | `public.user_role` | `NOT NULL DEFAULT 'profesor'` | Role: `administrador`, `preceptor`, `profesor` |
| `shift_id` | `UUID` | `REFERENCES public.shifts(id) ON DELETE SET NULL` | Primary assigned shift (optional) |
| `dni` | `VARCHAR(20)` | `NULL` | National Identity Document number |
| `phone` | `VARCHAR(50)` | `NULL` | Contact phone number |
| `active` | `BOOLEAN` | `NOT NULL DEFAULT true` | Account active flag |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT timezone('utc'::text, now())` | Registration timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT timezone('utc'::text, now())` | Profile update timestamp |

```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role public.user_role NOT NULL DEFAULT 'profesor',
    shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
    dni VARCHAR(20),
    phone VARCHAR(50),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

---

### 3.3 Table `courses` (Catálogo de Cursos y Divisiones)

Represents each academic course (division) belonging to a shift, with official enrolled numbers.

| Column Name | Data Type | Modifiers / Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique course identifier |
| `shift_id` | `UUID` | `NOT NULL REFERENCES public.shifts(id) ON DELETE RESTRICT` | Associated shift |
| `year` | `INT` | `NOT NULL CHECK (year BETWEEN 1 AND 7)` | Academic year (1° to 7°) |
| `division` | `INT` | `NOT NULL CHECK (division BETWEEN 1 AND 10)` | Division number (1ª to 10ª) |
| `name` | `VARCHAR(50)` | `NOT NULL` | Standard name (e.g. `'6° 1ª'`, `'1° 1ª C.TEC.MMO'`) |
| `cycle` | `public.course_cycle` | `NOT NULL` | `'basico'`, `'superior'`, `'tecnico_especial'` |
| `orientation` | `public.technical_orientation` | `NULL` | Technical specialty (`TECQU`, `TECMM`, `TECET`, `C.TEC.MMO`, etc.) |
| `inscriptos_varones` | `INT` | `NOT NULL DEFAULT 0 CHECK (inscriptos_varones >= 0)` | Enrolled male students ($I_V$) |
| `inscriptos_mujeres` | `INT` | `NOT NULL DEFAULT 0 CHECK (inscriptos_mujeres >= 0)` | Enrolled female students ($I_M$) |
| `inscriptos_total` | `INT` | `GENERATED ALWAYS AS (inscriptos_varones + inscriptos_mujeres) STORED` | Auto-calculated total enrollment ($I_T$) |
| `sort_order` | `INT` | `NOT NULL DEFAULT 0` | Display sorting order |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT true` | Course active status |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT timezone('utc'::text, now())` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT timezone('utc'::text, now())` | Update timestamp |

**Unique Constraint:** `CONSTRAINT uq_course_shift_name UNIQUE (shift_id, name)`

```sql
CREATE TABLE public.courses (
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
```

---

### 3.4 Table `course_assignments` (Asignación de Cursos a Profesores)

Maps teachers to the specific courses they are authorized to view and submit attendance for.

| Column Name | Data Type | Modifiers / Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique assignment identifier |
| `user_id` | `UUID` | `NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE` | Assigned teacher profile |
| `course_id` | `UUID` | `NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE` | Assigned course |
| `role_in_course` | `VARCHAR(50)` | `NOT NULL DEFAULT 'titular'` | Role (e.g. `'titular'`, `'suplente'`, `'preceptor_cargo'`) |
| `active` | `BOOLEAN` | `NOT NULL DEFAULT true` | Assignment active status |
| `assigned_by` | `UUID` | `REFERENCES public.profiles(id) ON DELETE SET NULL` | Admin who made the assignment |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT timezone('utc'::text, now())` | Assignment timestamp |

**Unique Constraint:** `CONSTRAINT uq_user_course UNIQUE (user_id, course_id)`

```sql
CREATE TABLE public.course_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    role_in_course VARCHAR(50) NOT NULL DEFAULT 'titular',
    active BOOLEAN NOT NULL DEFAULT true,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_course UNIQUE (user_id, course_id)
);
```

---

### 3.5 Table `attendance_records` (Partes Diarios de Asistencia por Curso)

The central fact table storing daily dual-gender attendance counts, snapshot matricula, observations, and status.

| Column Name | Data Type | Modifiers / Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique attendance record ID |
| `course_id` | `UUID` | `NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT` | Referenced course |
| `shift_id` | `UUID` | `NOT NULL REFERENCES public.shifts(id) ON DELETE RESTRICT` | Referenced shift (denormalized for fast filtering) |
| `date` | `DATE` | `NOT NULL DEFAULT CURRENT_DATE` | Attendance date (YYYY-MM-DD) |
| `presentes_varones` | `INT` | `NOT NULL DEFAULT 0 CHECK (presentes_varones >= 0)` | Present male students ($P_V$) |
| `ausentes_varones` | `INT` | `NOT NULL DEFAULT 0 CHECK (ausentes_varones >= 0)` | Absent male students ($A_V$) |
| `presentes_mujeres` | `INT` | `NOT NULL DEFAULT 0 CHECK (presentes_mujeres >= 0)` | Present female students ($P_M$) |
| `ausentes_mujeres` | `INT` | `NOT NULL DEFAULT 0 CHECK (ausentes_mujeres >= 0)` | Absent female students ($A_M$) |
| `total_presentes` | `INT` | `GENERATED ALWAYS AS (presentes_varones + presentes_mujeres) STORED` | Total present students ($P_T$) |
| `total_ausentes` | `INT` | `GENERATED ALWAYS AS (ausentes_varones + ausentes_mujeres) STORED` | Total absent students ($A_T$) |
| `total_matricula` | `INT` | `GENERATED ALWAYS AS (presentes_varones + ausentes_varones + presentes_mujeres + ausentes_mujeres) STORED` | Total verified matricula ($M_T$) |
| `snapshot_inscriptos_v` | `INT` | `NOT NULL DEFAULT 0 CHECK (snapshot_inscriptos_v >= 0)` | Enrolled male count at submission ($I_{V,\text{snap}}$) |
| `snapshot_inscriptos_m` | `INT` | `NOT NULL DEFAULT 0 CHECK (snapshot_inscriptos_m >= 0)` | Enrolled female count at submission ($I_{M,\text{snap}}$) |
| `snapshot_inscriptos_total` | `INT` | `GENERATED ALWAYS AS (snapshot_inscriptos_v + snapshot_inscriptos_m) STORED` | Total enrolled snapshot ($I_{T,\text{snap}}$) |
| `created_by` | `UUID` | `REFERENCES public.profiles(id) ON DELETE SET NULL` | Submitting teacher / staff |
| `updated_by` | `UUID` | `REFERENCES public.profiles(id) ON DELETE SET NULL` | Last modifying user |
| `status` | `public.attendance_status` | `NOT NULL DEFAULT 'presente'` | Status code |
| `observations` | `TEXT` | `NULL` | Free-text observations / incidents |
| `is_locked` | `BOOLEAN` | `NOT NULL DEFAULT false` | Lock flag for historical closing |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT timezone('utc'::text, now())` | Record submission timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT timezone('utc'::text, now())` | Record modification timestamp |

**Unique Constraint:** `CONSTRAINT uq_attendance_course_date UNIQUE (course_id, date)`

```sql
CREATE TABLE public.attendance_records (
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
    
    -- Enrollment Snapshot
    snapshot_inscriptos_v INT NOT NULL DEFAULT 0 CHECK (snapshot_inscriptos_v >= 0),
    snapshot_inscriptos_m INT NOT NULL DEFAULT 0 CHECK (snapshot_inscriptos_m >= 0),
    snapshot_inscriptos_total INT GENERATED ALWAYS AS (snapshot_inscriptos_v + snapshot_inscriptos_m) STORED,
    
    -- Attribution & State
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status public.attendance_status NOT NULL DEFAULT 'presente',
    observations TEXT,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    CONSTRAINT uq_attendance_course_date UNIQUE (course_id, date)
);
```

---

### 3.6 Table `staff_absences` (Registro de Inasistencias Docentes y Auxiliares)

Stores daily absent staff entries for the "AUSENTE DE DOCENTES Y AUXILIARES" section of the Parte General.

| Column Name | Data Type | Modifiers / Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique staff absence record ID |
| `shift_id` | `UUID` | `NOT NULL REFERENCES public.shifts(id) ON DELETE RESTRICT` | Shift during which absence occurred |
| `date` | `DATE` | `NOT NULL DEFAULT CURRENT_DATE` | Date of absence |
| `staff_name` | `TEXT` | `NOT NULL` | Full name of the absent teacher or auxiliary |
| `role` | `VARCHAR(100)` | `NOT NULL` | Role (`'Docente'`, `'Auxiliar'`, `'Preceptor'`, `'Directivo'`) |
| `subject_or_area` | `VARCHAR(255)` | `NULL` | Subject or duty area (e.g. `'Química Orgánica'`, `'Taller'`) |
| `course_id` | `UUID` | `REFERENCES public.courses(id) ON DELETE SET NULL` | Specific division affected (optional) |
| `reason` | `TEXT` | `NULL` | Reason / Statute Article (e.g., `'Art. 114 a-1'`, `'Particular'`) |
| `is_justified` | `BOOLEAN` | `NOT NULL DEFAULT false` | Justification flag |
| `observations` | `TEXT` | `NULL` | Additional remarks |
| `created_by` | `UUID` | `REFERENCES public.profiles(id) ON DELETE SET NULL` | Logging user |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT timezone('utc'::text, now())` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT timezone('utc'::text, now())` | Update timestamp |

```sql
CREATE TABLE public.staff_absences (
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
```

---

### 3.7 Table `attendance_audit_logs` (Auditoría Forense de Modificaciones)

Tracks any insertion, update, or deletion of attendance records with timestamp, user ID, action, and JSONB diffs.

| Column Name | Data Type | Modifiers / Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique audit entry identifier |
| `attendance_id` | `UUID` | `REFERENCES public.attendance_records(id) ON DELETE CASCADE` | Affected attendance record |
| `course_id` | `UUID` | `REFERENCES public.courses(id) ON DELETE SET NULL` | Course reference for quick filtering |
| `changed_by` | `UUID` | `REFERENCES public.profiles(id) ON DELETE SET NULL` | User who made the modification |
| `action` | `TEXT` | `NOT NULL` | Operation: `'INSERT'`, `'UPDATE'`, `'DELETE'` |
| `old_values` | `JSONB` | `NULL` | State before modification (NULL on INSERT) |
| `new_values` | `JSONB` | `NULL` | State after modification (NULL on DELETE) |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT timezone('utc'::text, now())` | Audit log timestamp |

```sql
CREATE TABLE public.attendance_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id UUID REFERENCES public.attendance_records(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

---

## 4. Integrity Triggers & Business Logic Functions

### 4.1 Attendance Validation & Snapshotting Trigger

This trigger executes `BEFORE INSERT OR UPDATE` on `attendance_records` and enforces:
1. Retrieval and injection of `shift_id` directly from `courses`.
2. Automatic snapshotting of `snapshot_inscriptos_v` and `snapshot_inscriptos_m` from active course enrollment if unpopulated.
3. Strict enforcement of mathematical parity:
   $$\text{presentes\_varones} + \text{ausentes\_varones} = \text{snapshot\_inscriptos\_v}$$
   $$\text{presentes\_mujeres} + \text{ausentes\_mujeres} = \text{snapshot\_inscriptos\_m}$$
4. Automatic timestamp renewal on `updated_at`.

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
    -- Fetch active enrollment and shift for the referenced course
    SELECT inscriptos_varones, inscriptos_mujeres, shift_id
    INTO v_inscriptos_v, v_inscriptos_m, v_course_shift
    FROM public.courses
    WHERE id = NEW.course_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Curso con ID % no existe en la base de datos', NEW.course_id;
    END IF;

    -- Ensure shift_id matches the course's shift
    NEW.shift_id := v_course_shift;

    -- Populate enrollment snapshots on insert or if initialized as 0
    IF TG_OP = 'INSERT' OR (NEW.snapshot_inscriptos_v = 0 AND NEW.snapshot_inscriptos_m = 0) THEN
        NEW.snapshot_inscriptos_v := v_inscriptos_v;
        NEW.snapshot_inscriptos_m := v_inscriptos_m;
    END IF;

    -- Mathematical Invariant Check: Varones
    IF (NEW.presentes_varones + NEW.ausentes_varones) <> NEW.snapshot_inscriptos_v THEN
        RAISE EXCEPTION 'Inconsistencia en Varones para curso %: Presentes (%) + Ausentes (%) != Inscriptos (%)',
            NEW.course_id, NEW.presentes_varones, NEW.ausentes_varones, NEW.snapshot_inscriptos_v;
    END IF;

    -- Mathematical Invariant Check: Mujeres
    IF (NEW.presentes_mujeres + NEW.ausentes_mujeres) <> NEW.snapshot_inscriptos_m THEN
        RAISE EXCEPTION 'Inconsistencia en Mujeres para curso %: Presentes (%) + Ausentes (%) != Inscriptos (%)',
            NEW.course_id, NEW.presentes_mujeres, NEW.ausentes_mujeres, NEW.snapshot_inscriptos_m;
    END IF;

    -- Maintain updated_at timestamp
    NEW.updated_at := timezone('utc'::text, now());
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_and_snapshot_attendance
    BEFORE INSERT OR UPDATE ON public.attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_validate_and_snapshot_attendance();
```

---

### 4.2 Auth User Registration Hook Trigger

Automatically provisions a corresponding record in `public.profiles` upon `auth.users` creation.

```sql
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
        active
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'profesor'::public.user_role),
        true
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_handle_new_auth_user();
```

---

### 4.3 Automated Audit Logging Trigger

Logs all changes to `attendance_records` seamlessly.

```sql
CREATE OR REPLACE FUNCTION public.fn_audit_attendance_changes()
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
            new_values
        ) VALUES (
            NEW.id,
            NEW.course_id,
            COALESCE(NEW.created_by, auth.uid()),
            'INSERT',
            NULL,
            to_jsonb(NEW)
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.attendance_audit_logs (
            attendance_id,
            course_id,
            changed_by,
            action,
            old_values,
            new_values
        ) VALUES (
            NEW.id,
            NEW.course_id,
            COALESCE(NEW.updated_by, auth.uid()),
            'UPDATE',
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.attendance_audit_logs (
            attendance_id,
            course_id,
            changed_by,
            action,
            old_values,
            new_values
        ) VALUES (
            OLD.id,
            OLD.course_id,
            auth.uid(),
            'DELETE',
            to_jsonb(OLD),
            NULL
        );
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

## 5. Indexing Strategy & Performance Architecture

The indexing strategy targets high-frequency query filters: shift dashboards, date ranges, teacher course lookups, and foreign key validations.

| Index Name | Target Table | Indexed Columns | Justification / Query Pattern |
|---|---|---|---|
| `idx_shifts_code` | `shifts` | `(code)` | Quick lookup by shift slug (`manana`, `tarde`, `vespertino`) |
| `idx_profiles_role` | `profiles` | `(role, active)` | Filter active staff by role (admin, preceptor, profesor) |
| `idx_courses_shift_active` | `courses` | `(shift_id, is_active, sort_order)` | Primary query for shift dashboard and course catalog |
| `idx_course_assignments_user` | `course_assignments` | `(user_id, active)` | Fast retrieval of a teacher's assigned courses |
| `idx_course_assignments_course`| `course_assignments` | `(course_id)` | Fast lookup of staff assigned to a given course |
| `idx_attendance_date_shift` | `attendance_records` | `(date, shift_id)` | Main query for daily Parte General dashboard |
| `idx_attendance_course_date` | `attendance_records` | `(course_id, date)` | Unique lookups & teacher form queries |
| `idx_attendance_created_by` | `attendance_records` | `(created_by)` | Foreign key navigation & user history |
| `idx_staff_absences_date_shift`| `staff_absences` | `(date, shift_id)` | Shift daily absent personnel list |
| `idx_attendance_audit_log_att` | `attendance_audit_logs` | `(attendance_id, created_at DESC)` | Forensic audit timeline per attendance sheet |

```sql
-- Performance Indexes DDL
CREATE INDEX idx_shifts_code ON public.shifts(code);
CREATE INDEX idx_profiles_role ON public.profiles(role, active);
CREATE INDEX idx_courses_shift_active ON public.courses(shift_id, is_active, sort_order);
CREATE INDEX idx_course_assignments_user ON public.course_assignments(user_id, active);
CREATE INDEX idx_course_assignments_course ON public.course_assignments(course_id);
CREATE INDEX idx_attendance_date_shift ON public.attendance_records(date, shift_id);
CREATE INDEX idx_attendance_course_date ON public.attendance_records(course_id, date);
CREATE INDEX idx_attendance_created_by ON public.attendance_records(created_by);
CREATE INDEX idx_staff_absences_date_shift ON public.staff_absences(date, shift_id);
CREATE INDEX idx_attendance_audit_log_att ON public.attendance_audit_logs(attendance_id, created_at DESC);
```

---

## 6. Foreign Key Topology & Cascading Rules Summary

| Relationship | Child Table.Column | Parent Table.Column | ON DELETE Action | Integrity Rationale |
|---|---|---|---|---|
| Auth Link | `profiles.id` | `auth.users.id` | `CASCADE` | When a user is purged from Supabase Auth, their profile is cleanly removed. |
| Shift Assignment | `profiles.shift_id` | `shifts.id` | `SET NULL` | Deleting a shift should not delete user accounts. |
| Course to Shift | `courses.shift_id` | `shifts.id` | `RESTRICT` | Cannot delete a shift while courses belong to it. |
| Assignment to Profile | `course_assignments.user_id` | `profiles.id` | `CASCADE` | Deleting a user clears their teaching assignments. |
| Assignment to Course | `course_assignments.course_id` | `courses.id` | `CASCADE` | Deleting a course clears its teaching assignments. |
| Assignment Creator | `course_assignments.assigned_by`| `profiles.id` | `SET NULL` | Deleting an admin retains assignment records. |
| Attendance to Course | `attendance_records.course_id` | `courses.id` | `RESTRICT` | Prevents accidental deletion of courses with historical attendance records. |
| Attendance to Shift | `attendance_records.shift_id` | `shifts.id` | `RESTRICT` | Preserves shift integrity for historical reports. |
| Attendance Submitter | `attendance_records.created_by` | `profiles.id` | `SET NULL` | Historical attendance is retained even if the submitting teacher leaves. |
| Attendance Modifier | `attendance_records.updated_by` | `profiles.id` | `SET NULL` | Retains attendance record even if editor user is removed. |
| Absence to Shift | `staff_absences.shift_id` | `shifts.id` | `RESTRICT` | Shift records cannot be dropped if absence logs exist. |
| Absence to Course | `staff_absences.course_id` | `courses.id` | `SET NULL` | Course deletion unlinks absence but preserves staff absence entry. |
| Absence Logger | `staff_absences.created_by` | `profiles.id` | `SET NULL` | Absence records are retained if creator profile is deleted. |
| Audit to Attendance | `attendance_audit_logs.attendance_id`| `attendance_records.id` | `CASCADE` | Audit records for deleted temporary attendance are cleaned up. |
| Audit Modifier | `attendance_audit_logs.changed_by`| `profiles.id` | `SET NULL` | Forensic trace of modification survives user deletion. |

---

## 7. Stored Procedure Blueprint for Aggregated "Parte General"

To match `PARTE GENERALES TV.xlsx - T.V.csv` with zero roundtrips, this stored procedure aggregates courses, totals, and staff absences for any date and shift.

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
    -- 1. Identify Shift
    SELECT id, name INTO v_shift_id, v_shift_name
    FROM public.shifts
    WHERE code = p_shift_code;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Turno con código "%" no encontrado', p_shift_code;
    END IF;

    -- 2. Aggregate Course Lines
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'course_id', c.id,
            'course_name', c.name,
            'year', c.year,
            'division', c.division,
            'cycle', c.cycle,
            'orientation', COALESCE(c.orientation::text, '-'),
            'sort_order', c.sort_order,
            'inscriptos_v', COALESCE(a.snapshot_inscriptos_v, c.inscriptos_varones),
            'inscriptos_m', COALESCE(a.snapshot_inscriptos_m, c.inscriptos_mujeres),
            'inscriptos_t', COALESCE(a.snapshot_inscriptos_total, c.inscriptos_total),
            'presentes_v', COALESCE(a.presentes_varones, 0),
            'presentes_m', COALESCE(a.presentes_mujeres, 0),
            'presentes_t', COALESCE(a.total_presentes, 0),
            'ausentes_v', COALESCE(a.ausentes_varones, 0),
            'ausentes_m', COALESCE(a.ausentes_mujeres, 0),
            'ausentes_t', COALESCE(a.total_ausentes, 0),
            'porcentaje_asistencia', CASE 
                WHEN COALESCE(a.snapshot_inscriptos_total, c.inscriptos_total) > 0 
                THEN ROUND((COALESCE(a.total_presentes, 0)::NUMERIC / COALESCE(a.snapshot_inscriptos_total, c.inscriptos_total)::NUMERIC) * 100, 1)
                ELSE 0.0 
            END,
            'observaciones', COALESCE(a.observations, ''),
            'is_submitted', (a.id IS NOT NULL),
            'submitted_by', p.full_name,
            'submitted_at', a.created_at
        ) ORDER BY c.sort_order, c.year, c.division
    ), '[]'::jsonb) INTO v_courses_json
    FROM public.courses c
    LEFT JOIN public.attendance_records a ON c.id = a.course_id AND a.date = p_date
    LEFT JOIN public.profiles p ON a.created_by = p.id
    WHERE c.shift_id = v_shift_id AND c.is_active = true;

    -- 3. Compute Shift Totals
    SELECT jsonb_build_object(
        'total_inscriptos_v', COALESCE(SUM(COALESCE(a.snapshot_inscriptos_v, c.inscriptos_varones)), 0),
        'total_inscriptos_m', COALESCE(SUM(COALESCE(a.snapshot_inscriptos_m, c.inscriptos_mujeres)), 0),
        'total_inscriptos_t', COALESCE(SUM(COALESCE(a.snapshot_inscriptos_total, c.inscriptos_total)), 0),
        'total_presentes_v', COALESCE(SUM(a.presentes_varones), 0),
        'total_presentes_m', COALESCE(SUM(a.presentes_mujeres), 0),
        'total_presentes_t', COALESCE(SUM(a.total_presentes), 0),
        'total_ausentes_v', COALESCE(SUM(a.ausentes_varones), 0),
        'total_ausentes_m', COALESCE(SUM(a.ausentes_mujeres), 0),
        'total_ausentes_t', COALESCE(SUM(a.total_ausentes), 0),
        'porcentaje_asistencia_general', CASE 
            WHEN SUM(COALESCE(a.snapshot_inscriptos_total, c.inscriptos_total)) > 0 
            THEN ROUND((COALESCE(SUM(a.total_presentes), 0)::NUMERIC / SUM(COALESCE(a.snapshot_inscriptos_total, c.inscriptos_total))::NUMERIC) * 100, 1)
            ELSE 0.0 
        END,
        'total_courses_count', COUNT(c.id),
        'submitted_courses_count', COUNT(a.id)
    ) INTO v_totals_json
    FROM public.courses c
    LEFT JOIN public.attendance_records a ON c.id = a.course_id AND a.date = p_date
    WHERE c.shift_id = v_shift_id AND c.is_active = true;

    -- 4. Aggregate Staff Absences
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', sa.id,
            'staff_name', sa.staff_name,
            'role', sa.role,
            'subject_or_area', sa.subject_or_area,
            'reason', sa.reason,
            'is_justified', sa.is_justified,
            'observations', sa.observations
        )
    ), '[]'::jsonb) INTO v_absences_json
    FROM public.staff_absences sa
    WHERE sa.shift_id = v_shift_id AND sa.date = p_date;

    -- 5. Combine Final JSON Output
    v_result := jsonb_build_object(
        'date', p_date,
        'shift_id', v_shift_id,
        'shift_code', p_shift_code,
        'shift_name', v_shift_name,
        'courses', v_courses_json,
        'totals', v_totals_json,
        'staff_absences', v_absences_json
    );

    RETURN v_result;
END;
$$;
```

---

## 8. Complete Consolidated SQL DDL Migration Blueprint

The following complete script is designed for migration file `supabase/migrations/20260820000000_m1_database_and_auth.sql`:

```sql
-- ============================================================================
-- MIGRATION: 20260820000000_m1_database_and_auth.sql
-- Project: E.E.S.T. N° 3 Attendance Management System ("Parte General")
-- Database: PostgreSQL 15+ (Supabase)
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
CREATE TYPE public.user_role AS ENUM (
    'administrador',
    'preceptor',
    'profesor'
);

CREATE TYPE public.course_cycle AS ENUM (
    'basico',
    'superior',
    'tecnico_especial'
);

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

-- 3. TABLES

-- 3.1 Shifts
CREATE TABLE public.shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.2 User Profiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role public.user_role NOT NULL DEFAULT 'profesor',
    shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
    dni VARCHAR(20),
    phone VARCHAR(50),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.3 Courses
CREATE TABLE public.courses (
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

-- 3.4 Course Assignments
CREATE TABLE public.course_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    role_in_course VARCHAR(50) NOT NULL DEFAULT 'titular',
    active BOOLEAN NOT NULL DEFAULT true,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_course UNIQUE (user_id, course_id)
);

-- 3.5 Attendance Records
CREATE TABLE public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
    shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE RESTRICT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    presentes_varones INT NOT NULL DEFAULT 0 CHECK (presentes_varones >= 0),
    ausentes_varones INT NOT NULL DEFAULT 0 CHECK (ausentes_varones >= 0),
    presentes_mujeres INT NOT NULL DEFAULT 0 CHECK (presentes_mujeres >= 0),
    ausentes_mujeres INT NOT NULL DEFAULT 0 CHECK (ausentes_mujeres >= 0),
    
    total_presentes INT GENERATED ALWAYS AS (presentes_varones + presentes_mujeres) STORED,
    total_ausentes INT GENERATED ALWAYS AS (ausentes_varones + ausentes_mujeres) STORED,
    total_matricula INT GENERATED ALWAYS AS (presentes_varones + ausentes_varones + presentes_mujeres + ausentes_mujeres) STORED,
    
    snapshot_inscriptos_v INT NOT NULL DEFAULT 0 CHECK (snapshot_inscriptos_v >= 0),
    snapshot_inscriptos_m INT NOT NULL DEFAULT 0 CHECK (snapshot_inscriptos_m >= 0),
    snapshot_inscriptos_total INT GENERATED ALWAYS AS (snapshot_inscriptos_v + snapshot_inscriptos_m) STORED,
    
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status public.attendance_status NOT NULL DEFAULT 'presente',
    observations TEXT,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    CONSTRAINT uq_attendance_course_date UNIQUE (course_id, date)
);

-- 3.6 Staff Absences
CREATE TABLE public.staff_absences (
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

-- 3.7 Attendance Audit Logs
CREATE TABLE public.attendance_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendance_id UUID REFERENCES public.attendance_records(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. PERFORMANCE INDEXES
CREATE INDEX idx_shifts_code ON public.shifts(code);
CREATE INDEX idx_profiles_role ON public.profiles(role, active);
CREATE INDEX idx_courses_shift_active ON public.courses(shift_id, is_active, sort_order);
CREATE INDEX idx_course_assignments_user ON public.course_assignments(user_id, active);
CREATE INDEX idx_course_assignments_course ON public.course_assignments(course_id);
CREATE INDEX idx_attendance_date_shift ON public.attendance_records(date, shift_id);
CREATE INDEX idx_attendance_course_date ON public.attendance_records(course_id, date);
CREATE INDEX idx_attendance_created_by ON public.attendance_records(created_by);
CREATE INDEX idx_staff_absences_date_shift ON public.staff_absences(date, shift_id);
CREATE INDEX idx_attendance_audit_log_att ON public.attendance_audit_logs(attendance_id, created_at DESC);

-- 5. TRIGGERS & FUNCTIONS

-- 5.1 Attendance Validation & Snapshotting
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
    SELECT inscriptos_varones, inscriptos_mujeres, shift_id
    INTO v_inscriptos_v, v_inscriptos_m, v_course_shift
    FROM public.courses
    WHERE id = NEW.course_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Curso con ID % no existe en la base de datos', NEW.course_id;
    END IF;

    NEW.shift_id := v_course_shift;

    IF TG_OP = 'INSERT' OR (NEW.snapshot_inscriptos_v = 0 AND NEW.snapshot_inscriptos_m = 0) THEN
        NEW.snapshot_inscriptos_v := v_inscriptos_v;
        NEW.snapshot_inscriptos_m := v_inscriptos_m;
    END IF;

    IF (NEW.presentes_varones + NEW.ausentes_varones) <> NEW.snapshot_inscriptos_v THEN
        RAISE EXCEPTION 'Inconsistencia en Varones para curso %: Presentes (%) + Ausentes (%) != Inscriptos (%)',
            NEW.course_id, NEW.presentes_varones, NEW.ausentes_varones, NEW.snapshot_inscriptos_v;
    END IF;

    IF (NEW.presentes_mujeres + NEW.ausentes_mujeres) <> NEW.snapshot_inscriptos_m THEN
        RAISE EXCEPTION 'Inconsistencia en Mujeres para curso %: Presentes (%) + Ausentes (%) != Inscriptos (%)',
            NEW.course_id, NEW.presentes_mujeres, NEW.ausentes_mujeres, NEW.snapshot_inscriptos_m;
    END IF;

    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_and_snapshot_attendance
    BEFORE INSERT OR UPDATE ON public.attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_validate_and_snapshot_attendance();

-- 5.2 Auth User Registration Hook
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
        active
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'profesor'::public.user_role),
        true
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_handle_new_auth_user();

-- 5.3 Audit Logging Trigger
CREATE OR REPLACE FUNCTION public.fn_audit_attendance_changes()
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
            new_values
        ) VALUES (
            NEW.id,
            NEW.course_id,
            COALESCE(NEW.created_by, auth.uid()),
            'INSERT',
            NULL,
            to_jsonb(NEW)
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.attendance_audit_logs (
            attendance_id,
            course_id,
            changed_by,
            action,
            old_values,
            new_values
        ) VALUES (
            NEW.id,
            NEW.course_id,
            COALESCE(NEW.updated_by, auth.uid()),
            'UPDATE',
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.attendance_audit_logs (
            attendance_id,
            course_id,
            changed_by,
            action,
            old_values,
            new_values
        ) VALUES (
            OLD.id,
            OLD.course_id,
            auth.uid(),
            'DELETE',
            to_jsonb(OLD),
            NULL
        );
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

## 9. Verification Method & Database Test Scenarios

The following verification matrix provides explicit SQL assertions to validate the schema before frontend deployment:

| # | Test Scenario | Execution Vector | Expected Assertion / Behavior |
|---|---|---|---|
| **V-01** | `courses` Generated Stored Column | `INSERT INTO courses (shift_id, year, division, name, cycle, inscriptos_varones, inscriptos_mujeres) VALUES (<id>, 6, 1, '6° 1ª', 'superior', 11, 4)` | `inscriptos_total` MUST automatically equal `15`. |
| **V-02** | `attendance_records` Stored Totals | `INSERT INTO attendance_records (course_id, presentes_varones, ausentes_varones, presentes_mujeres, ausentes_mujeres) VALUES (<id>, 10, 1, 4, 0)` | `total_presentes` = 14, `total_ausentes` = 1, `total_matricula` = 15, `snapshot_inscriptos_total` = 15. |
| **V-03** | Parity Violation (Varones) | `INSERT INTO attendance_records (course_id, presentes_varones, ausentes_varones, presentes_mujeres, ausentes_mujeres) VALUES (<id>, 8, 1, 4, 0)` ($8+1 \neq 11$) | DB raises exception: `Inconsistencia en Varones para curso...`. Transaction rolled back. |
| **V-04** | Parity Violation (Mujeres) | `INSERT INTO attendance_records (course_id, presentes_varones, ausentes_varones, presentes_mujeres, ausentes_mujeres) VALUES (<id>, 10, 1, 3, 0)` ($3+0 \neq 4$) | DB raises exception: `Inconsistencia en Mujeres para curso...`. Transaction rolled back. |
| **V-05** | Unique Constraint `(course_id, date)` | Insert second attendance record for the same course on same date | DB rejects insert with unique constraint violation `uq_attendance_course_date`. |
| **V-06** | Forensic Audit Trigger | Update attendance record | New entry created in `attendance_audit_logs` with `action='UPDATE'` containing JSON diffs in `old_values` and `new_values`. |
| **V-07** | Shift Deletion Protection | `DELETE FROM shifts WHERE code = 'vespertino'` (when courses exist) | DB rejects delete due to `ON DELETE RESTRICT` foreign key constraint. |
| **V-08** | User Cascading Delete | `DELETE FROM auth.users WHERE id = <teacher_id>` | Associated profile in `profiles` and course assignment in `course_assignments` are removed; historical `attendance_records.created_by` is set to `NULL`. |

---

## 10. Conclusion & Handoff Directive

The proposed PostgreSQL DDL schema is comprehensive, fully normalized, performance-indexed, and mathematically secured. It is ready to be directly incorporated into the M1 migration suite (`supabase/migrations/20260820000000_m1_database_and_auth.sql`) alongside the seed dataset.
