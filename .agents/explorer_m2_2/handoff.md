# Handoff Report: Institutional Design System & Common UI Component Library (M2)

- **Agent**: `explorer_m2_2`
- **Milestone**: M2 (Frontend Foundation, Design System, Auth & State Management Layer)
- **Target Role**: M2 Implementers / Frontend Engineers (`coder_m2_1`, `coder_m2_2`)
- **Date**: 2026-08-20

---

## 1. Observation

1. **Existing Base & Schema**:
   - `src/lib/supabase.ts` (lines 1-69) instantiates the Supabase client using `@supabase/supabase-js` and types from `src/types/database.ts`.
   - `src/types/database.ts` (lines 20-56) defines `UserRole` (`'administrador' | 'preceptor' | 'profesor'`), `CourseCycle` (`'basico' | 'superior' | 'tecnico_especial'`), `TechnicalOrientation` (`'TECQU' | 'TECMM' | 'TECET' | 'C.TEC.MMO' | ...`), `AttendanceStatus`, and `ShiftCode` (`'manana' | 'tarde' | 'vespertino'`).
   - `PROJECT.md` (lines 47-117) and `tests/harness/types.ts` (lines 1-135) define the frontend domain models: `UserProfile`, `Shift`, `Course`, `AttendanceRecord`, `StaffAbsence`, `ShiftParteGeneralReport`.

2. **Styling & Layout Requirements**:
   - `ORIGINAL_REQUEST.md` (lines 10-31, 78-81) requires full school structure representation for all 3 shifts (Mañana, Tarde, Vespertino), institutional branding for "Escuela de Educación Secundaria Técnica N° 3 — Ntra. Sra. de la Merced (Loma Hermosa)", and usability on $375\text{px}$ mobile screens up to $1280\text{px}+$ desktop displays without horizontal overflow.
   - `SCOPE.md` (lines 21-30) prescribes the exact deliverables for F-01:
     * `src/index.css` with Tailwind styles, custom scrollbars, institutional theme tokens.
     * `src/components/common/Header.tsx` (School crest, exact institutional title, active shift badge, formatted Argentine date).
     * `src/components/common/Navbar.tsx` (Responsive navbar with active link highlight, role pill badges, user profile dropdown/logout, mobile navigation drawer).
     * Reusable primitives: `Button.tsx`, `Input.tsx`, `Card.tsx`, `Badge.tsx`, `Modal.tsx`, `LoadingSpinner.tsx`.

3. **E2E Infrastructure Readiness**:
   - `TEST_READY.md` (lines 1-20) confirms an independent 153-test verification suite runnable via `npx tsx tests/runner/index.ts --tier=all` covering R1-R5 and F-01 to F-20.

---

## 2. Logic Chain

1. **Design System Consistency**:
   - From Observation 1 & 2, the application requires institutional solemnity paired with high-contrast data visualization for dual-gender attendance calculations.
   - The palette is structured around:
     * **Navy Brand**: `#0f2942` (`escuela-navy-900`) and `#163b5c` (`escuela-navy-800`) for headers, navbars, and primary contrast surfaces.
     * **Blue Secondary**: `#1e5f8a` (`escuela-blue-600`) and `#2575a7` (`escuela-blue-500`) for interactive elements and active tab states.
     * **Gold Accent**: `#d4a017` (`escuela-gold-600`) and `#f0c242` (`escuela-gold-400`) reflecting the school emblem and badge highlights.
     * **Semantic Status**: Presente (`#16a34a`), Ausente (`#dc2626`), Media Falta (`#d97706`), Justificada (`#2563eb`).
   - Every text-background pair in this palette satisfies WCAG 2.1 AA ($>4.5:1$ contrast ratio), verified in `analysis.md` Section 2.2.

2. **Component Modularity & Typing**:
   - From Observation 2, the UI primitives in `src/components/common/` must be completely decoupled from backend state while accepting strictly typed props matching `src/types/database.ts` and `PROJECT.md`.
   - `Header.tsx` encapsulates the formal school title, dynamic shift pill, and localized Argentine date formatted via `Intl.DateTimeFormat('es-AR')`.
   - `Navbar.tsx` filters navigation links dynamically based on the active user's `role` (`administrador`, `preceptor`, `profesor`), provides a logout trigger, and supports a responsive drawer for mobile viewports.
   - `Button.tsx`, `Input.tsx`, `Card.tsx`, `Badge.tsx`, `Modal.tsx`, and `LoadingSpinner.tsx` provide standardized building blocks with integrated ARIA accessibility attributes (`aria-invalid`, `aria-busy`, `aria-modal`, `role="dialog"`).

3. **Mobile & Desktop Ergonomics**:
   - To support classroom teachers on smartphones without horizontal scrollbars, input fields incorporate `inputmode="numeric"`, `pattern="[0-9]*"`, and touch targets with minimum dimensions of $44\text{px} \times 44\text{px}$.
   - Wide summary tables utilize thin custom scrollbars (`.custom-scrollbar` in `src/index.css`) and responsive breakpoint collapsing.

---

## 3. Caveats

1. **SVGs & Institutional Crest Assets**: While standard SVG school emblem icons (from Lucide React) are used in `Header.tsx`, a dedicated high-resolution institutional PNG/SVG crest can be swapped into `src/assets/logo-eest3.svg` once approved by school directivos.
2. **Framework Compatibility**: The component specifications are fully compatible with both React 18 and React 19 in TypeScript strict mode with Tailwind CSS 3.4+.
3. **No Direct Code Modifications in Source**: As an Explorer, this report provides architectural blueprints, token mappings, and TypeScript contracts in `analysis.md` without modifying `src/` directly.

---

## 4. Conclusion

The specification for the Institutional Design System and Common UI Component Library is complete, comprehensive, and ready for immediate implementation in Milestone 2. 

The implementer can follow the exact contracts, Tailwind configurations, and component blueprints detailed in `analysis.md` to produce:
1. `tailwind.config.js` (with extended `escuela` color tokens and shadow elevations).
2. `src/index.css` (with font smoothing, print stylesheets, and custom scrollbars).
3. `src/components/common/Header.tsx`
4. `src/components/common/Navbar.tsx`
5. `src/components/common/Button.tsx`
6. `src/components/common/Input.tsx`
7. `src/components/common/Card.tsx`
8. `src/components/common/Badge.tsx`
9. `src/components/common/Modal.tsx`
10. `src/components/common/LoadingSpinner.tsx`
11. `src/components/common/index.ts` (barrel export)

---

## 5. Verification Method

To verify the design system and UI components once implemented:

1. **Compilation & Type Checking**:
   ```bash
   npm run build
   # or
   npx tsc --noEmit
   ```
2. **E2E Test Suite Pass**:
   ```bash
   npx tsx tests/runner/index.ts --tier=all
   ```
3. **Visual & Accessibility Inspection**:
   - Inspect `Header.tsx` renders exact string: `"Escuela de Educación Secundaria Técnica N° 3 — Ntra. Sra. de la Merced (Loma Hermosa)"`.
   - Inspect `Navbar.tsx` role-based link filtering for `administrador`, `preceptor`, and `profesor`.
   - Emulate $375\text{px}$ viewport in browser DevTools to ensure zero horizontal body overflow and touch targets $\ge 44\text{px}$.
