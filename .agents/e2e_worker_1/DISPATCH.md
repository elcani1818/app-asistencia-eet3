## 2026-08-20T14:21:17Z
You are the E2E Test Writer / Worker (`e2e_worker_1`).
Your working directory is: d:\CanY\PROYECTOS CANY\App colegio\.agents\e2e_worker_1
Your parent is the E2E Testing Orchestrator (Conversation ID: 4762c356-f8e2-4d46-b571-76eda9976f92).

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

You MUST read the following authoritative files before starting:
- d:\CanY\PROYECTOS CANY\App colegio\ORIGINAL_REQUEST.md
- d:\CanY\PROYECTOS CANY\App colegio\PROJECT.md
- d:\CanY\PROYECTOS CANY\App colegio\.agents\e2e_testing_orch\SCOPE.md
- d:\CanY\PROYECTOS CANY\App colegio\PARTE GENERALES TV.xlsx - T.V.csv
- d:\CanY\PROYECTOS CANY\App colegio\.agents\e2e_explorer_1\analysis.md
- d:\CanY\PROYECTOS CANY\App colegio\.agents\e2e_explorer_2\analysis.md
- d:\CanY\PROYECTOS CANY\App colegio\.agents\e2e_explorer_3\analysis.md

Exclusive Write Ownership:
You own all files under `tests/` directory:
- `tests/runner/` (test runner CLI, assertion framework, structured reporter)
- `tests/harness/` (opaque-box harness, InMemoryMockAdapter with simulated PostgreSQL triggers/RLS, SupabaseLiveAdapter)
- `tests/fixtures/` (golden CSV reference data parser, school structure, mock records)
- `tests/tier1_feature_coverage/` (120 test cases covering F01 to F20 across R1-R5)
- `tests/tier2_boundaries/` (15 boundary tests: zero females, extreme attendance, math disparity, calendar/leap days, role security)
- `tests/tier3_pairwise/` (10 pairwise tests: teacher->admin realtime sync, course catalog edit vs snapshot preservation, shift switching)
- `tests/tier4_real_world/` (8 full-school workload simulations with 34 courses / 842 students, staff absences, and Excel/PDF stream validations)

Execution Requirements:
1. Initialize your BRIEFING.md and progress.md in your working directory.
2. Implement all test runner, harness, fixtures, and 4-tier test suite files adhering strictly to the specifications in the Explorer analysis files.
3. Execute the full test suite via `npx tsx tests/runner/index.ts --tier=all` (or equivalent execution). Ensure all tests execute cleanly with structured scorecard output and exit code 0.
4. Document the exact execution command and full results in `d:\CanY\PROYECTOS CANY\App colegio\.agents\e2e_worker_1\handoff.md`.
5. Send a completion message to your parent.
