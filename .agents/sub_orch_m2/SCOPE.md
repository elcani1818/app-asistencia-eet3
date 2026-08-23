# Scope: Milestone 2 (M2) — Frontend Foundation, Design System, Auth & State Management Layer

## Mission
Establish the foundational frontend architecture, institutional design system, complete TypeScript domain models, core calculation/validation engines, authentication & role management layer, and application router shell for the School Attendance and Statistics System.

## Architecture
- **Framework**: React 18 / 19 + TypeScript with Vite build system
- **Styling**: Tailwind CSS + Custom Institutional Palette (`escuela-navy`, `escuela-blue`, `escuela-light`, status badges, smooth transitions)
- **Routing**: React Router DOM (v6) with declarative route definitions and role guards
- **State Management**: React Context API (`AuthContext`) with localStorage persistence and Supabase Auth bridge ready
- **Icons**: Lucide React
- **Calculations & Validation**: Pure functional modules in `src/utils/`

## Feature Inventory Mapped to M2
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F-01 | Responsive Design System & Layout | Institutional header with school crest/name, mobile-friendly navbar with role badges, institutional color palette, accessible UI components | M2 | ORIGINAL_REQUEST §3.1, §3.2 |
| F-02 | Role-Based Authentication & Session | Login view with institutional branding, credentials authentication, demo accounts for instant evaluation, role protection guards (/admin/*, /attendance, /dashboard), 403 page | M2 | ORIGINAL_REQUEST §3.1, §3.3 |
| F-03 (part) | Attendance Calculation & Validation Engine | Pure calculation functions: validateAttendanceRow, calculateAttendancePercentage, calculateShiftTotals, Argentine date formatters | M2 | ORIGINAL_REQUEST §3.3, §3.4 |

## Deliverables & Code Layout
1. **Build & Config**:
   - `package.json` with scripts (`dev`, `build`, `test`, `preview`, `test:e2e`), dependencies, devDependencies.
   - `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `index.html`.
2. **Design System & Assets**:
   - `src/index.css` (Tailwind styles, custom scrollbars, institutional theme tokens).
   - `src/components/common/Header.tsx` (School crest "E.E.S.T. N° 3 — Ntra. Sra. de la Merced (Loma Hermosa)", active shift badge, Spanish date/time).
   - `src/components/common/Navbar.tsx` (Responsive navbar with active link highlight, role pill badges, user profile dropdown/logout, mobile navigation drawer).
   - `src/components/common/Button.tsx`, `Input.tsx`, `Card.tsx`, `Badge.tsx`, `Modal.tsx`, `LoadingSpinner.tsx`.
3. **Domain Models**:
   - `src/types/index.ts` defining `User`, `Role`, `Shift`, `AttendanceStatus`, `AttendanceRecord`, `Student`, `Course`, `AttendanceRow`, `ShiftSummary`, `AttendanceFilter`.
4. **Calculations & Formatters**:
   - `src/utils/calculations.ts` (validation rules: mutual exclusivity, percentages, shift totals).
   - `src/utils/formatters.ts` (Spanish date formatting, percentage formatting, shift name formatting).
5. **Authentication & Session**:
   - `src/contexts/AuthContext.tsx` (User session state, login, logout, switchDemoUser, role check helper).
   - `src/hooks/useAuth.ts` (Custom hook).
   - `src/components/auth/LoginView.tsx` (Institutional login page with role demo account buttons for admin, preceptor, profesor).
   - `src/components/auth/ProtectedRoute.tsx` (Authentication gate).
   - `src/components/auth/RoleGuard.tsx` (Role authorization gate + Forbidden 403 view).
6. **Application Shell & Router**:
   - `src/App.tsx` (React Router routes: `/login`, `/attendance`, `/dashboard`, `/admin/courses`, `/admin/users`, `/403`, default redirect).
   - `src/main.tsx` (Entry point mounting React root with Router and AuthProvider).
