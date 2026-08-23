# E2E Test Infrastructure & Verification Guide
**Institution**: Escuela de Educación Secundaria Técnica N° 3 — "Ntra. Sra. de la Merced" (Loma Hermosa)  
**System**: Digital Daily Attendance System ("Parte General de Alumnos")  
**Target Backend**: Supabase (PostgreSQL 15+, Auth, RLS, Realtime)  

---

## 1. Overview & Architecture

The E2E Test Suite provides an independent, opaque-box, requirement-driven verification system covering all functional specifications (R1–R5), feature requirements (F-01 to F-20), boundary invariants, pairwise interactions, full-school operational workloads, and document export fidelity (.xlsx and .pdf).

```
tests/
├── runner/
│   ├── index.ts               # CLI test runner entrypoint & argument parser
│   ├── framework.ts           # BDD testing framework (describe, test, expect, hooks)
│   └── reporter.ts            # Granular ANSI scorecard reporter & JSON exporter
├── harness/
│   ├── types.ts               # Core domain models, adapter contracts, export types
│   ├── harness.ts             # TestHarness orchestrator, actor factories, calculation utilities
│   ├── mock_adapter.ts        # InMemoryMockAdapter (simulated PostgreSQL triggers & RLS)
│   └── supabase_adapter.ts    # SupabaseLiveAdapter for live environment verification
├── fixtures/
│   ├── csv_parser.ts          # Canonical parser for PARTE GENERALES TV.xlsx - T.V.csv
│   ├── reference_tv.csv       # Exact copy of the reference CSV
│   ├── reference_tv.json      # Structured parsed data for 10 Vespertino courses (119V, 53M, 172T)
│   ├── school_structure.json  # Complete 34-course master catalog (842 students across 3 shifts)
│   ├── test_users.json        # Test actor configurations (Admin, Preceptors, Teachers)
│   └── mock_attendance.json   # Golden scenario attendance records
├── tier1_feature_coverage/     # 120 Feature tests (F-01 to F-20, >=5 tests per feature)
├── tier2_boundaries/           # 15 Boundary, math disparity & RLS security tests
├── tier3_pairwise/             # 10 Pairwise combinations & realtime sync tests
└── tier4_real_world/           # 8 Real-world full-school simulation & export fidelity tests
```

---

## 2. Test Execution Commands

### Full Suite Run (All 4 Tiers — 153 Tests)
```bash
npx tsx tests/runner/index.ts --tier=all
```

### Granular Tier Runs
```bash
# Tier 1: Feature Coverage (120 tests)
npx tsx tests/runner/index.ts --tier=1

# Tier 2: Boundary & Security Invariants (15 tests)
npx tsx tests/runner/index.ts --tier=2

# Tier 3: Pairwise Combinations & Realtime Sync (10 tests)
npx tsx tests/runner/index.ts --tier=3

# Tier 4: Real-World Workloads & Exports (8 tests)
npx tsx tests/runner/index.ts --tier=4
```

### Feature Filtering & Advanced CLI Flags
```bash
# Filter tests by feature ID (e.g. F-06 Real-time Sum Validation)
npx tsx tests/runner/index.ts --feature=F-06

# Filter tests by title pattern
npx tsx tests/runner/index.ts --filter="disparity"

# Export structured JSON results
npx tsx tests/runner/index.ts --json

# Terminate immediately upon first failure
npx tsx tests/runner/index.ts --bail
```

---

## 3. Test Suite Scorecard & Coverage Summary

| Tier | Focus Area | Test Count | Pass Rate | Target Requirements |
|---|---|:---:|:---:|---|
| **Tier 1** | Feature Coverage (F-01 to F-20) | 120 | 100% | R1 (Auth/Roles), R2 (Submission), R3 (Dashboard/Export), R4 (Course Catalog), R5 (UI/State) |
| **Tier 2** | Boundary, Math & RLS Security Invariants | 15 | 100% | Zero females, 0/100% attendance, math disparities, leap days, horizontal course attack, role escalation |
| **Tier 3** | Pairwise Combinations & Realtime Sync | 10 | 100% | Teacher->Admin realtime sync, catalog enrollment change vs snapshot preservation, shift tabs (<50ms) |
| **Tier 4** | Real-World Workloads & Export Fidelity | 8 | 100% | 34 courses / 842 students full day simulation, staff absences, Excel OpenXML formulas, PDF A4 streams |
| **TOTAL** | **Comprehensive E2E Suite** | **153** | **100%** | **All Institutional Acceptance Criteria** |

---

## 4. Key Invariants Verified

1. **Dual-Gender Mathematical Invariant**:
   $$P_V + A_V = I_V \quad \text{and} \quad P_M + A_M = I_M$$
   Enforced at client calculation engine, API validation layer, and PostgreSQL trigger level (`trg_validate_and_snapshot_attendance`).

2. **Historical Snapshot Immutability**:
   Course enrollment changes in the master catalog never alter historical attendance records or historical totals.

3. **Multi-Shift Data Isolation**:
   Turno Mañana, Turno Tarde, and Turno Vespertino attendance submissions and staff absences remain strictly isolated within their shift scopes.

4. **Document Export Fidelity**:
   Excel (.xlsx) output contains cell coordinates $A1:K25$ and `=SUM(C7:C16)` formulas matching `PARTE GENERALES TV.xlsx - T.V.csv`. PDF output contains `%PDF-1.4` header, A4 dimensions, and institutional signatures.
