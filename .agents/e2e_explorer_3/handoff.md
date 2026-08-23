# Handoff Report: E2E Explorer 3 (Tiers 2, 3, 4 & Export Workload Specialist)

**Agent**: `e2e_explorer_3`  
**Working Directory**: `d:\CanY\PROYECTOS CANY\App colegio\.agents\e2e_explorer_3`  
**Target Recipient**: E2E Testing Orchestrator (`4762c356-f8e2-4d46-b571-76eda9976f92`)  
**Date**: 2026-08-20  
**Handoff Type**: Soft Handoff (Investigation & Specification Complete)  

---

## 1. Observation

1. **Reference Data & Official Paper Layout**:
   - Inspected `PARTE GENERALES TV.xlsx - T.V.csv` (Lines 1-25):
     * Line 11: `5º4º,,TECET,,,8,-,8`
     * Line 12: `6º1º,,TECQU,,,11,4,15`
     * Line 13: `6º2º,,TECMM,,,9,14,23`
     * Line 14: `6º3º,,TECET,,,23,2,25`
     * Line 15: `6º4º,,TECET,,,6,-,6`
     * Line 16: `7º1º,,TECQU,,,5,8,13`
     * Line 17: `7º2º,,TECMM,,,9,9,18`
     * Line 18: `7º3º,,TECET,,,20,9,29`
     * Line 19: `7º4º,,TECET,,,8,-,8`
     * Line 20: `1° 1°,,C.TEC.MMO,,,20,7,27`
     * Line 23: `TOTAL,,,,,119,53,172`
   - Three courses (`5°4°`, `6°4°`, `7°4°`) have 0 female students (`-`), requiring specific zero-boundary handling.

2. **Master Architecture Requirements**:
   - `ORIGINAL_REQUEST.md` (Lines 34-51, R1-R5) mandates:
     * Dual gender breakdown ($P_V, A_V, P_M, A_M$) with hard validation $P_V + A_V = I_V$ and $P_M + A_M = I_M$.
     * Exact paper form replication across Mañana, Tarde, and Vespertino shifts.
     * Excel (`.xlsx`) and PDF (`.pdf`) export matching paper form layout.
     * Historical lock for past dates (teachers read-only).
   - `PROJECT.md` (Lines 86-164) defines database models with snapshots (`inscriptos_varones_snapshot`, `inscriptos_mujeres_snapshot`), calculation engine contracts (`validateAttendanceRow`, `calculateShiftTotals`), and UI component hierarchy.

3. **Scope Alignment**:
   - `.agents/e2e_testing_orch/SCOPE.md` (Lines 56-67) defines the test directory hierarchy:
     * `tier2_boundaries/`: `math_boundaries.test.ts`, `date_boundaries.test.ts`, `rls_security_boundaries.test.ts`.
     * `tier3_pairwise/`: `teacher_to_admin_flow.test.ts`, `course_edit_to_totals.test.ts`, `multi_shift_parte_general.test.ts`.
     * `tier4_real_world/`: `full_school_daily_cycle.test.ts`, `export_fidelity_workload.test.ts`.

---

## 2. Logic Chain

1. **From Observation 1 (CSV zero-female courses & total 172 students)**:
   - Technical secondary schools have orientations with 0 enrolled females (`5°4°`, `6°4°`, `7°4°`).
   - If the system does not handle $I_M = 0$ as a distinct boundary, teachers will face validation blocking or divide-by-zero errors.
   - Therefore, Tier 2 test specifications `T2-BOUND-01` and `T2-BOUND-02` explicitly verify $I_M = 0$ and $I_V = 0$ paths.

2. **From Observation 2 (Snapshot requirement in schema & master request)**:
   - If student enrollment is modified mid-year in the course catalog, historical attendance reports must preserve the exact matriculation active on the day of submission.
   - Therefore, Tier 3 test specification `T3-PAIR-02` tests a 4-step sequence: Day 1 submission $\rightarrow$ Day 2 catalog enrollment modification $\rightarrow$ Day 1 historical query verification $\rightarrow$ Day 2 new submission verification.

3. **From Observation 1 & 2 (Official paper layout & export requirements)**:
   - The paper sheet has exact coordinate rows, merged headers (`A1:K1`, `A5:A6`), formulas in totals (`=SUM(...)`), and signature lines for Preceptor and Directivo.
   - High-fidelity export tests must not only verify that a file was produced, but inspect OpenXML structures, cell coordinates, Excel formulas, and PDF stream tokens.
   - Therefore, section 5 of `analysis.md` provides exact cell mapping `A1:K25` and PDF stream assertion criteria.

4. **From Observation 3 (34-course school workload across 3 shifts)**:
   - The school operates 3 shifts with distinct timetables. Simulating a full school day requires simulating the progression from 07:00 morning shift to 23:59 evening close.
   - Therefore, Tier 4 test specification `T4-SIM-01` synthesizes the 34-course master catalog (842 students) and simulates multi-user concurrent logins, submissions, and consolidated reporting.

---

## 3. Caveats

1. **Dynamic Font Embedding in PDF**: PDF string extraction with basic tools may encounter font encoding variations depending on whether standard Type 1 fonts (Helvetica) or custom embedded TrueType fonts are used. The PDF validator should use glyph-to-text token stream parsing or normalized text extractors (`pdf-parse`).
2. **Local Machine Time Zone**: Test assertions for the 23:59:59 $\rightarrow$ 00:00:00 midnight date transition should mock system time using deterministic clock helpers (`jest.setSystemTime` or custom test runner clock) to avoid timezone discrepancies between Argentina (UTC-3) and CI servers (UTC).
3. **No implementation changes performed**: As an Explorer agent, all outputs are strictly read-only specifications and blueprints placed in `.agents/e2e_explorer_3/`.

---

## 4. Conclusion

A complete, production-grade test specification for **Tier 2 (Boundary & Corner Cases)**, **Tier 3 (Pairwise & System Interactions)**, **Tier 4 (Real-World Multi-Shift School Workload)**, and **Export Engine Fidelity Verification** has been authored and documented in `d:\CanY\PROYECTOS CANY\App colegio\.agents\e2e_explorer_3\analysis.md`.

The specification includes:
- **15 Tier 2 Boundary Test Cases** covering mathematical disparities, zero enrollment, negative/decimal rejection, calendar boundaries (leap days, month-ends), and role escalation attacks.
- **10 Tier 3 Pairwise Test Cases** validating realtime updates, snapshot preservation during catalog edits, shift switcher recalculation, and multi-shift concurrency.
- **8 Tier 4 Real-World Workload Test Cases** simulating the full 34-course, 842-student daily cycle across Mañana, Tarde, and Vespertino.
- **6 Export Engine Fidelity Checks** specifying exact binary, XML, cell coordinate (`A1:K25`), formula (`=SUM(...)`), and PDF stream layout verifications.

---

## 5. Verification Method

To verify the deliverables of this exploration turn:
1. Inspect `d:\CanY\PROYECTOS CANY\App colegio\.agents\e2e_explorer_3\analysis.md` for completeness and structural coverage.
2. Confirm the 34-course master catalog mathematics:
   - Turno Mañana: 12 courses, 340 students ($186\text{ V} + 154\text{ M}$).
   - Turno Tarde: 12 courses, 330 students ($210\text{ V} + 120\text{ M}$).
   - Turno Vespertino: 10 courses, 172 students ($119\text{ V} + 53\text{ M}$, identical to CSV).
   - Whole School: 34 courses, 842 students ($515\text{ V} + 327\text{ M}$).
3. Verify cell mapping table against `PARTE GENERALES TV.xlsx - T.V.csv` row indices.

---

## 6. Remaining Work (For Implementers)

- [ ] Implement `tests/tier2_boundaries/math_boundaries.test.ts` using the test specifications from `analysis.md` Section 2.
- [ ] Implement `tests/tier2_boundaries/date_boundaries.test.ts` and `rls_security_boundaries.test.ts`.
- [ ] Implement `tests/tier3_pairwise/teacher_to_admin_flow.test.ts` and `course_edit_to_totals.test.ts`.
- [ ] Implement `tests/tier4_real_world/full_school_daily_cycle.test.ts` and `export_fidelity_workload.test.ts`.
- [ ] Integrate test runner with report generation and CI exit codes.
