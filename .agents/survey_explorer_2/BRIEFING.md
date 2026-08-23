# BRIEFING — 2026-08-20T14:16:30Z

## Mission
Perform a comprehensive survey of backend requirements and PostgreSQL/Supabase database architecture for the "Escuela de Educación Secundaria Técnica N° 3 — Ntra. Sra. de la Merced" attendance system ("Parte General de Alumnos").

## 🔒 My Identity
- Archetype: explorer
- Roles: backend & database architecture specialist
- Working directory: d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_2
- Original parent: c7e384c0-6de0-4dfc-937e-9f83b044ea36
- Milestone: M1_Backend_Database_Architecture_Survey

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Analyze database requirements, role definitions, constraints, triggers, RLS policies, seed datasets, and migration architecture
- Output analysis.md and handoff.md in working directory

## Current Parent
- Conversation ID: c7e384c0-6de0-4dfc-937e-9f83b044ea36
- Updated: 2026-08-20T14:16:30Z

## Investigation State
- **Explored paths**: `ORIGINAL_REQUEST.md`, `PARTE GENERALES TV.xlsx - T.V.csv`, `extract.ps1`, Supabase MCP schema definitions
- **Key findings**: 
  - Complete school model: 3 shifts (Mañana, Tarde, Vespertino); Ciclo Básico (1°-3°), Ciclo Superior (4°-7° with TECQU, TECMM, TECET), Special (1°1ª C.TEC.MMO).
  - Seed data for Vespertino matches CSV exactly (10 courses with 172 enrolled students: 119 V, 53 M).
  - 3 User roles: Administrador, Preceptor, Profesor with explicit permission hierarchy and RLS rules.
  - Mathematical integrity validations enforced via PostgreSQL generated stored columns and triggers ($V + M = T$, $Pres + Aus = Insc$).
  - Historical snapshotting of enrollment data in attendance records prevents retro-corruption when student rolls change.
  - Stored procedures (`fn_get_shift_parte_general`, `fn_get_attendance_trends`) mirror paper Parte General layout and supply dashboard reporting.
- **Unexplored areas**: No caveats remaining. All core requirements and schemas designed.

## Key Decisions Made
- Use UUIDs for entity IDs and link user profiles directly to `auth.users(id)` with `ON DELETE CASCADE`.
- Implement PostgreSQL CHECK constraints and GENERATED ALWAYS AS columns for strict data integrity.
- Design database functions (`is_admin()`, `is_preceptor()`, `is_teacher()`, `is_assigned_to_course()`) with `SECURITY DEFINER` to enable high-performance RLS policies without circular recursion.
- Create view/functions for aggregated reporting mirroring the exact Parte General paper layout.

## Artifact Index
- `d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_2\DISPATCH.md` — Incoming dispatch log
- `d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_2\BRIEFING.md` — Agent memory and state
- `d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_2\progress.md` — Liveness and progress heartbeat
- `d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_2\analysis.md` — Comprehensive backend & DB architecture specification and SQL migrations
- `d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_2\handoff.md` — 5-Component handoff report
