# Handoff Report: PostgreSQL Schema DDL Specification (M1 Explorer 1)

**Agent:** m1_explorer_1  
**Target:** parent (`567b53ec-9a92-498c-bc32-3331aa68eb71`)  
**Milestone:** M1 — Database & Auth Engine  
**Type:** Hard Handoff  
**Date:** 2026-08-20  

---

## 1. Observation

1. **Source Documents Examined**:
   - `d:\CanY\PROYECTOS CANY\App colegio\PROJECT.md` (lines 46-117: TypeScript data models and database contracts for `Profile`, `Shift`, `Course`, `AttendanceRecord`, `StaffAbsence`).
   - `d:\CanY\PROYECTOS CANY\App colegio\ORIGINAL_REQUEST.md` (lines 12-32: School structure with 3 shifts, Ciclo Básico 1°-3°, Ciclo Superior 4°-7° with TECQU/TECMM/TECET, and 1°1ª C.TEC.MMO; lines 34-53: R1-R4 requirements).
   - `d:\CanY\PROYECTOS CANY\App colegio\.agents\sub_orch_m1\SCOPE.md` (lines 6-18: M1 scope mapping F1-F9).
   - `d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_1\analysis.md` (lines 18-31: Turno Vespertino 10 courses with 172 inscriptos; lines 126-157: 11-column Parte General paper form layout).
   - `d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_2\analysis.md` (lines 90-256: PostgreSQL DDL schemas, generated columns, validation triggers, audit triggers, and RPC functions).
   - `d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_3\analysis.md` (lines 220-245: Daily summary table specification; lines 370-386: Edge cases E-01 to E-12).

2. **Database Engine Requirements**:
   - PostgreSQL 15+ hosted on Supabase.
   - 7 core tables: `shifts`, `profiles`, `courses`, `course_assignments`, `attendance_records`, `staff_absences`, `attendance_audit_logs`.
   - Custom enums: `user_role` (`'administrador'`, `'preceptor'`, `'profesor'`), `course_cycle` (`'basico'`, `'superior'`, `'tecnico_especial'`), `technical_orientation` (`'TECQU'`, `'TECMM'`, `'TECET'`, `'C.TEC.MMO'`, `'construcciones'`, `'electromecanica'`, `'quimica'`, `'computacion'`, `'ciclo_basico'`, `'otra'`), `attendance_status` (`'presente'`, `'ausente_justificado'`, `'ausente_injustificado'`, `'comision_servicio'`, `'licencia'`, `'guardia'`, `'submitted'`, `'draft'`).
   - Stored generated columns: `courses.inscriptos_total` (`inscriptos_varones + inscriptos_mujeres`), `attendance_records.total_presentes` (`presentes_varones + presentes_mujeres`), `attendance_records.total_ausentes` (`ausentes_varones + ausentes_mujeres`), `attendance_records.total_matricula` (`presentes_varones + ausentes_varones + presentes_mujeres + ausentes_mujeres`), `attendance_records.snapshot_inscriptos_total` (`snapshot_inscriptos_v + snapshot_inscriptos_m`).
   - Mathematical trigger: `trg_validate_and_snapshot_attendance` enforcing $(P_V + A_V = I_V)$ and $(P_M + A_M = I_M)$ on `attendance_records`.
   - Historical snapshotting: `snapshot_inscriptos_v`, `snapshot_inscriptos_m` to isolate historical attendance from future course enrollment updates.
   - Auditing: `attendance_audit_logs` tracking JSONB diffs for all `attendance_records` changes.

---

## 2. Logic Chain

1. **Relational Integrity & Foreign Keys (Observation 1, 2)**:
   - `profiles.id` references `auth.users(id)` with `ON DELETE CASCADE`. When an auth user is removed, their profile is automatically cleaned up.
   - `course_assignments` has foreign keys to `profiles(id)` and `courses(id)` with `ON DELETE CASCADE` and a composite unique constraint `(user_id, course_id)`.
   - `attendance_records` references `courses(id)` and `shifts(id)` with `ON DELETE RESTRICT`. This prevents accidental deletion of shifts or courses with historical records.
   - User attribution columns (`created_by`, `updated_by`, `changed_by`) reference `profiles(id)` with `ON DELETE SET NULL`, ensuring attendance and audit history survive employee departures.

2. **Generated Columns for Deterministic Aggregation (Observation 1, 2)**:
   - Defining `inscriptos_total`, `total_presentes`, `total_ausentes`, and `total_matricula` as `GENERATED ALWAYS AS (...) STORED` guarantees that all queries, views, and clients observe exact mathematical sums without redundant client-side calculation.

3. **Dual-Gender Invariant Validation (Observation 1, 2)**:
   - The trigger `fn_validate_and_snapshot_attendance` executes `BEFORE INSERT OR UPDATE`. It loads the current course enrollment if snapshot values are not set, and verifies $P_V + A_V = I_V$ and $P_M + A_M = I_M$. Any mismatch aborts the transaction with a clear error message.

4. **Forensic Auditing (Observation 1, 2)**:
   - The trigger `fn_audit_attendance_changes` records old and new row states in JSONB, satisfying institutional accountability and data retention compliance.

---

## 3. Caveats

1. **Supabase Auth Hook Configuration**:
   - The trigger `trg_on_auth_user_created` operates on table `auth.users`. In Supabase local migrations, this requires permissions on the `auth` schema or standard Supabase Auth trigger installation.
2. **Date Locking Logic**:
   - Date-based edit locking for teachers (restricting past day modifications) is handled via RLS policies and application layer checks; administrators and preceptors retain override capabilities.

---

## 4. Conclusion

A complete, production-ready PostgreSQL DDL blueprint has been designed, validated, and documented in `d:\CanY\PROYECTOS CANY\App colegio\.agents\m1_explorer_1\analysis.md`. The DDL contains:
- 4 Custom ENUM types.
- 7 Core tables with strict constraints, generated columns, and foreign keys.
- 10 Performance-optimized indexes covering all foreign keys and dashboard filters.
- 3 Security Definer triggers for mathematical validation, auth profile syncing, and audit logging.
- 1 Optimized stored procedure (`fn_get_shift_parte_general`) for paper-matching tabular aggregations.

The blueprint is ready for immediate incorporation into `supabase/migrations/20260820000000_m1_database_and_auth.sql`.

---

## 5. Verification Method

To independently verify the schema:
1. Inspect the complete DDL in `d:\CanY\PROYECTOS CANY\App colegio\.agents\m1_explorer_1\analysis.md` (Sections 3, 4, 5, and 8).
2. Execute the verification matrix defined in Section 9 of `analysis.md`:
   - Test V-01: Insert a course with $I_V=11, I_M=4$; verify $I_T=15$.
   - Test V-02: Insert attendance record with $P_V=10, A_V=1, P_M=4, A_M=0$; verify $P_T=14, A_T=1, M_T=15$.
   - Test V-03: Attempt insert with $P_V=8, A_V=1, P_M=4, A_M=0$; verify trigger aborts with exception.
   - Test V-05: Insert duplicate `(course_id, date)`; verify unique constraint violation.
   - Test V-06: Update attendance record; verify log generated in `attendance_audit_logs`.
