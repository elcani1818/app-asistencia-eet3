# DISPATCH

## 2026-08-20T14:17:09Z
You are the E2E Testing Orchestrator for the Dual-Track E2E Testing Track.
Your working directory is: d:\CanY\PROYECTOS CANY\App colegio\.agents\e2e_testing_orch
The master project blueprint is at: d:\CanY\PROYECTOS CANY\App colegio\PROJECT.md
The original user request is at: d:\CanY\PROYECTOS CANY\App colegio\ORIGINAL_REQUEST.md
Survey reports are available at:
- d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_1\analysis.md
- d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_2\analysis.md
- d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_3\analysis.md

Scope of E2E Testing Track:
1. Design and establish the complete 4-tier requirement-driven E2E test architecture and test runner in `tests/`:
   - Tier 1: Feature Coverage (>=5 tests per feature across all R1-R5 features).
   - Tier 2: Boundary & Corner Cases (empty inputs, zero attendance, 100% attendance, max enrollment, invalid disparity, gender mismatch, date boundaries, leap days, role permission boundaries).
   - Tier 3: Cross-Feature Combinations (pairwise interactions: teacher submit -> admin view, course edit -> enrollment recalculation, shift switch -> realtime totals update, multi-shift daily parte general export).
   - Tier 4: Real-World School Workloads (full daily cycle: teachers login, submit attendance for 10 Vespertino courses + Mañana + Tarde courses, record staff absences, preceptor verifies, admin exports to Excel and PDF matching exact school paper layout).
2. Create `TEST_INFRA.md` at project root documenting test runner invocation, format, thresholds, and feature checklist.
3. Once all test suites and test runner are implemented, verified, and passing against mock/live environment, publish `TEST_READY.md` at project root with full coverage summary and execution command.
