# Adversarial Analysis & Stress Test Report — Milestone 1 (M1: Database & Auth Engine)

**Agent**: Challenger 1 (critic, specialist)  
**Target**: `supabase/migrations/20260820000000_m1_database_and_auth.sql` & `supabase/seed.sql`  
**Date**: 2026-08-20  
**Overall Risk Assessment**: **MEDIUM** (1 Architectural Foreign Key Flaw in Audit Triggers, 1 Date Mutation Edge Case, Strong Math & Security Foundation)

---

## Executive Summary

An adversarial audit and stress-testing analysis was conducted across all DDL statements, relational constraints, integrity triggers, security definer functions, and stored procedures in the M1 database migration.

The schema exhibits strong mathematical integrity checks, strict enum definitions, recursion-safe RLS policies, and precise alignment with the institutional structure of the E.E.S.T. N° 3. However, one **critical relational flaw** was identified in the audit logging cascade architecture during `DELETE` operations, along with one **date mutation edge case** in the date-locking trigger.

---

## 1. Relational DDL & Foreign Key Architecture

### 1.1 Integrity Matrix

| Table | Primary Key | Foreign Keys & Cascade Actions | Unique Constraints | Check Constraints | Audit Assessment |
|---|---|---|---|---|---|
| `shifts` | `id` (UUID) | None | `uq_shifts_code` (`code`) | None | **ROBUST** |
| `profiles` | `id` (UUID) | `id` -> `auth.users(id)` ON DELETE CASCADE<br>`shift_id` -> `shifts(id)` ON DELETE SET NULL | `email` | None | **ROBUST** |
| `courses` | `id` (UUID) | `shift_id` -> `shifts(id)` ON DELETE RESTRICT | `uq_course_shift_name` (`shift_id`, `name`) | `year BETWEEN 1 AND 7`<br>`division BETWEEN 1 AND 10`<br>`inscriptos_v >= 0`<br>`inscriptos_m >= 0` | **ROBUST** |
| `course_assignments` | `id` (UUID) | `user_id` -> `profiles(id)` ON DELETE CASCADE<br>`course_id` -> `courses(id)` ON DELETE CASCADE<br>`assigned_by` -> `profiles(id)` ON DELETE SET NULL | `uq_user_course` (`user_id`, `course_id`) | None | **ROBUST** |
| `attendance_records` | `id` (UUID) | `course_id` -> `courses(id)` ON DELETE RESTRICT<br>`shift_id` -> `shifts(id)` ON DELETE RESTRICT<br>`submitted_by` -> `profiles(id)` ON DELETE SET NULL | `uq_attendance_course_date` (`course_id`, `date`) | `presentes_v >= 0`<br>`ausentes_v >= 0`<br>`presentes_m >= 0`<br>`ausentes_m >= 0`<br>`snapshot_v >= 0`<br>`snapshot_m >= 0` | **ROBUST** |
| `staff_absences` | `id` (UUID) | `shift_id` -> `shifts(id)` ON DELETE RESTRICT<br>`course_id` -> `courses(id)` ON DELETE SET NULL<br>`created_by` -> `profiles(id)` ON DELETE SET NULL | None | None | **ROBUST** |
| `attendance_audit_logs` | `id` (UUID) | `attendance_id` -> `attendance_records(id)` ON DELETE CASCADE<br>`course_id` -> `courses(id)` ON DELETE SET NULL<br>`changed_by` -> `profiles(id)` ON DELETE SET NULL | None | None | **CRITICAL FLAW DETECTED (See Challenge 1)** |

---

## 2. Adversarial Challenges & Findings

### [CRITICAL] Challenge 1: Foreign Key Violation & Log Destruction on Attendance Deletion

- **Location**: `supabase/migrations/20260820000000_m1_database_and_auth.sql` (Lines 184, 658-677)
- **Assumption Challenged**: That `attendance_audit_logs` can maintain `attendance_id UUID REFERENCES public.attendance_records(id) ON DELETE CASCADE` while an `AFTER DELETE` trigger inserts a log for the deleted record.
- **Attack Scenario**:
  1. An administrator issues `DELETE FROM public.attendance_records WHERE id = 'att-uuid-123'`.
  2. PostgreSQL deletes the record from `public.attendance_records`.
  3. Because of `ON DELETE CASCADE`, any existing historical audit logs for `att-uuid-123` (INSERT, UPDATE) are immediately purged.
  4. The `AFTER DELETE` trigger `trg_attendance_audit` fires and executes:
     ```sql
     INSERT INTO public.attendance_audit_logs (
         attendance_id, course_id, changed_by, action, old_values, new_values, created_at
     ) VALUES (
         OLD.id, OLD.course_id, auth.uid(), 'DELETE', to_jsonb(OLD), NULL, timezone('utc'::text, now())
     );
     ```
  5. PostgreSQL validates the FK constraint `attendance_audit_logs.attendance_id REFERENCES attendance_records(id)`.
  6. Since `OLD.id` has already been deleted from `attendance_records`, PostgreSQL throws:
     `ERROR: insert or update on table "attendance_audit_logs" violates foreign key constraint "attendance_audit_logs_attendance_id_fkey"`.
  7. The transaction aborts and rollbacks. **Attendance records CANNOT be deleted.**
- **Blast Radius**:
  - Hard transaction failure on any `DELETE` operation on `attendance_records`.
  - Loss of forensic audit history if cascade delete is triggered.
- **Recommended Mitigation**:
  Modify `attendance_audit_logs` so that `attendance_id` is an unconstrained `UUID` column or has `ON DELETE SET NULL`:
  ```sql
  CREATE TABLE IF NOT EXISTS public.attendance_audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      attendance_id UUID, -- No strict FK constraint to allow preserving logs after record deletion
      course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
      changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      old_values JSONB,
      new_values JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
  );
  ```

---

### [MEDIUM] Challenge 2: Date Mutation Bypass on Attendance UPDATE

- **Location**: `supabase/migrations/20260820000000_m1_database_and_auth.sql` (Line 588)
- **Assumption Challenged**: That `trg_date_lock_attendance` blocks non-admins from changing records to past dates.
- **Attack Scenario**:
  1. A preceptor or authenticated user with edit permissions updates a record originally created today (`OLD.date = CURRENT_DATE`).
  2. The update payload sets `NEW.date = '2025-01-01'`.
  3. The trigger checks `IF OLD.date < CURRENT_DATE THEN ...`, which evaluates to `FALSE` because `OLD.date` is today.
  4. The trigger does not check `NEW.date < CURRENT_DATE`.
  5. The record is retroactively moved to a past date without admin permissions.
- **Blast Radius**: Preceptors could unintentionally or intentionally alter the date of a record into the past.
- **Recommended Mitigation**:
  In `fn_date_lock_attendance()` under `TG_OP = 'UPDATE'`:
  ```sql
  IF OLD.date < CURRENT_DATE THEN
      RAISE EXCEPTION 'Bloqueo de Fecha: No se permite modificar partes de asistencia de fechas pasadas (%).', OLD.date;
  END IF;
  IF NEW.date < CURRENT_DATE THEN
      RAISE EXCEPTION 'Bloqueo de Fecha: No se permite cambiar la fecha del parte a una fecha histórica (%).', NEW.date;
  END IF;
  ```

---

### [LOW] Challenge 3: Snapshot Fallback on Granular Single-Gender Updates

- **Location**: `supabase/migrations/20260820000000_m1_database_and_auth.sql` (Line 521)
- **Assumption Challenged**: That `COALESCE(NEW.snapshot_inscriptos_v, 0) = 0 AND COALESCE(NEW.snapshot_inscriptos_m, 0) = 0` correctly handles partial snapshot restoration.
- **Analysis**:
  - For single-gender technical divisions (e.g. `5° 4ª TECET` with 8 Varones and 0 Mujeres), `snapshot_inscriptos_m` is legitimately `0`.
  - On INSERT: both snapshots are populated directly from `courses`.
  - On UPDATE: if someone explicitly provides `snapshot_inscriptos_v = 0` while `snapshot_inscriptos_m = 4`, the `AND` condition evaluates to `FALSE`, preventing fallback to `courses.inscriptos_varones`.
- **Recommended Mitigation**:
  Populate snapshots independently:
  ```sql
  IF TG_OP = 'INSERT' THEN
      NEW.snapshot_inscriptos_v := v_inscriptos_v;
      NEW.snapshot_inscriptos_m := v_inscriptos_m;
  ELSE
      NEW.snapshot_inscriptos_v := COALESCE(NEW.snapshot_inscriptos_v, v_inscriptos_v);
      NEW.snapshot_inscriptos_m := COALESCE(NEW.snapshot_inscriptos_m, v_inscriptos_m);
  END IF;
  ```

---

## 3. Mathematical Invariant Stress-Testing Results

| Test Scenario | Input Data | Target Invariant | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|---|---|
| **P_V + A_V = I_V Valid** | P_V=21, A_V=2, I_V=23 | Gender Parity Varones | INSERT / UPDATE Allowed | Allowed | **PASS** |
| **P_M + A_M = I_M Valid** | P_M=2, A_M=0, I_M=2 | Gender Parity Mujeres | INSERT / UPDATE Allowed | Allowed | **PASS** |
| **Varones Deficit (-1)** | P_V=20, A_V=2, I_V=23 | $20 + 2 = 22 \neq 23$ | Exception Raised ('Inconsistencia en Varones...') | Exception Raised | **PASS** |
| **Mujeres Surplus (+1)** | P_M=3, A_M=0, I_M=2 | $3 + 0 = 3 \neq 2$ | Exception Raised ('Inconsistencia en Mujeres...') | Exception Raised | **PASS** |
| **Cross-Gender Cancellation** | P_V=22, A_V=2 (24 vs 23)<br>P_M=1, A_M=0 (1 vs 2)<br>Total: 25 = 25 | Independent Gender Parity | Exception Raised on Varones despite total match | Exception Raised on Varones | **PASS** |
| **Negative Presentes** | P_V=-1, A_V=24, I_V=23 | Positive Integers | Exception Raised ('...no pueden ser negativas') | Blocked by CHECK & Trigger | **PASS** |
| **Negative Ausentes** | P_M=3, A_M=-1, I_M=2 | Positive Integers | Exception Raised ('...no pueden ser negativas') | Blocked by CHECK & Trigger | **PASS** |
| **Zero Enrollment Boundary** | P_V=0, A_V=0, I_V=0<br>P_M=0, A_M=0, I_M=0 | $0 + 0 = 0$ | Allowed (100% / 0% division-by-zero safe) | Allowed, Percentage = 0.0% | **PASS** |

---

## 4. Date-Locking & Role Access Results

| Operation | User Role | Record Date | Status / Lock | Expected Result | Actual Result |
|---|---|---|---|---|---|
| `INSERT` | `administrador` | `2026-01-01` (Past) | New | **ALLOWED** (Admin Bypass) | **PASS** |
| `INSERT` | `preceptor` | `2026-01-01` (Past) | New | **BLOCKED** ('Bloqueo de Fecha') | **PASS** |
| `INSERT` | `profesor` | `CURRENT_DATE` | New | **ALLOWED** (Assigned course) | **PASS** |
| `UPDATE` | `preceptor` | `2026-01-01` (Past) | Unlocked | **BLOCKED** ('Bloqueo de Fecha') | **PASS** |
| `UPDATE` | `preceptor` | `CURRENT_DATE` | `is_locked = true` | **BLOCKED** ('Bloqueo Administrativo') | **PASS** |
| `UPDATE` | `administrador` | `2026-01-01` (Past) | `is_locked = true` | **ALLOWED** (Admin Bypass) | **PASS** |
| `DELETE` | `preceptor` | `CURRENT_DATE` | Unlocked | **BLOCKED** by RLS (`is_admin()`) | **PASS** |
| `DELETE` | `administrador` | `CURRENT_DATE` | Unlocked | **BLOCKED** by FK trigger error (Challenge 1) | **FAIL (BUG)** |

---

## 5. Stored Procedure `fn_get_shift_parte_general` Verification

- **Vespertino Reference Dataset Verification**:
  - Total Courses: 10 courses active.
  - Inscriptos Varones: 119
  - Inscriptos Mujeres: 53
  - Inscriptos Total: 172
  - Mathematical integrity match with `PARTE GENERALES TV.xlsx - T.V.csv`: **100% EXACT**.
- **Cycle Subtotals**:
  - `superior`: 9 courses (5° 4ª, 6° 1ª, 6° 2ª, 6° 3ª, 6° 4ª, 7° 1ª, 7° 2ª, 7° 3ª, 7° 4ª) -> 99 V, 46 M, 145 T.
  - `tecnico_especial`: 1 course (1° 1ª C.TEC.MMO) -> 20 V, 7 M, 27 T.
  - Subtotal Sum: $145 + 27 = 172$.
- **Division-by-Zero Handling**:
  - Checked lines 782, 866, 890: all divisions by `inscriptos_t` are protected by `CASE WHEN ... > 0 THEN ... ELSE 0.0 END`.

---

## 6. Verdict & Actionable Recommendations

1. **Fix Challenge 1 (Critical)**: In `supabase/migrations/20260820000000_m1_database_and_auth.sql`, alter `public.attendance_audit_logs.attendance_id` to remove the strict `REFERENCES public.attendance_records(id) ON DELETE CASCADE` constraint.
2. **Fix Challenge 2 (Medium)**: In `fn_date_lock_attendance()`, add validation to reject updates where `NEW.date < CURRENT_DATE` for non-admin roles.
3. **Approve Schema & Triggers**: Once the audit table FK and date mutation check are patched, the database schema is verified as fully production-ready for Milestone 1.
