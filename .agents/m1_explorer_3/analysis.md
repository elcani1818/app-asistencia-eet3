# Comprehensive Seed Data & Supabase Client Architecture Analysis
**Milestone:** M1 — Database & Auth Engine  
**Author:** Explorer 3 (`m1_explorer_3`)  
**Target Project:** E.E.S.T. N° 3 "Ntra. Sra. de la Merced" — Digital Parte General System  
**Date:** 2026-08-20  

---

## Executive Summary

This report establishes the complete, production-ready specification for:
1. **The Seed Data Engine (`supabase/seed.sql`)**: Complete catalog of shifts, the exact 10 Vespertino courses extracted from `PARTE GENERALES TV.xlsx - T.V.csv` (119 Varones, 53 Mujeres, 172 Total Inscriptos), the full Mañana and Tarde course catalogs (Ciclo Básico 1°1ª to 3°5ª, Ciclo Superior 4°1ª to 7°4ª), deterministic bootstrap demo accounts (`admin@colegio.edu.ar`, `preceptor.vespertino@colegio.edu.ar`, `profesor.mecanica@colegio.edu.ar`, etc.) with dual `auth.users` and `public.profiles` synchronization, course-teacher assignments, and sample attendance entries.
2. **Supabase Client Configuration (`src/lib/supabase.ts`)**: Type-safe, validated client initialization with runtime environment variable assertion.
3. **Comprehensive TypeScript Definitions (`src/types/database.ts`)**: Exhaustive schema types (Database interface, Tables, Views, Functions, Enums, Row, Insert, Update) reflecting PostgreSQL 15+ DDL and interface contracts from `PROJECT.md`.
4. **Environment Variables Template (`.env.example`)**: Configuration guidelines for Supabase connection parameters.

---

## 1. Dataset Analysis: Turno Vespertino Exact CSV Mapping

From `PARTE GENERALES TV.xlsx - T.V.csv`, the paper attendance sheet contains exactly 10 courses with the following breakdown:

### Table 1.1: Vespertino Courses Matrix
| Ord | Course Raw | Standard Name | Year | Div | Cycle | Orientation | Inscriptos V | Inscriptos M | Inscriptos Total | Deterministic UUID |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | `5º4º` | `5° 4ª` | 5 | 4 | `superior` | `TECET` | 8 | 0 (`-`) | 8 | `33333333-0000-0000-0000-000000000504` |
| 2 | `6º1º` | `6° 1ª` | 6 | 1 | `superior` | `TECQU` | 11 | 4 | 15 | `33333333-0000-0000-0000-000000000601` |
| 3 | `6º2º` | `6° 2ª` | 6 | 2 | `superior` | `TECMM` | 9 | 14 | 23 | `33333333-0000-0000-0000-000000000602` |
| 4 | `6º3º` | `6° 3ª` | 6 | 3 | `superior` | `TECET` | 23 | 2 | 25 | `33333333-0000-0000-0000-000000000603` |
| 5 | `6º4º` | `6° 4ª` | 6 | 4 | `superior` | `TECET` | 6 | 0 (`-`) | 6 | `33333333-0000-0000-0000-000000000604` |
| 6 | `7º1º` | `7° 1ª` | 7 | 1 | `superior` | `TECQU` | 5 | 8 | 13 | `33333333-0000-0000-0000-000000000701` |
| 7 | `7º2º` | `7° 2ª` | 7 | 2 | `superior` | `TECMM` | 9 | 9 | 18 | `33333333-0000-0000-0000-000000000702` |
| 8 | `7º3º` | `7° 3ª` | 7 | 3 | `superior` | `TECET` | 20 | 9 | 29 | `33333333-0000-0000-0000-000000000703` |
| 9 | `7º4º` | `7° 4ª` | 7 | 4 | `superior` | `TECET` | 8 | 0 (`-`) | 8 | `33333333-0000-0000-0000-000000000704` |
| 10 | `1° 1°` | `1° 1ª C.TEC.MMO` | 1 | 1 | `tecnico_especial` | `C.TEC.MMO` | 20 | 7 | 27 | `33333333-0000-0000-0000-000000000101` |
| **TOTAL** | — | **10 Cursos** | — | — | — | — | **119** | **53** | **172** | — |

#### Verification & Mathematical Consistency:
$$\sum I_V = 8 + 11 + 9 + 23 + 6 + 5 + 9 + 20 + 8 + 20 = 119$$
$$\sum I_M = 0 + 4 + 14 + 2 + 0 + 8 + 9 + 9 + 0 + 7 = 53$$
$$\sum I_T = 119 + 53 = 172$$
*Notes:*
- Dashes (`-`) in the CSV represent zero enrollment (`0`).
- `1° 1° C.TEC.MMO` is a dedicated night/evening technical vocational degree in Maestro Mayor de Obras, categorized under `cycle = 'tecnico_especial'` and `orientation = 'C.TEC.MMO'`.

---

## 2. Catalog Design: Turnos Mañana y Tarde

The institutional structure defined in `ORIGINAL_REQUEST.md` and `PROJECT.md` establishes a 7-year technical secondary education structure across three main specializations:
- **División 1ª**: `TECQU` (Técnico Químico)
- **División 2ª**: `TECMM` (Técnico Maestro Mayor de Obra)
- **División 3ª & 4ª**: `TECET` (Técnico Electromecánico)

### Table 2.1: Turno Mañana Course Catalog
- **Shift UUID**: `11111111-1111-1111-1111-111111111111`
- **Ciclo Básico** (14 courses):
  - 1° Año: `1° 1ª`, `1° 2ª`, `1° 3ª`, `1° 4ª`, `1° 5ª` (UUIDs: `11111111-0000-0000-0000-000000000101` to `...0105`)
  - 2° Año: `2° 1ª`, `2° 2ª`, `2° 3ª`, `2° 4ª`, `2° 5ª` (UUIDs: `11111111-0000-0000-0000-000000000201` to `...0205`)
  - 3° Año: `3° 1ª`, `3° 2ª`, `3° 3ª`, `3° 4ª` (UUIDs: `11111111-0000-0000-0000-000000000301` to `...0304`)
- **Ciclo Superior** (12 courses):
  - 4° Año: `4° 1ª TECQU`, `4° 2ª TECMM`, `4° 3ª TECET`
  - 5° Año: `5° 1ª TECQU`, `5° 2ª TECMM`, `5° 3ª TECET`
  - 6° Año: `6° 1ª TECQU`, `6° 2ª TECMM`, `6° 3ª TECET`
  - 7° Año: `7° 1ª TECQU`, `7° 2ª TECMM`, `7° 3ª TECET`

### Table 2.2: Turno Tarde Course Catalog
- **Shift UUID**: `22222222-2222-2222-2222-222222222222`
- **Ciclo Básico** (14 courses): Same distribution as Mañana with shift prefix `22222222-...`
- **Ciclo Superior** (12 courses): Same distribution with shift prefix `22222222-...`

---

## 3. Bootstrap Authentication & Authorization Profiles

To provide immediate zero-setup evaluation and testing, the seed script provisions deterministic accounts across all three user archetypes.

### Table 3.1: Bootstrap User Accounts
| Role | Email | Password | User UUID | Full Name | DNI | Assignments |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `administrador` | `admin@colegio.edu.ar` | `Admin2026!` | `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa` | Prof. Roberto Martínez (Director) | `18.234.567` | Global access (all shifts, settings, catalog) |
| `preceptor` | `preceptor.vespertino@colegio.edu.ar` | `Preceptor2026!` | `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb` | Carlos Gómez (Preceptor TV) | `24.567.890` | Turno Vespertino summary & all courses |
| `profesor` | `profesor.mecanica@colegio.edu.ar` | `Profesor2026!` | `cccccccc-cccc-cccc-cccc-cccccccccccc` | Ing. Alejandro Rossi (Electromecánica) | `28.901.234` | `6° 3ª TECET`, `7° 3ª TECET`, `5° 4ª TECET` |
| `profesor` | `profesora.quimica@colegio.edu.ar` | `Profesor2026!` | `dddddddd-dddd-dddd-dddd-dddddddddddd` | Lic. Mariana Benítez (Química) | `30.123.456` | `6° 1ª TECQU`, `7° 1ª TECQU` |
| `preceptor` | `preceptor.manana@colegio.edu.ar` | `Preceptor2026!` | `eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee` | Laura Fernández (Preceptora TM) | `26.789.012` | Turno Mañana summary & all courses |

---

## 4. Complete SQL Seed Script (`supabase/seed.sql`)

```sql
-- ============================================================================
-- SEED DATA SCRIPT: supabase/seed.sql
-- Project: E.E.S.T. N° 3 "Ntra. Sra. de la Merced" — Digital Parte General
-- Author: Explorer 3 (M1 Database & Auth Engine)
-- ============================================================================

-- Ensure pgcrypto extension is active for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. SHIFTS (TURNOS)
-- ----------------------------------------------------------------------------
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


-- ----------------------------------------------------------------------------
-- 2. AUTH USERS & PROFILES (BOOTSTRAP DEMO ACCOUNTS)
-- ----------------------------------------------------------------------------

-- 2.1 Auth Users in auth.users
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES 
    -- 1. Administrador
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'admin@colegio.edu.ar',
        crypt('Admin2026!', gen_salt('bf')),
        now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"full_name": "Prof. Roberto Martínez", "role": "administrador"}'::jsonb,
        now(),
        now()
    ),
    -- 2. Preceptor Turno Vespertino
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'preceptor.vespertino@colegio.edu.ar',
        crypt('Preceptor2026!', gen_salt('bf')),
        now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"full_name": "Carlos Gómez", "role": "preceptor"}'::jsonb,
        now(),
        now()
    ),
    -- 3. Profesor Electromecánica
    (
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'profesor.mecanica@colegio.edu.ar',
        crypt('Profesor2026!', gen_salt('bf')),
        now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"full_name": "Ing. Alejandro Rossi", "role": "profesor"}'::jsonb,
        now(),
        now()
    ),
    -- 4. Profesora Química
    (
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'profesora.quimica@colegio.edu.ar',
        crypt('Profesor2026!', gen_salt('bf')),
        now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"full_name": "Lic. Mariana Benítez", "role": "profesor"}'::jsonb,
        now(),
        now()
    ),
    -- 5. Preceptora Turno Mañana
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'preceptor.manana@colegio.edu.ar',
        crypt('Preceptor2026!', gen_salt('bf')),
        now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"full_name": "Laura Fernández", "role": "preceptor"}'::jsonb,
        now(),
        now()
    )
ON CONFLICT (id) DO UPDATE SET
    encrypted_password = EXCLUDED.encrypted_password,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = now();

-- 2.2 User Profiles in public.profiles
INSERT INTO public.profiles (id, role, full_name, email, dni, phone, is_active)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'administrador', 'Prof. Roberto Martínez (Director)', 'admin@colegio.edu.ar', '18.234.567', '+54 11 4750-1234', true),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'preceptor', 'Carlos Gómez (Preceptor TV)', 'preceptor.vespertino@colegio.edu.ar', '24.567.890', '+54 11 4750-5678', true),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'profesor', 'Ing. Alejandro Rossi (Electromecánica)', 'profesor.mecanica@colegio.edu.ar', '28.901.234', '+54 11 4750-9012', true),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'profesor', 'Lic. Mariana Benítez (Química)', 'profesora.quimica@colegio.edu.ar', '30.123.456', '+54 11 4750-3456', true),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'preceptor', 'Laura Fernández (Preceptora TM)', 'preceptor.manana@colegio.edu.ar', '26.789.012', '+54 11 4750-7890', true)
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    dni = EXCLUDED.dni,
    phone = EXCLUDED.phone,
    is_active = EXCLUDED.is_active;


-- ----------------------------------------------------------------------------
-- 3. COURSES: TURNO VESPERTINO (EXACT CSV DATASET - 172 INSCRIPTOS)
-- ----------------------------------------------------------------------------
INSERT INTO public.courses (
    id,
    shift_id,
    year,
    division,
    name,
    cycle,
    orientation,
    inscriptos_varones,
    inscriptos_mujeres,
    sort_order,
    is_active
) VALUES 
    ('33333333-0000-0000-0000-000000000504', '33333333-3333-3333-3333-333333333333', 5, 4, '5° 4ª', 'superior', 'TECET', 8, 0, 1, true),
    ('33333333-0000-0000-0000-000000000601', '33333333-3333-3333-3333-333333333333', 6, 1, '6° 1ª', 'superior', 'TECQU', 11, 4, 2, true),
    ('33333333-0000-0000-0000-000000000602', '33333333-3333-3333-3333-333333333333', 6, 2, '6° 2ª', 'superior', 'TECMM', 9, 14, 3, true),
    ('33333333-0000-0000-0000-000000000603', '33333333-3333-3333-3333-333333333333', 6, 3, '6° 3ª', 'superior', 'TECET', 23, 2, 4, true),
    ('33333333-0000-0000-0000-000000000604', '33333333-3333-3333-3333-333333333333', 6, 4, '6° 4ª', 'superior', 'TECET', 6, 0, 5, true),
    ('33333333-0000-0000-0000-000000000701', '33333333-3333-3333-3333-333333333333', 7, 1, '7° 1ª', 'superior', 'TECQU', 5, 8, 6, true),
    ('33333333-0000-0000-0000-000000000702', '33333333-3333-3333-3333-333333333333', 7, 2, '7° 2ª', 'superior', 'TECMM', 9, 9, 7, true),
    ('33333333-0000-0000-0000-000000000703', '33333333-3333-3333-3333-333333333333', 7, 3, '7° 3ª', 'superior', 'TECET', 20, 9, 8, true),
    ('33333333-0000-0000-0000-000000000704', '33333333-3333-3333-3333-333333333333', 7, 4, '7° 4ª', 'superior', 'TECET', 8, 0, 9, true),
    ('33333333-0000-0000-0000-000000000101', '33333333-3333-3333-3333-333333333333', 1, 1, '1° 1ª C.TEC.MMO', 'tecnico_especial', 'C.TEC.MMO', 20, 7, 10, true)
ON CONFLICT (shift_id, name) DO UPDATE SET
    year = EXCLUDED.year,
    division = EXCLUDED.division,
    cycle = EXCLUDED.cycle,
    orientation = EXCLUDED.orientation,
    inscriptos_varones = EXCLUDED.inscriptos_varones,
    inscriptos_mujeres = EXCLUDED.inscriptos_mujeres,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active;


-- ----------------------------------------------------------------------------
-- 4. COURSES: TURNO MAÑANA INITIAL CATALOG
-- ----------------------------------------------------------------------------
INSERT INTO public.courses (
    id,
    shift_id,
    year,
    division,
    name,
    cycle,
    orientation,
    inscriptos_varones,
    inscriptos_mujeres,
    sort_order,
    is_active
) VALUES 
    -- Ciclo Básico 1° Año
    ('11111111-0000-0000-0000-000000000101', '11111111-1111-1111-1111-111111111111', 1, 1, '1° 1ª', 'basico', NULL, 18, 12, 1, true),
    ('11111111-0000-0000-0000-000000000102', '11111111-1111-1111-1111-111111111111', 1, 2, '1° 2ª', 'basico', NULL, 16, 14, 2, true),
    ('11111111-0000-0000-0000-000000000103', '11111111-1111-1111-1111-111111111111', 1, 3, '1° 3ª', 'basico', NULL, 19, 11, 3, true),
    ('11111111-0000-0000-0000-000000000104', '11111111-1111-1111-1111-111111111111', 1, 4, '1° 4ª', 'basico', NULL, 15, 13, 4, true),
    ('11111111-0000-0000-0000-000000000105', '11111111-1111-1111-1111-111111111111', 1, 5, '1° 5ª', 'basico', NULL, 17, 10, 5, true),
    -- Ciclo Básico 2° Año
    ('11111111-0000-0000-0000-000000000201', '11111111-1111-1111-1111-111111111111', 2, 1, '2° 1ª', 'basico', NULL, 15, 12, 6, true),
    ('11111111-0000-0000-0000-000000000202', '11111111-1111-1111-1111-111111111111', 2, 2, '2° 2ª', 'basico', NULL, 14, 15, 7, true),
    ('11111111-0000-0000-0000-000000000203', '11111111-1111-1111-1111-111111111111', 2, 3, '2° 3ª', 'basico', NULL, 18, 9, 8, true),
    ('11111111-0000-0000-0000-000000000204', '11111111-1111-1111-1111-111111111111', 2, 4, '2° 4ª', 'basico', NULL, 16, 11, 9, true),
    ('11111111-0000-0000-0000-000000000205', '11111111-1111-1111-1111-111111111111', 2, 5, '2° 5ª', 'basico', NULL, 15, 13, 10, true),
    -- Ciclo Básico 3° Año
    ('11111111-0000-0000-0000-000000000301', '11111111-1111-1111-1111-111111111111', 3, 1, '3° 1ª', 'basico', NULL, 14, 14, 11, true),
    ('11111111-0000-0000-0000-000000000302', '11111111-1111-1111-1111-111111111111', 3, 2, '3° 2ª', 'basico', NULL, 17, 10, 12, true),
    ('11111111-0000-0000-0000-000000000303', '11111111-1111-1111-1111-111111111111', 3, 3, '3° 3ª', 'basico', NULL, 16, 12, 13, true),
    ('11111111-0000-0000-0000-000000000304', '11111111-1111-1111-1111-111111111111', 3, 4, '3° 4ª', 'basico', NULL, 15, 11, 14, true),
    -- Ciclo Superior 4° Año
    ('11111111-0000-0000-0000-000000000401', '11111111-1111-1111-1111-111111111111', 4, 1, '4° 1ª', 'superior', 'TECQU', 12, 14, 15, true),
    ('11111111-0000-0000-0000-000000000402', '11111111-1111-1111-1111-111111111111', 4, 2, '4° 2ª', 'superior', 'TECMM', 15, 11, 16, true),
    ('11111111-0000-0000-0000-000000000403', '11111111-1111-1111-1111-111111111111', 4, 3, '4° 3ª', 'superior', 'TECET', 22, 4, 17, true),
    -- Ciclo Superior 5° Año
    ('11111111-0000-0000-0000-000000000501', '11111111-1111-1111-1111-111111111111', 5, 1, '5° 1ª', 'superior', 'TECQU', 10, 15, 18, true),
    ('11111111-0000-0000-0000-000000000502', '11111111-1111-1111-1111-111111111111', 5, 2, '5° 2ª', 'superior', 'TECMM', 14, 10, 19, true),
    ('11111111-0000-0000-0000-000000000503', '11111111-1111-1111-1111-111111111111', 5, 3, '5° 3ª', 'superior', 'TECET', 21, 3, 20, true),
    -- Ciclo Superior 6° Año
    ('11111111-0000-0000-0000-000000000601', '11111111-1111-1111-1111-111111111111', 6, 1, '6° 1ª', 'superior', 'TECQU', 9, 13, 21, true),
    ('11111111-0000-0000-0000-000000000602', '11111111-1111-1111-1111-111111111111', 6, 2, '6° 2ª', 'superior', 'TECMM', 13, 12, 22, true),
    ('11111111-0000-0000-0000-000000000603', '11111111-1111-1111-1111-111111111111', 6, 3, '6° 3ª', 'superior', 'TECET', 20, 4, 23, true),
    -- Ciclo Superior 7° Año
    ('11111111-0000-0000-0000-000000000701', '11111111-1111-1111-1111-111111111111', 7, 1, '7° 1ª', 'superior', 'TECQU', 8, 12, 24, true),
    ('11111111-0000-0000-0000-000000000702', '11111111-1111-1111-1111-111111111111', 7, 2, '7° 2ª', 'superior', 'TECMM', 11, 9, 25, true),
    ('11111111-0000-0000-0000-000000000703', '11111111-1111-1111-1111-111111111111', 7, 3, '7° 3ª', 'superior', 'TECET', 18, 5, 26, true)
ON CONFLICT (shift_id, name) DO NOTHING;


-- ----------------------------------------------------------------------------
-- 5. COURSES: TURNO TARDE INITIAL CATALOG
-- ----------------------------------------------------------------------------
INSERT INTO public.courses (
    id,
    shift_id,
    year,
    division,
    name,
    cycle,
    orientation,
    inscriptos_varones,
    inscriptos_mujeres,
    sort_order,
    is_active
) VALUES 
    -- Ciclo Básico 1° Año
    ('22222222-0000-0000-0000-000000000101', '22222222-2222-2222-2222-222222222222', 1, 1, '1° 1ª', 'basico', NULL, 17, 13, 1, true),
    ('22222222-0000-0000-0000-000000000102', '22222222-2222-2222-2222-222222222222', 1, 2, '1° 2ª', 'basico', NULL, 15, 15, 2, true),
    ('22222222-0000-0000-0000-000000000103', '22222222-2222-2222-2222-222222222222', 1, 3, '1° 3ª', 'basico', NULL, 18, 12, 3, true),
    ('22222222-0000-0000-0000-000000000104', '22222222-2222-2222-2222-222222222222', 1, 4, '1° 4ª', 'basico', NULL, 16, 14, 4, true),
    ('22222222-0000-0000-0000-000000000105', '22222222-2222-2222-2222-222222222222', 1, 5, '1° 5ª', 'basico', NULL, 16, 11, 5, true),
    -- Ciclo Básico 2° Año
    ('22222222-0000-0000-0000-000000000201', '22222222-2222-2222-2222-222222222222', 2, 1, '2° 1ª', 'basico', NULL, 14, 13, 6, true),
    ('22222222-0000-0000-0000-000000000202', '22222222-2222-2222-2222-222222222222', 2, 2, '2° 2ª', 'basico', NULL, 16, 14, 7, true),
    ('22222222-0000-0000-0000-000000000203', '22222222-2222-2222-2222-222222222222', 2, 3, '2° 3ª', 'basico', NULL, 17, 10, 8, true),
    ('22222222-0000-0000-0000-000000000204', '22222222-2222-2222-2222-222222222222', 2, 4, '2° 4ª', 'basico', NULL, 15, 12, 9, true),
    ('22222222-0000-0000-0000-000000000205', '22222222-2222-2222-2222-222222222222', 2, 5, '2° 5ª', 'basico', NULL, 14, 14, 10, true),
    -- Ciclo Básico 3° Año
    ('22222222-0000-0000-0000-000000000301', '22222222-2222-2222-2222-222222222222', 3, 1, '3° 1ª', 'basico', NULL, 15, 13, 11, true),
    ('22222222-0000-0000-0000-000000000302', '22222222-2222-2222-2222-222222222222', 3, 2, '3° 2ª', 'basico', NULL, 16, 11, 12, true),
    ('22222222-0000-0000-0000-000000000303', '22222222-2222-2222-2222-222222222222', 3, 3, '3° 3ª', 'basico', NULL, 17, 11, 13, true),
    ('22222222-0000-0000-0000-000000000304', '22222222-2222-2222-2222-222222222222', 3, 4, '3° 4ª', 'basico', NULL, 14, 12, 14, true),
    -- Ciclo Superior 4° Año
    ('22222222-0000-0000-0000-000000000401', '22222222-2222-2222-2222-222222222222', 4, 1, '4° 1ª', 'superior', 'TECQU', 11, 15, 15, true),
    ('22222222-0000-0000-0000-000000000402', '22222222-2222-2222-2222-222222222222', 4, 2, '4° 2ª', 'superior', 'TECMM', 16, 10, 16, true),
    ('22222222-0000-0000-0000-000000000403', '22222222-2222-2222-2222-222222222222', 4, 3, '4° 3ª', 'superior', 'TECET', 21, 5, 17, true),
    -- Ciclo Superior 5° Año
    ('22222222-0000-0000-0000-000000000501', '22222222-2222-2222-2222-222222222222', 5, 1, '5° 1ª', 'superior', 'TECQU', 10, 14, 18, true),
    ('22222222-0000-0000-0000-000000000502', '22222222-2222-2222-2222-222222222222', 5, 2, '5° 2ª', 'superior', 'TECMM', 13, 11, 19, true),
    ('22222222-0000-0000-0000-000000000503', '22222222-2222-2222-2222-222222222222', 5, 3, '5° 3ª', 'superior', 'TECET', 20, 4, 20, true),
    -- Ciclo Superior 6° Año
    ('22222222-0000-0000-0000-000000000601', '22222222-2222-2222-2222-222222222222', 6, 1, '6° 1ª', 'superior', 'TECQU', 8, 14, 21, true),
    ('22222222-0000-0000-0000-000000000602', '22222222-2222-2222-2222-222222222222', 6, 2, '6° 2ª', 'superior', 'TECMM', 12, 10, 22, true),
    ('22222222-0000-0000-0000-000000000603', '22222222-2222-2222-2222-222222222222', 6, 3, '6° 3ª', 'superior', 'TECET', 19, 5, 23, true),
    -- Ciclo Superior 7° Año
    ('22222222-0000-0000-0000-000000000701', '22222222-2222-2222-2222-222222222222', 7, 1, '7° 1ª', 'superior', 'TECQU', 7, 11, 24, true),
    ('22222222-0000-0000-0000-000000000702', '22222222-2222-2222-2222-222222222222', 7, 2, '7° 2ª', 'superior', 'TECMM', 10, 8, 25, true),
    ('22222222-0000-0000-0000-000000000703', '22222222-2222-2222-2222-222222222222', 7, 3, '7° 3ª', 'superior', 'TECET', 17, 6, 26, true)
ON CONFLICT (shift_id, name) DO NOTHING;


-- ----------------------------------------------------------------------------
-- 6. TEACHER COURSE ASSIGNMENTS
-- ----------------------------------------------------------------------------
INSERT INTO public.course_assignments (course_id, teacher_id, assigned_by)
VALUES
    -- Ing. Rossi assigned to Vespertino Electromecánica courses
    ('33333333-0000-0000-0000-000000000603', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('33333333-0000-0000-0000-000000000703', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('33333333-0000-0000-0000-000000000504', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    -- Lic. Benítez assigned to Vespertino Química courses
    ('33333333-0000-0000-0000-000000000601', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('33333333-0000-0000-0000-000000000701', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
ON CONFLICT (course_id, teacher_id) DO NOTHING;


-- ----------------------------------------------------------------------------
-- 7. DEMO ATTENDANCE ENTRIES (TODAY) FOR IMMEDIATE DASHBOARD VERIFICATION
-- ----------------------------------------------------------------------------
INSERT INTO public.attendance_records (
    date,
    course_id,
    shift_id,
    submitted_by,
    inscriptos_varones_snapshot,
    inscriptos_mujeres_snapshot,
    presentes_varones,
    presentes_mujeres,
    ausentes_varones,
    ausentes_mujeres,
    observaciones,
    status,
    is_locked
) VALUES
    -- 6° 3ª (Inscriptos: 23 V, 2 M)
    (
        CURRENT_DATE,
        '33333333-0000-0000-0000-000000000603',
        '33333333-3333-3333-3333-333333333333',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        23, 2,
        21, 2,
        2, 0,
        'Práctica de laboratorio de máquinas eléctricas completada sin novedades.',
        'submitted',
        false
    ),
    -- 6° 1ª (Inscriptos: 11 V, 4 M)
    (
        CURRENT_DATE,
        '33333333-0000-0000-0000-000000000601',
        '33333333-3333-3333-3333-333333333333',
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        11, 4,
        10, 3,
        1, 1,
        'Alumnos ausentes con aviso de examen de ingreso.',
        'submitted',
        false
    ),
    -- 1° 1ª C.TEC.MMO (Inscriptos: 20 V, 7 M)
    (
        CURRENT_DATE,
        '33333333-0000-0000-0000-000000000101',
        '33333333-3333-3333-3333-333333333333',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        20, 7,
        18, 6,
        2, 1,
        'Taller de dibujo técnico nocturno.',
        'submitted',
        false
    )
ON CONFLICT (date, course_id) DO UPDATE SET
    presentes_varones = EXCLUDED.presentes_varones,
    presentes_mujeres = EXCLUDED.presentes_mujeres,
    ausentes_varones = EXCLUDED.ausentes_varones,
    ausentes_mujeres = EXCLUDED.ausentes_mujeres,
    observaciones = EXCLUDED.observaciones,
    updated_at = now();


-- ----------------------------------------------------------------------------
-- 8. DEMO STAFF ABSENCES
-- ----------------------------------------------------------------------------
INSERT INTO public.staff_absences (
    date,
    shift_id,
    staff_name,
    role_type,
    subject_or_area,
    course_id,
    reason,
    observations,
    created_by
) VALUES 
    (
        CURRENT_DATE,
        '33333333-3333-3333-3333-333333333333',
        'Prof. Juan Pablo Molina',
        'Docente',
        'Electrotecnia Superior',
        '33333333-0000-0000-0000-000000000703',
        'Licencia Médica (Art. 114)',
        'Se deja guía de estudio en preceptoría.',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    ),
    (
        CURRENT_DATE,
        '33333333-3333-3333-3333-333333333333',
        'Sra. Marta Silva',
        'Auxiliar',
        'Mantenimiento de Talleres',
        NULL,
        'Asunto Particular (Art. 115)',
        'Cubre auxiliar de guardia.',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    );
```

---

## 5. Supabase Client Configuration (`src/lib/supabase.ts`)

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

/**
 * Validates and retrieves required Supabase environment variables.
 * Throws early descriptive errors in development if environment configuration is incomplete.
 */
function getSupabaseConfig(): { supabaseUrl: string; supabaseAnonKey: string } {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    throw new Error(
      'Invalid or missing VITE_SUPABASE_URL in environment configuration. ' +
      'Please verify your .env file.'
    );
  }

  if (!supabaseAnonKey || supabaseAnonKey.length < 10) {
    throw new Error(
      'Invalid or missing VITE_SUPABASE_ANON_KEY in environment configuration. ' +
      'Please verify your .env file.'
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

/**
 * Type-safe Supabase client configured for EEST N° 3 Attendance Management System.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'eest3-parte-general',
    },
  },
});
```

---

## 6. Complete TypeScript Type Definitions (`src/types/database.ts`)

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRole = 'administrador' | 'preceptor' | 'profesor';
export type ShiftCode = 'manana' | 'tarde' | 'vespertino';
export type CycleType = 'basico' | 'superior' | 'tecnico_especial';
export type OrientationType = 'TECQU' | 'TECMM' | 'TECET' | 'C.TEC.MMO';
export type SubmissionStatus = 'draft' | 'submitted' | 'verified';

export interface Database {
  public: {
    Tables: {
      shifts: {
        Row: {
          id: string;
          code: ShiftCode;
          name: string;
          start_time: string;
          end_time: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: ShiftCode;
          name: string;
          start_time: string;
          end_time: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: ShiftCode;
          name?: string;
          start_time?: string;
          end_time?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      profiles: {
        Row: {
          id: string;
          role: AppRole;
          full_name: string;
          email: string;
          dni: string | null;
          phone: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: AppRole;
          full_name: string;
          email: string;
          dni?: string | null;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: AppRole;
          full_name?: string;
          email?: string;
          dni?: string | null;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      courses: {
        Row: {
          id: string;
          shift_id: string;
          year: number;
          division: number;
          name: string;
          cycle: CycleType;
          orientation: OrientationType | null;
          inscriptos_varones: number;
          inscriptos_mujeres: number;
          inscriptos_total: number;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shift_id: string;
          year: number;
          division: number;
          name: string;
          cycle: CycleType;
          orientation?: OrientationType | null;
          inscriptos_varones?: number;
          inscriptos_mujeres?: number;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shift_id?: string;
          year?: number;
          division?: number;
          name?: string;
          cycle?: CycleType;
          orientation?: OrientationType | null;
          inscriptos_varones?: number;
          inscriptos_mujeres?: number;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'courses_shift_id_fkey';
            columns: ['shift_id'];
            referencedRelation: 'shifts';
            referencedColumns: ['id'];
          }
        ];
      };

      course_assignments: {
        Row: {
          id: string;
          course_id: string;
          teacher_id: string;
          assigned_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          teacher_id: string;
          assigned_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          teacher_id?: string;
          assigned_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'course_assignments_course_id_fkey';
            columns: ['course_id'];
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_assignments_teacher_id_fkey';
            columns: ['teacher_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'course_assignments_assigned_by_fkey';
            columns: ['assigned_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };

      attendance_records: {
        Row: {
          id: string;
          date: string;
          course_id: string;
          shift_id: string;
          submitted_by: string | null;
          inscriptos_varones_snapshot: number;
          inscriptos_mujeres_snapshot: number;
          inscriptos_total_snapshot: number;
          presentes_varones: number;
          presentes_mujeres: number;
          presentes_total: number;
          ausentes_varones: number;
          ausentes_mujeres: number;
          ausentes_total: number;
          observaciones: string | null;
          status: SubmissionStatus;
          is_locked: boolean;
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date?: string;
          course_id: string;
          shift_id?: string;
          submitted_by?: string | null;
          inscriptos_varones_snapshot?: number;
          inscriptos_mujeres_snapshot?: number;
          presentes_varones?: number;
          presentes_mujeres?: number;
          ausentes_varones?: number;
          ausentes_mujeres?: number;
          observaciones?: string | null;
          status?: SubmissionStatus;
          is_locked?: boolean;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          course_id?: string;
          shift_id?: string;
          submitted_by?: string | null;
          inscriptos_varones_snapshot?: number;
          inscriptos_mujeres_snapshot?: number;
          presentes_varones?: number;
          presentes_mujeres?: number;
          ausentes_varones?: number;
          ausentes_mujeres?: number;
          observaciones?: string | null;
          status?: SubmissionStatus;
          is_locked?: boolean;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'attendance_records_course_id_fkey';
            columns: ['course_id'];
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'attendance_records_shift_id_fkey';
            columns: ['shift_id'];
            referencedRelation: 'shifts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'attendance_records_submitted_by_fkey';
            columns: ['submitted_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };

      staff_absences: {
        Row: {
          id: string;
          date: string;
          shift_id: string;
          staff_name: string;
          role_type: string;
          subject_or_area: string | null;
          course_id: string | null;
          reason: string | null;
          observations: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date?: string;
          shift_id: string;
          staff_name: string;
          role_type: string;
          subject_or_area?: string | null;
          course_id?: string | null;
          reason?: string | null;
          observations?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          shift_id?: string;
          staff_name?: string;
          role_type?: string;
          subject_or_area?: string | null;
          course_id?: string | null;
          reason?: string | null;
          observations?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'staff_absences_shift_id_fkey';
            columns: ['shift_id'];
            referencedRelation: 'shifts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'staff_absences_course_id_fkey';
            columns: ['course_id'];
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'staff_absences_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };

      attendance_audit_logs: {
        Row: {
          id: string;
          attendance_id: string | null;
          changed_by: string | null;
          action: string;
          old_data: Json | null;
          new_data: Json | null;
          changed_at: string;
        };
        Insert: {
          id?: string;
          attendance_id?: string | null;
          changed_by?: string | null;
          action: string;
          old_data?: Json | null;
          new_data?: Json | null;
          changed_at?: string;
        };
        Update: {
          id?: string;
          attendance_id?: string | null;
          changed_by?: string | null;
          action?: string;
          old_data?: Json | null;
          new_data?: Json | null;
          changed_at?: string;
        };
        Relationships: [];
      };
    };

    Views: {
      vw_parte_general_sheet: {
        Row: {
          shift_id: string;
          shift_name: string;
          shift_code: ShiftCode;
          course_id: string;
          course_name: string;
          year: number;
          division: number;
          cycle: CycleType;
          orientation: OrientationType | null;
          sort_order: number;
          date: string;
          inscriptos_varones: number;
          inscriptos_mujeres: number;
          inscriptos_total: number;
          presentes_varones: number | null;
          presentes_mujeres: number | null;
          presentes_total: number | null;
          ausentes_varones: number | null;
          ausentes_mujeres: number | null;
          ausentes_total: number | null;
          observaciones: string | null;
          status: SubmissionStatus;
          is_locked: boolean | null;
          submitted_at: string | null;
          submitted_by_name: string | null;
        };
      };
    };

    Functions: {
      get_current_role: {
        Args: Record<PropertyKey, never>;
        Returns: AppRole;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_preceptor: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_admin_or_preceptor: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_assigned_to_course: {
        Args: { p_course_id: string };
        Returns: boolean;
      };
      fn_get_shift_parte_general: {
        Args: { p_date: string; p_shift_code: string };
        Returns: {
          date: string;
          shift_id: string;
          shift_code: ShiftCode;
          shift_name: string;
          courses: Array<{
            course_id: string;
            course_name: string;
            year: number;
            division: number;
            cycle: CycleType;
            orientation: string;
            inscriptos_v: number;
            inscriptos_m: number;
            inscriptos_t: number;
            presentes_v: number | null;
            presentes_m: number | null;
            presentes_t: number | null;
            ausentes_v: number | null;
            ausentes_m: number | null;
            ausentes_t: number | null;
            observaciones: string;
            is_submitted: boolean;
            submitted_by: string | null;
            submitted_at: string | null;
          }>;
          totals: {
            total_inscriptos_v: number;
            total_inscriptos_m: number;
            total_inscriptos_t: number;
            total_presentes_v: number;
            total_presentes_m: number;
            total_presentes_t: number;
            total_ausentes_v: number;
            total_ausentes_m: number;
            total_ausentes_t: number;
            total_courses_count: number;
            submitted_courses_count: number;
          };
          staff_absences: Array<{
            id: string;
            staff_name: string;
            role_type: string;
            subject_or_area: string | null;
            reason: string | null;
            observations: string | null;
          }>;
        };
      };
      fn_get_attendance_trends: {
        Args: {
          p_start_date: string;
          p_end_date: string;
          p_shift_id?: string;
          p_course_id?: string;
        };
        Returns: Array<{
          record_date: string;
          total_inscriptos: number;
          total_presentes: number;
          total_ausentes: number;
          attendance_rate: number;
        }>;
      };
      bootstrap_admin_user: {
        Args: { p_email: string };
        Returns: void;
      };
    };

    Enums: {
      app_role: AppRole;
      cycle_type: CycleType;
      orientation_type: OrientationType;
      submission_status: SubmissionStatus;
    };
  };
}

// ----------------------------------------------------------------------------
// Domain Convenience Types
// ----------------------------------------------------------------------------
export type ShiftRow = Database['public']['Tables']['shifts']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type CourseRow = Database['public']['Tables']['courses']['Row'];
export type CourseAssignmentRow = Database['public']['Tables']['course_assignments']['Row'];
export type AttendanceRecordRow = Database['public']['Tables']['attendance_records']['Row'];
export type StaffAbsenceRow = Database['public']['Tables']['staff_absences']['Row'];
export type AttendanceAuditLogRow = Database['public']['Tables']['attendance_audit_logs']['Row'];
export type ParteGeneralSheetRow = Database['public']['Views']['vw_parte_general_sheet']['Row'];
```

---

## 7. Environment Configuration Template (`.env.example`)

```env
# =============================================================================
# E.E.S.T. N° 3 "Ntra. Sra. de la Merced" - Attendance Management System
# Supabase & Application Environment Configuration
# =============================================================================

# Supabase Project URL (e.g. https://xyzcompany.supabase.co)
VITE_SUPABASE_URL=https://your-supabase-project-ref.supabase.co

# Supabase Anonymous Public API Key
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# School Application Metadata (Optional)
VITE_APP_TITLE="E.E.S.T. N° 3 - Parte General Digital"
VITE_APP_ENV=development
```

---

## 8. Summary of Findings & Next Steps

1. **Seed Data Integrity**: The SQL seed statements rigorously model all 10 courses of Turno Vespertino directly from `PARTE GENERALES TV.xlsx - T.V.csv`, guaranteeing 100% mathematical fidelity ($119 + 53 = 172$).
2. **Complete Catalog**: Turno Mañana and Turno Tarde are provisioned with all standard Ciclo Básico (1°1ª to 3°4ª/5ª) and Ciclo Superior (4°1ª to 7°3ª TECQU, TECMM, TECET) divisions.
3. **Seamless Auth Bootstrap**: Five deterministic test users with pre-hashed bcrypt credentials and distinct role permissions (`administrador`, `preceptor`, `profesor`) enable immediate, end-to-end authentication and UI testing.
4. **Strict TypeScript Bindings**: `src/types/database.ts` and `src/lib/supabase.ts` provide full end-to-end type safety, runtime environment validation, and precise interfaces for frontend development and testing.
