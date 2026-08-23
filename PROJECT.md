# Master Project Blueprint: E.E.S.T. N° 3 Attendance System ("Parte General de Alumnos")

## Architecture Overview
The application is a full-stack responsive web system designed to digitize the daily attendance workflow of "Escuela de Educación Secundaria Técnica N° 3 — Ntra. Sra. de la Merced" (Loma Hermosa).
- **Backend / Database**: Supabase (PostgreSQL 15+) with Row Level Security (RLS), custom types, triggers for mathematical attendance validation ($P_V+A_V=I_V$ and $P_M+A_M=I_M$), and stored procedures for paper-matching aggregations.
- **Authentication**: Supabase Auth with custom profiles table and role-based permissions (`administrador`, `preceptor`, `profesor`).
- **Frontend**: React 18+ with TypeScript, Vite, Tailwind CSS, Lucide React, Recharts (attendance analytics), jsPDF + jspdf-autotable (PDF export), and SheetJS xlsx (Excel export).
- **Responsiveness**: Mobile-first architecture supporting 375px mobile viewports (touch friendly) and 1280px+ desktop dashboards without horizontal overflow.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Supabase Schema & Types | PostgreSQL tables for shifts, profiles, courses, assignments, attendance, staff absences | M1 (DONE) | Survey 2 |
| 2 | Role-Based Access Control & RLS | Granular RLS policies and security definer functions for admin, preceptor, profesor | M1 (DONE) | Survey 2 |
| 3 | Attendance Validation Trigger | DB-level check and trigger guaranteeing Presentes + Ausentes = Inscriptos per gender | M1 (DONE) | Survey 2 |
| 4 | Seed Data Loader | Complete seed data for 3 shifts, 10 Vespertino courses from CSV (172 total inscriptos), and Mañana/Tarde catalogs | M1 (DONE) | Survey 1, 2 |
| 5 | Design System & Layout | Institutional UI theme, responsive header, navigation, and mobile menu | M2 (DONE) | Survey 3 |
| 6 | Auth & Role Guards | Login screen, Supabase session management, ProtectedRoute and RoleGuard | M2 (DONE) | Survey 3 |
| 7 | Core Calculation & State Engine | Shared logic for $P_T, A_T, I_T, \%Asistencia$, date formatting, and state management | M2 (DONE) | Survey 1, 3 |
| 8 | Course Selector for Teachers | Filtered course picker showing assigned courses for teachers and all courses for preceptor/admin | M3 (DONE) | Survey 3 |
| 9 | Daily Attendance Form | Live dual-gender inputs ($P_V, P_M, A_V, A_M$) with automatic total calculation | M3 (DONE) | Survey 1, 3 |
| 10 | Real-time Form Validation | Real-time visual feedback and hard blocking when Presentes + Ausentes ≠ Inscriptos | M3 (DONE) | Survey 1, 3 |
| 11 | Date Selector & Historical Locking | Date picker allowing today's edits and enforcing read-only locking on past dates for teachers | M3 (DONE) | Survey 3 |
| 12 | Staff Absence & Observaciones | Input for general observations and reporting absent teachers/auxiliaries | M3 (DONE) | Survey 1, 3 |
| 13 | Shift Switcher Tabs | Instant tab switching between Mañana, Tarde, and Vespertino | M4 | Survey 1, 3 |
| 14 | Official Daily Summary Table | 11-column table mirroring the exact layout of `PARTE GENERALES TV.xlsx - T.V.csv` with bottom Totals row | M4 | Survey 1, 3 |
| 15 | Attendance Trend Charts | Recharts time-series visualization filterable by course, shift, and school-wide | M4 | Survey 3 |
| 16 | Absent Staff Panel | Daily dashboard widget listing absent teachers and auxiliaries by shift | M4 | Survey 3 |
| 17 | Excel (.xlsx) Export Engine | 1-click export generating formatted Excel sheet matching the official paper form with formulas | M4 | Survey 1, 3 |
| 18 | PDF Export Engine | 1-click export generating official printable PDF with header, course table, totals, and signature lines | M4 | Survey 1, 3 |
| 19 | Course Catalog CRUD | Admin interface to add, edit, deactivate courses, assign shifts, orientations, and enrollment numbers | M5 | Survey 1, 3 |
| 20 | User & Role Management | Admin interface to create users, assign roles (Admin, Preceptor, Profesor), and link courses to teachers | M5 | Survey 3 |
| 21 | E2E Dual-Track Test Suite | 4-tier requirement-driven test suite (Feature coverage, boundaries, pairwise, real-world) | E2E Track (DONE) | Survey 3 |
| 22 | Adversarial Hardening & Forensics | Tier 5 white-box stress testing and forensic integrity verification | M6 | Survey 3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Database & Auth Engine | Supabase DDL, RLS policies, validation triggers, seed data migration (CSV 10 courses + Mañana/Tarde) | none | DONE |
| M2 | Frontend Scaffold, Auth & State Layer | Vite + React + TS setup, Tailwind theme, AuthContext, role guards, calculation engine | M1 | DONE |
| M3 | Attendance Entry Module | Teacher/Preceptor attendance form, auto-calculations, live validation, staff absence subform | M2 | DONE |
| M4 | Dashboard, Analytics & Export | Shift switcher, official summary table, Recharts trend charts, Excel & PDF export engines | M3 | PLANNED |
| M5 | Course & User Administration | Course catalog CRUD, shift assignment, user creation, role assignment, course assignments | M2 | PLANNED |
| M6 | Integration, E2E Pass & Hardening | Pass 100% E2E test suite (Tiers 1-4), Tier 5 adversarial stress testing, Forensic Audit | M4, M5, E2E Track | PLANNED |

## Interface Contracts
### Data Models & Types (`src/types/index.ts`)
```typescript
export type AppRole = 'administrador' | 'preceptor' | 'profesor';
export type ShiftCode = 'manana' | 'tarde' | 'vespertino';
export type CycleType = 'basico' | 'superior' | 'tecnico_especial';
export type OrientationType = 'TECQU' | 'TECMM' | 'TECET' | 'C.TEC.MMO' | null;

export interface Profile {
  id: string;
  role: AppRole;
  full_name: string;
  email: string;
  dni?: string;
  is_active: boolean;
}

export interface Shift {
  id: string;
  code: ShiftCode;
  name: string;
  start_time: string;
  end_time: string;
  sort_order: number;
}

export interface Course {
  id: string;
  shift_id: string;
  name: string; // e.g. "6° 1°"
  year: number;
  division: number;
  cycle: CycleType;
  orientation: OrientationType;
  inscriptos_varones: number;
  inscriptos_mujeres: number;
  inscriptos_total: number;
  is_active: boolean;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  course_id: string;
  shift_id: string;
  submitted_by: string;
  inscriptos_varones_snapshot: number;
  inscriptos_mujeres_snapshot: number;
  inscriptos_total_snapshot: number;
  presentes_varones: number;
  presentes_mujeres: number;
  presentes_total: number;
  ausentes_varones: number;
  ausentes_mujeres: number;
  ausentes_total: number;
  observaciones?: string;
  is_locked: boolean;
  submitted_at: string;
}

export interface StaffAbsence {
  id: string;
  date: string;
  shift_id: string;
  staff_name: string;
  role_type: string;
  subject_or_area?: string;
  reason?: string;
  observations?: string;
  created_by: string;
}
```

### Calculation Engine Contract (`src/utils/calculations.ts`)
```typescript
export interface ValidationResult {
  isValid: boolean;
  varonesValid: boolean;
  mujeresValid: boolean;
  totalValid: boolean;
  varonesDisparity: number; // (P_V + A_V) - I_V
  mujeresDisparity: number; // (P_M + A_M) - I_M
  errorMessage?: string;
}

export function validateAttendanceRow(
  inscriptosV: number,
  inscriptosM: number,
  presentesV: number,
  presentesM: number,
  ausentesV: number,
  ausentesM: number
): ValidationResult;

export function calculateAttendancePercentage(presentesTotal: number, inscriptosTotal: number): number;

export function calculateShiftTotals(rows: Array<{
  inscriptos_varones: number;
  inscriptos_mujeres: number;
  inscriptos_total: number;
  presentes_varones: number;
  presentes_mujeres: number;
  presentes_total: number;
  ausentes_varones: number;
  ausentes_mujeres: number;
  ausentes_total: number;
}>): {
  inscriptosV: number;
  inscriptosM: number;
  inscriptosT: number;
  presentesV: number;
  presentesM: number;
  presentesT: number;
  ausentesV: number;
  ausentesM: number;
  ausentesT: number;
  porcentajeAsistencia: number;
};
```

## Code Layout
```
/
├── .agents/                    # Agent metadata (BRIEFING, progress, handoffs)
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── common/             # Button, Input, Modal, Card, Badge, Header, Navbar
│   │   ├── attendance/         # AttendanceForm, CourseSelector, ValidationBadge, StaffAbsenceForm
│   │   ├── dashboard/          # DailySummaryTable, ShiftSwitcher, TrendCharts, StaffAbsenceList
│   │   ├── admin/              # CourseManager, UserManager, AssignmentModal
│   │   └── export/             # ExportButton, PdfTemplate, ExcelExporter
│   ├── contexts/               # React Contexts (AuthContext, AttendanceContext)
│   ├── hooks/                  # Custom hooks (useAuth, useAttendance, useCourses, useRealtime)
│   ├── lib/                    # Supabase client, config, constants
│   ├── services/               # API & DB service functions (attendanceService, courseService, userService)
│   ├── types/                  # TypeScript interfaces and enum definitions
│   ├── utils/                  # Calculations, date formatters, export generators (pdfGenerator, excelGenerator)
│   ├── App.tsx                 # Main application router and shell
│   ├── main.tsx                # Application entrypoint
│   └── index.css               # Tailwind CSS imports and custom school typography/styles
├── supabase/
│   ├── migrations/             # SQL DDL migrations, RLS policies, stored procedures
│   └── seed.sql                # Seed data for 3 shifts, 10 Vespertino courses from CSV, demo users
├── tests/
│   ├── e2e/                    # E2E test runner and specs (Tiers 1-4)
│   ├── unit/                   # Unit tests for calculations, validations, exports
│   └── fixtures/               # Test fixtures (CSV reference data, mock records)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```
