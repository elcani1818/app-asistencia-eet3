# Handoff Report: Seed Data Engine & Supabase Client Configuration
**Agent**: Explorer 3 (`m1_explorer_3`)  
**Milestone**: M1 (Database & Auth Engine)  
**Date**: 2026-08-20  
**Handoff Type**: Hard (Task Complete)  

---

## 1. Observation

1. **Source CSV Parsing (`PARTE GENERALES TV.xlsx - T.V.csv`)**:
   - Lines 11-20 contain the active evening courses:
     - `5º4º` (`TECET`): Varones 8, Mujeres 0, Total 8.
     - `6º1º` (`TECQU`): Varones 11, Mujeres 4, Total 15.
     - `6º2º` (`TECMM`): Varones 9, Mujeres 14, Total 23.
     - `6º3º` (`TECET`): Varones 23, Mujeres 2, Total 25.
     - `6º4º` (`TECET`): Varones 6, Mujeres 0, Total 6.
     - `7º1º` (`TECQU`): Varones 5, Mujeres 8, Total 13.
     - `7º2º` (`TECMM`): Varones 9, Mujeres 9, Total 18.
     - `7º3º` (`TECET`): Varones 20, Mujeres 9, Total 29.
     - `7º4º` (`TECET`): Varones 8, Mujeres 0, Total 8.
     - `1° 1°` (`C.TEC.MMO`): Varones 20, Mujeres 7, Total 27.
   - Line 23 verifies totals: Varones 119, Mujeres 53, Total 172 ($119 + 53 = 172$).

2. **Institutional Structure (`ORIGINAL_REQUEST.md` & `PROJECT.md`)**:
   - Three distinct shifts: Mañana (`11111111-1111-1111-1111-111111111111`), Tarde (`22222222-2222-2222-2222-222222222222`), Vespertino (`33333333-3333-3333-3333-333333333333`).
   - Ciclo Básico: 1° (1ª-5ª), 2° (1ª-5ª), 3° (1ª-4ª).
   - Ciclo Superior: 4°-7° divisions 1ª (`TECQU`), 2ª (`TECMM`), 3ª (`TECET`).

3. **Authentication & Authorization Architecture**:
   - PostgreSQL `auth.users` synchronized with `public.profiles` via trigger and explicit seed insertion.
   - 3 core test roles: `administrador` (`admin@colegio.edu.ar`), `preceptor` (`preceptor.vespertino@colegio.edu.ar`), `profesor` (`profesor.mecanica@colegio.edu.ar`).

---

## 2. Logic Chain

1. **Deterministic UUID Strategy**: By assigning predictable, deterministic UUIDs for shifts, courses, and users (e.g. `11111111-0000-0000-0000-00000000YYDD` for Mañana courses, `33333333-0000-0000-0000-00000000YYDD` for Vespertino), subsequent seed records (course assignments, attendance demo entries, staff absences) reference foreign keys without fragile nested subqueries.
2. **Dual-Layer User Seeding**: Inserting into `auth.users` using `crypt('Password123!', gen_salt('bf'))` satisfies Supabase GoTrue authentication requirements, while inserting into `public.profiles` with `ON CONFLICT (id) DO UPDATE` ensures instant role assignment without waiting for async webhook execution.
3. **Idempotency via `ON CONFLICT`**: All seed `INSERT` statements are guarded by `ON CONFLICT (id)` or `ON CONFLICT (shift_id, name)` / `ON CONFLICT (code)`, making `supabase/seed.sql` re-runnable across test fixtures, resets, and CI environments without throwing duplicate key errors.
4. **End-to-End Type Safety**: `src/types/database.ts` maps exact database enums, columns, nullability, relationships, views, and RPC signatures. `src/lib/supabase.ts` uses `createClient<Database>` and validates environment variables at startup, preventing runtime undefined errors in the UI.

---

## 3. Caveats

1. **Local vs Cloud Supabase Auth**: The SQL insertion into `auth.users` works directly on local Supabase PostgreSQL (`supabase start` / `supabase db reset`) and self-hosted instances. For Supabase Cloud environments where direct SQL writes to `auth.users` might be restricted on certain plans, the `bootstrap_admin_user(email)` RPC function provides a safe alternative for promoting users after registration.
2. **Mañana & Tarde Initial Matricula**: Unlike Turno Vespertino which has explicit historical CSV data, Turno Mañana and Tarde enrollments are initialized with realistic benchmark counts (14–22 students per division) and remain fully editable via the Admin Course Management UI.

---

## 4. Conclusion

The seed dataset and TypeScript client configuration are fully designed and documented in `analysis.md`:
- `supabase/seed.sql` provides shifts, exact 10 Vespertino courses (172 students), full Mañana & Tarde catalogs (26 courses each), 5 demo accounts across all 3 roles, course assignments, and sample attendance/absence records.
- `src/lib/supabase.ts` initializes a typed Supabase client with runtime assertion of `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- `src/types/database.ts` exposes complete TypeScript interfaces for all tables, views, and RPCs.
- `.env.example` provides the template for frontend setup.

---

## 5. Verification Method

To verify these artifacts independently:

1. **SQL Seed Validation**:
   - Inspect `d:\CanY\PROYECTOS CANY\App colegio\.agents\m1_explorer_3\analysis.md` Section 4.
   - Verify that running the seed SQL inserts 3 shifts, 10 Vespertino courses, 26 Mañana courses, 26 Tarde courses, 5 users, and demo attendance without errors.
   - Run verification query:
     ```sql
     SELECT s.name, COUNT(c.id) AS course_count, SUM(c.inscriptos_total) AS total_enrolled
     FROM public.courses c
     JOIN public.shifts s ON c.shift_id = s.id
     GROUP BY s.name;
     ```
     Expected result for Turno Vespertino: `course_count = 10`, `total_enrolled = 172`.

2. **TypeScript Compilation & Client Validation**:
   - Confirm that `src/types/database.ts` contains `Database`, `AppRole`, `ShiftCode`, `CourseRow`, `AttendanceRecordRow`.
   - Confirm that `src/lib/supabase.ts` passes `tsc --noEmit` once Vite dependencies are installed in M2.
