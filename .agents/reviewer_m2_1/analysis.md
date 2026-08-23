# Review & Adversarial Analysis: Milestone 2 (M2)

**System**: Escuela de Educación Secundaria Técnica N° 3 — "Ntra. Sra. de la Merced" (Loma Hermosa)  
**Milestone**: M2 (Frontend Foundation, Design System, Auth & State Management Layer)  
**Reviewer**: `reviewer_m2_1`  
**Date**: 2026-08-20  
**Verdict**: **APPROVE**

---

## 1. Executive Summary

Milestone 2 establishes the complete frontend architecture, institutional design system, complete TypeScript domain models, mathematical calculation/validation engine, and authentication & session management layer.

The implementation was reviewed against the master architecture in `PROJECT.md`, `SCOPE.md`, and the initial requirements in `ORIGINAL_REQUEST.md`. Adversarial stress-testing of calculation formulas, boundary conditions, edge cases, date parsing mechanics, and authentication state transitions was performed.

**Verdict**: **APPROVE**. The codebase demonstrates exceptional quality, mathematical rigor, clean architectural separation, and strict integrity compliance with zero bypasses or shortcuts.

---

## 2. Review Dimensions & Evidence

### 2.1 Focus 1: Complete TypeScript Types & Domain Models (`src/types/index.ts`)
- **Interface Contract Alignment**:
  * `AppRole`, `Role`: Strictly typed as `'administrador' | 'preceptor' | 'profesor'`.
  * `ShiftCode`, `ShiftType`: Strictly `'manana' | 'tarde' | 'vespertino'`.
  * `CycleType`, `CourseCycle`: Strictly `'basico' | 'superior' | 'tecnico_especial'`.
  * `OrientationType`, `TechnicalOrientation`: Strictly `'TECQU' | 'TECMM' | 'TECET' | 'C.TEC.MMO' | null`.
  * `Course`: Contains `id`, `shift_id`, `name`, `year`, `division`, `cycle`, `orientation`, `inscriptos_varones`, `inscriptos_mujeres`, `inscriptos_total`, `sort_order`, `is_active`.
  * `AttendanceRecord`: Full alignment with database snapshot fields (`inscriptos_varones_snapshot`, `inscriptos_mujeres_snapshot`, `inscriptos_total_snapshot`, `presentes_varones`, `presentes_mujeres`, `presentes_total`, `ausentes_varones`, `ausentes_mujeres`, `ausentes_total`, `observaciones`, `is_locked`, `submitted_at`).
  * `StaffAbsence`: Supports both docencia and auxilares tracking with `staff_name`, `role_type`, `subject_or_area`, `reason`, `is_justified`, `observations`.
  * `Database`: Full PostgreSQL schema mirroring Supabase DDL with RPC payloads for `fn_get_shift_parte_general`.

### 2.2 Focus 2: Calculation & Validation Engine (`src/utils/calculations.ts`)
- **Dual-Gender Parity Invariant ($P_V + A_V = I_V$ and $P_M + A_M = I_M$)**:
  * Evaluated across symmetric cohorts, asymmetric cohorts (e.g., 5° 4ª with 0 females: $I_V=8, I_M=0$), all-absent cohorts ($P=0$), and full-attendance cohorts ($A=0$).
  * Negative number guards: Strictly rejects negative counts before calculating disparities.
  * Non-integer / Decimal guards: Strictly rejects floating point inputs with `Number.isInteger()`.
  * Disparity calculation: Computes exact delta `(P + A) - I` and outputs descriptive Spanish guidance (e.g., *"Varones: Faltan 1 para completar los 11 inscriptos"*, *"Mujeres: Sobran 1 (suma 5 de 4 inscriptas)"*).
- **Percentage Calculation**:
  * Formula: $(\text{Presentes} / \text{Inscriptos}) \times 100$.
  * Division by Zero Protection: Safely returns `0.0` when $\text{Inscriptos} \le 0$ or on empty arrays.
  * Media Falta Support: Correctly weights `media_falta` at $0.5$ and `presente` at $1.0$.
  * Rounding Precision: Formats using `.toFixed(2)` and parses as `Number` to prevent IEEE 754 floating point artifacts.
- **Shift Totals Aggregation**:
  * Consolidates multi-course shift rows into grand totals for inscriptos, presentes, ausentes, media faltas, and overall shift percentage.
  * Handles partial shift submissions accurately distinguishing submitted vs pending courses.

### 2.3 Focus 3: Institutional Date & Formatters Engine (`src/utils/formatters.ts`)
- **Timezone-Safe Date Parsing**:
  * Splitting `YYYY-MM-DD` strings directly prevents UTC midnight timezone shifts that would otherwise roll dates backward in UTC-3 (Argentina local time).
- **Argentine Institutional Spanish Formats**:
  * `long`: `"Jueves, 20 de Agosto de 2026"`.
  * `short`: `"20/08/2026"`.
  * `official`: `"LOMA HERMOSA, 20 de Agosto de 2026"`.
  * `iso`: `"2026-08-20"`.
- **Percentage & Shift Name Formatters**:
  * `formatPercentage(value, decimals)`: Division-by-zero, null, undefined, and NaN safe, returning `"0.0%"`.
  * `formatShiftName(code)`: Accurately maps `'manana'`, `'tarde'`, `'vespertino'`, and aliases (`'tm'`, `'tt'`, `'tv'`) to `"Turno Mañana"`, `"Turno Tarde"`, and `"Turno Vespertino"`.

### 2.4 Focus 4: Clean Exports, Component Library & Routing Shell
- **Atomic UI Components**:
  * `Header.tsx`: Features school crest, institutional branding, active shift pill badge, and live Argentine Spanish date.
  * `Navbar.tsx`: Role-filtered navigation links, active route highlight, user profile capsule with role badge, mobile drawer navigation menu.
  * `Button.tsx`, `Input.tsx`, `Card.tsx`, `Badge.tsx`, `Modal.tsx`, `LoadingSpinner.tsx`: Accessible, WCAG AA compliant, touch-friendly ($44\text{px}$ touch targets).
- **Authentication & Security Guards**:
  * `AuthContext.tsx`: Session state, local persistence, instant demo account evaluation switcher (`admin`, `preceptor_manana`, `preceptor_tarde`, `preceptor_vespertino`, `profesor_quimica`, `profesor_electrom`), and live Supabase Auth fallback.
  * `ProtectedRoute.tsx`: Gate protecting private routes against unauthenticated requests.
  * `RoleGuard.tsx`: Strict RBAC authorization gate redirecting unauthorized users to `/403`.
  * `Forbidden403.tsx`: Branded 403 Forbidden page with navigation back to allowed panels.
  * `App.tsx`: Full router shell with layout integration.

---

## 3. Adversarial Stress-Testing Matrix

| Test Scenario | Input / Action | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|---|
| **Zero Female Enrollment** | $I_V=8, I_M=0, P_V=7, A_V=1, P_M=0, A_M=0$ | `isValid: true`, `disparities: 0` | Validated true, 0 disparity | **PASS** |
| **Excess Female in Zero-Female Course** | $I_V=8, I_M=0, P_M=1, A_M=0$ | `isValid: false`, `mujeresDisparity: 1` | `isValid: false`, error message generated | **PASS** |
| **All-Female Cohort** | $I_V=0, I_M=25, P_M=25, A_M=0$ | `isValid: true` | `isValid: true` | **PASS** |
| **Divide by Zero (Percentage)** | $P=0, I=0$ or $P=10, I=0$ | Return `0.0`, no NaN or Infinity | Returns `0.0` | **PASS** |
| **Negative Values** | $P_V=-1, A_V=12, I_V=11$ | Reject with "Los valores no pueden ser negativos" | Caught and rejected | **PASS** |
| **Decimal / Floating Point** | $P_V=10.5, A_V=0.5, I_V=11$ | Reject with "Los valores deben ser números enteros" | Caught and rejected | **PASS** |
| **Date Timezone Shift** | Parse `"2026-08-20"` in UTC-3 | Output "20/08/2026", never "19/08/2026" | Accurately parsed date parts without shift | **PASS** |
| **Leap Year Date** | `"2024-02-29"` | Formats to "Jueves, 29 de Febrero de 2024" | Validated cleanly | **PASS** |
| **Unauthorized Access (Teacher to Dashboard/Admin)** | Role: `profesor` attempting `/dashboard` | Blocked by `RoleGuard` -> redirect to `/403` | Blocked and routed to 403 | **PASS** |
| **Unauthenticated Route Access** | Non-logged-in user attempting `/attendance` | Blocked by `ProtectedRoute` -> redirect to `/login` | Redirected to `/login` with `from` state | **PASS** |

---

## 4. Integrity Violation Check
- [x] No hardcoded test results embedded in calculation or domain logic.
- [x] No dummy facades mimicking calculations without real logic.
- [x] No bypassed requirements.
- [x] Full independence of verification.

---

## 5. Verdict & Recommendation

**Verdict**: **APPROVE**  
Milestone 2 meets all architectural, functional, aesthetic, and mathematical specifications outlined in `PROJECT.md` and `SCOPE.md`. The foundation is complete and ready for Milestone 3 (Attendance Form & Entry Module).
