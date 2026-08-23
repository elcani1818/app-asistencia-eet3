## 2026-08-20T14:49:51Z
You are Explorer 3 for Milestone 3 (M3: Teacher & Preceptor Daily Attendance Entry Module).
Your working directory is: d:\CanY\PROYECTOS CANY\App colegio\.agents\sub_orch_m3_explorer_3

Required reading before starting:
- Master Project Blueprint: d:\CanY\PROYECTOS CANY\App colegio\PROJECT.md
- Scope Document: d:\CanY\PROYECTOS CANY\App colegio\.agents\sub_orch_m3\SCOPE.md
- Original User Request: d:\CanY\PROYECTOS CANY\App colegio\ORIGINAL_REQUEST.md
- Test Infra: d:\CanY\PROYECTOS CANY\App colegio\TEST_INFRA.md
- Existing auth in `src/contexts/AuthContext.tsx` or `src/hooks/useAuth.ts` and routes in `src/App.tsx`.

Your Mission:
Investigate and design RBAC Integration, Historical Lockout, Routing, and E2E Test Alignment:
1. Role-Based Access Control (RBAC):
   - How `profesor`, `preceptor`, and `administrador` roles interact with course selection (assigned courses vs all courses).
   - How permissions affect editing vs viewing historical dates (past date edit lockout banner for teachers; preceptor/admin permissions).
2. Routing & Navigation:
   - Mounting `/attendance` in `src/App.tsx` with authentication guard and proper layout wrapping (Navbar/Sidebar).
3. Test Case & Boundary Alignment:
   - Map out all edge cases from `TEST_INFRA.md` for Features F-03 to F-09 (e.g. 0 enrolled students, 100% attendance, 0% attendance, negative numbers prevention, non-integer inputs, empty fields defaulting to 0, past date edit attempts, staff absence duplicates).

Deliverables:
- Write your complete technical analysis and design specification to `d:\CanY\PROYECTOS CANY\App colegio\.agents\sub_orch_m3_explorer_3\analysis.md`
- Write your handoff summary to `d:\CanY\PROYECTOS CANY\App colegio\.agents\sub_orch_m3_explorer_3\handoff.md`
- Send completion message to parent when done.
