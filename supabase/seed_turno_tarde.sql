-- ============================================================================
-- SCRIPT: supabase/seed_turno_tarde.sql
-- Cursos oficiales del Turno Tarde
-- Escuela de Educación Secundaria Técnica N° 3 "Ntra. Sra. de la Merced"
-- Ejecutar en Supabase SQL Editor si deseas cargarlos directamente en la base de datos
-- ============================================================================

DO $$
DECLARE
    v_shift_id UUID;
    v_cb_id UUID;
    v_tecqu_id UUID;
    v_tecmm_id UUID;
    v_tecet_id UUID;
BEGIN
    -- 1. Obtener o crear Turno Tarde
    SELECT id INTO v_shift_id FROM public.shifts WHERE name ILIKE '%Tarde%' OR code = 'tarde' LIMIT 1;
    IF v_shift_id IS NULL THEN
        INSERT INTO public.shifts (name, display_order)
        VALUES ('Tarde', 2)
        RETURNING id INTO v_shift_id;
    END IF;

    -- 2. Asegurar orientaciones
    SELECT id INTO v_cb_id FROM public.orientations WHERE code = 'CB' LIMIT 1;
    IF v_cb_id IS NULL THEN
        INSERT INTO public.orientations (code, full_name)
        VALUES ('CB', 'Ciclo Básico')
        RETURNING id INTO v_cb_id;
    END IF;

    SELECT id INTO v_tecqu_id FROM public.orientations WHERE code = 'TECQU' LIMIT 1;
    IF v_tecqu_id IS NULL THEN
        INSERT INTO public.orientations (code, full_name)
        VALUES ('TECQU', 'Técnico en Química')
        RETURNING id INTO v_tecqu_id;
    END IF;

    SELECT id INTO v_tecmm_id FROM public.orientations WHERE code = 'TECMM' LIMIT 1;
    IF v_tecmm_id IS NULL THEN
        INSERT INTO public.orientations (code, full_name)
        VALUES ('TECMM', 'Técnico en Electromecánica')
        RETURNING id INTO v_tecmm_id;
    END IF;

    SELECT id INTO v_tecet_id FROM public.orientations WHERE code = 'TECET' LIMIT 1;
    IF v_tecet_id IS NULL THEN
        INSERT INTO public.orientations (code, full_name)
        VALUES ('TECET', 'Técnico en Electrónica')
        RETURNING id INTO v_tecet_id;
    END IF;

    -- 3. Cursos oficiales del Turno Tarde según Parte General:
    -- 1° 3°: CICLO BÁSICO (16 V + 11 M = 27 T)
    INSERT INTO public.courses (year, division, display_name, shift_id, orientation_id, inscriptos_v, inscriptos_m, inscriptos_t, cycle, is_active)
    VALUES (1, 3, '1° 3°', v_shift_id, v_cb_id, 16, 11, 27, 'basico', true)
    ON CONFLICT (shift_id, display_name) DO UPDATE SET
        year = EXCLUDED.year,
        division = EXCLUDED.division,
        orientation_id = EXCLUDED.orientation_id,
        inscriptos_v = EXCLUDED.inscriptos_v,
        inscriptos_m = EXCLUDED.inscriptos_m,
        inscriptos_t = EXCLUDED.inscriptos_t,
        cycle = EXCLUDED.cycle,
        is_active = true;

    -- 1° 4°: CICLO BÁSICO (18 V + 8 M = 26 T)
    INSERT INTO public.courses (year, division, display_name, shift_id, orientation_id, inscriptos_v, inscriptos_m, inscriptos_t, cycle, is_active)
    VALUES (1, 4, '1° 4°', v_shift_id, v_cb_id, 18, 8, 26, 'basico', true)
    ON CONFLICT (shift_id, display_name) DO UPDATE SET
        year = EXCLUDED.year,
        division = EXCLUDED.division,
        orientation_id = EXCLUDED.orientation_id,
        inscriptos_v = EXCLUDED.inscriptos_v,
        inscriptos_m = EXCLUDED.inscriptos_m,
        inscriptos_t = EXCLUDED.inscriptos_t,
        cycle = EXCLUDED.cycle,
        is_active = true;

    -- 2° 4°: CICLO BÁSICO (18 V + 11 M = 29 T)
    INSERT INTO public.courses (year, division, display_name, shift_id, orientation_id, inscriptos_v, inscriptos_m, inscriptos_t, cycle, is_active)
    VALUES (2, 4, '2° 4°', v_shift_id, v_cb_id, 18, 11, 29, 'basico', true)
    ON CONFLICT (shift_id, display_name) DO UPDATE SET
        year = EXCLUDED.year,
        division = EXCLUDED.division,
        orientation_id = EXCLUDED.orientation_id,
        inscriptos_v = EXCLUDED.inscriptos_v,
        inscriptos_m = EXCLUDED.inscriptos_m,
        inscriptos_t = EXCLUDED.inscriptos_t,
        cycle = EXCLUDED.cycle,
        is_active = true;

    -- 3° 1°: CICLO BÁSICO (17 V + 11 M = 28 T)
    INSERT INTO public.courses (year, division, display_name, shift_id, orientation_id, inscriptos_v, inscriptos_m, inscriptos_t, cycle, is_active)
    VALUES (3, 1, '3° 1°', v_shift_id, v_cb_id, 17, 11, 28, 'basico', true)
    ON CONFLICT (shift_id, display_name) DO UPDATE SET
        year = EXCLUDED.year,
        division = EXCLUDED.division,
        orientation_id = EXCLUDED.orientation_id,
        inscriptos_v = EXCLUDED.inscriptos_v,
        inscriptos_m = EXCLUDED.inscriptos_m,
        inscriptos_t = EXCLUDED.inscriptos_t,
        cycle = EXCLUDED.cycle,
        is_active = true;

    -- 4° 1°: TECQU (9 V + 20 M = 29 T)
    INSERT INTO public.courses (year, division, display_name, shift_id, orientation_id, inscriptos_v, inscriptos_m, inscriptos_t, cycle, is_active)
    VALUES (4, 1, '4° 1°', v_shift_id, v_tecqu_id, 9, 20, 29, 'superior', true)
    ON CONFLICT (shift_id, display_name) DO UPDATE SET
        year = EXCLUDED.year,
        division = EXCLUDED.division,
        orientation_id = EXCLUDED.orientation_id,
        inscriptos_v = EXCLUDED.inscriptos_v,
        inscriptos_m = EXCLUDED.inscriptos_m,
        inscriptos_t = EXCLUDED.inscriptos_t,
        cycle = EXCLUDED.cycle,
        is_active = true;

    -- 4° 2°: TECMM (17 V + 14 M = 31 T)
    INSERT INTO public.courses (year, division, display_name, shift_id, orientation_id, inscriptos_v, inscriptos_m, inscriptos_t, cycle, is_active)
    VALUES (4, 2, '4° 2°', v_shift_id, v_tecmm_id, 17, 14, 31, 'superior', true)
    ON CONFLICT (shift_id, display_name) DO UPDATE SET
        year = EXCLUDED.year,
        division = EXCLUDED.division,
        orientation_id = EXCLUDED.orientation_id,
        inscriptos_v = EXCLUDED.inscriptos_v,
        inscriptos_m = EXCLUDED.inscriptos_m,
        inscriptos_t = EXCLUDED.inscriptos_t,
        cycle = EXCLUDED.cycle,
        is_active = true;

    -- 4° 3°: TECET (28 V + 7 M = 35 T)
    INSERT INTO public.courses (year, division, display_name, shift_id, orientation_id, inscriptos_v, inscriptos_m, inscriptos_t, cycle, is_active)
    VALUES (4, 3, '4° 3°', v_shift_id, v_tecet_id, 28, 7, 35, 'superior', true)
    ON CONFLICT (shift_id, display_name) DO UPDATE SET
        year = EXCLUDED.year,
        division = EXCLUDED.division,
        orientation_id = EXCLUDED.orientation_id,
        inscriptos_v = EXCLUDED.inscriptos_v,
        inscriptos_m = EXCLUDED.inscriptos_m,
        inscriptos_t = EXCLUDED.inscriptos_t,
        cycle = EXCLUDED.cycle,
        is_active = true;

    -- 5° 1°: TECQU (7 V + 18 M = 25 T)
    INSERT INTO public.courses (year, division, display_name, shift_id, orientation_id, inscriptos_v, inscriptos_m, inscriptos_t, cycle, is_active)
    VALUES (5, 1, '5° 1°', v_shift_id, v_tecqu_id, 7, 18, 25, 'superior', true)
    ON CONFLICT (shift_id, display_name) DO UPDATE SET
        year = EXCLUDED.year,
        division = EXCLUDED.division,
        orientation_id = EXCLUDED.orientation_id,
        inscriptos_v = EXCLUDED.inscriptos_v,
        inscriptos_m = EXCLUDED.inscriptos_m,
        inscriptos_t = EXCLUDED.inscriptos_t,
        cycle = EXCLUDED.cycle,
        is_active = true;

    -- 5° 2°: TECMM (10 V + 11 M = 21 T)
    INSERT INTO public.courses (year, division, display_name, shift_id, orientation_id, inscriptos_v, inscriptos_m, inscriptos_t, cycle, is_active)
    VALUES (5, 2, '5° 2°', v_shift_id, v_tecmm_id, 10, 11, 21, 'superior', true)
    ON CONFLICT (shift_id, display_name) DO UPDATE SET
        year = EXCLUDED.year,
        division = EXCLUDED.division,
        orientation_id = EXCLUDED.orientation_id,
        inscriptos_v = EXCLUDED.inscriptos_v,
        inscriptos_m = EXCLUDED.inscriptos_m,
        inscriptos_t = EXCLUDED.inscriptos_t,
        cycle = EXCLUDED.cycle,
        is_active = true;

    -- 5° 3°: TECET (22 V + 10 M = 32 T)
    INSERT INTO public.courses (year, division, display_name, shift_id, orientation_id, inscriptos_v, inscriptos_m, inscriptos_t, cycle, is_active)
    VALUES (5, 3, '5° 3°', v_shift_id, v_tecet_id, 22, 10, 32, 'superior', true)
    ON CONFLICT (shift_id, display_name) DO UPDATE SET
        year = EXCLUDED.year,
        division = EXCLUDED.division,
        orientation_id = EXCLUDED.orientation_id,
        inscriptos_v = EXCLUDED.inscriptos_v,
        inscriptos_m = EXCLUDED.inscriptos_m,
        inscriptos_t = EXCLUDED.inscriptos_t,
        cycle = EXCLUDED.cycle,
        is_active = true;

    RAISE NOTICE 'Cursos oficiales de Turno Tarde cargados exitosamente.';
END $$;
