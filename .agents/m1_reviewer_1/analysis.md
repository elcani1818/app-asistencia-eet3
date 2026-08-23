# Review & Adversarial Analysis Report — Milestone 1 (M1: Database & Auth Engine)

**Reviewer:** Reviewer 1 (`m1_reviewer_1`)  
**Roles:** reviewer, critic  
**Target:** `supabase/migrations/20260820000000_m1_database_and_auth.sql` and Milestone 1 Deliverables  
**Date:** 2026-08-20  

---

## 1. Review Summary

**Verdict**: **APPROVE**  
**Overall Risk Assessment**: **LOW**  
**Integrity Status**: **VERIFIED CLEAN (No integrity violations, no hardcoding shortcuts, no facade implementations)**

The database DDL migration `supabase/migrations/20260820000000_m1_database_and_auth.sql` and supporting artifacts (`supabase/seed.sql`, `src/types/database.ts`, `src/lib/supabase.ts`, `.env.example`) implement a robust, production-grade PostgreSQL 15+ schema with comprehensive Row Level Security (RLS), security definer helper functions designed to prevent infinite recursion, deterministic mathematical validation triggers, historical date locks, forensic audit logging, and exact CSV reference seed data.

---

## 2. Review Criteria Verification

| # | Criterion | Verification Method | Status | Evidence / Notes |
|---|---|---|---|---|
| 1 | **Completeness (7 Tables, 4 ENUMs)** | Static AST / SQL Schema View | **PASS** | Tables: `shifts`, `profiles`, `courses`, `course_assignments`, `attendance_records`, `staff_absences`, `attendance_audit_logs`. ENUMs: `user_role`, `course_cycle`, `technical_orientation`, `attendance_status`. All foreign keys, primary keys, and unique constraints are defined. |
| 2 | **Generated Stored Columns** | Schema Inspection | **PASS** | 5 generated columns with `GENERATED ALWAYS AS (...) STORED`: `courses.inscriptos_total`, `attendance_records.total_presentes`, `attendance_records.total_ausentes`, `attendance_records.total_matricula`, `attendance_records.snapshot_inscriptos_total`. |
| 3 | **RLS Recursion Prevention** | Security Definer & Search Path Audit | **PASS** | Helper functions (`auth_user_role()`, `is_admin()`, `is_preceptor()`, `is_admin_or_preceptor()`, `is_assigned_to_course()`, `can_edit_attendance()`) are defined with `SECURITY DEFINER STABLE` and explicit `SET search_path = public, auth`. This isolates `profiles` table lookups from recursive RLS evaluation. |
| 4 | **Role Permissions & Granular RLS** | Policy Matrix Analysis | **PASS** | Strict policies configured per role: Admin has full CRUD across catalog and users; Preceptor has view access across all courses/attendance and manage access to staff absences; Profesor is restricted strictly to assigned courses for SELECT and same-day (`date = CURRENT_DATE`) INSERT/UPDATE. |
| 5 | **Mathematical Invariant Trigger** | Trigger Logic Analysis | **PASS** | `fn_validate_attendance_math` strictly verifies $P_V + A_V = I_V$ and $P_M + A_M = I_M$ on `BEFORE INSERT OR UPDATE`. Blocks negative numbers and snapshots active catalog counts. |
| 6 | **Forensic Audit & Date Lock** | Trigger & Table Audit | **PASS** | `fn_date_lock_attendance` enforces date immutability for past records unless bypass is granted to `is_admin()`. `fn_attendance_audit` logs JSONB before/after payloads for all attendance mutations. |
| 7 | **Seed Parity with CSV Reference** | CSV vs SQL Seed Line-by-Line Match | **PASS** | Exact 10 courses in Turno Vespertino matching `PARTE GENERALES TV.xlsx - T.V.csv` with 119 Varones + 53 Mujeres = 172 Inscriptos Total. Mañana and Tarde catalogs provisioned with 26 courses each (52 courses). |
| 8 | **TypeScript Interface Alignment** | Contract Comparison (`src/types/database.ts`) | **PASS** | Complete matching `Database` types, Row/Insert/Update definitions, and `ParteGeneralPayload` types aligning with `PROJECT.md`. |

---

## 3. Adversarial Critique & Stress-Testing

### Challenge 1: Infinite Recursion & Execution Overhead on RLS Evaluation
- **Assumption Challenged**: Calling `is_admin()` or `is_assigned_to_course()` within `USING` clauses of RLS policies might trigger cyclic evaluation when querying `profiles` or `course_assignments`.
- **Stress-Test Analysis**:
  - `auth_user_role()`, `is_admin()`, `is_preceptor()`, `is_assigned_to_course()` are declared with `SECURITY DEFINER` and `SET search_path = public, auth`.
  - In PostgreSQL, a `SECURITY DEFINER` function executes with the privileges of the function owner (superuser / schema creator) and bypasses RLS on the tables queried inside the function body (`profiles`, `course_assignments`).
  - Furthermore, `profiles`'s SELECT policy is `USING (true)`, requiring no subquery.
- **Finding**: **Robust & Recursion-Free**.

### Challenge 2: Privilege Escalation via Profile Self-Update
- **Assumption Challenged**: Can a regular teacher or preceptor elevate their own role to `'administrador'` by sending an `UPDATE public.profiles SET role = 'administrador'`?
- **Stress-Test Analysis**:
  - Inspected `profiles_update_own` policy (lines 364-373):
    ```sql
    CREATE POLICY "profiles_update_own"
        ON public.profiles FOR UPDATE
        TO authenticated
        USING (id = auth.uid())
        WITH CHECK (
            id = auth.uid()
            AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
            AND is_active = (SELECT p.is_active FROM public.profiles p WHERE p.id = auth.uid())
        );
    ```
  - The `WITH CHECK` clause explicitly asserts that the updated row's `role` and `is_active` must match the pre-existing role and active status of the user's profile.
- **Finding**: **Privilege escalation is impossible**.

### Challenge 3: Division-by-Zero Hazards in Reporting Procedures
- **Assumption Challenged**: What happens in `fn_get_shift_parte_general` when a new course is created with 0 enrolled students or a shift has 0 total students?
- **Stress-Test Analysis**:
  - Inspected line 782, line 866, and line 890:
    ```sql
    CASE 
        WHEN COALESCE(inscriptos_t, 0) > 0 
        THEN (COALESCE(presentes_t, 0)::NUMERIC / inscriptos_t::NUMERIC) * 100.0 
        ELSE 0.0 
    END
    ```
  - Every calculation is protected with `> 0` guard clauses returning `0.0` when enrollment is zero.
- **Finding**: **Immune to division-by-zero runtime exceptions**.

### Challenge 4: Integrity of Historical Records Under Catalog Updates
- **Assumption Challenged**: If an administrator edits the number of enrolled students for a course midway through the academic year, will past attendance records have invalid percentages or failed invariants?
- **Stress-Test Analysis**:
  - `attendance_records` captures `snapshot_inscriptos_v` and `snapshot_inscriptos_m` upon insert.
  - Mathematical validation checks: `(NEW.presentes_varones + NEW.ausentes_varones) <> NEW.snapshot_inscriptos_v`.
  - `fn_get_shift_parte_general` calculates percentages using `COALESCE(a.snapshot_inscriptos_total, c.inscriptos_total)`.
- **Finding**: **Historical reports remain immutable and accurate**.

---

## 4. Minor Observations & Future Recommendations

1. **Local vs Cloud Auth Bootstrap**:
   - In `supabase/seed.sql`, inserting directly into `auth.users` using `crypt()` is standard for local Supabase CLI development. When deploying to Supabase Cloud, users are created via the Supabase Auth API/Dashboard, which triggers `trg_on_auth_user_created` to sync with `public.profiles`. The trigger logic is already in place and handles `ON CONFLICT (id) DO UPDATE`.
2. **Date Comparison Timezone Awareness**:
   - The date locking trigger uses `CURRENT_DATE`. The frontend should format dates in Argentina Standard Time (`America/Argentina/Buenos_Aires`, UTC-3) so that submissions near midnight do not experience day rollover discrepancies. (To be verified in M2/M3).

---

## 5. Formal Verdict

**APPROVE**: All M1 criteria are completely met with zero integrity violations and solid architectural resilience. The database migration is ready for downstream milestone consumption.
