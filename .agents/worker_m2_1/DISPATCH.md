## 2026-08-20T14:37:19Z
You are the Worker for Milestone 2 (M2: Frontend Foundation, Design System, Auth & State Management Layer).
Your working directory is: d:\CanY\PROYECTOS CANY\App colegio\.agents\worker_m2_1

Read carefully before starting work:
- ORIGINAL_REQUEST.md at: d:\CanY\PROYECTOS CANY\App colegio\ORIGINAL_REQUEST.md
- PROJECT.md at: d:\CanY\PROYECTOS CANY\App colegio\PROJECT.md
- SCOPE.md at: d:\CanY\PROYECTOS CANY\App colegio\.agents\sub_orch_m2\SCOPE.md
- Explorer 1 Report at: d:\CanY\PROYECTOS CANY\App colegio\.agents\explorer_m2_1\analysis.md
- Explorer 2 Report at: d:\CanY\PROYECTOS CANY\App colegio\.agents\explorer_m2_2\analysis.md
- Explorer 3 Report at: d:\CanY\PROYECTOS CANY\App colegio\.agents\explorer_m2_3\analysis.md
- TEST_INFRA.md and TEST_READY.md at: d:\CanY\PROYECTOS CANY\App colegio\

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Assigned Scope & Exclusive Write Ownership:
1. Frontend Build & Tooling:
   - `package.json`: scripts (`dev`, `build`, `test`, `preview`, `test:e2e`), dependencies (react, react-dom, react-router-dom, @supabase/supabase-js, lucide-react, recharts, jspdf, jspdf-autotable, xlsx, clsx, tailwind-merge), devDependencies (vite, @vitejs/plugin-react, typescript, tailwindcss, postcss, autoprefixer, tsx).
   - `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`, `index.html`.
2. Institutional Design System & Theme:
   - `src/index.css`: Tailwind directives, custom font imports, institutional color palette (`escuela-navy` #0f2942, `escuela-blue` #1e5f8a, `escuela-gold` #c59b27, `escuela-light` #f4f7fa, status colors: presente #16a34a, ausente #dc2626, media_falta #d97706, justificada #2563eb).
   - `src/components/common/`:
     * `Header.tsx`: School crest/emblem, institutional title "Escuela de Educación Secundaria Técnica N° 3 — Ntra. Sra. de la Merced (Loma Hermosa)", current date/time in Argentine Spanish, active shift badge (Mañana, Tarde, Vespertino).
     * `Navbar.tsx`: Responsive navigation bar with active route highlighting, role badges (`Administrador`, `Preceptor`, `Profesor`), user info, and logout action. Mobile hamburger drawer / bottom bar for mobile screens (375px+).
     * `Button.tsx`, `Input.tsx`, `Card.tsx`, `Badge.tsx`, `Modal.tsx`, `LoadingSpinner.tsx`.
3. Complete Domain Types & Interfaces:
   - `src/types/index.ts`: Full domain models (`User`, `Role`, `Shift`, `AttendanceStatus`, `Student`, `Course`, `AttendanceRecord`, `AttendanceRow`, `ShiftSummary`, `AttendanceFilter`, `DailyAttendanceStats`).
4. Core Calculation & Validation Engine:
   - `src/utils/calculations.ts`: `validateAttendanceRow(row)`, `calculateAttendancePercentage(records)`, `calculateShiftTotals(rows, shift)`.
   - `src/utils/formatters.ts`: Date formatting in Argentine Spanish ("Lunes, 20 de Agosto de 2026", "20/08/2026"), percentage formatting, shift name formatting.
5. Authentication & State Management Layer:
   - `src/config/demoUsers.ts`: Demo credentials for Admin, Preceptor Mañana, Preceptor Tarde, Profesor.
   - `src/contexts/AuthContext.tsx`: Session state, login, logout, switchDemoUser, hasRole, isPreceptorForCourse.
   - `src/hooks/useAuth.ts`: Custom hook.
   - `src/components/auth/LoginView.tsx`: Polished login screen with institutional branding, email/password inputs, validation, demo accounts quick-login buttons for instant evaluation.
   - `src/components/auth/ProtectedRoute.tsx`, `RoleGuard.tsx`, `Forbidden403.tsx`.
6. Shell Application Router:
   - `src/App.tsx`: React Router configuration with `/login`, `/attendance`, `/dashboard`, `/admin/courses`, `/admin/users`, `/403`, and default redirects based on user role.
   - `src/main.tsx`: Application entry point.

Verification Requirements:
1. Verify the project builds cleanly (`npx tsc --noEmit` and `npm run build` or `npx vite build`).
2. Run the E2E test runner (`npx tsx tests/runner/index.ts --tier=1` or relevant tier) if applicable, or verify the exports required by the test runner.
3. Write your progress to `d:\CanY\PROYECTOS CANY\App colegio\.agents\worker_m2_1\progress.md` and complete handoff report at `d:\CanY\PROYECTOS CANY\App colegio\.agents\worker_m2_1\handoff.md`.
4. When done, send a message to your parent orchestrator.
