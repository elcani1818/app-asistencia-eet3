# Orchestrator Execution Plan: E.E.S.T. N° 3 Attendance System

## Phase 0: Scope Survey & Master Blueprint
- [ ] Spawn 3 Explorers / Spec Miners:
  - Agent 1 (Survey Explorer): Detailed analysis of CSV reference (`PARTE GENERALES TV.xlsx - T.V.csv`), course structure, calculation logic (Presentes/Ausentes/Inscriptos/Totals/Percentages/Observations/Absences).
  - Agent 2 (Survey Explorer): Supabase environment assessment, database schema, RLS policies, seed data structure for all 3 shifts (Vespertino, Mañana, Tarde), Auth & Role architecture.
  - Agent 3 (Survey Spec Miner): Frontend tech stack (React + Vite + Tailwind + TypeScript), UI component architecture, mobile 375px & desktop 1280px+ responsiveness, export engine (.xlsx & .pdf matching paper format), charting.
- [ ] Synthesize findings into `PROJECT.md` (Architecture, Feature Inventory, Milestones, Interface Contracts, Code Layout).
- [ ] Set up Dual-Track architecture: Implementation Track & E2E Testing Track.

## Phase 1: Database, Schema & Authentication Engine (Milestone 1)
- [ ] Supabase schema: profiles, roles, courses, shifts, course_assignments, attendance_records, teacher_absences.
- [ ] RLS policies for Administrador, Preceptor, Profesor.
- [ ] Seed data loader for Vespertino (from CSV) and initial courses for Mañana and Tarde.

## Phase 2: Core Data Access & Validation Layer (Milestone 2)
- [ ] Attendance validation logic (Presentes V/M/T + Ausentes V/M/T == Inscriptos V/M/T).
- [ ] Daily attendance submit & update logic with date locks (current day editable, past days read-only).
- [ ] Aggregation calculation engine (totals per shift, attendance percentages, teacher absence logs).

## Phase 3: Teacher / Preceptor Daily Attendance UI (Milestone 3)
- [ ] Login screen with role routing.
- [ ] Course selection & attendance entry form (pre-populated enrollment, auto-calculating totals, live validation feedback).
- [ ] Observaciones and Teacher/Auxiliary Absence reporting.
- [ ] Mobile-first responsive UX (375px touch friendly).

## Phase 4: Admin Dashboard, Analytics & Export Engine (Milestone 4)
- [ ] Daily summary table mirroring the official paper form layout with shift switcher.
- [ ] Trend charts (recharts) filterable by course, shift, school-wide.
- [ ] Absent teacher/auxiliary registry.
- [ ] Export engine (Excel `.xlsx` and PDF matching paper layout).

## Phase 5: Course, User & Shift Management (Milestone 5)
- [ ] Course catalog CRUD: add/edit/delete courses, shift assignments, orientations, enrollment updates.
- [ ] User & role administration: user creation, role assignment, course assignment for teachers.

## Phase 6: E2E Testing Suite & Adversarial Hardening (Milestone 6 / Final Milestone)
- [ ] Dual-Track E2E Test Suite (Tiers 1-4: Feature coverage, boundaries, combinatorial, real-world workloads).
- [ ] Verification across 375px mobile and 1280px+ desktop.
- [ ] Adversarial Coverage Hardening (Tier 5 Challenger loop).
- [ ] Forensic Integrity Audit (`teamwork_preview_auditor`).
- [ ] Victory report to Sentinel.
