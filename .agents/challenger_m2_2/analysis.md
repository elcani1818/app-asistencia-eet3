# Adversarial & Empirical Verification Analysis: Milestone 2 (M2)

**Evaluator**: Challenger 2 (`challenger_m2_2`)  
**Milestone**: M2 (Frontend Foundation, Design System, Auth & State Management Layer)  
**System**: Sistema Digital de Asistencia y Parte General Diario — E.E.S.T. N° 3 "Ntra. Sra. de la Merced" (Loma Hermosa)  
**Evaluation Date**: 2026-08-20  

---

## 1. Executive Summary & Verification Matrix

Milestone 2 establishes the complete frontend application foundation, institutional UI design system, dual-gender mathematical engine, role-based authentication/authorization layer, and master router shell.

This empirical challenger review subjected the M2 deliverables to rigorous adversarial stress testing, boundary analysis, permission escalation tests, and responsive layout verification.

### Verification Scorecard

| Module / Feature | Specification | Empirical Evaluation | Edge Case Stress | Status |
|---|---|---|---|:---:|
| **F-01: Responsive Design System** | Institutional color palette (`escuela-navy`, `escuela-blue`, `escuela-gold`, `escuela-canvas`), typography, 44px touch targets, mobile drawer, print styles | Header, Navbar, Button, Input, Card, Badge, Modal, LoadingSpinner | 375px mobile viewport, dynamic wrapping, print media stylesheet isolation | **PASSED** |
| **F-02: Role-Based Auth & Session** | Three roles (`administrador`, `preceptor`, `profesor`), demo accounts, password hashing, session caching, route protection, 403 screen | `AuthContext.tsx`, `useAuth.ts`, `LoginView.tsx`, `ProtectedRoute.tsx`, `RoleGuard.tsx` | Role demotion, horizontal teacher access attacks, deactivated account lockout | **PASSED** |
| **F-03 (Part): Mathematical Engine** | Dual-gender parity $P_V + A_V = I_V \land P_M + A_M = I_M$, shift aggregation, Argentine date formatters | `calculations.ts`, `formatters.ts`, `types/index.ts` | Zero-female cohorts, 0% and 100% attendance, negative counts, fractional numbers | **PASSED** |
| **Component Barrel Exports** | Zero missing named/default exports for seamless downstream milestone integration | `src/components/common/index.ts`, `src/components/auth/index.ts` | Cross-module import resolution | **PASSED** |

---

## 2. Feature F-01: Institutional Design System & UI Library Analysis

### 2.1 Color Palette & Institutional Tokens
- Verified color definitions in `tailwind.config.js` and `src/index.css`:
  - `escuela-navy`: `#0f2942` (institutional primary dark background and contrast headers).
  - `escuela-blue`: `#1e5f8a` (interactive primary buttons and focus rings).
  - `escuela-gold`: `#c59b27` (school crest accent and highlight borders).
  - `escuela-canvas`: `#f4f7fa` (high legibility background).
  - Status indicators: `presente` (`#16a34a`), `ausente` (`#dc2626`), `media` (`#d97706`), `justificada` (`#2563eb`).
- **Contrast Check**: Text on `escuela-navy` (#ffffff on #0f2942) produces a contrast ratio of >13:1, well above WCAG 2.1 AAA standards (7:1). Text on buttons (#ffffff on #1e5f8a) produces >4.8:1, satisfying WCAG AA standards.

### 2.2 Component Ergonomics & Accessibility
- `Header.tsx`:
  - Institutional crest icon (`School`) in gold badge.
  - Full title "Escuela de Educación Secundaria Técnica N° 3 — Ntra. Sra. de la Merced (Loma Hermosa)".
  - Dynamic shift badge (`Turno Mañana`, `Turno Tarde`, `Turno Vespertino`).
  - Formatted Argentine Spanish dates (`formatArgentineDate(date, 'long')` for desktop, `short` for mobile).
- `Navbar.tsx`:
  - Role-filtered navigation links: Professors only see "Cargar Asistencia"; Preceptors see "Cargar Asistencia" + "Parte General"; Admins see all modules including "Cursos" and "Usuarios".
  - Active route highlighting with high contrast gold accents.
  - User capsule displaying full name, email, and role badge.
  - Mobile hamburger drawer navigation with animated transition and full touch accessibility.
- `Button.tsx`:
  - Variants: `primary`, `secondary`, `gold`, `danger`, `outline`, `ghost`.
  - Sizes: `sm` (32px), `md` (40px), `lg` (48px).
  - Accessible states: `aria-disabled`, `aria-busy`, `disabled`, with embedded SVG `LoadingSpinner`.
- `Input.tsx`:
  - Forwarded ref support.
  - Accessible error alerts (`role="alert"`, `aria-invalid`, `aria-describedby`).
  - Mobile numeric optimization (`input[type="number"]` without default browser spinners, clean touch padding).
- `Card.tsx`:
  - Compound structure: `Card.Header`, `Card.Title`, `Card.Description`, `Card.Content`/`Card.Body`, `Card.Footer`.
  - Variants: `default`, `primary`, `accent`, `stat` (with 4px left accent bar).
- `Badge.tsx`:
  - Variants for all roles (`administrador`, `preceptor`, `profesor`), shifts (`manana`, `tarde`, `vespertino`), attendance statuses (`presente`, `ausente`, `media_falta`, `justificada`), and technical orientations (`tecqu`, `tecmm`, `tecet`, `mmo`).
  - Dot indicator support with synchronized colors.
- `Modal.tsx`:
  - Accessible dialog (`role="dialog"`, `aria-modal="true"`).
  - Backdrop blur, click-outside dismissal, and keyboard `Escape` handler with body scroll lock.
- `LoadingSpinner.tsx`:
  - Accessible SVG spinner with `role="status"` and hidden screen reader fallback.

---

## 3. Feature F-02: Role-Based Authentication & Session Management

### 3.1 Authentication Context (`AuthContext.tsx`)
- **Dual Mode Operation**:
  1. Instant Demo Evaluation: Matches predefined demo accounts in `DEMO_USERS` (`admin`, `preceptor_manana`, `preceptor_tarde`, `preceptor_vespertino`, `profesor_quimica`, `profesor_electrom`) and alias normalization (`DEMO_USER_ALIASES`), allowing one-click reviewer evaluation without backend setup.
  2. Live Supabase Auth: Connects to Supabase GoTrue `signInWithPassword`, querying PostgreSQL `profiles` table for role, shift, and assigned courses.
- **Session Persistence**:
  - Automatically caches active session in `localStorage` under `eest3_auth_session`.
  - Safe error recovery on corrupted JSON in `localStorage`.
  - Clears storage on `logout()`.
- **Account State & Deactivation**:
  - Throws `Cuenta desactivada` error if `is_active === false`, preventing deactivated users from gaining access.

### 3.2 Authorization Gates & Route Guards
- `ProtectedRoute.tsx`:
  - Intercepts unauthenticated navigation and redirects to `/login`, preserving initial target URL in `location.state.from`.
  - Renders loading spinner while session initializes.
- `RoleGuard.tsx`:
  - Restricts routes based on `allowedRoles`.
  - Unauthorized users are redirected to `/403` (`Forbidden403`).
- `Forbidden403.tsx`:
  - Institutional branded access denied page with active user role display, "Volver a mi Panel" redirect button, and logout button.
- `App.tsx` Routing Architecture:
  - `/login`: Public login screen with 4 instant demo account buttons.
  - `/`: Dispatches automatically to `/attendance` (Profesor) or `/dashboard` (Preceptor / Admin).
  - `/attendance`: Accessible by `profesor`, `preceptor`, `administrador`.
  - `/dashboard`: Accessible by `preceptor`, `administrador`. Guarded from `profesor`.
  - `/admin/courses` & `/admin/users`: Strictly guarded for `administrador`.

---

## 4. Mathematical Engine & Calculation Invariants Stress Testing

### 4.1 Dual-Gender Parity Formula: $P_V + A_V = I_V \land P_M + A_M = I_M$
The function `validateAttendanceRow` in `src/utils/calculations.ts` was tested against adversarial inputs:

1. **Zero Female Cohort (e.g. 5° 4ª TECET)**:
   - Input: $I_V=8, I_M=0, P_V=7, P_M=0, A_V=1, A_M=0$
   - Result: `isValid: true, varonesValid: true, mujeresValid: true, varonesDisparity: 0, mujeresDisparity: 0`.
2. **Zero Male Cohort (All-Female Course)**:
   - Input: $I_V=0, I_M=25, P_V=0, P_M=24, A_V=0, A_M=1$
   - Result: `isValid: true`.
3. **Disparity Under-Count**:
   - Input: $I_V=11, I_M=4, P_V=9, P_M=4, A_V=1, A_M=0 \implies (P_V+A_V)=10 \neq 11$
   - Result: `isValid: false, varonesDisparity: -1, errorMessage: "Varones: Faltan 1 para completar los 11 inscriptos"`.
4. **Disparity Over-Count**:
   - Input: $I_V=11, I_M=4, P_V=11, P_M=4, A_V=1, A_M=0 \implies (P_V+A_V)=12 \neq 11$
   - Result: `isValid: false, varonesDisparity: 1, errorMessage: "Varones: Sobran 1 (suma 12 de 11 inscriptos)"`.
5. **Negative Value Attack**:
   - Input: $P_V = -1$
   - Result: `isValid: false, errorMessage: "Los valores no pueden ser negativos"`.
6. **Non-Integer Decimal Attack**:
   - Input: $P_V = 10.5, A_V = 0.5$
   - Result: `isValid: false, errorMessage: "Los valores deben ser números enteros"`.
7. **Percentage Calculation with Media Falta (0.5 weight)**:
   - Input: 10 present, 2 half-absent out of 20 enrolled $\implies (10 + 2 \times 0.5) / 20 = 11 / 20 = 55.00\%$.
   - Result: `55.00%`.

---

## 5. Viewport Responsiveness (375px Mobile Simulation)

- **Grid and Breakpoints**:
  - `xs: 375px` defined in `tailwind.config.js`.
  - All containers use responsive flex/grid wrappers (`flex-col sm:flex-row`, `grid grid-cols-1 sm:grid-cols-2`).
  - No fixed pixel widths exceeding 320px without `w-full max-w-*` constraints.
- **Header & Navbar on Small Screens**:
  - Header switches from long Argentine date ("Jueves, 20 de Agosto de 2026") to concise date ("20/08/2026").
  - Navbar collapses into mobile drawer with hamburger button, maintaining 44px touch targets.
- **Login View on Small Screens**:
  - Quick-login buttons arrange in a 2x2 grid with clear icons and truncated labels that do not overflow.

---

## 6. Adversarial Attack Scenarios & Mitigations

| Attack Scenario | Vector | Expected Defense | Verified Outcome |
|---|---|---|:---:|
| **Horizontal Course Submission Attack** | Profesor A attempts to submit attendance for a course assigned to Profesor B | Rejected with authorization error | **PASS** (Protected at context & backend RLS) |
| **Direct URL Privilege Escalation** | Profesor navigates directly to `/admin/users` or `/dashboard` | Blocked by `RoleGuard` and redirected to `/403` | **PASS** (RoleGuard strictly blocks unauthorized routes) |
| **Unauthenticated API Access** | Guest attempts direct access to `/attendance` | Blocked by `ProtectedRoute` and redirected to `/login` | **PASS** (Redirects preserving `state.from`) |
| **Tampered LocalStorage Session** | Malformed JSON in `localStorage` | Gracefully handled, cleared, and reset to unauthenticated | **PASS** (`try/catch` in `AuthContext` useEffect) |
| **Deactivated Account Login** | Inactive staff member attempts authentication | Login rejected with explicit error message | **PASS** (`is_active` check throws descriptive error) |

---

## 7. Conclusion

All functional requirements (F-01, F-02, and calculation engine F-03) meet the highest engineering standards, strict dual-gender mathematical integrity, and comprehensive RBAC security. No regressions, syntax errors, or vulnerabilities were found.
