# Soft Handoff Report: Tier 1 Feature Coverage Test Suite Specification (F-01 to F-20)

**Agent:** e2e_explorer_2 (Tier 1 Feature Coverage Specialist)  
**Target:** parent (`4762c356-f8e2-4d46-b571-76eda9976f92` — E2E Testing Orchestrator)  
**Milestone:** M_E2E_2 — Tier 1: Feature Coverage Test Specification  
**Type:** Soft Handoff  
**Date:** 2026-08-20  

---

## 1. Observation

1. **Authoritative Specifications Examined**:
   - `ORIGINAL_REQUEST.md`: Identified core functional requirements R1-R5, school structure (Ciclo Básico 1°-3°, Ciclo Superior 4°-7° with TECQU/TECMM/TECET, 1°1ª C.TEC.MMO), role rules (Administrador, Preceptor, Profesor), and dual-gender attendance formulas.
   - `PROJECT.md`: Verified full feature inventory (F-01 to F-22), TypeScript interface contracts (`Profile`, `Shift`, `Course`, `AttendanceRecord`, `StaffAbsence`), calculation engine signatures, and project directory layout.
   - `.agents/e2e_testing_orch/SCOPE.md`: Analyzed test architecture and feature inventory mapping for F-01 through F-20 across 5 target test files (`auth_roles.test.ts`, `attendance_form.test.ts`, `dashboard_table.test.ts`, `export_engine.test.ts`, `course_admin.test.ts`).
   - `PARTE GENERALES TV.xlsx - T.V.csv`: Confirmed reference data for Turno Vespertino: 10 courses, 172 total inscriptos (119 Varones, 53 Mujeres), 11-column table layout, notes section, and absent staff section.

2. **Feature Coverage Scope Designed**:
   - 20 distinct features (F-01 to F-20).
   - 120 total test cases (6 exhaustive test cases per feature, exceeding the $\ge 5$ threshold).
   - Opaque-box verification mechanisms designed for UI, API, DB triggers, and file stream outputs.

---

## 2. Logic Chain

1. **Traceability to Institutional Rules (Observation 1)**:
   - Every test case is directly linked to a specific system requirement (R1: Authentication & Roles, R2: Attendance Submission, R3: Dashboard & Export, R4: Course & User Administration, R5: Responsive Design).
2. **Dual-Gender Mathematical Invariant Preservation (Observation 1, 2)**:
   - Features F-05, F-06, and F-12 enforce that $P_V + A_V = I_V$ and $P_M + A_M = I_M$ unconditionally. Test cases TC-F06-01 to TC-F06-06 explicitly verify that UI buttons are disabled upon disparity and PostgreSQL trigger aborts invalid inserts.
3. **Paper Form & Shift Layout Fidelity (Observation 1)**:
   - Features F-10, F-11, F-12, F-15, and F-16 verify that the 11-column matrix, bottom totals row ($\sum I_V=119, \sum I_M=53, \sum I_T=172$ for Vespertino baseline), Excel `=SUM()` formulas, and PDF autotable match the CSV structure exactly.
4. **Opaque-Box Independence (Observation 1, 2)**:
   - The test specifications use public interfaces (`OpaqueTestHarness`), allowing tests to run identically against live Supabase instances or in-memory mock adapters.

---

## 3. Caveats

1. **Live Supabase Environment Availability**:
   - The test specification is designed to execute against both the live Supabase instance and an in-memory mock runner. Live execution depends on network/API keys configured in the environment.
2. **Realtime WebSocket Testing**:
   - Feature F-20 (Realtime Subscriptions) requires mock broadcast simulation when running in offline/headless CI runners without an active Supabase WebSocket server.

---

## 4. Conclusion

A comprehensive, robust Tier 1 Feature Coverage Test Suite specification has been authored and documented in `d:\CanY\PROYECTOS CANY\App colegio\.agents\e2e_explorer_2\analysis.md`.
- **20 Features fully specified (F-01 to F-20)**.
- **120 Test cases designed** with inputs, expected outputs, invariants, and opaque-box assertions.
- **100% Traceability** to requirements R1 through R5 and the official paper layout from `PARTE GENERALES TV.xlsx - T.V.csv`.

---

## 5. Verification Method & Remaining Work

### Verification Steps for Test Implementers
1. Inspect `d:\CanY\PROYECTOS CANY\App colegio\.agents\e2e_explorer_2\analysis.md` for complete test case definitions.
2. Verify test count per feature:
   - `auth_roles.test.ts`: F01 (6), F02 (6), F19 (6) = 18 tests.
   - `attendance_form.test.ts`: F03 (6), F04 (6), F05 (6), F06 (6), F07 (6), F08 (6), F09 (6) = 42 tests.
   - `dashboard_table.test.ts`: F10 (6), F11 (6), F12 (6), F13 (6), F14 (6), F20 (6) = 36 tests.
   - `export_engine.test.ts`: F15 (6), F16 (6) = 12 tests.
   - `course_admin.test.ts`: F17 (6), F18 (6) = 12 tests.
   - **Total**: 120 tests.

### Remaining Work for Implementation Phase
1. Implement TypeScript test runner executable (`tests/runner/index.ts`).
2. Scaffold test files in `tests/tier1_feature_coverage/` implementing the 120 specified test cases.
3. Integrate with E2E Explorer 1 harness adapters and E2E Explorer 3 boundary/pairwise test suites.
