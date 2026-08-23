# Milestone 3 (M3) Adversarial Challenge Report: Challenger 1

**Reviewer Role**: Challenger 1 (Empirical Challenger: Critic & Specialist)  
**Target Milestone**: M3 (Teacher & Preceptor Daily Attendance Entry Module)  
**Date**: 2026-08-20  
**Overall Risk Assessment**: **LOW / ROBUST**

---

## 1. Executive Summary

An adversarial stress test of Milestone 3 (M3 Daily Attendance Entry Module) was conducted across mathematical calculation engines, React hook state transitions, UI form constraints, boundary defenses, and backend service persistence guards. 

A dedicated 30-case adversarial test suite (`tests/tier2_boundaries/m3_challenger_stress.test.ts`) was authored and registered into the master test runner (`tests/runner/index.ts`).

### Key Findings & Verdict
- **Mathematical Invariant Defenses**: $P_V + A_V = I_V$ and $P_M + A_M = I_M$ are strictly enforced with per-gender isolation. Compensating disparities (where total sum equals enrollment but gender distributions are incorrect) are strictly trapped and rejected.
- **Single-Gender Cohorts**: Single-gender courses (e.g. 5° 4ª TECET with 8V, 0M; 6° 4ª TECET with 6V, 0M; 7° 4ª TECET with 8V, 0M) are handled natively. The UI automatically disables and zeros female input fields, and the calculation engine correctly permits valid male inputs while rejecting any phantom female student inputs.
- **Extreme Cohorts & Zero Enrollment**: Cohorts with 0 enrollment ($I_V=0, I_M=0$) evaluate to 0.00% without divide-by-zero or `NaN` errors. Large cohorts up to 50 and stress cohorts up to 1000 calculate without numeric overflow.
- **Hostile Input Sanitization**: Negative counts and floating point/decimal counts are strictly rejected with descriptive Spanish error messages (`"Los valores no pueden ser negativos"`, `"Los valores deben ser números enteros"`).
- **Temporal Locks**: Future dates are strictly blocked for all users; past dates enforce read-only mode for teachers (`profesor`) and preceptors (`preceptor`), while permitting direct administrative rectification for `administrador`.

---

## 2. Adversarial Challenge Matrix & Results

| # | Attack Vector / Scenario | Target System | Expected Behavior | Stress Test Result | Status |
|---|--------------------------|---------------|-------------------|-------------------|--------|
| **CH-01** | Zero Enrollment Cohort ($I_V=0, I_M=0$) | `calculations.ts` | Valid when all 0s, $\%A=0\%$ without divide-by-zero | Handled cleanly, returns $0$ | **PASS** |
| **CH-02** | Phantom Student on Zero Enrollment Cohort | `calculations.ts` | $P_V=1 \implies$ Invalid, Disparity $+1$ | Rejected with disparity $+1$ | **PASS** |
| **CH-03** | Single-Gender Male (5° 4ª TECET: 8V, 0M) | `calculations.ts`, `AttendanceForm.tsx` | Female input disabled ($0$), Male input validated ($0..8$) | $100\%$, $0\%$, $62.5\%$ verified; female entry blocked | **PASS** |
| **CH-04** | Single-Gender Female (Synthetic 0V, 15M) | `calculations.ts` | Male input locked, Female input validated ($0..15$) | $100\%$, $80\%$ verified; male entry blocked | **PASS** |
| **CH-05** | Maximum Standard Cohort (50 Students: 25V, 25M) | `calculations.ts` | Boundary math and totals exact | Validates $42/50 \implies 84.0\%$ | **PASS** |
| **CH-06** | Massive Cohort Overflow (1000 Students) | `calculations.ts` | Arithmetic remains stable without precision degradation | Validates $930/1000 \implies 93.0\%$ | **PASS** |
| **CH-07** | Negative Present Input ($P_V = -2, A_V = 12$) | `calculations.ts` | Rejected even if sum algebraically matches ($10 = 10$) | Rejected: `"Los valores no pueden ser negativos"` | **PASS** |
| **CH-08** | Negative Absent Input ($P_V = 15, A_V = -5$) | `calculations.ts` | Rejected even if sum algebraically matches ($10 = 10$) | Rejected: `"Los valores no pueden ser negativos"` | **PASS** |
| **CH-09** | Negative Enrollment ($I_V = -10$) | `calculations.ts` | Rejected immediately | Rejected: `"Los valores no pueden ser negativos"` | **PASS** |
| **CH-10** | Floating Point / Decimals ($P_V = 9.5, A_V = 0.5$) | `calculations.ts` | Non-integer rejected by `Number.isInteger` | Rejected: `"Los valores deben ser números enteros"` | **PASS** |
| **CH-11** | Object Input with Undefined/Missing Keys | `calculations.ts` | Nullish coalescing defaults missing keys to 0 | Safe fallback without unhandled exception | **PASS** |
| **CH-12** | Object Input with `snake_case` Alternative Keys | `calculations.ts` | Supports both camelCase and snake_case properties | Validates cleanly | **PASS** |
| **CH-13** | Disparity Matrix: Exact Match $(0, 0)$ | `calculations.ts` | `isValid: true`, `errorMessage: undefined` | Exact parity confirmed | **PASS** |
| **CH-14** | Disparity Matrix: Male Under-Count $(-3, 0)$ | `calculations.ts` | `isValid: false`, `varonesDisparity: -3` | `"Varones: Faltan 3 para completar los 16 inscriptos"` | **PASS** |
| **CH-15** | Disparity Matrix: Male Over-Count $(+4, 0)$ | `calculations.ts` | `isValid: false`, `varonesDisparity: +4` | `"Varones: Sobran 4 (suma 20 de 16 inscriptos)"` | **PASS** |
| **CH-16** | Disparity Matrix: Female Under-Count $(0, -2)$ | `calculations.ts` | `isValid: false`, `mujeresDisparity: -2` | `"Mujeres: Faltan 2 para completar las 12 inscriptas"` | **PASS** |
| **CH-17** | Disparity Matrix: Female Over-Count $(0, +3)$ | `calculations.ts` | `isValid: false`, `mujeresDisparity: +3` | `"Mujeres: Sobran 3 (suma 15 de 12 inscriptas)"` | **PASS** |
| **CH-18** | Disparity Matrix: Double Under-Count $(-2, -3)$ | `calculations.ts` | `isValid: false`, both disparities reported | Both missing messages combined with semicolon | **PASS** |
| **CH-19** | Disparity Matrix: Double Over-Count $(+2, +2)$ | `calculations.ts` | `isValid: false`, both disparities reported | Both excess messages combined with semicolon | **PASS** |
| **CH-20** | Compensating Disparity: Male $-3$, Female $+3$ | `calculations.ts`, `DisparityAlert.tsx` | `totalValid: true` BUT `isValid: false` | Trapped as invalid; amber banner displayed | **PASS** |
| **CH-21** | Compensating Disparity: Male $+2$, Female $-2$ | `calculations.ts`, `DisparityAlert.tsx` | `totalValid: true` BUT `isValid: false` | Trapped as invalid; amber banner displayed | **PASS** |
| **CH-22** | Quick-Fill: `suggestAbsents` Normal | `calculations.ts` | Exact difference $I - P$ | $18 - 15 = 3$, $18 - 18 = 0$, $18 - 0 = 18$ | **PASS** |
| **CH-23** | Quick-Fill: `suggestAbsents` Overflow Clamp | `calculations.ts` | Clamped to 0 via `Math.max(0, ...)` | Clamps to $0$ when $P > I$ | **PASS** |
| **CH-24** | Shift Totals Aggregation Across Courses | `calculations.ts` | Conservation of totals across 34 courses | Correctly computes grand sums and attendance % | **PASS** |
| **CH-25** | Partial Shift Totals (Submitted vs Global) | `calculations.ts` | Separates submitted % from global cohort % | $93.33\%$ submitted vs $46.67\%$ global | **PASS** |
| **CH-26** | Service Guard: Future Date Upsert | `attendanceService.ts` | Throws future date error | Throws `"No se permite registrar asistencia en fechas futuras"` | **PASS** |
| **CH-27** | Service Guard: Teacher Past Date Upsert | `attendanceService.ts` | Throws 403 date lock error | Throws `"403 Forbidden: Bloqueo de Fecha"` | **PASS** |
| **CH-28** | Service Guard: Admin Historical Override | `attendanceService.ts` | Admin allows past date correction | Saves record with `is_locked: true` flag | **PASS** |
| **CH-29** | Service Guard: Parity Mismatch Persistence | `attendanceService.ts` | Throws parity error before DB insert | Throws `"Inconsistencia en Varones"` | **PASS** |
| **CH-30** | Staff Absence: Mandatory Agent Name & Role | `attendanceService.ts` | Throws validation error on empty fields | Throws mandatory field errors | **PASS** |

---

## 3. Detailed Dimension Analysis

### A. Assumption Stress-Testing
- **Assumption**: Attendance counts can only be non-negative integers that partition official enrollment.
  - **Challenge**: Passing negative counts, non-integers, and floats.
  - **Result**: `validateAttendanceRow` validates `Number.isInteger` and `val < 0` immediately, blocking invalid data before any disparity arithmetic takes place.
- **Assumption**: A course may have zero female students (e.g. Technical Electromechanical orientation).
  - **Challenge**: User typing into disabled female inputs or quick-fill assigning non-zero.
  - **Result**: `AttendanceForm.tsx` detects `im === 0`, disables the inputs with `disabled={isReadOnly || isZeroFemale}` and hardcodes display to `0`. `useAttendance.ts` quick-fill computes `im - 0 = 0`, keeping the state zero.

### B. Compensating Disparity Attack
- **Scenario**: A user enters $P_V = 10, A_V = 0$ for $I_V = 11$ (under-count by 1) and $P_M = 4, A_M = 1$ for $I_M = 4$ (over-count by 1). Total students present + absent = $15$, which matches total enrollment $I_T = 15$.
- **Defense**: The engine computes `totalValid = true`, but `varonesValid = false` and `mujeresValid = false`. The final invariant requires `isValid = varonesValid && mujeresValid`.
- **UX Feedback**: `DisparityAlert.tsx` renders a specialized amber box: *"Error de Compensación: El total general suma 15, pero las cantidades por género no cuadran individualmente. Cada género debe validar por separado."*

### C. Quick-Fill Resilience
- **`todos_presentes`**: Sets $P_V = I_V, P_M = I_M, A_V = 0, A_M = 0$. Always results in 100% attendance and exact parity.
- **`todos_ausentes`**: Sets $P_V = 0, P_M = 0, A_V = I_V, A_M = I_M$. Always results in 0% attendance and exact parity.
- **`autocompletar_ausentes`**: Calculates $A_V = \max(0, I_V - P_V)$ and $A_M = \max(0, I_M - P_M)$. If the user previously typed an excessive present count ($P_V > I_V$), $A_V$ becomes $0$ and the form cleanly flags the positive disparity for the user to rectify.
- **`reset`**: Restores the baseline to the existing saved record (if already submitted) or clears all fields to empty strings.

---

## 4. Conclusion

The Milestone 3 Attendance Entry Module implements airtight mathematical invariants, graceful single-gender cohort handling, robust input validation, and secure temporal role-based locking. All 30 adversarial stress scenarios passed without issue.

**Verdict**: **APPROVE**
