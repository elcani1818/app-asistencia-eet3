# Scope: E2E Testing Track

## Architecture
The E2E Test Suite provides an independent, opaque-box, requirement-driven verification system for the E.E.S.T. N° 3 Attendance System.
It exercises all functional specifications (R1-R5, F-01 to F-20) across all 3 school shifts (Mañana, Tarde, Vespertino) without relying on internal implementation details.

## Feature Inventory Mapping
| # | Feature | Description | Requirement | E2E Milestone | Target Tests | Status |
|---|---------|-------------|-------------|---------------|--------------|:------:|
| F-01 | User Authentication | Login with email/password for staff | R1 | M_E2E_2 (Tier 1) | 6 | DONE |
| F-02 | Role Redirection & Guards | Role-based routing (Admin, Preceptor, Profesor) | R1 | M_E2E_2 (Tier 1) | 6 | DONE |
| F-03 | Course Selector | Filtered course picker per assigned teacher | R1, R2 | M_E2E_2 (Tier 1) | 6 | DONE |
| F-04 | Pre-populated Header | Course metadata & enrolled counts from DB/CSV | R2 | M_E2E_2 (Tier 1) | 6 | DONE |
| F-05 | Gender Breakdown Entry | Dual-gender inputs (V, M) for Presentes & Ausentes | R2 | M_E2E_2 (Tier 1) | 6 | DONE |
| F-06 | Real-time Sum Validation | Enforce P_V + A_V = I_V and P_M + A_M = I_M | R2 | M_E2E_2 (Tier 1) | 6 | DONE |
| F-07 | Date Selector & Lock | Today editable; past dates read-only for teachers | R2 | M_E2E_2 (Tier 1) | 6 | DONE |
| F-08 | Observaciones Input | Free-text observations field per course/shift | R2 | M_E2E_2 (Tier 1) | 6 | DONE |
| F-09 | Staff Absences Entry | Record absent teachers and auxiliaries | R2 | M_E2E_2 (Tier 1) | 6 | DONE |
| F-10 | Shift Switcher Tabs | Switch between Mañana, Tarde, Vespertino, All | R3 | M_E2E_2 (Tier 1) | 6 | DONE |
| F-11 | Daily Summary Table | 11-column table mirroring official paper form | R3 | M_E2E_2 (Tier 1) | 6 | DONE |
| F-12 | Bottom Totals Row | Column-wise sum calculations and overall % | R3 | M_E2E_2 (Tier 1) | 6 | DONE |
| F-13 | Attendance Trend Charts | Time series visualization of % attendance | R3 | M_E2E_2 (Tier 1) | 6 | DONE |
| F-14 | Staff Absences Summary Panel | Consolidated view of absent staff per shift/date | R3 | M_E2E_2 (Tier 1) | 6 | DONE |
| F-15 | Excel Export Engine | Format-matching .xlsx export with formulas | R3 | M_E2E_2 (Tier 1) | 6 | DONE |
| F-16 | PDF Export Engine | Format-matching printable .pdf export with signatures | R3 | M_E2E_2 (Tier 1) | 6 | DONE |
| F-17 | Course Catalog CRUD | Add/edit/archive courses, assign shift & enrollment | R4 | M_E2E_2 (Tier 1) | 6 | DONE |
| F-18 | Seed Data Initializer | Pre-load 10 Vespertino courses (172 enrolled) from CSV | R4 | M_E2E_2 (Tier 1) | 6 | DONE |
| F-19 | User & Role Management | User creation, role assignment, course assignments | R1, R4 | M_E2E_2 (Tier 1) | 6 | DONE |
| F-20 | Realtime Subscriptions | Live dashboard sync upon teacher submission | R3 | M_E2E_2 (Tier 1) | 6 | DONE |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|:------:|
| M_E2E_1 | Test Runner & Harness Infra | Standalone test runner CLI, test assertions, mock/environment fixtures, CSV parser & reference fixtures | none | DONE |
| M_E2E_2 | Tier 1: Feature Coverage | Exhaustive unit & E2E tests for features F01-F20 (120 tests total, 6 per feature) | M_E2E_1 | DONE |
| M_E2E_3 | Tier 2 Boundaries & Tier 3 Combinations | Tier 2 boundary cases (zero females, 0/100% attendance, max enrollment, leap days) + Tier 3 pairwise cross-feature tests (25 tests total) | M_E2E_2 | DONE |
| M_E2E_4 | Tier 4 Workloads & Documentation | Tier 4 full-day real school workloads (8 tests), multi-shift cycles, PDF/Excel byte/structure verification, TEST_INFRA.md, TEST_READY.md | M_E2E_3 | DONE |
