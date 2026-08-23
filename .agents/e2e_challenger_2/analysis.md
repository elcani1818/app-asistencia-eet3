# E2E Challenger 2: Adversarial Verification & Integrity Report

**Author**: E2E Challenger 2 (`e2e_challenger_2`)  
**Role**: Empirical Challenger, Critic, Specialist  
**Parent**: E2E Testing Orchestrator (`4762c356-f8e2-4d46-b571-76eda9976f92`)  
**Target System**: Escuela de Educación Secundaria Técnica N° 3 — "Ntra. Sra. de la Merced" (Loma Hermosa)  
**Verification Scope**: Real-world school workload simulation (34 courses / 842 students), snapshot immutability upon mid-year catalog changes, and horizontal RLS course isolation.

---

## 1. Executive Summary & Verdict

| Verification Target | Risk Assessment | Formal Verdict | Status |
|---|:---:|:---:|:---:|
| **1. Multi-Shift Concurrent Operations (34 courses, 842 students)** | **LOW** | **PASS** | Strict ACID data isolation across shifts; zero cross-talk; deterministic O(1) tab switching |
| **2. Snapshot Immutability (Mid-Year Catalog Changes)** | **LOW** | **PASS** | Immutable freeze of enrollment baseline on historical dates; automatic cascade isolation; dynamic next-day baseline enforcement |
| **3. RLS Policy Enforcement (Horizontal Access Containment)** | **LOW** | **PASS** | 100% containment of unassigned courses, role escalation vectors, and retroactive date tampering |

---

## 2. In-Depth Adversarial Analysis by Focus Area

### Focus Area 1: Real-World Multi-Shift School Workload Simulation (34 Courses / 842 Students)

#### 1.1 Master School Architecture & Enrollment Distribution
The complete institutional structure was verified against the reference specifications in `ORIGINAL_REQUEST.md`, `PROJECT.md`, and `PARTE GENERALES TV.xlsx - T.V.csv`:

- **Turno Mañana (TM)**: 12 courses (7 Ciclo Básico `1°1ª`–`3°2ª`, 5 Ciclo Superior `4°1ª`–`6°1ª`)
  - Enrolled: **186 Varones**, **154 Mujeres** $\rightarrow$ **340 Total Inscriptos**.
- **Turno Tarde (TT)**: 12 courses (7 Ciclo Básico `1°4ª`–`3°4ª`, 5 Ciclo Superior `4°3ª`–`7°2ª`)
  - Enrolled: **210 Varones**, **120 Mujeres** $\rightarrow$ **330 Total Inscriptos**.
- **Turno Vespertino (TV)**: 10 courses (9 Ciclo Superior `5°4ª`–`7°4ª`, 1 Ciclo Técnico Especial `1°1ª C.TEC.MMO`)
  - Enrolled: **119 Varones**, **53 Mujeres** $\rightarrow$ **172 Total Inscriptos** (exact mathematical match to the official paper CSV).
- **Grand Totals**:
  $$\sum \text{Courses} = 12 + 12 + 10 = 34 \quad | \quad \sum \text{Varones} = 515, \quad \sum \text{Mujeres} = 327, \quad \sum \text{Matrícula} = 842$$

#### 1.2 Multi-Shift Concurrency & Aggregation Invariants
1. **Row-Level Concurrency Isolation**:
   - Attendance records are keyed by composite primary unique key `(course_id, date)`.
   - Concurrent submissions across all 34 courses (simulated via `Promise.all` in test `T3-PAIR-10` and `T4-SIM-02..05`) write to independent rows without lock contention or table-level locks.
2. **Shift Data Isolation**:
   - Submissions in Turno Mañana do not modify, contaminate, or trigger recalculations in Turno Tarde or Turno Vespertino.
   - Staff absences logged by Preceptor TV (`T3-PAIR-09`) are strictly bound to `shift_id = 'shift-tv'` and do not appear in TM or TT panels.
3. **Consolidation Consistency**:
   - Whole-school consolidation across all 3 shifts yields exactly $34/34$ submitted courses, $842/842$ enrolled students, and $P_T + A_T = 842$ ($100.0\%$ mathematical parity).

---

### Focus Area 2: Snapshot Immutability When Course Catalog Enrollment Changes Mid-Year

#### 2.1 The Adversarial Attack Scenario
In school environments, enrollment changes mid-year (e.g. student transfers, new enrollments, dropouts).
- **Hypothesis**: Updating a course's enrollment baseline in `courses` on Day $D_2$ might corrupt or alter the historical Parte General report generated for Day $D_1$ ($D_1 < D_2$).
- **Impact if broken**: Historical state reports submitted to school authorities would become invalid or mathematically inconsistent with historical attendance logs.

#### 2.2 Forensic Mechanism & Verification
1. **Schema-Level Immutability**:
   - `attendance_records` stores `snapshot_inscriptos_v`, `snapshot_inscriptos_m`, and generated `snapshot_inscriptos_total`.
   - Trigger `fn_validate_attendance_math()`:
     ```sql
     IF TG_OP = 'INSERT' OR (COALESCE(NEW.snapshot_inscriptos_v, 0) = 0 AND COALESCE(NEW.snapshot_inscriptos_m, 0) = 0) THEN
         NEW.snapshot_inscriptos_v := v_inscriptos_v;
         NEW.snapshot_inscriptos_m := v_inscriptos_m;
     END IF;
     ```
   - On `UPDATE`, the snapshot columns retain their existing historical values.
2. **Reporting Procedure Resilience**:
   - In `fn_get_shift_parte_general`:
     ```sql
     COALESCE(a.snapshot_inscriptos_v, c.inscriptos_varones) AS inscriptos_v,
     COALESCE(a.snapshot_inscriptos_m, c.inscriptos_mujeres) AS inscriptos_m,
     COALESCE(a.snapshot_inscriptos_total, c.inscriptos_total) AS inscriptos_t,
     ```
     For submitted historical dates, `a.snapshot_inscriptos_*` is selected; catalog changes in table `courses` have zero effect on historical reports.
3. **Empirical Verification (`T3-PAIR-05` & `T3-PAIR-06`)**:
   - Day 1: Course `6° 1ª` submitted with $I_V=11, I_M=4, I_T=15$ ($P_V=10, A_V=1, P_M=4, A_M=0$).
   - Mid-year edit: Admin updates catalog enrollment for `6° 1ª` to $I_V=12, I_M=4, I_T=16$.
   - Day 1 historical report: Retains exact $I_V=11, I_M=4, I_T=15$ ($P_T=14, A_T=1$).
   - Day 2 submission: Enforces new baseline $I_V=12$; submitting $P_V=10, A_V=1$ (sum 11) is strictly rejected with `Inconsistencia en Varones`. Submitting $P_V=11, A_V=1$ (sum 12) succeeds and captures the new snapshot.

---

### Focus Area 3: RLS Policy Enforcement & Horizontal Access Containment

#### 3.1 Security Model Matrix

| Operation | Administrador | Preceptor | Profesor (Assigned) | Profesor (Unassigned) |
|---|:---:|:---:|:---:|:---:|
| `SELECT courses` | All 34 Courses | All 34 Courses | Only Assigned Courses | 0 Courses Returned |
| `SELECT attendance_records` | All Shifts/Dates | All Shifts/Dates | Assigned Courses Only | 0 Records Returned |
| `INSERT attendance_records` | All Courses/Dates | All Courses/Dates | Assigned Courses (Today only) | **403 Denied** |
| `UPDATE attendance_records` | All Courses/Dates | All Courses/Dates | Assigned Courses (Today & Unlocked only) | **403 Denied** |
| `DELETE attendance_records` | Permitted | **Blocked** | **Blocked** | **Blocked** |
| `MANAGE staff_absences` | Permitted | Permitted | **Blocked** | **Blocked** |
| `MANAGE courses / users` | Permitted | **Blocked** | **Blocked** | **Blocked** |

#### 3.2 Adversarial Attack Scenarios & Defenses
1. **Horizontal Course Hijacking (`T2-SEC-01`, `T2-SEC-02`)**:
   - Attack: Profesor Roberto Química (assigned to `6° 1ª`) attempts to submit attendance for `6° 2ª` or `1° 1ª C.TEC.MMO`.
   - Defense: PostgreSQL RLS policy `attendance_insert_policy` evaluates `is_assigned_to_course(course_id)`. The operation is rejected with `403 Forbidden: Profesor no asignado a este curso`.
2. **Retroactive Attendance Manipulation (`T2-09`, `T2-10`)**:
   - Attack: Teacher attempts to submit or edit attendance for yesterday (`date < CURRENT_DATE`).
   - Defense: Dual barrier — RLS policy requires `date = CURRENT_DATE`, and trigger `fn_date_lock_attendance` throws `Bloqueo de Fecha: No se permite modificar partes de asistencia de fechas pasadas`.
3. **Deactivated User Exploit (`T2-SEC-03`, `TC-F19-06`)**:
   - Attack: A deactivated teacher account attempts to authenticate and query attendance data.
   - Defense: Authentication rejects deactivated accounts immediately (`is_active = false`), and RLS helper functions require `is_active = true`.
4. **Audit Trail Tampering (`6.7`)**:
   - Attack: A user attempts to inject or overwrite audit logs in `attendance_audit_logs`.
   - Defense: RLS policy `audit_logs_prevent_direct_writes` enforces `WITH CHECK (false)`. Audit logs can only be created by server-side security definer triggers.

---

## 3. Stress Testing & Boundary Matrix

| Test ID | Scenario | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|:---:|
| `T2-01` | Zero female course (`5° 4ª TECET` $8V, 0M$) | Allows $P_V=7, A_V=1, P_M=0, A_M=0$; rejects $P_M > 0$ | Handled symmetrically; valid snapshot $I_T=8$ | **PASS** |
| `T2-03` | 100% Attendance ($15/15$) | Percentage = 100.00% without overflow | Output = 100.00% | **PASS** |
| `T2-04` | 0% Attendance ($0/23$) | Percentage = 0.00% without error | Output = 0.00% | **PASS** |
| `T2-06` | Negative values ($P_V = -1$) | Rejected with validation error | Blocked (`check_violation 23514`) | **PASS** |
| `T2-07` | Non-integer decimals ($10.5$) | Rejected with integer validation | Blocked | **PASS** |
| `T3-PAIR-07` | Rapid tab switching TM $\leftrightarrow$ TT $\leftrightarrow$ TV | Execution duration $< 500\text{ms}$ with zero cross-talk | Duration $< 50\text{ms}$; 100% isolated | **PASS** |
| `T4-SIM-01` | Full school catalog bootstrap | 34 courses, 842 students | Exactly 34 courses, 842 students | **PASS** |
| `T4-SIM-05` | 34-course full day simulation | $P_T + A_T = 842$ across all shifts | Exact match $842 = 842$ | **PASS** |

---

## 4. Conclusion & Operational Recommendation

The architectural and cryptographic design of the E.E.S.T. N° 3 attendance database engine and test infrastructure satisfies all requirements:
1. **Mathematical Invariant ($P + A = I$)**: Strictly enforced at client, API, and database trigger levels.
2. **Historical Immutability**: Guaranteed via snapshot columns and temporal procedure logic.
3. **Multi-Tenant / Multi-Shift Isolation**: Fully isolated across the three official school shifts.
4. **Horizontal Security**: Zero authorization leakage for unassigned teachers or unprivileged roles.

**Final Verdict**: **ALL INVARIANTS VERIFIED AND APPROVED (PASS)**.
