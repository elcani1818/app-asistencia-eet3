-- ============================================================================
-- SCRIPT: supabase/seed_turno_manana.sql
-- Cursos oficiales del Turno Mañana - Ciclo Básico
-- Escuela de Educación Secundaria Técnica N° 3 "Ntra. Sra. de la Merced"
-- Ejecutar en Supabase SQL Editor si deseas cargarlos directamente en la base de datos
-- ============================================================================

DO $$
DECLARE
    v_shift_id UUID;
    v_cb_orientation_id UUID;
BEGIN
    -- 1. Buscar o crear Turno Mañana
    SELECT id INTO v_shift_id FROM public.shifts WHERE name ILIKE '%Mañana%' OR code = 'manana' LIMIT 1;
    IF v_shift_id IS NULL THEN
        INSERT INTO public.shifts (name, display_order)
        VALUES ('Mañana', 1)
        RETURNING id INTO v_shift_id;
    END IF;

    -- 2. Buscar o crear Orientación Ciclo Básico
    SELECT id INTO v_cb_orientation_id FROM public.orientations WHERE code = 'CB' LIMIT 1;
    IF v_cb_orientation_id IS NULL THEN
        INSERT INTO public.orientations (code, full_name)
        VALUES ('CB', 'Ciclo Básico')
        RETURNING id INTO v_cb_orientation_id;
    END IF;

    -- 3. Cargar los 10 Cursos Oficiales según el Parte General:
    -- 1° 1° (19 V + 6 M = 25 T)
    INSERT INTO public.courses (year, division, display_name, shift_id, orientation_id, inscriptos_v, inscriptos_m, inscriptos_t, cycle, is_active)
    VALUES (1, 1, '1° 1°', v_shift_id, v_cb_orientation_id, 19, 6, 25, 'basico', true)
    ON CONFLICT (shift_id, display_name) DO UPDATE SET
        year = EXCLUDED.year,
        division = EXCLUDED.division,
        orientation_id = EXCLUDED.orientation_id,
        inscriptos_v = EXCLUDED.inscriptos_v,
        inscriptos_m = EXCLUDED.inscriptos_m,
        inscriptos_t = EXCLUDED.inscriptos_t,
        cycle = EXCLUDED.cycle,
        is_active = true;

    -- 1° 2° (14 V + 13 M = 27 T)
    INSERT INTO public.courses (year, division, display_name, shift_id, orientation_id, inscriptos_v, inscriptos_m, inscriptos_t, cycle, is_active)
    VALUES (1, 2, '1° 2°', v_shift_id, v_cb_orientation_id, 14, 13, 27, 'basico', true)
    ON CONFLICT (shift_id, display_name) DO UPDATE SET
        year = EXCLUDED.year,
        division = EXCLUDED.division,
        orientation_id = EXCLUDED.orientation_id,
        inscriptos_v = EXCLUDED.inscriptos_v,
        inscriptos_m = EXCLUDED.inscriptos_m,
        inscriptos_t = EXCLUDED.inscriptos_t,
        cycle = EXCLUDED.cycle,
        is_active = true;

    -- 1° 5° (13 V + 11 M = 24 T)
    INSERT INTO public.courses (year, division, display_name, shift_id, orientation_id, inscriptos_v, inscriptos_m, inscriptos_t, cycle, is_active)
    VALUES (1, 5, '1° 5°', v_shift_id, v_cb_orientation_id, 13, 11, 24, 'basico', true)
    ON CONFLICT (shift_id, display_name) DO UPDATE SET
        year = EXCLUDED.year,
        division = EXCLUDED.division,
        orientation_id = EXCLUDED.orientation_id,
        inscriptos_v = EXCLUDED.inscriptos_v,
        inscriptos_m = EXCLUDED.inscriptos_m,
        inscriptos_t = EXCLUDED.inscriptos_t,
        cycle = EXCLUDED.cycle,
        is_active = true;

    -- 2° 1° (17 V + 8 M = 25 T)
    INSERT INTO public.courses (year, division, display_name, shift_id, orientation_id, inscriptos_v, inscriptos_m, inscriptos_t, cycle, is_active)
    VALUES (2, 1, '2° 1°', v_shift_id, v_cb_orientation_id, 17, 8, 25, 'basico', true)
    ON CONFLICT (shift_id, display_name) DO UPDATE SET
        year = EXCLUDED.year,
        division = EXCLUDED.division,
        orientation_id = EXCLUDED.orientation_id,
        inscriptos_v = EXCLUDED.inscriptos_v,
        inscriptos_m = EXCLUDED.inscriptos_m,
        inscriptos_t = EXCLUDED.inscriptos_t,
        cycle = EXCLUDED.cycle,
        is_active = true;

    -- 2° 2° (12 V + 13 M = 25 T)
    INSERT INTO public.courses (year, division, display_name, shift_id, orientation_id, inscriptos_v, inscriptos_m, inscriptos_t, cycle, is_active)
    VALUES (2, 2, '2° 2°', v_shift_id, v_cb_orientation_id, 12, 13, 25, 'basico', true)
    ON CONFLICT (shift_id, display_name) DO UPDATE SET
        year = EXCLUDED.year,
        division = EXCLUDED.division,
        orientation_id = EXCLUDED.orientation_id,
        inscriptos_v = EXCLUDED.inscriptos_v,
        inscriptos_m = EXCLUDED.inscriptos_m,
        inscriptos_t = EXCLUDED.inscriptos_t,
        cycle = EXCLUDED.cycle,
        is_active = true;

    -- 2° 3° (17 V + 8 M = 25 T)
    INSERT INTO public.courses (year, division, display_name, shift_id, orientation_id, inscriptos_v, inscriptos_m, inscriptos_t, cycle, is_active)
    VALUES (2, 3, '2° 3°', v_shift_id, v_cb_orientation_id, 17, 8, 25, 'basico', true)
    ON CONFLICT (shift_id, display_name) DO UPDATE SET
        year = EXCLUDED.year,
        division = EXCLUDED.division,
        orientation_id = EXCLUDED.orientation_id,
        inscriptos_v = EXCLUDED.inscriptos_v,
        inscriptos_m = EXCLUDED.inscriptos_m,
        inscriptos_t = EXCLUDED.inscriptos_t,
        cycle = EXCLUDED.cycle,
        is_active = true;

    -- 2° 5° (16 V + 6 M = 22 T)
    INSERT INTO public.courses (year, division, display_name, shift_id, orientation_id, inscriptos_v, inscriptos_m, inscriptos_t, cycle, is_active)
    VALUES (2, 5, '2° 5°', v_shift_id, v_cb_orientation_id, 16, 6, 22, 'basico', true)
    ON CONFLICT (shift_id, display_name) DO UPDATE SET
        year = EXCLUDED.year,
        division = EXCLUDED.division,
        orientation_id = EXCLUDED.orientation_id,
        inscriptos_v = EXCLUDED.inscriptos_v,
        inscriptos_m = EXCLUDED.inscriptos_m,
        inscriptos_t = EXCLUDED.inscriptos_t,
        cycle = EXCLUDED.cycle,
        is_active = true;

    -- 3° 2° (10 V + 15 M = 25 T)
    INSERT INTO public.courses (year, division, display_name, shift_id, orientation_id, inscriptos_v, inscriptos_m, inscriptos_t, cycle, is_active)
    VALUES (3, 2, '3° 2°', v_shift_id, v_cb_orientation_id, 10, 15, 25, 'basico', true)
    ON CONFLICT (shift_id, display_name) DO UPDATE SET
        year = EXCLUDED.year,
        division = EXCLUDED.division,
        orientation_id = EXCLUDED.orientation_id,
        inscriptos_v = EXCLUDED.inscriptos_v,
        inscriptos_m = EXCLUDED.inscriptos_m,
        inscriptos_t = EXCLUDED.inscriptos_t,
        cycle = EXCLUDED.cycle,
        is_active = true;

    -- 3° 3° (18 V + 6 M = 24 T)
    INSERT INTO public.courses (year, division, display_name, shift_id, orientation_id, inscriptos_v, inscriptos_m, inscriptos_t, cycle, is_active)
    VALUES (3, 3, '3° 3°', v_shift_id, v_cb_orientation_id, 18, 6, 24, 'basico', true)
    ON CONFLICT (shift_id, display_name) DO UPDATE SET
        year = EXCLUDED.year,
        division = EXCLUDED.division,
        orientation_id = EXCLUDED.orientation_id,
        inscriptos_v = EXCLUDED.inscriptos_v,
        inscriptos_m = EXCLUDED.inscriptos_m,
        inscriptos_t = EXCLUDED.inscriptos_t,
        cycle = EXCLUDED.cycle,
        is_active = true;

    -- 3° 4° (12 V + 15 M = 27 T)
    INSERT INTO public.courses (year, division, display_name, shift_id, orientation_id, inscriptos_v, inscriptos_m, inscriptos_t, cycle, is_active)
    VALUES (3, 4, '3° 4°', v_shift_id, v_cb_orientation_id, 12, 15, 27, 'basico', true)
    ON CONFLICT (shift_id, display_name) DO UPDATE SET
        year = EXCLUDED.year,
        division = EXCLUDED.division,
        orientation_id = EXCLUDED.orientation_id,
        inscriptos_v = EXCLUDED.inscriptos_v,
        inscriptos_m = EXCLUDED.inscriptos_m,
        inscriptos_t = EXCLUDED.inscriptos_t,
        cycle = EXCLUDED.cycle,
        is_active = true;

    RAISE NOTICE 'Cursos de Turno Mañana cargados exitosamente.';
END $$;
