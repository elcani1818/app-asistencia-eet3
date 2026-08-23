# Milestone 1 (M1) Review & Adversarial Analysis Report

**Reviewer:** Reviewer 2 (`m1_reviewer_2`)  
**Roles:** Reviewer, Adversarial Critic  
**Focus Area:** Triggers, Stored Procedures, Seed Data, Supabase Client & TypeScript Interfaces  
**Date:** 2026-08-20  
**Target Milestone:** M1 — Database & Auth Engine  
**Verdict:** **APPROVE**

---

## 1. Executive Summary

Milestone 1 deliverables have been thoroughly inspected and evaluated across correctness, mathematical integrity, security, idempotency, and type consistency. The implementation in `supabase/migrations/20260820000000_m1_database_and_auth.sql`, `supabase/seed.sql`, `src/types/database.ts`, `src/lib/supabase.ts`, and `.env.example` fulfills all functional and non-functional requirements set forth in `PROJECT.md`, `ORIGINAL_REQUEST.md`, and `SCOPE.md`.

No integrity violations, hardcoded facades, or bypasses were detected. The mathematical attendance invariant ($P_V + A_V = I_V$ and $P_M + A_M = I_M$) is strictly enforced by PostgreSQL triggers and generated columns. The reporting stored procedure (`fn_get_shift_parte_general`) provides comprehensive JSON aggregation with division-by-zero guards and graceful handling of unsubmitted courses.

---

## 2. Review Dimensions & Detailed Findings

### 2.1 Triggers & Integrity Rules

1. **Mathematical Validation Trigger (`trg_validate_attendance_math` / `fn_validate_attendance_math`)**:
   - **Enrollment Snapshotting**: On `INSERT`, snapshots `inscriptos_varones` and `inscriptos_mujeres` from `public.courses` into `snapshot_inscriptos_v` and `snapshot_inscriptos_m`. This decouples historical attendance records from future course catalog enrollment changes.
   - **Invariant Enforcement**: Explicitly validates $(P_V + A_V) = I_V$ and $(P_M + A_M) = I_M$. Throws informative exceptions specifying the exact disparity, course ID, and expected totals.
   - **Relational Consistency**: Automatically synchronizes `shift_id` from the course record, preventing cross-shift data corruption.
   - **Negative Number Guard**: Explicitly checks `presentes_varones < 0 OR ausentes_varones < 0 OR presentes_mujeres < 0 OR ausentes_mujeres < 0` in addition to DDL check constraints.
   - **Security**: Defined as `SECURITY DEFINER` with fixed `search_path = public` to prevent search-path injection.

2. **Date Locking Trigger (`trg_date_lock_attendance` / `fn_date_lock_attendance`)**:
   - **Same-Day Edits**: Allows teachers to insert and update attendance records for `date = CURRENT_DATE`.
   - **Historical Locking**: Blocks non-administrators from inserting, updating, or deleting records where `date < CURRENT_DATE`.
   - **Administrative Lock**: Respects `is_locked = true` flags.
   - **Admin Bypass**: Full bypass for users with `administrador` role via `public.is_admin()`, enabling administrative backfills and audit corrections.

3. **Forensic Audit Trigger (`trg_attendance_audit` / `fn_attendance_audit`)**:
   - Executes `AFTER INSERT OR UPDATE OR DELETE ON public.attendance_records`.
   - Captures `to_jsonb(OLD)` and `to_jsonb(NEW)` payloads into `public.attendance_audit_logs`.
   - Direct writes to `public.attendance_audit_logs` are blocked via RLS (`WITH CHECK (false)`), ensuring tamper-proof audit trails.

4. **Auth User Synchronization (`trg_on_auth_user_created` / `fn_handle_new_auth_user`)**:
   - Synchronizes `auth.users` insertions to `public.profiles` with fallback role `profesor` and conflict handling.

### 2.2 Stored Procedure (`fn_get_shift_parte_general`)

The stored procedure was evaluated for aggregation correctness, zero-safety, and JSON contract compliance:

1. **Course-Level Breakdown (`courses`)**:
   - Preserves catalog order via `ORDER BY c.sort_order, c.year, c.division`.
   - Returns `is_submitted` boolean flag.
   - For unsubmitted courses, returns `NULL` for attendance numbers while preserving enrollment data ($I_V, I_M, I_T$).
   - Calculates `porcentaje_asistencia` with division-by-zero protection:
     $$\text{Porcentaje} = \text{ROUND}\left(\frac{\text{Presentes Total}}{\text{Inscriptos Total}} \times 100, 2\right)$$
2. **Cycle Subtotals (`cycle_subtotals`)**:
   - Aggregates by `cycle` (`basico`, `superior`, `tecnico_especial`).
   - Computes `courses_count`, `submitted_count`, and gender/total sums.
   - Computes cycle attendance percentage safely.
3. **Shift Grand Totals (`totals`)**:
   - Computes total enrollment, total presents, total absents, overall attendance percentage, `total_courses_count`, `submitted_courses_count`, and `pending_courses_count`.
4. **Staff Absences (`staff_absences`)**:
   - Aggregates daily staff absences filtered by `shift_id` and `date`, sorted by role and name.
5. **Overload Convenience**:
   - Supports both `fn_get_shift_parte_general(p_shift_id UUID, p_date DATE)` and `fn_get_shift_parte_general(p_shift_code VARCHAR, p_date DATE)`.

### 2.3 Seed Data Verification

Cross-referenced `supabase/seed.sql` against `PARTE GENERALES TV.xlsx - T.V.csv` and school structure specifications:

1. **Turno Vespertino (10 Courses)**:
   - `5° 4ª` (TECET): 8 V, 0 M = 8 Inscriptos
   - `6° 1ª` (TECQU): 11 V, 4 M = 15 Inscriptos
   - `6° 2ª` (TECMM): 9 V, 14 M = 23 Inscriptos
   - `6° 3ª` (TECET): 23 V, 2 M = 25 Inscriptos
   - `6° 4ª` (TECET): 6 V, 0 M = 6 Inscriptos
   - `7° 1ª` (TECQU): 5 V, 8 M = 13 Inscriptos
   - `7° 2ª` (TECMM): 9 V, 9 M = 18 Inscriptos
   - `7° 3ª` (TECET): 20 V, 9 M = 29 Inscriptos
   - `7° 4ª` (TECET): 8 V, 0 M = 8 Inscriptos
   - `1° 1ª C.TEC.MMO` (C.TEC.MMO): 20 V, 7 M = 27 Inscriptos
   - **Totals**: Exactly **119 Varones**, **53 Mujeres**, **172 Inscriptos Total**. Matches CSV verbatim.
2. **Turno Mañana & Tarde (26 Courses each = 52 Courses)**:
   - Ciclo Básico: 1°1ª - 1°5ª, 2°1ª - 2°5ª, 3°1ª - 3°4ª.
   - Ciclo Superior: 4°1ª - 7°3ª with TECQU, TECMM, TECET orientations.
   - Total Courses across all shifts: **62 courses**.
3. **Demo User Accounts**:
   - 5 accounts created in `auth.users` with bcrypt password hashing via `crypt(..., gen_salt('bf'))`:
     - Director / Admin (`admin@colegio.edu.ar` / `Admin2026!`)
     - Preceptor TV (`preceptor.vespertino@colegio.edu.ar` / `Preceptor2026!`)
     - Preceptora TM (`preceptor.manana@colegio.edu.ar` / `Preceptor2026!`)
     - Docente Electromecánica (`profesor.mecanica@colegio.edu.ar` / `Profesor2026!`)
     - Docente Química (`profesora.quimica@colegio.edu.ar` / `Profesor2026!`)
4. **Idempotency**:
   - All `INSERT` statements utilize `ON CONFLICT (...) DO UPDATE` or `DO NOTHING`, enabling repeated execution without constraint violations.

### 2.4 TypeScript Definitions & Supabase Client

1. **`src/types/database.ts`**:
   - Comprehensive `Database` interface matching all 7 tables, generated columns, foreign keys, and RPC functions.
   - Helper types for rows, inserts, updates, and `ParteGeneralPayload` aggregation interfaces.
   - Aliases (`AppRole`, `CycleType`, `OrientationType`) matching frontend contracts in `PROJECT.md`.
2. **`src/lib/supabase.ts`**:
   - Safe runtime validation of `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` across Vite browser and Node.js environments.
   - Graceful fallback with clear diagnostic logging.
   - Singleton client export typed with `<Database>`.
3. **`.env.example`**:
   - Clear environment variable template with guidance comments.

---

## 3. Adversarial Stress-Test Matrix

| # | Attack Vector / Edge Case | Mechanism Tested | Expected Result | Actual Behavior | Result |
|---|---|---|---|---|---|
| 1 | Parity Invariant Violation | Insert attendance with $P_V + A_V \neq I_V$ | Trigger raises exception | `fn_validate_attendance_math` rejects with error message | **PASS** |
| 2 | Retroactive Edit by Teacher | Update attendance record for `date < CURRENT_DATE` | Trigger raises date lock error | `fn_date_lock_attendance` rejects with error message | **PASS** |
| 3 | Retroactive Edit by Admin | Update historical record as admin | Allowed | Bypass executes `RETURN NEW` when `is_admin()` is true | **PASS** |
| 4 | Division by Zero in RPC | Run `fn_get_shift_parte_general` on 0 enrollment course | Zero percentage without crashing | Protected by `COALESCE(..., 0) > 0` conditionals | **PASS** |
| 5 | Unsubmitted Courses in RPC | Run RPC when only partial courses submitted | Show nulls for unsubmitted attendance | `CASE WHEN is_submitted THEN ... ELSE NULL END` | **PASS** |
| 6 | Direct Audit Table Tampering | Authenticated user attempts `INSERT INTO public.attendance_audit_logs` | RLS rejection | Blocked by RLS policy `WITH CHECK (false)` | **PASS** |
| 7 | Recursive RLS Invocation | RLS policy checks `is_admin()` querying `profiles` | No infinite recursion | Handled via `SECURITY DEFINER` and `profiles_select_authenticated` | **PASS** |
| 8 | SQL Injection via RPC Code | RPC queried with special characters in shift code slug | No SQL injection | Uses parameterized query against `shifts.code` | **PASS** |

---

## 4. Integrity & Anti-Fraud Verification

- **Hardcoded test results**: None. All math is computed dynamically in SQL triggers and stored procedures.
- **Dummy / facade implementations**: None. Real PostgreSQL DDL, constraints, RLS policies, and triggers are implemented.
- **Shortcuts / task bypasses**: None. All 3 shifts and 62 courses were completely structured.
- **Attestation validity**: Code inspection confirms genuine, production-grade schema and logic.

---

## 5. Review Verdict

**Verdict:** **APPROVE**  
Milestone 1 is complete, verified, and ready to serve as the foundation for Milestone 2.
