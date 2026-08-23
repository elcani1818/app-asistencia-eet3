# Scope: Milestone 1 (M1: Database & Auth Engine)

## Architecture
PostgreSQL 15+ Schema on Supabase with Row Level Security (RLS), custom triggers, stored procedures, seed data, and TypeScript client configuration.

## Feature Inventory Mapping
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Supabase DDL Migration | Tables: `shifts`, `profiles`, `courses`, `course_assignments`, `attendance_records`, `staff_absences`, `attendance_audit_logs`. Foreign keys, enums, constraints. | M1 | ORIGINAL_REQUEST §3, PROJECT.md |
| F2 | Generated Columns & Calculations | `courses.inscriptos_total` (V+M), `attendance_records.total_presentes`, `total_ausentes`, `total_matricula`, `porcentaje_asistencia`. | M1 | ORIGINAL_REQUEST §3.1, §3.3 |
| F3 | Attendance Validation Triggers | Trigger checking `presentes_varones + ausentes_varones = inscriptos_varones` and `presentes_mujeres + ausentes_mujeres = inscriptos_mujeres` on insert/update. Also date lock preventing modification of previous days unless admin. | M1 | ORIGINAL_REQUEST §3.3, §6 |
| F4 | Stored Procedures | `fn_get_shift_parte_general(p_shift_id UUID, p_date DATE)` returning JSON/table with each course row + aggregated summary (Totals by Cycle, General Shift Total, Percentages). | M1 | ORIGINAL_REQUEST §3.4, §8 |
| F5 | Security Definer Functions & RLS | Helper functions `is_admin()`, `is_preceptor()`, `is_assigned_to_course(course_id)`. RLS policies per role (Administrador, Preceptor, Profesor). | M1 | ORIGINAL_REQUEST §2, §7 |
| F6 | Seed Data (Turno Vespertino Exact) | Exact 10 courses from `PARTE GENERALES TV.xlsx - T.V.csv` with 172 inscriptos (119 V, 53 M). | M1 | ORIGINAL_REQUEST §10, Survey |
| F7 | Seed Data (Turno Mañana & Tarde) | Course catalogs for Mañana and Tarde (Ciclo Básico 1°1ª to 3°4ª, Ciclo Superior 4°1ª to 7°4ª). | M1 | ORIGINAL_REQUEST §4, PROJECT.md |
| F8 | Bootstrap Accounts & Roles | Demo/seed accounts for Admin, Preceptor, and Profesor for authentication and immediate E2E verification. | M1 | PROJECT.md |
| F9 | Client Config & Env Setup | `src/lib/supabase.ts` (typed Supabase client) and `.env.example`. | M1 | PROJECT.md |

## Sub-Milestones & Deliverables
1. Migration File: `supabase/migrations/20260820000000_m1_database_and_auth.sql`
   - Complete tables, enums, triggers, RLS policies, indexes, security helper functions, and `fn_get_shift_parte_general`.
2. Seed File: `supabase/seed.sql`
   - Shifts (Mañana, Tarde, Vespertino)
   - Vespertino exact 10 courses (172 inscriptos)
   - Mañana and Tarde courses template catalogs
   - Demo profiles and course assignments
3. Client Configuration:
   - `src/lib/supabase.ts`
   - `src/types/database.ts` (full TypeScript interfaces/types matching DB schema)
   - `.env.example`

## Dependencies
- None (M1 is the foundational milestone).
