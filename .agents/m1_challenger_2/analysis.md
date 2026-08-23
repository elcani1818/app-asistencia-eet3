# Adversarial Challenge & Verification Report: Seed Dataset & Stored Procedures (M1)

**Agent**: Challenger 2 (Empirical Challenger / Critic / Specialist)  
**Target Milestone**: Milestone 1 (M1: Database & Auth Engine)  
**Date**: 2026-08-20  
**Artifacts Evaluated**:
- `supabase/seed.sql`
- `supabase/migrations/20260820000000_m1_database_and_auth.sql`
- `PARTE GENERALES TV.xlsx - T.V.csv`
- `PROJECT.md` & `ORIGINAL_REQUEST.md`

---

## 1. Executive Summary & Verdict

| Verification Target | Requirement / Reference | Status | Verdict |
|---------------------|------------------------|:------:|:-------:|
| **Turno Vespertino Seed** | 10 courses, exact enrollment & orientations from CSV | **PASS** | **100% Concordant** (119 V, 53 M, 172 Total) |
| **Turno Mañana Catalog** | 26 courses (14 Básico 1°-3°, 12 Superior 4°-7°) | **PASS** | **100% Concordant** |
| **Turno Tarde Catalog** | 26 courses (14 Básico 1°-3°, 12 Superior 4°-7°) | **PASS** | **100% Concordant** |
| **Stored Procedure Schema** | `courses`, `cycle_subtotals`, `totals`, `staff_absences` | **PASS** | **Complete & Validated** |
| **Percentage Calculation** | `ROUND((presentes * 100.0) / matricula, 2)` & `NULLIF`/`CASE` guard | **PASS** | **Zero-Division Safe** |
| **Unsubmitted Course State** | Preserves catalog order, `is_submitted=false`, `NULL` metrics | **PASS** | **Robust & Spec-Compliant** |

**Final Challenger Verdict**: **APPROVED WITHOUT RESERVATIONS**.

---

## 2. Turno Vespertino Seed Mathematical Verification

### 2.1 Course-by-Course Cell Audit (CSV vs `supabase/seed.sql`)

| Course ID / Seed Reference | Course Name | Cycle | Orientation | CSV Inscriptos (V / M / T) | Seed Inscriptos (V / M / T) | Verification Status |
|---|---|---|---|:---:|:---:|:---:|
| `33333333-0000-0000-0000-000000000504` | 5° 4ª | `superior` | `TECET` | `8 / - / 8` | `8 / 0 / 8` | **EXACT MATCH** |
| `33333333-0000-0000-0000-000000000601` | 6° 1ª | `superior` | `TECQU` | `11 / 4 / 15` | `11 / 4 / 15` | **EXACT MATCH** |
| `33333333-0000-0000-0000-000000000602` | 6° 2ª | `superior` | `TECMM` | `9 / 14 / 23` | `9 / 14 / 23` | **EXACT MATCH** |
| `33333333-0000-0000-0000-000000000603` | 6° 3ª | `superior` | `TECET` | `23 / 2 / 25` | `23 / 2 / 25` | **EXACT MATCH** |
| `33333333-0000-0000-0000-000000000604` | 6° 4ª | `superior` | `TECET` | `6 / - / 6` | `6 / 0 / 6` | **EXACT MATCH** |
| `33333333-0000-0000-0000-000000000701` | 7° 1ª | `superior` | `TECQU` | `5 / 8 / 13` | `5 / 8 / 13` | **EXACT MATCH** |
| `33333333-0000-0000-0000-000000000702` | 7° 2ª | `superior` | `TECMM` | `9 / 9 / 18` | `9 / 9 / 18` | **EXACT MATCH** |
| `33333333-0000-0000-0000-000000000703` | 7° 3ª | `superior` | `TECET` | `20 / 9 / 29` | `20 / 9 / 29` | **EXACT MATCH** |
| `33333333-0000-0000-0000-000000000704` | 7° 4ª | `superior` | `TECET` | `8 / - / 8` | `8 / 0 / 8` | **EXACT MATCH** |
| `33333333-0000-0000-0000-000000000101` | 1° 1ª C.TEC.MMO | `tecnico_especial` | `C.TEC.MMO` | `20 / 7 / 27` | `20 / 7 / 27` | **EXACT MATCH** |

### 2.2 Mathematical Summation Proof

$$\sum \text{Varones} = 8 + 11 + 9 + 23 + 6 + 5 + 9 + 20 + 8 + 20 = 119$$
$$\sum \text{Mujeres} = 0 + 4 + 14 + 2 + 0 + 8 + 9 + 9 + 0 + 7 = 53$$
$$\sum \text{Total} = 119 + 53 = 172$$

- **CSV Reference Line 23**: `TOTAL ,,,,, 119 , 53 , 172`
- **Seed Aggregation**: $\text{Varones} = 119$, $\text{Mujeres} = 53$, $\text{Total} = 172$.
- **Result**: $\Delta = 0$ across all axes.

---

## 3. Turno Mañana & Turno Tarde Catalogs Verification

### 3.1 Structural Breakdown per Shift

According to institutional blueprint `ORIGINAL_REQUEST.md`:
- **Ciclo Básico** (1° to 3° Año, no technical orientation):
  - 1° Año: 5 divisions ($1^\circ 1^{\mathrm{a}}$ to $1^\circ 5^{\mathrm{a}}$) = 5 courses
  - 2° Año: 5 divisions ($2^\circ 1^{\mathrm{a}}$ to $2^\circ 5^{\mathrm{a}}$) = 5 courses
  - 3° Año: 4 divisions ($3^\circ 1^{\mathrm{a}}$ to $3^\circ 4^{\mathrm{a}}$) = 4 courses
  - *Subtotal Ciclo Básico*: **14 courses** (`cycle = 'basico'`, `orientation = NULL`).
- **Ciclo Superior** (4° to 7° Año, with technical orientations):
  - Divisions ending in 1ª $\to$ `TECQU` (Técnico Químico): $4^\circ 1^{\mathrm{a}}, 5^\circ 1^{\mathrm{a}}, 6^\circ 1^{\mathrm{a}}, 7^\circ 1^{\mathrm{a}}$ (4 courses)
  - Divisions ending in 2ª $\to$ `TECMM` (Técnico Maestro Mayor de Obra): $4^\circ 2^{\mathrm{a}}, 5^\circ 2^{\mathrm{a}}, 6^\circ 2^{\mathrm{a}}, 7^\circ 2^{\mathrm{a}}$ (4 courses)
  - Divisions ending in 3ª $\to$ `TECET` (Técnico Electromecánico): $4^\circ 3^{\mathrm{a}}, 5^\circ 3^{\mathrm{a}}, 6^\circ 3^{\mathrm{a}}, 7^\circ 3^{\mathrm{a}}$ (4 courses)
  - *Subtotal Ciclo Superior*: **12 courses** (`cycle = 'superior'`).

### 3.2 Audit Results
- **Turno Mañana**: 26 courses (lines 190–222 in `seed.sql`), correct cycle tags, correct sequential sort orders 1..26.
- **Turno Tarde**: 26 courses (lines 250–282 in `seed.sql`), correct cycle tags, correct sequential sort orders 1..26.
- **Turno Vespertino**: 10 courses (lines 153–162 in `seed.sql`), 9 `superior`, 1 `tecnico_especial`, sort orders 1..10.
- **Total School-Wide Active Catalog**: **62 courses**.

---

## 4. Stored Procedure `fn_get_shift_parte_general` Adversarial Audit

### 4.1 JSON Contract Verification

The stored procedure returns a `JSONB` root object with the following top-level keys:
```json
{
  "date": "YYYY-MM-DD",
  "shift_id": "UUID",
  "shift_code": "manana | tarde | vespertino",
  "shift_name": "Turno ...",
  "courses": [ ... ],
  "cycle_subtotals": { ... },
  "totals": { ... },
  "staff_absences": [ ... ]
}
```

1. **`courses`**:
   - Every active course in the shift is represented, ordered by `sort_order, year, division`.
   - Populates immutable enrollment counts (`inscriptos_v`, `inscriptos_m`, `inscriptos_t`).
   - When submitted (`is_submitted = true`): includes `presentes_v`, `presentes_m`, `presentes_t`, `ausentes_v`, `ausentes_m`, `ausentes_t`, `porcentaje_asistencia`, submitter attribution name, timestamp, and lock status.
   - When pending (`is_submitted = false`): sets `presentes_*`, `ausentes_*`, and `porcentaje_asistencia` to `NULL` (preventing misleading 0 values on UI tables), while setting `is_submitted: false` and `observations: ""`.
2. **`cycle_subtotals`**:
   - Aggregates by `cycle` (`basico`, `superior`, `tecnico_especial`).
   - Provides `courses_count`, `submitted_count`, cumulative enrollment, cumulative present/absent counts, and cycle-specific attendance percentage.
3. **`totals`**:
   - Provides grand totals for the entire shift: cumulative enrollment, cumulative presents, cumulative absents, shift-wide attendance percentage.
   - Includes submission tracking counters: `total_courses_count`, `submitted_courses_count`, and `pending_courses_count`.
4. **`staff_absences`**:
   - Returns all staff absences recorded for the specified shift and date, with staff name, role, subject/area, course name, justification status, reason, and submitter profile name.

### 4.2 Percentage Formula & Division-by-Zero Safety

The stored procedure enforces the standard attendance percentage formula:
$$\text{Porcentaje Asistencia} = \text{ROUND}\left( \frac{\text{Presentes Total} \times 100.0}{\text{Matrícula Total}}, 2 \right)$$

In all three aggregation tiers (`course_data`, `cycle_metrics`, `totals`), division by zero is strictly prevented:
- **Per Course**:
  ```sql
  ROUND(
      CASE 
          WHEN a.id IS NOT NULL AND COALESCE(a.snapshot_inscriptos_total, c.inscriptos_total) > 0 
          THEN (COALESCE(a.total_presentes, 0)::NUMERIC / COALESCE(a.snapshot_inscriptos_total, c.inscriptos_total)::NUMERIC) * 100.0
          ELSE 0.0
      END, 2
  )
  ```
- **Per Cycle**:
  ```sql
  ROUND(
      CASE 
          WHEN COALESCE(inscriptos_t, 0) > 0 
          THEN (COALESCE(presentes_t, 0)::NUMERIC / inscriptos_t::NUMERIC) * 100.0 
          ELSE 0.0 
      END, 2
  )
  ```
- **Per Shift Grand Total**:
  ```sql
  ROUND(
      CASE 
          WHEN COALESCE(SUM(COALESCE(a.snapshot_inscriptos_total, c.inscriptos_total)), 0) > 0
          THEN (COALESCE(SUM(a.total_presentes), 0)::NUMERIC / SUM(COALESCE(a.snapshot_inscriptos_total, c.inscriptos_total))::NUMERIC) * 100.0
          ELSE 0.0
      END, 2
  )
  ```
If matrícula is 0, the expression resolves to `0.0` rather than throwing a SQL runtime division by zero exception.

### 4.3 Handling of Partial & Unsubmitted Days

The procedure utilizes `LEFT JOIN public.attendance_records a ON c.id = a.course_id AND a.date = p_date`:
- Courses without submissions on the queried date are **never dropped** from the output.
- `pending_courses_count` is dynamically calculated as `COUNT(c.id) - COUNT(a.id)`.
- UI consumers can immediately distinguish between a course that submitted 0 present students vs a course that has not yet submitted attendance for the day.

---

## 5. Adversarial Stress Scenarios & Edge Cases

| Challenge Scenario | Stress Condition | Expected Behavior | Observed Code Behavior | Status |
|---|---|---|---|:---:|
| **Empty Shift** | Shift exists but has 0 courses | Returns valid JSON with empty arrays / 0 counts | `COALESCE(..., '[]'::jsonb)` ensures valid empty JSON | **PASS** |
| **Zero Submissions** | Date has 0 submitted attendance records | Summary table displays all courses with pending flags | `LEFT JOIN` preserves all courses; `submitted_courses_count = 0` | **PASS** |
| **Historical Enrollment Mutation** | Catalog enrollment edited after attendance was filed | Historical reports must preserve attendance parity against past enrollment | Uses `snapshot_inscriptos_*` before falling back to `courses.inscriptos_*` | **PASS** |
| **Invalid Shift Identifier** | Non-existent UUID or unknown code slug passed | Function raises informative PostgreSQL exception | `IF NOT FOUND THEN RAISE EXCEPTION ...` | **PASS** |
| **Overloaded Call Pattern** | Call by UUID or call by code slug (`'vespertino'`) | Both call signatures execute seamlessly | Overloaded function resolves code to UUID and delegates | **PASS** |

---

## 6. Conclusion & Recommendation

The database seed dataset and stored procedure implementation in `supabase/` are robust, mathematically exact, and fully compliant with both the reference CSV (`PARTE GENERALES TV.xlsx - T.V.csv`) and the system blueprint.

**Milestone 1 Database & Auth Engine is cleared for Milestone 2 frontend integration.**
