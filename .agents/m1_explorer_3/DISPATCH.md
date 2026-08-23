## 2026-08-20T14:17:46Z

You are Explorer 3 for Milestone 1 (M1: Database & Auth Engine).
Your working directory is: d:\CanY\PROYECTOS CANY\App colegio\.agents\m1_explorer_3
Master blueprint: d:\CanY\PROYECTOS CANY\App colegio\PROJECT.md
Original request: d:\CanY\PROYECTOS CANY\App colegio\ORIGINAL_REQUEST.md
Survey reports:
- d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_1\analysis.md
- d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_2\analysis.md
- d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_3\analysis.md
CSV source: d:\CanY\PROYECTOS CANY\App colegio\PARTE GENERALES TV.xlsx - T.V.csv
Scope document: d:\CanY\PROYECTOS CANY\App colegio\.agents\sub_orch_m1\SCOPE.md

Your Task:
Investigate and design the complete Seed Data scripts and Supabase Client Configuration:
1. Seed Data Analysis & Script Design:
   - `shifts`: Mañana, Tarde, Vespertino.
   - Vespertino exact dataset: Extract and format all 10 courses from `PARTE GENERALES TV.xlsx - T.V.csv` (exact distribution: 119 Varones, 53 Mujeres, 172 Inscriptos Total). Map each course (1°1ª to 7°1ª etc., cycles Básico/Superior, technical orientations Construcciones/Electromecánica).
   - Turno Mañana & Tarde initial catalogs: 1°1ª to 3°4ª (Ciclo Básico) and 4°1ª to 7°4ª (Ciclo Superior - Electromecánica, Construcciones, Computación).
   - Bootstrap accounts: Demo users for `admin@colegio.edu.ar` (Administrador), `preceptor.vespertino@colegio.edu.ar` (Preceptor), `profesor.mecanica@colegio.edu.ar` (Profesor), with proper UUID linkage to `auth.users` and `public.profiles`.
2. Supabase Client & TypeScript definitions:
   - `src/lib/supabase.ts`: Client initialization with supabase-js, environment variable validation.
   - `src/types/database.ts`: TypeScript Database type definitions matching the schema exactly (Row, Insert, Update, Enums, Tables).
   - `.env.example`: Template with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Write your complete findings, exact SQL seed insert statements, and TypeScript client code to `d:\CanY\PROYECTOS CANY\App colegio\.agents\m1_explorer_3\analysis.md` and your `handoff.md`.
4. Send a message to parent when complete.
