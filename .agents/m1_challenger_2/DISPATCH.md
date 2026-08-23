## 2026-08-20T14:23:30Z
You are Challenger 2 for Milestone 1 (M1: Database & Auth Engine).
Your working directory is: d:\CanY\PROYECTOS CANY\App colegio\.agents\m1_challenger_2
Master blueprint: d:\CanY\PROYECTOS CANY\App colegio\PROJECT.md
Original request: d:\CanY\PROYECTOS CANY\App colegio\ORIGINAL_REQUEST.md
Reference CSV: d:\CanY\PROYECTOS CANY\App colegio\PARTE GENERALES TV.xlsx - T.V.csv
Seed File: supabase/seed.sql
Migration File: supabase/migrations/20260820000000_m1_database_and_auth.sql

Your Task:
Adversarially challenge and verify the Seed Dataset mathematics and the Stored Procedure `fn_get_shift_parte_general`:
1. Verify exact numbers for Turno Vespertino in `supabase/seed.sql`:
   - Compare every single course in `supabase/seed.sql` against `PARTE GENERALES TV.xlsx - T.V.csv`:
     5°4ª (8 V, 0 M = 8), 6°1ª (11 V, 4 M = 15), 6°2ª (9 V, 14 M = 23), 6°3ª (23 V, 2 M = 25), 6°4ª (6 V, 0 M = 6), 7°1ª (5 V, 8 M = 13), 7°2ª (9 V, 9 M = 18), 7°3ª (20 V, 9 M = 29), 7°4ª (8 V, 0 M = 8), 1°1ª C.TEC.MMO (20 V, 7 M = 27).
   - Verify sum of Varones = 119.
   - Verify sum of Mujeres = 53.
   - Verify sum Total = 172.
2. Verify Turno Mañana and Tarde catalogs:
   - Check course count and cycle assignments (Ciclo Básico 1°-3°, Ciclo Superior 4°-7°).
3. Verify Stored Procedure `fn_get_shift_parte_general`:
   - Trace the JSON output structure: does it include `courses`, `cycle_subtotals`, `totals`, and `staff_absences`?
   - Trace the percentage formula: does it prevent division by zero (`NULLIF`)? Is it `ROUND((presentes * 100.0) / matricula, 2)`?
   - Does it handle courses that have not submitted attendance for the day?
4. Write your challenge analysis and verdict to `d:\CanY\PROYECTOS CANY\App colegio\.agents\m1_challenger_2\analysis.md` and your `handoff.md`.
5. Send a message to parent when complete.
