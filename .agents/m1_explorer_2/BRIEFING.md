# BRIEFING — 2026-08-20T14:22:00Z

## Mission
Investigate and design complete SQL Logic, Functions, Triggers, RLS Policies, and Stored Procedures for Supabase (M1: Database & Auth Engine).

## 🔒 My Identity
- Archetype: explorer
- Roles: sql-logic-designer, rls-architect, trigger-procedure-engineer
- Working directory: d:\CanY\PROYECTOS CANY\App colegio\.agents\m1_explorer_2
- Original parent: 567b53ec-9a92-498c-bc32-3331aa68eb71
- Milestone: M1 (Database & Auth Engine)

## 🔒 Key Constraints
- Read-only investigation of source project requirements — design robust, production-grade PL/pgSQL functions, triggers, and RLS policies.
- Ensure strict security definer encapsulation, bypass prevention, and role-based access control.
- Ensure complete coverage of tables: shifts, profiles, courses, course_assignments, attendance_records, staff_absences, attendance_audit_logs.

## Current Parent
- Conversation ID: 567b53ec-9a92-498c-bc32-3331aa68eb71
- Updated: 2026-08-20T14:22:00Z

## Investigation State
- **Explored paths**: `PROJECT.md`, `ORIGINAL_REQUEST.md`, `SCOPE.md`, `survey_explorer_1`, `survey_explorer_2`, `survey_explorer_3`, `PARTE GENERALES TV.xlsx - T.V.csv`.
- **Key findings**:
  1. Helper functions must use `SECURITY DEFINER` and `SET search_path = public, auth` with `STABLE` volatility to prevent RLS recursion on `public.profiles`.
  2. RLS matrix designed for all 7 tables with strict course isolation for teachers and full read/write management for admin/preceptor.
  3. Parity validation triggers (`P_V + A_V = I_V` and `P_M + A_M = I_M`) with snapshot population, date-locking for past dates, and JSONB audit logging.
  4. Stored procedure `fn_get_shift_parte_general` implements course rows, cycle subtotals (*Básico*, *Superior*, *Técnico Especial*), grand totals, percentage math, and absent staff records.
- **Unexplored areas**: None for M1 SQL logic scope.

## Key Decisions Made
- Encapsulated role evaluation in `public.user_role()`, `public.is_admin()`, `public.is_preceptor()`, `public.is_admin_or_preceptor()`, and `public.is_assigned_to_course()`.
- Implemented `trg_validate_attendance_math`, `trg_date_lock_attendance`, `trg_attendance_audit`, and `trg_on_auth_user_created`.
- Implemented `fn_get_shift_parte_general` and `fn_get_attendance_trends`.

## Artifact Index
- `d:\CanY\PROYECTOS CANY\App colegio\.agents\m1_explorer_2\DISPATCH.md` — Dispatch log
- `d:\CanY\PROYECTOS CANY\App colegio\.agents\m1_explorer_2\BRIEFING.md` — Working memory
- `d:\CanY\PROYECTOS CANY\App colegio\.agents\m1_explorer_2\progress.md` — Liveness heartbeat
- `d:\CanY\PROYECTOS CANY\App colegio\.agents\m1_explorer_2\analysis.md` — Comprehensive SQL Logic & Procedural Specification
- `d:\CanY\PROYECTOS CANY\App colegio\.agents\m1_explorer_2\handoff.md` — 5-component handoff report
