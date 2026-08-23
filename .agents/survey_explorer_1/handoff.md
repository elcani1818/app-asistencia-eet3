# Handoff Report — Paper Attendance Form Reference Analysis

## 1. Observation

Direct observations from workspace files:

1. **`ORIGINAL_REQUEST.md` (Lines 10-31, 34-52)**:
   - Institution: "Escuela de Educación Secundaria Técnica N° 3 — Ntra. Sra. de la Merced" (Loma Hermosa).
   - Three shifts: Mañana, Tarde, Vespertino.
   - Ciclo Básico (1° to 3°): 1°1ª to 1°5ª, 2°1ª to 2°5ª, 3°1ª to 3°4ª (no orientation).
   - Ciclo Superior (4° to 7°):
     - Divisions ending in 1ª: `TECQU` (Técnico Químico) — 4°1ª, 5°1ª, 6°1ª, 7°1ª
     - Divisions ending in 2ª: `TECMM` (Técnico Maestro Mayor de Obra) — 4°2ª, 5°2ª, 6°2ª, 7°2ª
     - Divisions ending in 3ª: `TECET` (Técnico Electromecánico) — 4°3ª, 5°3ª, 6°3ª, 7°3ª
     - Divisions ending in 4ª: `TECET` (Técnico Electromecánico) — 5°4ª, 6°4ª, 7°4ª
   - Ciclo Técnico Especial: `1°1ª C.TEC.MMO` (Ciclo Técnico en Maestro Mayor de Obras).
   - Role permissions: Administrador (manage users/courses, view all, submit), Preceptor (view all shifts/courses, cannot modify admin settings), Profesor (view and submit only assigned courses).

2. **`PARTE GENERALES TV.xlsx - T.V.csv` (Lines 1-25)**:
   - Header text: `ESCUELA DE EDUCACIÓN SECUNDARIA TÉCNICA N° 3 "Ntra. Sra. de la Merced"` (Lines 1-2), `PARTE GENERAL ALUMNOS` (Lines 5-6), `LOMA HERMOSA, ……de ……………………………… de 20 ......` (Line 7).
   - Columns: `CURSOS, ORIENTACIÓN, INSCRIPTOS (V, M, T), PRESENTES (V, M, T), AUSENTES (V, M, T)` (Lines 9-10).
   - 10 Courses listed for Vespertino shift:
     - Line 11: `5º4º`, `TECET`, Inscriptos `8,-,8`
     - Line 12: `6º1º`, `TECQU`, Inscriptos `11,4,15`
     - Line 13: `6º2º`, `TECMM`, Inscriptos `9,14,23`
     - Line 14: `6º3º`, `TECET`, Inscriptos `23,2,25`
     - Line 15: `6º4º`, `TECET`, Inscriptos `6,-,6`
     - Line 16: `7º1º`, `TECQU`, Inscriptos `5,8,13`
     - Line 17: `7º2º`, `TECMM`, Inscriptos `9,9,18`
     - Line 18: `7º3º`, `TECET`, Inscriptos `20,9,29`
     - Line 19: `7º4º`, `TECET`, Inscriptos `8,-,8`
     - Line 20: `1° 1°`, `C.TEC.MMO`, Inscriptos `20,7,27`
   - Totals row (Line 23): `TOTAL`, Inscriptos `119,53,172`.
   - Footer lines (Lines 24-25): `OBSERVACIONES`, `AUSENTE DE DOCENTES Y AUXILIARES:`.

3. **`PARTE GENERALES TV.xlsx - T.V.pdf` (Page 1 Screenshot & OCR)**:
   - Verified the visual layout is a landscape 2-up duplicate form (two copies of "Parte General Alumnos" side-by-side).
   - Confirmed all headers, column labels, course rows, totals, and footer text boxes match the CSV exactly.

---

## 2. Logic Chain

1. **Vespertino Seed Data**: From Observation #2, the CSV contains 10 courses with initial enrolled counts ($I_V, I_M, I_T$). Summing $I_V$ ($8+11+9+23+6+5+9+20+8+20 = 119$) and $I_M$ ($0+4+14+2+0+8+9+9+0+7 = 53$) gives exactly $172$, proving the mathematical integrity of the seed data.
2. **Whole School Catalog**: From Observation #1, the complete school structure has 14 Ciclo Básico courses, 15-16 Ciclo Superior courses across 3 technical specialties (TECQU, TECMM, TECET), and 1 special cycle course (`1°1ª C.TEC.MMO`). The database schema must allow dynamic shift assignment so Mañana and Tarde shifts can be configured by the admin using these catalog courses.
3. **Form Calculations and Validations**:
   - $P_T = P_V + P_M$
   - $A_T = A_V + A_M$
   - Hard validation: $P_V + A_V = I_V$ and $P_M + A_M = I_M$, which implies $P_T + A_T = I_T$.
   - Shift total is the sum across all active courses for that shift on a given date.
   - Attendance percentage: $\% \text{Asistencia} = (\text{Total Presentes} / \text{Total Inscriptos}) \times 100$.
4. **Layout Faithful Reproduction**: From Observation #2 & #3, the UI and export formats must strictly reproduce the 11-column grid with institutional headers, `OBSERVACIONES` box, and `AUSENTE DE DOCENTES Y AUXILIARES` table/box.

---

## 3. Caveats

- The CSV file contains enrollment numbers for Turno Vespertino only. Initial enrollment numbers for Turno Mañana and Turno Tarde are not in the CSV and must be entered or configured by the administrator via the app interface.
- In the CSV, courses with 0 female students use `-` as a placeholder. The database model should store `0` as an integer.

---

## 4. Conclusion

The paper attendance form has been thoroughly reverse-engineered and structured into:
1. Complete 10-course initial dataset for Turno Vespertino with exact enrollment numbers totaling 172 students (119 V, 53 M).
2. Comprehensive 3-shift course catalog encompassing Ciclo Básico (1°1ª-3°4ª), Ciclo Superior (4°1ª-7°4ª with TECQU, TECMM, TECET), and Ciclo Técnico Especial (`1°1ª C.TEC.MMO`).
3. Precise mathematical formulas and validation constraints for course rows and shift aggregates.
4. Exact layout specification for the frontend UI, PDF export, and Excel export.

All detailed findings are written in `d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_1\analysis.md`.

---

## 5. Verification Method

1. **Inspect Analysis Report**:
   - View `d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_1\analysis.md`
2. **Verify Against Original Sources**:
   - Compare course table with `d:\CanY\PROYECTOS CANY\App colegio\PARTE GENERALES TV.xlsx - T.V.csv`
   - Compare layout and fields with `d:\CanY\PROYECTOS CANY\App colegio\PARTE GENERALES TV.xlsx - T.V.pdf`
   - Compare requirements with `d:\CanY\PROYECTOS CANY\App colegio\ORIGINAL_REQUEST.md`
3. **Invalidation Condition**:
   - If any course row from the CSV is missing, or total sums mismatch ($119 + 53 \ne 172$), or Ciclo Básico/Superior definitions differ from `ORIGINAL_REQUEST.md`, this analysis is invalidated.
