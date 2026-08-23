# E2E Test Suite Specification: Tiers 2, 3, 4 & Export Workload Specialist

**Project**: Sistema de Gestión de Asistencia y Parte General Diario  
**Institution**: Escuela de Educación Secundaria Técnica N° 3 "Ntra. Sra. de la Merced" (Loma Hermosa)  
**Author**: E2E Explorer 3 (Tiers 2, 3, 4 & Export Workload Specialist)  
**Parent Orchestrator**: E2E Testing Orchestrator (`4762c356-f8e2-4d46-b571-76eda9976f92`)  
**Date**: 2026-08-20  
**Version**: 1.0.0-SPEC-PROD  

---

## 1. Executive Summary

This document provides the authoritative, exhaustive E2E test specifications for **Tier 2 (Boundary & Corner Cases)**, **Tier 3 (Pairwise & System Interactions)**, **Tier 4 (Real-World Multi-Shift School Workload)**, and **Export Engine Fidelity Verification (.xlsx and .pdf)** for the E.E.S.T. N° 3 Attendance System.

The test design ensures that:
1. **Mathematical and logical boundaries** (zero enrolled females, 0%/100% attendance, decimals, negatives, disparity detection, calendar transitions, and role escalation) are rigorously blocked and handled cleanly.
2. **Cross-feature interactions** (real-time teacher-to-admin broadcasting, historical snapshot preservation during catalog edits, instant multi-shift filtering, and whole-school consolidation) function seamlessly under concurrent operations.
3. **Real-world school workflows** simulating 34 courses across 3 shifts (Turno Mañana, Turno Tarde, Turno Vespertino), dozens of teachers, preceptors, staff absences, and end-of-day reports execute without state corruption or data loss.
4. **Excel and PDF exports** are validated not only at the file-generation level, but down to binary container headers, exact cell coordinates (`A1:K25`), dynamic Excel formulas (`=SUM(C7:C16)`), PDF string streams, page geometries, and institutional signature lines matching the original paper sheet (`PARTE GENERALES TV.xlsx - T.V.csv` / PDF).

---

## 2. Tier 2: Boundary & Corner Case Test Specifications

### 2.1 Zero Enrolled Females & Asymmetric Gender Distributions

#### Context & Real-World Baseline
In technical secondary schools, technical orientations often exhibit asymmetric gender enrollment. As verified in `PARTE GENERALES TV.xlsx - T.V.csv`:
- `5° 4° TECET`: 8 Varones, 0 Mujeres (`-` in CSV), 8 Total Inscriptos.
- `6° 4° TECET`: 6 Varones, 0 Mujeres (`-` in CSV), 6 Total Inscriptos.
- `7° 4° TECET`: 8 Varones, 0 Mujeres (`-` in CSV), 8 Total Inscriptos.

#### Test Specification: `T2-BOUND-01` (Zero Female Course Input & Validation)
- **Input Preconditions**: Course `5° 4° TECET` loaded ($I_V = 8, I_M = 0, I_T = 8$).
- **Test Actions**:
  1. Verify the UI/API loads $I_M = 0$. The Mujeres input fields must either default to $0$ or be locked to $0$.
  2. Input valid male counts: $P_V = 7, A_V = 1$ ($7 + 1 = 8$).
  3. Keep female counts: $P_M = 0, A_M = 0$ ($0 + 0 = 0$).
  4. Verify validation passes: $\Delta_V = 0, \Delta_M = 0, \text{isValid} = \text{true}$.
  5. Attempt to input $P_M = 1, A_M = 0$.
  6. Verify validation fails immediately: $\Delta_M = 1$, submit button hard-disabled, error message: *"Inconsistencia en Mujeres: Presentes (1) + Ausentes (0) <> Inscriptos (0)"*.
  7. Reset $P_M = 0, A_M = 0$, submit attendance, and verify stored record:
     $$P_V=7, P_M=0, P_T=7, A_V=1, A_M=0, A_T=1, \%Asistencia = 87.50\%$$

#### Test Specification: `T2-BOUND-02` (Zero Male Course or All-Female Division)
- **Input Preconditions**: Special synthetic course created: `4° 1° TECQU-FEM` ($I_V = 0, I_M = 25, I_T = 25$).
- **Test Actions**:
  1. Verify $I_V = 0$ behaves symmetrically: $P_V = 0, A_V = 0$ is valid; any $P_V > 0$ triggers $\Delta_V > 0$ blocking.
  2. Enter $P_M = 25, A_M = 0 \rightarrow$ Valid, $\%Asistencia = 100.0\%$.

---

### 2.2 Attendance Extremes: 100% Attendance & 0% Attendance

#### Test Specification: `T2-BOUND-03` (100% Full Attendance)
- **Course**: `6° 1° TECQU` ($I_V = 11, I_M = 4, I_T = 15$).
- **Test Actions**:
  1. Trigger "Todos Presentes" quick-fill action or input: $P_V = 11, A_V = 0, P_M = 4, A_M = 0$.
  2. Validate calculations:
     - $P_T = 11 + 4 = 15$
     - $A_V = 0, A_M = 0, A_T = 0$
     - $\%Asistencia = \frac{15}{15} \times 100 = 100.00\%$
     - $\%Ausentismo = \frac{0}{15} \times 100 = 0.00\%$
  3. Verify zero division edge cases do not occur.
  4. Submit and verify dashboard and export displays $100.0\%$ without formatting glitches.

#### Test Specification: `T2-BOUND-04` (0% Total Absenteeism / School Closure Simulation)
- **Course**: `6° 2° TECMM` ($I_V = 9, I_M = 14, I_T = 23$).
- **Test Actions**:
  1. Input: $P_V = 0, A_V = 9, P_M = 0, A_M = 14$.
  2. Validate calculations:
     - $P_T = 0, A_T = 23$
     - $\%Asistencia = \frac{0}{23} \times 100 = 0.00\%$
     - $\%Ausentismo = 100.00\%$
  3. In `observaciones`, append *"Jornada institucional / Alumnos afectados a actividad exterior"*.
  4. Submit and verify DB constraint accepts $0$ presentes and stores cleanly.

---

### 2.3 Maximum & Scaled Enrollment Boundaries

#### Test Specification: `T2-BOUND-05` (Large Course Enrollment Limits)
- **Course**: `1° 1° Ciclo Básico` ($I_V = 25, I_M = 25, I_T = 50$).
- **Test Actions**:
  1. Verify inputs handle high values ($P_V = 24, A_V = 1, P_M = 23, A_M = 2$).
  2. Verify DB column data types (`INT` / `SMALLINT`) prevent integer overflow while accommodating standard educational cohort sizes up to 100 per division.
  3. Verify totals row calculation properly sums without truncation or layout overflow on UI tables and PDF cells.

---

### 2.4 Numeric Integrity: Negative & Decimal Rejection

#### Test Specification: `T2-BOUND-06` (Negative Value Hard Rejection)
- **Vectors**: $P_V = -1$, $A_V = -5$, $P_M = -10$, $A_M = -0.5$.
- **Validation Layers Tested**:
  1. **HTML/Client Input Layer**: `min="0"`, `pattern="[0-9]*"`, UI steppers prevent decrement below 0.
  2. **TypeScript Calculation Engine Layer**: `validateAttendanceRow()` rejects negative values with `isValid = false, errorMessage = "Los valores no pueden ser negativos"`.
  3. **PostgreSQL Schema Constraints**: Table check constraints `CHECK (presentes_varones >= 0)`, `CHECK (ausentes_varones >= 0)`, `CHECK (presentes_mujeres >= 0)`, `CHECK (ausentes_mujeres >= 0)`.
- **Expected Result**: Attempting an API payload with negative numbers raises PostgreSQL check constraint violation `23514` (`check_violation`).

#### Test Specification: `T2-BOUND-07` (Decimal & Floating-Point Rejection)
- **Vectors**: $P_V = 10.5, A_V = 0.5$ (Sum = 11), $P_M = 2.2, A_M = 1.8$ (Sum = 4).
- **Validation Layers Tested**:
  1. Integer parsing (`Number.isInteger()`, `Math.floor()`, or regex `^\d+$`).
  2. PostgreSQL column type is `INT` / `INTEGER` (not `FLOAT` or `NUMERIC`), rejecting non-integer SQL parameters.
- **Expected Result**: System rejects decimal numbers with *"Los valores deben ser números enteros"*.

---

### 2.5 Mathematical Disparity Engine Validation Matrix

The core integrity rule of the system is:
$$\Delta_V = (P_V + A_V) - I_V = 0$$
$$\Delta_M = (P_M + A_M) - I_M = 0$$

#### Comprehensive Disparity Test Matrix

| Case ID | Course Baseline ($I_V, I_M$) | Input ($P_V, A_V, P_M, A_M$) | $\Delta_V$ | $\Delta_M$ | Varones Valid | Mujeres Valid | Overall Valid | Expected Error / Warning Message |
|---|---|---|:---:|:---:|:---:|:---:|:---:|---|
| **DISP-01** | $I_V=11, I_M=4$ (6°1°) | $P_V=10, A_V=1, P_M=4, A_M=0$ | $0$ | $0$ | ✅ TRUE | ✅ TRUE | ✅ **VALID** | None (Ready to submit) |
| **DISP-02** | $I_V=11, I_M=4$ (6°1°) | $P_V=9, A_V=1, P_M=4, A_M=0$ | $-1$ | $0$ | ❌ FALSE | ✅ TRUE | ❌ **BLOCKED** | *"Varones: Faltan 1 para completar los 11 inscriptos"* |
| **DISP-03** | $I_V=11, I_M=4$ (6°1°) | $P_V=11, A_V=1, P_M=4, A_M=0$ | $+1$ | $0$ | ❌ FALSE | ✅ TRUE | ❌ **BLOCKED** | *"Varones: Sobran 1 (suma 12 de 11 inscriptos)"* |
| **DISP-04** | $I_V=11, I_M=4$ (6°1°) | $P_V=10, A_V=1, P_M=3, A_M=0$ | $0$ | $-1$ | ✅ TRUE | ❌ FALSE | ❌ **BLOCKED** | *"Mujeres: Faltan 1 para completar las 4 inscriptas"* |
| **DISP-05** | $I_V=11, I_M=4$ (6°1°) | $P_V=10, A_V=1, P_M=4, A_M=1$ | $0$ | $+1$ | ✅ TRUE | ❌ FALSE | ❌ **BLOCKED** | *"Mujeres: Sobran 1 (suma 5 de 4 inscriptas)"* |
| **DISP-06** | $I_V=11, I_M=4$ (6°1°) | $P_V=8, A_V=1, P_M=2, A_M=1$ | $-2$ | $-1$ | ❌ FALSE | ❌ FALSE | ❌ **BLOCKED** | *"Varones: Faltan 2; Mujeres: Faltan 1"* |
| **DISP-07** | $I_V=11, I_M=4$ (6°1°) | $P_V=12, A_V=1, P_M=5, A_M=1$ | $+2$ | $+2$ | ❌ FALSE | ❌ FALSE | ❌ **BLOCKED** | *"Varones: Sobran 2; Mujeres: Sobran 2"* |
| **DISP-08** | $I_V=20, I_M=7$ (1°1° CTEC) | $P_V=0, A_V=0, P_M=0, A_M=0$ | $-20$ | $-7$ | ❌ FALSE | ❌ FALSE | ❌ **BLOCKED** | *"Complete la asistencia del curso"* |
| **DISP-09** | $I_V=8, I_M=0$ (5°4°) | $P_V=8, A_V=0, P_M=0, A_M=0$ | $0$ | $0$ | ✅ TRUE | ✅ TRUE | ✅ **VALID** | None (Zero-female valid case) |
| **DISP-10** | $I_V=8, I_M=0$ (5°4°) | $P_V=8, A_V=0, P_M=1, A_M=0$ | $0$ | $+1$ | ✅ TRUE | ❌ FALSE | ❌ **BLOCKED** | *"Mujeres: Sobran 1 (curso sin mujeres inscriptas)"* |

---

### 2.6 Calendar, Date Boundaries & Temporal Transitions

#### Test Specification: `T2-DATE-01` (Leap Year & February 29 Transitions)
- **Target Dates**: `2024-02-29` (Valid leap day), `2025-02-28` $\rightarrow$ `2025-03-01` (Non-leap transition), `2028-02-29` (Future leap day).
- **Test Actions**:
  1. Set client date to `2024-02-29`. Verify system parses date without NaN or timezone shifting to March 1.
  2. Verify historical query on `2024-02-29` returns records for that exact date.
  3. Verify date display in Spanish: *"LOMA HERMOSA, 29 de Febrero de 2024"*.
  4. Attempt invalid date `2025-02-29` in API payload $\rightarrow$ PostgreSQL raises `22008` (`datetime_field_overflow`).

#### Test Specification: `T2-DATE-02` (Month & Year Boundaries)
- **Target Dates**: `2026-08-31` $\rightarrow$ `2026-09-01`, `2026-12-31` $\rightarrow$ `2027-01-01`.
- **Test Actions**:
  1. Submit attendance for `2026-08-31`. Verify analytics filters include last day of August.
  2. Submit attendance for `2026-09-01`. Verify shift aggregation isolates August from September while date-range trend charts smoothly connect both points.
  3. Year transition `2026-12-31` to `2027-01-01`: Verify annual summary and month indexing.

#### Test Specification: `T2-DATE-03` (Past Date Read-Only Enactment & 23:59:59 Boundary)
- **Actors**: `Profesor` vs `Administrador` / `Preceptor`.
- **Test Actions**:
  1. Teacher logs in and navigates to `date = CURRENT_DATE - 1 day` (Yesterday).
  2. Verify:
     - Form fields are `disabled`.
     - Read-only banner is displayed: *"Registro histórico archivado — Solo lectura"*.
     - Save button is hidden/disabled.
     - Direct API call `UPDATE attendance_records SET presentes_varones = X WHERE date = <yesterday>` with Teacher JWT is rejected by RLS policy `Attendance update policy` (`date = CURRENT_DATE AND is_locked = false`).
  3. Preceptor or Administrator logs in and navigates to `date = CURRENT_DATE - 1 day`.
  4. Verify:
     - Preceptor/Admin can view and edit historical records.
     - RLS policy `public.is_admin_or_preceptor()` allows update.
  5. Midnight transition simulation (23:59:59 $\rightarrow$ 00:00:01):
     - At 23:59:59, Teacher can submit/edit today's record.
     - At 00:00:01 (next calendar day), previous record becomes locked for Teacher; new day defaults to fresh unsubmitted form.

---

### 2.7 Role Escalation, Permission Boundaries & Security Attack Scenarios

#### Test Specification: `T2-SEC-01` (Teacher Horizontal Course Access Attack)
- **Scenario**: Teacher A is assigned strictly to `6° 1° TECQU` (Course ID: `UUID-6-1`). Teacher B is assigned to `6° 2° TECMM` (Course ID: `UUID-6-2`).
- **Attack Vector 1 (UI Level)**: Teacher A tampers with URL to `/attendance?course_id=UUID-6-2`.
  - **Expected Result**: System verifies `is_assigned_to_course(UUID-6-2)`. UI displays access denied notice and automatically selects Teacher A's assigned course `UUID-6-1`.
- **Attack Vector 2 (Direct Supabase REST / GraphQL / RLS Level)**: Teacher A sends authenticated `INSERT` or `UPDATE` request for `UUID-6-2`:
  ```http
  POST /rest/v1/attendance_records
  Authorization: Bearer <Teacher_A_JWT>
  { "course_id": "UUID-6-2", "date": "2026-08-20", "presentes_varones": 8, ... }
  ```
  - **Expected Result**: PostgreSQL RLS blocks the operation (0 rows affected / 403 Forbidden). `public.is_assigned_to_course(course_id)` evaluates to `FALSE`.

#### Test Specification: `T2-SEC-02` (Teacher Privilege Escalation to Admin/Preceptor)
- **Attack Vector**: Teacher attempts to update their own role in `public.profiles`:
  ```http
  PATCH /rest/v1/profiles?id=eq.<Teacher_A_UUID>
  Authorization: Bearer <Teacher_A_JWT>
  { "role": "administrador" }
  ```
  - **Expected Result**: RLS policy `"Users can update their own contact info"` enforces:
    `WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()))`.
    The role modification is rejected or silently ignored.

#### Test Specification: `T2-SEC-03` (Preceptor Course Catalog Tampering)
- **Scenario**: Preceptor attempts to delete a course or alter enrollment numbers in `public.courses`.
- **Expected Result**: Policy `"Courses manageable only by admin"` checks `public.is_admin()`. Operation is blocked for Preceptor role.

#### Test Specification: `T2-SEC-04` (Deactivated User Lockout)
- **Scenario**: Admin marks a user profile `is_active = false`.
- **Expected Result**: Subsequent API requests fail RLS checks (`is_active = true` required in helper functions `is_admin()`, `is_preceptor()`). The frontend terminates session and redirects to `/login` with *"Usuario inactivo. Comuníquese con la administración"*.

---

## 3. Tier 3: Pairwise Combinations & Realtime Integrations

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 TIER 3 PAIRWISE ARCHITECTURE                                │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

  [ Teacher Client ]                     [ Supabase Backend ]                 [ Admin Dashboard ]
          │                                        │                                   │
          │── 1. Submit 6°1° (P:14, A:1) ─────────>│                                   │
          │                                        │── 2. Postgres Change (Realtime) ─>│
          │                                        │                                   │── 3. Update Row:
          │                                        │                                   │      6°1° -> Cargado
          │                                        │                                   │── 4. Recompute Totals:
          │                                        │                                   │      P_T: 14/15 -> +14
          │                                        │                                   │── 5. Redraw Recharts
          │                                        │                                   │
```

### 3.1 Pairwise Flow A: Teacher Submit $\rightarrow$ Admin Realtime View & Aggregation Sync

#### Test Specification: `T3-PAIR-01` (Live Realtime Propagation)
1. **Initial State**:
   - Admin opens `/dashboard` for Turno Vespertino on `2026-08-20`.
   - All 10 courses show `status: "Pendiente"`.
   - Totals row: Total Inscriptos = `172`, Total Presentes = `0`, Total Ausentes = `0`, $\%Asistencia = 0.0\%$, Progress = `0/10`.
2. **Action**:
   - Teacher Juan Pérez submits attendance for `6° 1° TECQU` ($P_V=10, A_V=1, P_M=4, A_M=0$, Total Presentes = 14, Total Ausentes = 1).
3. **Assertions on Admin Dashboard (Without page reload)**:
   - Row `6° 1° TECQU` transitions to `status: "Cargado"` with badge `✅ Cargado`.
   - Cells update: $P_V=10, P_M=4, P_T=14, A_V=1, A_M=0, A_T=1, \%Asist=93.3\%$.
   - Bottom Totals Row updates dynamically:
     * Total Presentes V: $0 \rightarrow 10$
     * Total Presentes M: $0 \rightarrow 4$
     * Total Presentes T: $0 \rightarrow 14$
     * Total Ausentes V: $0 \rightarrow 1$
     * Total Ausentes M: $0 \rightarrow 0$
     * Total Ausentes T: $0 \rightarrow 1$
     * Overall $\%Asistencia$: $\frac{14}{172} \times 100 = 8.14\%$
     * Progress widget: `1 / 10 Cursos Cargados (10%)`.
   - Recharts Trend chart receives new live point for today.

---

### 3.2 Pairwise Flow B: Course Enrollment Update $\rightarrow$ Attendance Snapshot Preservation

#### Critical Architectural Requirement
When an administrator modifies a course's enrollment (e.g. a student transfers in or out mid-year), past attendance records must **never** recalculate or become mathematically invalid. The `attendance_records` table stores `inscriptos_varones_snapshot` and `inscriptos_mujeres_snapshot`.

#### Test Specification: `T3-PAIR-02` (Historical Snapshot Integrity)
1. **Step 1 (Day 1 - 2026-08-19)**:
   - Course `6° 1° TECQU` enrollment is $I_V = 11, I_M = 4, I_T = 15$.
   - Teacher submits Day 1 attendance: $P_V = 10, A_V = 1, P_M = 4, A_M = 0$.
   - Verify DB stores:
     - `inscriptos_varones_snapshot = 11`
     - `inscriptos_mujeres_snapshot = 4`
     - `inscriptos_total_snapshot = 15`
2. **Step 2 (Day 2 - Admin Updates Catalog)**:
   - Admin goes to `/admin/courses` and edits `6° 1° TECQU`.
   - New student enrolls: $I_V$ updated from $11 \rightarrow 12$. Now $I_V = 12, I_M = 4, I_T = 16$.
   - `courses` table now has `inscriptos_varones = 12`.
3. **Step 3 (Historical Verification on Day 1)**:
   - Admin/Preceptor queries `/dashboard` or exports PDF for Day 1 (`2026-08-19`).
   - **Assertion**: Row `6° 1°` on Day 1 **MUST still display** $I_V = 11, I_M = 4, I_T = 15$, $P_T = 14, A_T = 1$, and remain mathematically valid ($10 + 1 = 11$).
   - Totals for Day 1 must calculate against $172$ (not $173$).
4. **Step 4 (New Submission on Day 2 - 2026-08-20)**:
   - Teacher opens form for Day 2.
   - Form pre-populates new enrollment: $I_V = 12, I_M = 4, I_T = 16$.
   - Entering old sum $P_V = 10, A_V = 1$ ($= 11$) is now rejected with $\Delta_V = -1$.
   - Teacher enters $P_V = 11, A_V = 1$ ($= 12$) and $P_M = 4, A_M = 0$ ($= 4$).
   - Record saves with new snapshots ($I_V=12, I_M=4, I_T=16$).

---

### 3.3 Pairwise Flow C: Shift Switcher $\rightarrow$ Instant Table, KPI & Chart Recalculation

#### Test Specification: `T3-PAIR-03` (Multi-Shift State Aggregation)
1. **Setup**:
   - Date: `2026-08-20`.
   - Turno Mañana: 12 courses loaded (340 inscriptos), 12 submitted (310 presentes).
   - Turno Tarde: 12 courses loaded (330 inscriptos), 6 submitted (150 presentes).
   - Turno Vespertino: 10 courses loaded (172 inscriptos), 10 submitted (155 presentes).
2. **Switch Actions & State Assertions**:
   - Click `[ Turno Mañana ]`:
     * Table displays 12 morning courses.
     * KPI Cards: Inscriptos = 340, Presentes = 310, Ausentes = 30, $\%Asistencia = 91.18\%$.
     * Course count: `12/12 Completado`.
   - Click `[ Turno Tarde ]`:
     * Table immediately updates to 12 afternoon courses.
     * KPI Cards: Inscriptos = 330, Presentes = 150, Ausentes = 20 (submitted portion), Course count: `6/12 Pendientes`.
   - Click `[ Turno Vespertino ]`:
     * Table immediately updates to 10 evening courses (`5°4°` to `1°1° C.TEC.MMO`).
     * KPI Cards: Inscriptos = 172, Presentes = 155, Ausentes = 17, $\%Asistencia = 90.12\%$.
   - Click `[ Resumen General (Todos los Turnos) ]`:
     * Total School Inscriptos: $340 + 330 + 172 = 842$.
     * Total School Presentes: $310 + 150 + 155 = 615$.
     * Total School Ausentes: $30 + 20 + 17 = 67$.
     * Overall School $\%Asistencia$: $\frac{615}{842} \times 100 = 73.04\%$ (considering partial afternoon).
3. **Performance Assertion**: Tab switching transitions under 50ms without UI flicker or state leaks.

---

### 3.4 Pairwise Flow D: Multi-Shift Daily Parte General Consolidation

#### Test Specification: `T3-PAIR-04` (Cross-Shift Isolation & Consolidated Reporting)
- **Isolation Check**: Submitting an attendance record or staff absence in Turno Vespertino must never leak into Turno Mañana or Turno Tarde query scopes.
- **Foreign Key Enforcement**: Attendance records validate that `shift_id` corresponds to the course's configured `shift_id`.

---

## 4. Tier 4: Real-World Multi-Shift School Workload Simulation

### 4.1 Complete School Master Catalog (34 Courses Across 3 Shifts)

To simulate a realistic, full-capacity school day at E.E.S.T. N° 3, the test harness defines the complete institutional catalog:

```
====================================================================================================
E.E.S.T. N° 3 "Ntra. Sra. de la Merced" - Complete Master Catalog (842 Enrolled Students)
====================================================================================================

TURNO MAÑANA (TM) - 12 Cursos, 340 Inscriptos:
 1. 1° 1ª Ciclo Básico     (I_V: 18, I_M: 12, I_T: 30)
 2. 1° 2ª Ciclo Básico     (I_V: 16, I_M: 14, I_T: 30)
 3. 1° 3ª Ciclo Básico     (I_V: 17, I_M: 11, I_T: 28)
 4. 2° 1ª Ciclo Básico     (I_V: 15, I_M: 13, I_T: 28)
 5. 2° 2ª Ciclo Básico     (I_V: 19, I_M: 10, I_T: 29)
 6. 3° 1ª Ciclo Básico     (I_V: 16, I_M: 12, I_T: 28)
 7. 3° 2ª Ciclo Básico     (I_V: 18, I_M: 10, I_T: 28)
 8. 4° 1ª TECQU (Química)  (I_V: 12, I_M: 16, I_T: 28)
 9. 4° 2ª TECMM (Const.)   (I_V: 16, I_M: 12, I_T: 28)
10. 5° 1ª TECQU (Química)  (I_V: 10, I_M: 18, I_T: 28)
11. 5° 2ª TECMM (Const.)   (I_V: 18, I_M: 10, I_T: 28)
12. 6° 1ª TECQU (Química)  (I_V: 11, I_M: 16, I_T: 27)
Subtotal TM: 186 Varones, 154 Mujeres, 340 Inscriptos

TURNO TARDE (TT) - 12 Cursos, 330 Inscriptos:
 1. 1° 4ª Ciclo Básico     (I_V: 16, I_M: 12, I_T: 28)
 2. 1° 5ª Ciclo Básico     (I_V: 15, I_M: 13, I_T: 28)
 3. 2° 3ª Ciclo Básico     (I_V: 18, I_M: 10, I_T: 28)
 4. 2° 4ª Ciclo Básico     (I_V: 17, I_M: 11, I_T: 28)
 5. 2° 5ª Ciclo Básico     (I_V: 16, I_M: 11, I_T: 27)
 6. 3° 3ª Ciclo Básico     (I_V: 19, I_M:  9, I_T: 28)
 7. 3° 4ª Ciclo Básico     (I_V: 15, I_M: 12, I_T: 27)
 8. 4° 3ª TECET (Electrom) (I_V: 24, I_M:  4, I_T: 28)
 9. 5° 3ª TECET (Electrom) (I_V: 23, I_M:  5, I_T: 28)
10. 6° 3ª TECET (Electrom) (I_V: 22, I_M:  5, I_T: 27)
11. 7° 1ª TECQU (Química)  (I_V:  8, I_M: 19, I_T: 27)
12. 7° 2ª TECMM (Const.)   (I_V: 17, I_M: 10, I_T: 27)
Subtotal TT: 210 Varones, 120 Mujeres, 330 Inscriptos

TURNO VESPERTINO (TV) - 10 Cursos Oficiales CSV, 172 Inscriptos:
 1. 5º 4º TECET (Electrom) (I_V:  8, I_M:  0, I_T:  8)
 2. 6º 1º TECQU (Química)  (I_V: 11, I_M:  4, I_T: 15)
 3. 6º 2º TECMM (Const.)   (I_V:  9, I_M: 14, I_T: 23)
 4. 6º 3º TECET (Electrom) (I_V: 23, I_M:  2, I_T: 25)
 5. 6º 4º TECET (Electrom) (I_V:  6, I_M:  0, I_T:  6)
 6. 7º 1º TECQU (Química)  (I_V:  5, I_M:  8, I_T: 13)
 7. 7º 2º TECMM (Const.)   (I_V:  9, I_M:  9, I_T: 18)
 8. 7º 3º TECET (Electrom) (I_V: 20, I_M:  9, I_T: 29)
 9. 7º 4º TECET (Electrom) (I_V:  8, I_M:  0, I_T:  8)
10. 1° 1° C.TEC.MMO        (I_V: 20, I_M:  7, I_T: 27)
Subtotal TV: 119 Varones, 53 Mujeres, 172 Inscriptos

TOTAL GENERAL ESCUELA: 34 Cursos, 515 Varones, 327 Mujeres, 842 Inscriptos
====================================================================================================
```

---

### 4.2 Timeline & Lifecycle of a Complete School Day Simulation

#### Test Specification: `T4-SIM-01` (End-to-End Daily Operational Run)

```
07:00 ── TM Preceptor Logs in ──> Checks 0/12 TM Submissions
07:30 ── 12 TM Teachers Submit Attendance & Observations
08:15 ── Preceptor logs 2 absent TM staff (Prof. Pérez - Art 114 a-1; Aux. Gómez)
12:30 ── TM Preceptor verifies 12/12 TM done ──> Exports TM Excel & PDF
13:00 ── TT Preceptor Logs in ──> Checks 0/12 TT Submissions
13:30 ── 11 TT Teachers Submit + 1 Preceptor Override for absent teacher
14:00 ── Preceptor logs 1 absent TT teacher (Prof. Rossi - Licencia Médica)
17:30 ── TT Preceptor verifies 12/12 TT done ──> Exports TT Excel & PDF
18:30 ── TV Preceptor Logs in ──> Verifies 10 Vespertino courses
19:00 ── 10 TV Teachers submit all 10 TV courses (matching CSV structure)
20:00 ── TV Preceptor logs 1 absent TV teacher (Prof. Martínez - Art 115)
22:30 ── Admin Logs in ──> Reviews Full School KPI Dashboard (34/34 courses)
22:45 ── Admin generates Consolidated Full School Daily Report (.xlsx & .pdf)
23:59 ── Day Close Simulation & Midnight Read-Only Lockout Transition
```

#### Detailed Simulation Checkpoints

| Phase | Time | Action | Expected State & Verification Points |
|---|---|---|---|
| **Phase 1** | `07:00 - 08:30` | Turno Mañana Execution | 12 morning attendance records created. TM Totals: Inscriptos 340, Presentes 312, Ausentes 28. 2 Staff Absences recorded. TM PDF/Excel exported. |
| **Phase 2** | `13:00 - 14:30` | Turno Tarde Execution | 12 afternoon attendance records created (1 via Preceptor fallback). TT Totals: Inscriptos 330, Presentes 298, Ausentes 32. 1 Staff Absence recorded. TT PDF/Excel exported. |
| **Phase 3** | `18:30 - 20:30` | Turno Vespertino Execution | 10 evening attendance records created. Exact match for `5°4°` ($8,0$), `6°1°` ($11,4$), ..., `1°1° C.TEC.MMO` ($20,7$). TV Totals: Inscriptos 119 V, 53 M, 172 T; Presentes 107 V, 48 M, 155 T; Ausentes 12 V, 5 M, 17 T. |
| **Phase 4** | `22:30` | Admin School-Wide Consolidation | Dashboard reports: $34/34$ courses submitted ($100\%$). Global Inscriptos = 842, Global Presentes = 765, Global Ausentes = 77, Global $\%Asistencia = 90.85\%$. |
| **Phase 5** | `22:45` | Institutional Export Fidelity | Both `.xlsx` and `.pdf` files generated for TV, TM, TT, and All-Shifts. Automated parser verifies all cell values and PDF byte streams. |
| **Phase 6** | `00:00` | Historical Lock Transition | Advance system clock to next day. All 34 records for previous day become immutable for teachers. |

---

## 5. Export Engine Validation Protocols: Exact Binary, Cell & Structural Verification

### 5.1 Excel (`.xlsx`) Export Validation Protocol

An `.xlsx` file is an OpenXML ZIP archive containing XML structures. The test engine validates both the raw container integrity and the parsed spreadsheet object model (`xlsx` / `exceljs`).

#### 5.1.1 MIME & ZIP Container Verification
1. **Magic Bytes**: File must start with `PK\x03\x04` (`50 4B 03 04`).
2. **ZIP Entries**: Archive must contain:
   - `[Content_Types].xml`
   - `_rels/.rels`
   - `xl/workbook.xml`
   - `xl/worksheets/sheet1.xml`
   - `xl/styles.xml`
3. **MIME Type**: Response headers must specify `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
4. **File Naming Convention**: `Parte_General_Vespertino_YYYY-MM-DD.xlsx` or `Parte_General_EEST3_YYYY-MM-DD.xlsx`.

#### 5.1.2 Sheet Geometry & Exact Cell Coordinate Mapping (Turno Vespertino)

```
┌──────┬──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Cell │ Expected Content / Rule                                                                          │
├──────┼──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ A1   │ "ESCUELA DE EDUCACIÓN SECUNDARIA TÉCNICA N° 3 \"Ntra. Sra. de la Merced\"" (Merged A1:K1, Bold)  │
│ A2   │ "PARTE GENERAL DE ALUMNOS" (Merged A2:K2, Bold, Centered)                                        │
│ A3   │ "LOMA HERMOSA, 20 de Agosto de 2026" (Merged A3:F3)                                              │
│ G3   │ "TURNO: VESPERTINO" (Merged G3:K3)                                                               │
│ A5   │ "CURSOS" (Merged A5:A6, Header Style)                                                            │
│ B5   │ "ORIENTACIÓN" (Merged B5:B6, Header Style)                                                       │
│ C5   │ "INSCRIPTOS" (Merged C5:E5, Centered Header)                                                     │
│ F5   │ "PRESENTES" (Merged F5:H5, Centered Header)                                                      │
│ I5   │ "AUSENTES" (Merged I5:K5, Centered Header)                                                       │
│ C6   │ "V" (Varones)                                                                                    │
│ D6   │ "M" (Mujeres)                                                                                    │
│ E6   │ "T" (Total)                                                                                      │
│ F6   │ "V" (Varones Presentes)                                                                          │
│ G6   │ "M" (Mujeres Presentes)                                                                          │
│ H6   │ "T" (Total Presentes)                                                                            │
│ I6   │ "V" (Varones Ausentes)                                                                           │
│ J6   │ "M" (Mujeres Ausentes)                                                                           │
│ K6   │ "T" (Total Ausentes)                                                                             │
├──────┴──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ DATA ROWS (Rows 7 to 16):                                                                               │
│ Row 7 : A7="5º 4º",  B7="TECET",     C7=8,  D7=0,  E7=8,  F7=7,  G7=0, H7=7,  I7=1, J7=0, K7=1          │
│ Row 8 : A8="6º 1º",  B8="TECQU",     C8=11, D8=4,  E8=15, F8=10, G8=4, H8=14, I8=1, J8=0, K8=1          │
│ Row 9 : A9="6º 2º",  B9="TECMM",     C9=9,  D9=14, E9=23, F9=8,  G9=12,H9=20, I9=1, J9=2, K9=3          │
│ Row 10: A10="6º 3º", B10="TECET",    C10=23,D10=2, E10=25,F10=21,G10=2,H10=23,I10=2,J10=0,K10=2        │
│ Row 11: A11="6º 4º", B11="TECET",    C11=6, D11=0, E11=6, F11=5, G11=0,H11=5, I11=1,J11=0,K11=1        │
│ Row 12: A12="7º 1º", B12="TECQU",    C12=5, D12=8, E12=13,F12=4, G12=8,H12=12,I12=1,J12=0,K12=1        │
│ Row 13: A13="7º 2º", B13="TECMM",    C13=9, D13=9, E13=18,F13=8, G13=8,H13=16,I13=1,J13=1,K13=2        │
│ Row 14: A14="7º 3º", B14="TECET",    C14=20,D14=9, E14=29,F14=18,G14=8,H14=26,I14=2,J14=1,K14=3        │
│ Row 15: A15="7º 4º", B15="TECET",    C15=8, D15=0, E15=8, F15=8, G15=0,H15=8, I15=0,J15=0,K15=0        │
│ Row 16: A16="1° 1°", B16="C.TEC.MMO",C16=20,D16=7, E16=27,F16=18,G16=6,H16=24,I16=2,J16=1,K16=3        │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ TOTALS ROW (Row 17):                                                                                    │
│ A17  │ "TOTAL" (Bold)                                                                                   │
│ C17  │ Formula: `=SUM(C7:C16)` (Evaluated value: 119)                                                   │
│ D17  │ Formula: `=SUM(D7:D16)` (Evaluated value: 53)                                                    │
│ E17  │ Formula: `=SUM(E7:E16)` or `=C17+D17` (Evaluated value: 172)                                     │
│ F17  │ Formula: `=SUM(F7:F16)` (Evaluated value: 107)                                                   │
│ G17  │ Formula: `=SUM(G7:G16)` (Evaluated value: 48)                                                    │
│ H17  │ Formula: `=SUM(H7:H16)` or `=F17+G17` (Evaluated value: 155)                                     │
│ I17  │ Formula: `=SUM(I7:I16)` (Evaluated value: 12)                                                    │
│ J17  │ Formula: `=SUM(J7:J16)` (Evaluated value: 5)                                                     │
│ K17  │ Formula: `=SUM(K7:K16)` or `=I17+J17` (Evaluated value: 17)                                      │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ FOOTER BLOCKS:                                                                                          │
│ A19  │ "OBSERVACIONES:" (Bold, merged A19:K19)                                                          │
│ A20  │ Content string of teacher/preceptor observations (Merged A20:K21)                                │
│ A23  │ "AUSENTE DE DOCENTES Y AUXILIARES:" (Bold, merged A23:K23)                                       │
│ A24  │ Absent staff table headers: `Agente / Nombre`, `Rol`, `Materia / Tarea`, `Motivo`                │
│ A25+ │ Absent staff detail rows                                                                         │
└──────┴──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### 5.1.3 Automated Test Validation Script for Excel
The test harness runs `exceljs` or `xlsx` in headless mode to assert:
```typescript
// Pseudo-code assertion in E2E runner:
const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
const sheet = workbook.Sheets['Parte General - Vespertino'] || workbook.Sheets[workbook.SheetNames[0]];

expect(sheet['A1'].v).toContain('ESCUELA DE EDUCACIÓN SECUNDARIA TÉCNICA N° 3');
expect(sheet['C17'].v).toBe(119); // Enrolled males sum
expect(sheet['D17'].v).toBe(53);  // Enrolled females sum
expect(sheet['E17'].v).toBe(172); // Total enrolled sum
expect(sheet['H17'].v).toBe(155); // Total present sum
expect(sheet['K17'].v).toBe(17);  // Total absent sum

// Formula verification
expect(sheet['C17'].f).toBe('SUM(C7:C16)');
expect(sheet['E17'].f).toMatch(/SUM\(E7:E16\)|C17\+D17/);
```

---

### 5.2 PDF (`.pdf`) Export Validation Protocol

The PDF export must produce an official printable document matching the layout of `PARTE GENERALES TV.xlsx - T.V.pdf`.

#### 5.2.1 Binary Header & Structure Checks
1. **Header**: File begins with `%PDF-1.` (e.g. `%PDF-1.4` or `%PDF-1.7`).
2. **EOF Marker**: File ends with `%%EOF\n` or `%%EOF\r\n`.
3. **Internal Objects**: Contains valid dictionary objects (`/Catalog`, `/Pages`, `/Font`, `/Contents`).

#### 5.2.2 Document Page Dimensions & Geometry
1. **Standard Format**: A4 Page (`595.28 x 841.89 pt` in Portrait, or `841.89 x 595.28 pt` in Landscape).
2. **Page Count**: Exactly 1 page for single-shift daily report; multi-page only when consolidated with complete staff lists.

#### 5.2.3 Exact String & Glyph Stream Verification
Using `pdf-parse` or PDF stream token extractor, the test suite asserts the verbatim presence of all required strings:

```typescript
const pdfData = await pdfParse(pdfBuffer);
const text = pdfData.text;

// Institutional Identity
expect(text).toContain('ESCUELA DE EDUCACIÓN SECUNDARIA TÉCNICA N° 3');
expect(text).toContain('Ntra. Sra. de la Merced');
expect(text).toContain('PARTE GENERAL');
expect(text).toContain('ALUMNOS');
expect(text).toContain('LOMA HERMOSA');

// Course Rows
expect(text).toContain('5º 4º');
expect(text).toContain('TECET');
expect(text).toContain('6º 1º');
expect(text).toContain('TECQU');
expect(text).toContain('1° 1°');
expect(text).toContain('C.TEC.MMO');

// Totals and Metrics
expect(text).toContain('119'); // Total Varones Inscriptos
expect(text).toContain('53');  // Total Mujeres Inscriptas
expect(text).toContain('172'); // Total Inscriptos
expect(text).toContain('TOTAL');

// Sections & Signatures
expect(text).toContain('OBSERVACIONES');
expect(text).toContain('AUSENTE DE DOCENTES Y AUXILIARES');
expect(text).toMatch(/Preceptor|Directivo/);
```

---

## 6. Complete Test Implementation Matrix & Executable Blueprints

### 6.1 Test Case Inventory Catalog

#### Tier 2: Boundary & Corner Cases
- `T2-01`: Zero female course enrollment ($I_M = 0$) prevents female present/absent input $>0$.
- `T2-02`: Zero male course enrollment ($I_V = 0$) handles female-only cohort.
- `T2-03`: 100% full attendance ($P_T = I_T, A_T = 0$) calculates $100.00\%$ without divide-by-zero.
- `T2-04`: 0% attendance ($P_T = 0, A_T = I_T$) calculates $0.00\%$ cleanly.
- `T2-05`: Maximum cohort size ($50$ students) formats cleanly across all UI components.
- `T2-06`: Negative inputs ($-1$) rejected at UI, calculation, and DB constraint layers.
- `T2-07`: Decimal numbers ($1.5$) rejected by integer validation.
- `T2-08`: Disparity over-reporting ($P_V + A_V > I_V$) hard-disables submit.
- `T2-09`: Disparity under-reporting ($P_V + A_V < I_V$) hard-disables submit.
- `T2-10`: Single-gender disparity with valid counterpart ($P_V+A_V=I_V$ but $P_M+A_M \ne I_M$) blocks submission.
- `T2-11`: Leap day (`2024-02-29`) handles calendar indexing and Spanish formatting.
- `T2-12`: Month-end transition (`2026-08-31` to `2026-09-01`) isolates shift daily reports.
- `T2-13`: Past date selection by Teacher renders form read-only.
- `T2-14`: Teacher attempting to access unassigned course via URL/API receives 403 Forbidden.
- `T2-15`: Deactivated user blocked from authentication and submissions.

#### Tier 3: Pairwise Combinations & Realtime Integrations
- `T3-01`: Teacher submission immediately triggers Supabase Realtime broadcast to Admin dashboard.
- `T3-02`: Realtime broadcast updates single table row status from `Pendiente` to `Cargado`.
- `T3-03`: Totals row recalculates all 9 columns ($I_V, I_M, I_T, P_V, P_M, P_T, A_V, A_M, A_T$) on realtime event.
- `T3-04`: Progress counter widget increments (`X/10`) dynamically.
- `T3-05`: Admin edits course enrollment in catalog; historical Day 1 attendance retains original snapshot.
- `T3-06`: Day 2 attendance enforces new catalog enrollment numbers.
- `T3-07`: Shift switcher tab toggles between TM, TT, TV within $<50\text{ms}$ with zero state leakage.
- `T3-08`: All-shifts consolidated tab sums all 3 shifts into whole-school totals ($842$ enrolled).
- `T3-09`: Staff absences in TV do not appear in TM or TT shift panels.
- `T3-10`: Concurrent submission of two courses simultaneously resolves without race conditions.

#### Tier 4: Real-World Multi-Shift School Workloads
- `T4-01`: Full school catalog bootstrap (34 courses across TM, TT, TV).
- `T4-02`: Morning shift cycle execution (12 TM courses, 340 students, 2 absent staff).
- `T4-03`: Afternoon shift cycle execution (12 TT courses, 330 students, 1 absent staff, 1 preceptor override).
- `T4-04`: Evening shift cycle execution (10 TV courses matching CSV, 172 students, 1 absent teacher).
- `T4-05`: Full day school closure / partial attendance day simulation ($73.04\%$ attendance).
- `T4-06`: School-wide daily consolidation report generation.
- `T4-07`: 23:59:59 to 00:00:01 midnight historical locking transition.
- `T4-08`: Stress simulation: 20 teachers submitting attendance concurrently within 10 seconds.

#### Export Fidelity Workloads
- `EXP-01`: TV Excel export generates valid OpenXML ZIP container with correct MIME headers.
- `EXP-02`: TV Excel export cell coordinates `A1:K25` match official layout with formulas in totals row.
- `EXP-03`: Full-school 34-course Excel export generates multi-tab or consolidated workbook.
- `EXP-04`: TV PDF export conforms to `%PDF-` structure and A4 geometry.
- `EXP-05`: TV PDF text extraction matches institutional title, course names, and $119/53/172$ counts.
- `EXP-06`: PDF contains official signature blocks for Preceptor and Directivo.

---

### 6.2 Code Blueprint for Executable Test Specs

Here is the TypeScript implementation blueprint for the opaque-box test runner:

```typescript
// tests/tier2_boundaries/math_boundaries.test.ts
import { describe, it, expect } from '../runner/harness';
import { validateAttendanceRow, calculateAttendancePercentage } from '../../src/utils/calculations';

describe('Tier 2: Mathematical & Boundary Validation', () => {
  it('T2-01: Zero female course (5°4° TV) permits valid male input and locks female to zero', () => {
    const res = validateAttendanceRow(8, 0, 7, 0, 1, 0);
    expect(res.isValid).toBe(true);
    expect(res.varonesValid).toBe(true);
    expect(res.mujeresValid).toBe(true);
    expect(res.varonesDisparity).toBe(0);
    expect(res.mujeresDisparity).toBe(0);

    const invalidRes = validateAttendanceRow(8, 0, 7, 1, 1, 0);
    expect(invalidRes.isValid).toBe(false);
    expect(invalidRes.mujeresValid).toBe(false);
    expect(invalidRes.mujeresDisparity).toBe(1);
  });

  it('T2-03: 100% full attendance calculates correctly without divide-by-zero', () => {
    const pct = calculateAttendancePercentage(15, 15);
    expect(pct).toBe(100.0);
  });

  it('T2-04: 0% attendance calculates 0.00% cleanly', () => {
    const pct = calculateAttendancePercentage(0, 23);
    expect(pct).toBe(0.0);
  });

  it('T2-06 & T2-07: Negative and decimal values are rejected', () => {
    const resNeg = validateAttendanceRow(11, 4, -1, 4, 12, 0);
    expect(resNeg.isValid).toBe(false);

    const resDec = validateAttendanceRow(11, 4, 10.5, 4, 0.5, 0);
    expect(resDec.isValid).toBe(false);
  });
});
```

```typescript
// tests/tier4_real_world/full_school_daily_cycle.test.ts
import { describe, it, expect, createTestClient } from '../runner/harness';
import referenceData from '../fixtures/reference_tv.json';

describe('Tier 4: Full School Daily Workload Cycle', () => {
  it('T4-04: Simulates complete Turno Vespertino 10-course daily cycle matching CSV', async () => {
    const client = createTestClient();
    const date = '2026-08-20';
    
    // Seed 10 TV courses from CSV reference
    for (const course of referenceData.courses) {
      await client.submitAttendance({
        date,
        course_id: course.id,
        presentes_v: course.sample_presentes_v,
        ausentes_v: course.inscriptos_v - course.sample_presentes_v,
        presentes_m: course.sample_presentes_m,
        ausentes_m: course.inscriptos_m - course.sample_presentes_m,
        observaciones: course.sample_obs
      });
    }

    const report = await client.getShiftParteGeneral(date, 'vespertino');
    expect(report.totals.total_inscriptos_v).toBe(119);
    expect(report.totals.total_inscriptos_m).toBe(53);
    expect(report.totals.total_inscriptos_t).toBe(172);
    expect(report.totals.submitted_courses_count).toBe(10);
  });
});
```

---

## 7. Quality & Verification Method

1. **Deterministic Execution**: All test cases use isolated fixtures or mock adapters so they can run either against the local test harness or a live Supabase instance.
2. **Formula Integrity**: Excel formulas are verified via abstract syntax tree or literal string match (`SUM(...)`).
3. **Format Fidelity**: PDF and Excel output is validated against the physical reference file `PARTE GENERALES TV.xlsx - T.V.csv` and `PARTE GENERALES TV.xlsx - T.V.pdf`.
