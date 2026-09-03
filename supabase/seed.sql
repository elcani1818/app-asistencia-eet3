-- ============================================================================
-- SEED DATA: supabase/seed.sql
-- Project: Escuela de Educación Secundaria Técnica N° 3 "Ntra. Sra. de la Merced"
-- System: Digital Attendance & Daily General Report ("Parte General de Alumnos")
-- Milestone: M1 (Database & Auth Engine)
-- ============================================================================

-- Ensure pgcrypto extension is active for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. SHIFTS (TURNOS ESCOLARES)
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

-- 2.1 Accounts in auth.users
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
    -- 1. Administrador (Director / Equipo Directivo)
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'admin@colegio.edu.ar',
        crypt('Admin2026!', gen_salt('bf')),
        now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        '{"full_name": "Prof. Roberto Martínez (Director)", "role": "administrador"}'::jsonb,
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
        '{"full_name": "Carlos Gómez (Preceptor TV)", "role": "preceptor"}'::jsonb,
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
        '{"full_name": "Ing. Alejandro Rossi (Electromecánica)", "role": "profesor"}'::jsonb,
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
        '{"full_name": "Lic. Mariana Benítez (Química)", "role": "profesor"}'::jsonb,
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
        '{"full_name": "Laura Fernández (Preceptora TM)", "role": "preceptor"}'::jsonb,
        now(),
        now()
    )
ON CONFLICT (id) DO UPDATE SET
    encrypted_password = EXCLUDED.encrypted_password,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = now();

-- 2.2 Institutional Profiles in public.profiles
INSERT INTO public.profiles (id, role, full_name, email, shift_id, dni, phone, is_active)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'administrador', 'Prof. Roberto Martínez (Director)', 'admin@colegio.edu.ar', NULL, '18.234.567', '+54 11 4750-1234', true),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'preceptor', 'Carlos Gómez (Preceptor TV)', 'preceptor.vespertino@colegio.edu.ar', '33333333-3333-3333-3333-333333333333', '24.567.890', '+54 11 4750-5678', true),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'profesor', 'Ing. Alejandro Rossi (Electromecánica)', 'profesor.mecanica@colegio.edu.ar', '33333333-3333-3333-3333-333333333333', '28.901.234', '+54 11 4750-9012', true),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'profesor', 'Lic. Mariana Benítez (Química)', 'profesora.quimica@colegio.edu.ar', '33333333-3333-3333-3333-333333333333', '30.123.456', '+54 11 4750-3456', true),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'preceptor', 'Laura Fernández (Preceptora TM)', 'preceptor.manana@colegio.edu.ar', '11111111-1111-1111-1111-111111111111', '26.789.012', '+54 11 4750-7890', true)
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    shift_id = EXCLUDED.shift_id,
    dni = EXCLUDED.dni,
    phone = EXCLUDED.phone,
    is_active = EXCLUDED.is_active;


-- ----------------------------------------------------------------------------
-- 3. COURSES: TURNO VESPERTINO (EXACT CSV DATASET - 10 CURSOS, 172 INSCRIPTOS)
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
-- 4. COURSES: TURNO MAÑANA CATALOG (26 CURSOS)
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
    -- Ciclo Básico Turno Mañana (Oficial según Parte General)
    ('11111111-0000-0000-0000-000000000101', '11111111-1111-1111-1111-111111111111', 1, 1, '1° 1°', 'basico', NULL, 19, 6, 1, true),
    ('11111111-0000-0000-0000-000000000102', '11111111-1111-1111-1111-111111111111', 1, 2, '1° 2°', 'basico', NULL, 14, 13, 2, true),
    ('11111111-0000-0000-0000-000000000105', '11111111-1111-1111-1111-111111111111', 1, 5, '1° 5°', 'basico', NULL, 13, 11, 3, true),
    ('11111111-0000-0000-0000-000000000201', '11111111-1111-1111-1111-111111111111', 2, 1, '2° 1°', 'basico', NULL, 17, 8, 4, true),
    ('11111111-0000-0000-0000-000000000202', '11111111-1111-1111-1111-111111111111', 2, 2, '2° 2°', 'basico', NULL, 12, 13, 5, true),
    ('11111111-0000-0000-0000-000000000203', '11111111-1111-1111-1111-111111111111', 2, 3, '2° 3°', 'basico', NULL, 17, 8, 6, true),
    ('11111111-0000-0000-0000-000000000205', '11111111-1111-1111-1111-111111111111', 2, 5, '2° 5°', 'basico', NULL, 16, 6, 7, true),
    ('11111111-0000-0000-0000-000000000302', '11111111-1111-1111-1111-111111111111', 3, 2, '3° 2°', 'basico', NULL, 10, 15, 8, true),
    ('11111111-0000-0000-0000-000000000303', '11111111-1111-1111-1111-111111111111', 3, 3, '3° 3°', 'basico', NULL, 18, 6, 9, true),
    ('11111111-0000-0000-0000-000000000304', '11111111-1111-1111-1111-111111111111', 3, 4, '3° 4°', 'basico', NULL, 12, 15, 10, true),
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
-- 5. COURSES: TURNO TARDE CATALOG (26 CURSOS)
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
-- 6. TEACHER COURSE ASSIGNMENTS
-- ----------------------------------------------------------------------------
INSERT INTO public.course_assignments (user_id, course_id, role_in_course, assigned_by)
VALUES
    -- Ing. Alejandro Rossi assigned to Vespertino Electromecánica courses
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-0000-0000-0000-000000000603', 'titular', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-0000-0000-0000-000000000703', 'titular', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-0000-0000-0000-000000000504', 'titular', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    -- Lic. Mariana Benítez assigned to Vespertino Química courses
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-0000-0000-0000-000000000601', 'titular', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-0000-0000-0000-000000000701', 'titular', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
ON CONFLICT (user_id, course_id) DO NOTHING;


-- ----------------------------------------------------------------------------
-- 7. DEMO ATTENDANCE ENTRIES (TODAY) FOR IMMEDIATE DASHBOARD VERIFICATION
-- ----------------------------------------------------------------------------
INSERT INTO public.attendance_records (
    date,
    course_id,
    shift_id,
    submitted_by,
    created_by,
    snapshot_inscriptos_v,
    snapshot_inscriptos_m,
    presentes_varones,
    presentes_mujeres,
    ausentes_varones,
    ausentes_mujeres,
    observations,
    status,
    is_locked
) VALUES
    -- 6° 3ª (Inscriptos: 23 V, 2 M) -> Presentes: 21 V, 2 M; Ausentes: 2 V, 0 M
    (
        CURRENT_DATE,
        '33333333-0000-0000-0000-000000000603',
        '33333333-3333-3333-3333-333333333333',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        23, 2,
        21, 2,
        2, 0,
        'Práctica de laboratorio de máquinas eléctricas completada sin novedades.',
        'submitted',
        false
    ),
    -- 6° 1ª (Inscriptos: 11 V, 4 M) -> Presentes: 10 V, 3 M; Ausentes: 1 V, 1 M
    (
        CURRENT_DATE,
        '33333333-0000-0000-0000-000000000601',
        '33333333-3333-3333-3333-333333333333',
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        11, 4,
        10, 3,
        1, 1,
        'Alumnos ausentes con aviso de examen de ingreso.',
        'submitted',
        false
    ),
    -- 1° 1ª C.TEC.MMO (Inscriptos: 20 V, 7 M) -> Presentes: 18 V, 6 M; Ausentes: 2 V, 1 M
    (
        CURRENT_DATE,
        '33333333-0000-0000-0000-000000000101',
        '33333333-3333-3333-3333-333333333333',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        20, 7,
        18, 6,
        2, 1,
        'Taller de dibujo técnico nocturno.',
        'submitted',
        false
    )
ON CONFLICT (course_id, date) DO UPDATE SET
    presentes_varones = EXCLUDED.presentes_varones,
    presentes_mujeres = EXCLUDED.presentes_mujeres,
    ausentes_varones = EXCLUDED.ausentes_varones,
    ausentes_mujeres = EXCLUDED.ausentes_mujeres,
    observations = EXCLUDED.observations,
    updated_at = timezone('utc'::text, now());


-- ----------------------------------------------------------------------------
-- 8. DEMO STAFF ABSENCES
-- ----------------------------------------------------------------------------
INSERT INTO public.staff_absences (
    date,
    shift_id,
    staff_name,
    role,
    subject_or_area,
    course_id,
    reason,
    is_justified,
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
        'Licencia Médica (Art. 114 a-1)',
        true,
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
        false,
        'Cubre auxiliar de guardia.',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    );
