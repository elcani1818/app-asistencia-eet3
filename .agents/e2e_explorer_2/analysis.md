# Tier 1 Feature Coverage Test Suite Specification (Features F-01 to F-20)

**Project:** Escuela de Educación Secundaria Técnica N° 3 — Ntra. Sra. de la Merced (Loma Hermosa)  
**System:** Digital Daily Attendance System ("Parte General de Alumnos")  
**Agent:** E2E Explorer 2 (Tier 1 Feature Coverage Specialist)  
**Parent:** E2E Testing Orchestrator (`4762c356-f8e2-4d46-b571-76eda9976f92`)  
**Scope:** Exhaustive Tier 1 Opaque-Box Feature Coverage Specification (F-01 through F-20, Requirements R1 to R5)  
**Date:** 2026-08-20  

---

## 1. Executive Summary & Suite Architecture

The **Tier 1 Feature Coverage Test Suite** constitutes the functional verification foundation of the E.E.S.T. N° 3 Attendance System. It verifies that every feature (F-01 through F-20) across all requirements (R1 through R5) operates in strict accordance with institutional rules, mathematical invariants, and security policies.

### Core Testing Principles
1. **Opaque-Box Verification**: Tests interact strictly through public interfaces (HTTP endpoints, Supabase client API, UI DOM selectors, and document byte streams). No internal private method hooks or white-box shortcuts are used.
2. **Deterministic Invariants**: Every attendance transaction must satisfy the dual-gender enrollment conservation law:
   $$\begin{cases} P_V + A_V = I_V \\ P_M + A_M = I_M \\ P_T + A_T = I_T \end{cases}$$
   where $P$ = Presentes, $A$ = Ausentes, and $I$ = Inscriptos.
3. **Paper Form Fidelity**: The 11-column daily summary table, Excel export, and printable PDF must replicate the official paper "Parte General de Alumnos" (`PARTE GENERALES TV.xlsx - T.V.csv`) across all 3 school shifts (**Mañana**, **Tarde**, **Vespertino**).
4. **Granular Role Isolation**: Complete verification of access boundaries across the 3 user roles (**Administrador**, **Preceptor**, **Profesor**).

### Suite Metrics
- **Total Features Covered**: 20 (F-01 to F-20)
- **Total Test Cases**: 120 test cases (6 exhaustive test cases per feature, exceeding the $\ge 5$ requirement)
- **Target Execution Engine**: Standalone TypeScript runner (`tsx` / `Node.js`) with test harness adapters supporting both live Supabase backend and in-memory mock environment.

---

## 2. Requirements & Feature Traceability Matrix

| Feature ID | Feature Name | Primary Requirement | Target Test File | Test Case Range | Total Tests |
|---|---|---|---|---|---|
| **F-01** | User Authentication | R1 (Auth & Roles) | `auth_roles.test.ts` | TC-F01-01 to TC-F01-06 | 6 |
| **F-02** | Role Redirection & Route Guards | R1 (Auth & Roles) | `auth_roles.test.ts` | TC-F02-01 to TC-F02-06 | 6 |
| **F-03** | Course Selector for Teachers | R1, R2 (Submission) | `attendance_form.test.ts` | TC-F03-01 to TC-F03-06 | 6 |
| **F-04** | Pre-populated Header & Metadata | R2 (Submission) | `attendance_form.test.ts` | TC-F04-01 to TC-F04-06 | 6 |
| **F-05** | Gender Breakdown Entry & Math | R2 (Submission) | `attendance_form.test.ts` | TC-F05-01 to TC-F05-06 | 6 |
| **F-06** | Real-time Sum Validation & Blocking | R2 (Submission) | `attendance_form.test.ts` | TC-F06-01 to TC-F06-06 | 6 |
| **F-07** | Date Selector & Historical Locking | R2 (Submission) | `attendance_form.test.ts` | TC-F07-01 to TC-F07-06 | 6 |
| **F-08** | Observaciones Input & Sanitization | R2 (Submission) | `attendance_form.test.ts` | TC-F08-01 to TC-F08-06 | 6 |
| **F-09** | Staff Absences Entry Subform | R2 (Submission) | `attendance_form.test.ts` | TC-F09-01 to TC-F09-06 | 6 |
| **F-10** | Shift Switcher Tabs | R3 (Dashboard) | `dashboard_table.test.ts` | TC-F10-01 to TC-F10-06 | 6 |
| **F-11** | Official 11-Column Summary Table | R3 (Dashboard) | `dashboard_table.test.ts` | TC-F11-01 to TC-F11-06 | 6 |
| **F-12** | Bottom Totals Row & Shift % | R3 (Dashboard) | `dashboard_table.test.ts` | TC-F12-01 to TC-F12-06 | 6 |
| **F-13** | Attendance Trend Charts | R3 (Dashboard) | `dashboard_table.test.ts` | TC-F13-01 to TC-F13-06 | 6 |
| **F-14** | Absent Staff Summary Panel | R3 (Dashboard) | `dashboard_table.test.ts` | TC-F14-01 to TC-F14-06 | 6 |
| **F-15** | Excel (.xlsx) Export Engine | R3 (Dashboard/Export) | `export_engine.test.ts` | TC-F15-01 to TC-F15-06 | 6 |
| **F-16** | PDF Printable Export Engine | R3 (Dashboard/Export) | `export_engine.test.ts` | TC-F16-01 to TC-F16-06 | 6 |
| **F-17** | Course Catalog CRUD | R4 (Course Management) | `course_admin.test.ts` | TC-F17-01 to TC-F17-06 | 6 |
| **F-18** | Seed Data Initializer (CSV Baseline) | R4 (Course Management) | `course_admin.test.ts` | TC-F18-01 to TC-F18-06 | 6 |
| **F-19** | User & Role Management | R1, R4 (Management) | `auth_roles.test.ts` | TC-F19-01 to TC-F19-06 | 6 |
| **F-20** | Realtime Subscriptions & Sync | R3 (Dashboard) | `dashboard_table.test.ts` | TC-F20-01 to TC-F20-06 | 6 |
| **Total** | **20 Features** | **R1, R2, R3, R4, R5** | **5 Test Suites** | **120 Test Cases** | **120** |

---

## 3. Exhaustive Test Specifications by Feature (F-01 to F-20)

### 3.1 Feature F-01: User Authentication (Requirement R1)

#### TC-F01-01: Successful Login with Valid Administrator Credentials
- **Requirement**: R1 (Authentication)
- **Objective**: Verify that an active Administrator user can successfully authenticate via Supabase Auth and receive a valid JWT session.
- **Inputs**: Email `admin@eest3.edu.ar`, Password `AdminPass123!`.
- **Expected Output**: Auth state transitions to authenticated; session token stored; profile returns `role: 'administrador'`, `is_active: true`.
- **Verification Mechanism**: Call auth endpoint `POST /auth/v1/token?grant_type=password` (or `supabase.auth.signInWithPassword`); assert response status 200, JWT access token present, and `profile.role === 'administrador'`.

#### TC-F01-02: Successful Login with Valid Preceptor Credentials
- **Requirement**: R1 (Authentication)
- **Objective**: Verify that an active Preceptor user authenticates successfully with correct profile metadata.
- **Inputs**: Email `preceptor.tv@eest3.edu.ar`, Password `PreceptorPass123!`.
- **Expected Output**: HTTP 200; JWT session issued; profile attributes indicate `role: 'preceptor'`.
- **Verification Mechanism**: Call `supabase.auth.signInWithPassword`; assert user profile fetched from `profiles` table has `role === 'preceptor'`.

#### TC-F01-03: Successful Login with Valid Profesor Credentials
- **Requirement**: R1 (Authentication)
- **Objective**: Verify that an active Profesor user authenticates successfully with teacher role.
- **Inputs**: Email `prof.quimica@eest3.edu.ar`, Password `ProfesorPass123!`.
- **Expected Output**: HTTP 200; JWT session issued; profile role equals `'profesor'`.
- **Verification Mechanism**: Call `supabase.auth.signInWithPassword`; assert `profile.role === 'profesor'`.

#### TC-F01-04: Authentication Rejection on Invalid Password
- **Requirement**: R1 (Authentication)
- **Objective**: Verify that login is rejected when providing an incorrect password for an existing account.
- **Inputs**: Email `admin@eest3.edu.ar`, Password `WrongPassword999!`.
- **Expected Output**: Authentication error; session remains null; error message "Invalid login credentials".
- **Verification Mechanism**: Call `supabase.auth.signInWithPassword`; assert error object returned with `error.status === 400` or invalid grant error; no token saved.

#### TC-F01-05: Authentication Rejection on Nonexistent User
- **Requirement**: R1 (Authentication)
- **Objective**: Verify system security against enumeration / nonexistent user logins.
- **Inputs**: Email `nonexistent.user@eest3.edu.ar`, Password `SomeRandomPass123!`.
- **Expected Output**: Authentication failure; no user session created.
- **Verification Mechanism**: Call `supabase.auth.signInWithPassword`; assert error caught; session remains unauthenticated.

#### TC-F01-06: Authentication Rejection for Deactivated Staff Account (`is_active = false`)
- **Requirement**: R1 (Authentication)
- **Objective**: Ensure that deactivated accounts cannot access the system even with valid credentials.
- **Inputs**: Credentials for a deactivated account (`is_active: false`), correct password.
- **Expected Output**: System blocks access with notification "Cuenta desactivada. Contacte al Administrador."
- **Verification Mechanism**: After authentication or during profile hydration hook, verify that `is_active === false` immediately signs out user and returns error.

---

### 3.2 Feature F-02: Role Redirection & Route Guards (Requirement R1)

#### TC-F02-01: Admin Route Redirection & Full Navigation Authorization
- **Requirement**: R1 (Role-Based Access)
- **Objective**: Verify that user with role `'administrador'` has access to `/admin`, `/dashboard`, and `/asistencia` routes.
- **Inputs**: Authenticated session with role `'administrador'`; navigate to `/admin/users`, `/admin/courses`, `/dashboard`, `/asistencia`.
- **Expected Output**: All routes render without redirection or 403 Forbidden screens.
- **Verification Mechanism**: Evaluate `RoleGuard` and router for role `'administrador'`; assert `canAccessRoute('/admin') === true`, `canAccessRoute('/dashboard') === true`, `canAccessRoute('/asistencia') === true`.

#### TC-F02-02: Preceptor Navigation Scope & Admin Route Blocking
- **Requirement**: R1 (Role-Based Access)
- **Objective**: Verify that Preceptors can access overview `/dashboard` and `/asistencia` but are blocked from `/admin/*`.
- **Inputs**: Authenticated session with role `'preceptor'`; attempt navigation to `/admin/users` and `/admin/courses`.
- **Expected Output**: Redirected to `/dashboard` with warning notification "Acceso denegado: permisos insuficientes".
- **Verification Mechanism**: Test `RoleGuard` logic: assert `canAccessRoute('/dashboard') === true`, `canAccessRoute('/admin/users') === false`, `canAccessRoute('/admin/courses') === false`.

#### TC-F02-03: Profesor Route Containment to Assigned Attendance
- **Requirement**: R1 (Role-Based Access)
- **Objective**: Verify that Profesor is directed to `/asistencia` and restricted from `/dashboard` analytics and `/admin` panels.
- **Inputs**: Authenticated session with role `'profesor'`; attempt direct URL navigation to `/dashboard` and `/admin`.
- **Expected Output**: Direct navigation to `/dashboard` or `/admin` triggers redirect to `/asistencia`.
- **Verification Mechanism**: Test `RoleGuard` evaluation: assert `canAccessRoute('/asistencia') === true`, `canAccessRoute('/dashboard') === false`, `canAccessRoute('/admin') === false`.

#### TC-F02-04: Unauthenticated Direct Access Redirection to Login
- **Requirement**: R1 (Authentication & Guards)
- **Objective**: Verify that accessing any protected route (`/asistencia`, `/dashboard`, `/admin`) while unauthenticated redirects to `/login`.
- **Inputs**: Unauthenticated client (no session token); request `/asistencia`.
- **Expected Output**: Router redirects to `/login?redirectTo=%2Fasistencia`.
- **Verification Mechanism**: Invoke router `ProtectedRoute` without token; assert target URL is `/login` and redirect query parameter is set.

#### TC-F02-05: Dynamic Session Invalidation upon Role Demotion
- **Requirement**: R1 (Role Security)
- **Objective**: Verify that when an admin demotes an active user from admin to teacher, subsequent privileged requests are blocked immediately.
- **Inputs**: User initially with role `'administrador'` is updated in DB to `'profesor'`; user makes request to admin endpoint.
- **Expected Output**: Request rejected with HTTP 403 / RLS policy violation.
- **Verification Mechanism**: Update profile role in DB; make authenticated call to `manage_users`; assert RLS error returned.

#### TC-F02-06: Deep Linking with Role-Based Route Resolution
- **Requirement**: R1, R5 (Navigation)
- **Objective**: Verify that deep links (e.g. `/asistencia?shift=vespertino&course=6-1`) evaluate `RoleGuard` prior to component mounting.
- **Inputs**: Profesor with assignment for `6° 1°` accesses deep link `/asistencia?course=6-1`.
- **Expected Output**: Component mounts with course pre-selected; if course is not assigned to teacher, error alert is shown.
- **Verification Mechanism**: Test route resolution with query parameters; verify course ownership check is enforced.

---

### 3.3 Feature F-03: Course Selector for Teachers (Requirements R1, R2)

#### TC-F03-01: Profesor Course Selector Filtered to Assigned Courses Only
- **Requirement**: R1, R2 (Course Access)
- **Objective**: Verify that a Profesor only sees courses assigned in `course_assignments` table.
- **Inputs**: Teacher `prof.quimica` assigned to `6° 1ª TECQU` and `7° 1ª TECQU` (Vespertino).
- **Expected Output**: Course picker dropdown contains exactly 2 items: `6° 1ª TECQU` and `7° 1ª TECQU`.
- **Verification Mechanism**: Query `courseService.getAssignedCourses(teacherId)`; assert `courses.length === 2` and names match assigned courses.

#### TC-F03-02: Preceptor Course Selector Contains All Active Courses
- **Requirement**: R1, R2 (Shift Overview)
- **Objective**: Verify that a Preceptor can select any active course in the school.
- **Inputs**: Logged in as Preceptor; fetch available courses for selected shift (e.g. Vespertino).
- **Expected Output**: Selector contains all 10 Vespertino courses from seed CSV.
- **Verification Mechanism**: Query `courseService.getCoursesByShift('vespertino')`; assert returns 10 courses with matching IDs.

#### TC-F03-03: Administrador Course Selector Access
- **Requirement**: R1, R2 (Administrative Access)
- **Objective**: Verify that Administrator can select all courses across all 3 shifts.
- **Inputs**: Logged in as Admin; inspect course selector across Mañana, Tarde, and Vespertino.
- **Expected Output**: Full catalog available with shift filtering.
- **Verification Mechanism**: Query `courseService.getAllActiveCourses()`; assert all school courses are accessible.

#### TC-F03-04: Exclude Deactivated / Archived Courses from Selector
- **Requirement**: R2, R4 (Data Consistency)
- **Objective**: Ensure courses flagged with `is_active: false` do not appear in the active attendance selector.
- **Inputs**: Set course `5° 4ª TECET` `is_active: false`; load course selector for Vespertino.
- **Expected Output**: `5° 4ª TECET` is omitted from dropdown options.
- **Verification Mechanism**: Query active courses; assert `courses.every(c => c.is_active === true)`.

#### TC-F03-05: Course Switching Clears Dirty Form State & Loads New Baseline
- **Requirement**: R2 (Form State)
- **Objective**: Verify that changing course in the selector resets dirty form inputs and loads new enrollment baseline.
- **Inputs**: Teacher enters partial attendance for `6° 1ª`, then switches dropdown to `7° 1ª`.
- **Expected Output**: Input fields reset to 0/empty; header displays `7° 1ª` baseline ($I_V=5, I_M=8, I_T=13$).
- **Verification Mechanism**: Simulate course select change; verify `formState` resets and `inscriptos` updates to target course values.

#### TC-F03-06: Teacher with Zero Assigned Courses Graceful State
- **Requirement**: R1, R2 (Edge Case)
- **Objective**: Ensure teacher with no course assignments is shown a clear message without crash.
- **Inputs**: New teacher user with zero records in `course_assignments`.
- **Expected Output**: Dropdown displays "No tiene cursos asignados. Solicite asignación a Dirección." Submit button disabled.
- **Verification Mechanism**: Assert `assignedCourses.length === 0`, UI renders empty state banner, form input disabled.

---

### 3.4 Feature F-04: Pre-populated Header & Course Metadata (Requirement R2)

#### TC-F04-01: Header Populates Exact Name, Year, Division & Shift
- **Requirement**: R2 (Header Data)
- **Objective**: Verify that selecting a course populates header with official course designation.
- **Inputs**: Select course `6° 2ª TECMM` (Turno Vespertino).
- **Expected Output**: Header displays Name: `6° 2ª`, Year: `6`, Division: `2`, Shift: `Turno Vespertino`.
- **Verification Mechanism**: Assert header component props / DOM elements match `{ name: '6° 2ª', year: 6, division: 2, shift: 'Vespertino' }`.

#### TC-F04-02: Technical Orientation Tag Display for Ciclo Superior
- **Requirement**: R2 (Technical Structure)
- **Objective**: Verify orientation badges display correct technical codes for Ciclo Superior courses.
- **Inputs**: Inspect metadata for `6° 1ª` (TECQU), `6° 2ª` (TECMM), `6° 3ª` (TECET), `1° 1ª C.TEC.MMO` (C.TEC.MMO).
- **Expected Output**: Badges render `TECQU` (Química), `TECMM` (Maestro Mayor de Obra), `TECET` (Electromecánica), `C.TEC.MMO` (Ciclo Técnico MMO).
- **Verification Mechanism**: Assert `course.orientation` equals expected enum strings for each Division rule.

#### TC-F04-03: Ciclo Básico Course Header Display
- **Requirement**: R2 (Basic Cycle)
- **Objective**: Verify Ciclo Básico courses (Years 1-3) render without technical orientation or with "Ciclo Básico".
- **Inputs**: Select course `1° 1ª` (Ciclo Básico, Mañana).
- **Expected Output**: Cycle badge displays "Ciclo Básico"; orientation is null/empty.
- **Verification Mechanism**: Assert `course.cycle === 'basico'` and `course.orientation === null`.

#### TC-F04-04: Enrollment Baseline Matches DB/CSV Exactly
- **Requirement**: R2 (Baseline Accuracy)
- **Objective**: Verify pre-populated enrollment numbers match CSV baseline for all Vespertino courses.
- **Inputs**: Check pre-populated header for all 10 Vespertino courses:
  - `5° 4ª`: $I_V=8, I_M=0, I_T=8$
  - `6° 1ª`: $I_V=11, I_M=4, I_T=15$
  - `6° 2ª`: $I_V=9, I_M=14, I_T=23$
  - `6° 3ª`: $I_V=23, I_M=2, I_T=25$
  - `6° 4ª`: $I_V=6, I_M=0, I_T=6$
  - `7° 1ª`: $I_V=5, I_M=8, I_T=13$
  - `7° 2ª`: $I_V=9, I_M=9, I_T=18$
  - `7° 3ª`: $I_V=20, I_M=9, I_T=29$
  - `7° 4ª`: $I_V=8, I_M=0, I_T=8$
  - `1° 1ª C.TEC.MMO`: $I_V=20, I_M=7, I_T=27$
- **Expected Output**: UI inputs / state strictly match every individual $I_V, I_M, I_T$.
- **Verification Mechanism**: Assert each course object loaded has exact `inscriptos_varones`, `inscriptos_mujeres`, `inscriptos_total`.

#### TC-F04-05: Zero-Female Course Display Formatting
- **Requirement**: R2 (Data Formatting)
- **Objective**: Verify courses with zero female enrollment (e.g. `5° 4ª`, `6° 4ª`, `7° 4ª`) render cleanly without NaN or layout shift.
- **Inputs**: Load `5° 4ª TECET` ($I_V=8, I_M=0, I_T=8$).
- **Expected Output**: $I_M$ displays `0` or `-`; $I_T$ displays `8`; female inputs accept `0` without error.
- **Verification Mechanism**: Assert `course.inscriptos_mujeres === 0` and total is `8`.

#### TC-F04-06: Pre-populated Enrollment Immutability in Teacher Form
- **Requirement**: R2 (Data Integrity)
- **Objective**: Ensure the Inscriptos fields cannot be modified by the teacher on the attendance submission form.
- **Inputs**: Teacher attempts to type into Inscriptos $I_V, I_M, I_T$ display elements.
- **Expected Output**: Inscriptos elements are read-only labels/disabled inputs.
- **Verification Mechanism**: Assert DOM input attributes have `readOnly={true}` or `disabled={true}`.

---

### 3.5 Feature F-05: Gender Breakdown Entry & Dual-Gender Math (Requirement R2)

#### TC-F05-01: Auto-Calculation of Presentes Total ($P_T = P_V + P_M$)
- **Requirement**: R2 (Live Calculations)
- **Objective**: Verify live summation of Presentes total as male and female inputs change.
- **Inputs**: In course `6° 1ª` ($I_V=11, I_M=4$), input $P_V = 10$, $P_M = 4$.
- **Expected Output**: $P_T$ auto-calculates to `14`.
- **Verification Mechanism**: Test calculation function `calculateAttendanceTotals({ pv: 10, pm: 4 })`; assert `pt === 14`.

#### TC-F05-02: Auto-Calculation of Ausentes Total ($A_T = A_V + A_M$)
- **Requirement**: R2 (Live Calculations)
- **Objective**: Verify live summation of Ausentes total.
- **Inputs**: Input $A_V = 1$, $A_M = 0$.
- **Expected Output**: $A_T$ auto-calculates to `1`.
- **Verification Mechanism**: Assert `calculateAttendanceTotals({ av: 1, am: 0 }).at === 1`.

#### TC-F05-03: Attendance Percentage Calculation Accuracy
- **Requirement**: R2, R3 (Formulas)
- **Objective**: Verify accurate computation of attendance percentage:
  $$\%Asistencia = \left(\frac{P_T}{I_T}\right) \times 100$$
- **Inputs**: $P_T = 14, I_T = 15$.
- **Expected Output**: Computed percentage equals $93.33\%$ (rounded to 2 decimals).
- **Verification Mechanism**: Call `calculateAttendancePercentage(14, 15)`; assert result equals `93.33`.

#### TC-F05-04: Boundary Condition: 100% Attendance Calculation
- **Requirement**: R2 (Math Boundary)
- **Objective**: Verify calculations for perfect attendance.
- **Inputs**: In course `7° 2ª` ($I_V=9, I_M=9, I_T=18$), input $P_V=9, P_M=9, A_V=0, A_M=0$.
- **Expected Output**: $P_T=18, A_T=0, \%Asistencia = 100.00\%$.
- **Verification Mechanism**: Assert `calculateAttendancePercentage(18, 18) === 100.0` and validation is valid.

#### TC-F05-05: Boundary Condition: 0% Attendance Calculation
- **Requirement**: R2 (Math Boundary)
- **Objective**: Verify calculations when all students are absent (e.g. inclement weather).
- **Inputs**: In course `6° 4ª` ($I_V=6, I_M=0, I_T=6$), input $P_V=0, P_M=0, A_V=6, A_M=0$.
- **Expected Output**: $P_T=0, A_T=6, \%Asistencia = 0.00\%$.
- **Verification Mechanism**: Assert `calculateAttendancePercentage(0, 6) === 0.0` and validation is valid.

#### TC-F05-06: Non-Numeric and Negative Input Sanitization
- **Requirement**: R2 (Input Sanitization)
- **Objective**: Ensure non-numeric characters (`e`, `-`, `.`) or negative numbers are clamped to 0 or rejected.
- **Inputs**: User types `-5` or `abc` into $P_V$ input.
- **Expected Output**: Form sanitizes input to `0` or rejects keypress; state remains valid integer $\ge 0$.
- **Verification Mechanism**: Verify input handler `handleIntegerInput('-5')` parses to `0`.

---

### 3.6 Feature F-06: Real-time Sum Validation & Form Blocking (Requirement R2)

#### TC-F06-01: Valid Invariant State Enables Submission
- **Requirement**: R2 (Validation)
- **Objective**: Verify that when $P_V + A_V = I_V$ and $P_M + A_M = I_M$, Submit button is active with positive visual feedback.
- **Inputs**: Course `6° 1ª` ($I_V=11, I_M=4$); enter $P_V=10, A_V=1$ ($\Sigma=11$) and $P_M=4, A_M=0$ ($\Sigma=4$).
- **Expected Output**: `validateAttendanceRow` returns `isValid: true, varonesValid: true, mujeresValid: true, totalValid: true`. Submit button is enabled.
- **Verification Mechanism**: Call `validateAttendanceRow(11, 4, 10, 4, 1, 0)`; assert `isValid === true`, `varonesDisparity === 0`, `mujeresDisparity === 0`.

#### TC-F06-02: Male Disparity Blocks Submission with Disparity Count
- **Requirement**: R2 (Disparity Validation)
- **Objective**: Verify that an under-count or over-count in males triggers error state and disables submission.
- **Inputs**: Course `6° 1ª` ($I_V=11$); enter $P_V=9, A_V=1$ ($P_V+A_V=10 \neq 11$).
- **Expected Output**: `varonesValid: false`, `varonesDisparity: -1`; UI renders red badge "Varones: falta 1 alumno"; Submit button is disabled.
- **Verification Mechanism**: Assert `validateAttendanceRow(11, 4, 9, 4, 1, 0).isValid === false` and `varonesDisparity === -1`.

#### TC-F06-03: Female Disparity Blocks Submission with Disparity Count
- **Requirement**: R2 (Disparity Validation)
- **Objective**: Verify that female count mismatch triggers error state and disables submission.
- **Inputs**: Course `6° 1ª` ($I_M=4$); enter $P_M=3, A_M=2$ ($P_M+A_M=5 \neq 4$).
- **Expected Output**: `mujeresValid: false`, `mujeresDisparity: +1`; UI renders red badge "Mujeres: sobra 1 alumna"; Submit button disabled.
- **Verification Mechanism**: Assert `validateAttendanceRow(11, 4, 10, 3, 1, 2).isValid === false` and `mujeresDisparity === 1`.

#### TC-F06-04: Compensating Errors Strictly Blocked (Per-Gender Independence)
- **Requirement**: R2 (Invariant Incorruptibility)
- **Objective**: Ensure that a male deficit canceled out by a female surplus ($P_T + A_T = I_T$ but gender sums wrong) is strictly rejected.
- **Inputs**: Course `6° 1ª` ($I_V=11, I_M=4, I_T=15$); enter $P_V=10, A_V=0$ (Total V = 10, deficit 1) and $P_M=5, A_M=0$ (Total M = 5, surplus 1). Total $10+5=15$.
- **Expected Output**: Total sum equals 15, but `varonesValid: false`, `mujeresValid: false`, `isValid: false`. Form submission blocked.
- **Verification Mechanism**: Assert `validateAttendanceRow(11, 4, 10, 5, 0, 0).isValid === false`.

#### TC-F06-05: Database-Level Trigger Rejection on Bypassed Disparity Payload
- **Requirement**: R2, R4 (Database Integrity)
- **Objective**: Verify that direct SQL/API insertion violating $P_V+A_V=I_V$ is aborted by the PostgreSQL trigger `trg_validate_and_snapshot_attendance`.
- **Inputs**: Direct insert into `attendance_records` with $P_V=8, A_V=1$ for course with $I_V=11$.
- **Expected Output**: PostgreSQL raises exception `SQLSTATE 23514` / custom trigger error "Attendance validation failed: Presentes + Ausentes must equal Inscriptos per gender". Transaction rolled back.
- **Verification Mechanism**: Attempt `supabase.from('attendance_records').insert(...)`; assert response returns error with validation failure.

#### TC-F06-06: Dynamic Validation Recovery on Input Correction
- **Requirement**: R2 (User Experience)
- **Objective**: Verify that adjusting inputs to valid values immediately clears error badges and unlocks Submit button without requiring page reload.
- **Inputs**: State is invalid ($P_V=9, A_V=1$); user changes $P_V$ to $10$.
- **Expected Output**: Validation state flips from `isValid: false` to `isValid: true`; error badges disappear; Submit button enables.
- **Verification Mechanism**: Verify state transition in test harness upon sequential change events.

---

### 3.7 Feature F-07: Date Selector & Historical Locking (Requirement R2)

#### TC-F07-01: Date Selector Defaults to Current School Date
- **Requirement**: R2 (Date Handling)
- **Objective**: Verify date picker initializes to today's local date (e.g. `2026-08-20`).
- **Inputs**: Load attendance form.
- **Expected Output**: Date input value equals local ISO date string `YYYY-MM-DD`.
- **Verification Mechanism**: Assert `selectedDate === new Date().toISOString().split('T')[0]`.

#### TC-F07-02: Editable Submission for Current Date
- **Requirement**: R2 (Current Day Submission)
- **Objective**: Verify that for today's date, inputs are fully editable and can be saved or updated.
- **Inputs**: Date set to today; submit valid attendance.
- **Expected Output**: Submission succeeds; record created/updated in `attendance_records`; toast notification "Asistencia guardada correctamente".
- **Verification Mechanism**: Assert `response.status === 200` and record exists in DB for today's date.

#### TC-F07-03: Past Date Enforces Read-Only Lock for Profesor Role
- **Requirement**: R2 (Historical Immutability)
- **Objective**: Verify that when a teacher selects a date in the past (e.g. yesterday `2026-08-19`), all inputs are locked.
- **Inputs**: Logged in as Profesor; select date `2026-08-19`.
- **Expected Output**: Form displays previously submitted data; inputs are disabled; banner renders "Registro histórico cerrado (solo lectura)"; Submit button is hidden or disabled.
- **Verification Mechanism**: Assert DOM inputs have `disabled === true` and `isLocked === true`.

#### TC-F07-04: API-Level Rejection for Teacher Past-Date Modifications
- **Requirement**: R2 (Security Policy)
- **Objective**: Ensure that a teacher attempting to send an HTTP PUT/PATCH to modify a past date's record is blocked by RLS.
- **Inputs**: Authenticated as Profesor; invoke `UPDATE attendance_records SET presentes_varones = 11 WHERE date = '2026-08-19'`.
- **Expected Output**: Request rejected with RLS permission denied error.
- **Verification Mechanism**: Execute update via Supabase client; assert error returned from PostgreSQL RLS policy.

#### TC-F07-05: Admin/Preceptor Historical Override Capability
- **Requirement**: R1, R2 (Administrative Audit)
- **Objective**: Verify that Administrador and Preceptor roles can modify historical records, with changes recorded in `attendance_audit_logs`.
- **Inputs**: Logged in as Administrador; edit record for `2026-08-19`.
- **Expected Output**: Update succeeds; audit log created with `old_data`, `new_data`, `changed_by`, `timestamp`.
- **Verification Mechanism**: Query `attendance_audit_logs`; assert row created referencing updated `attendance_record_id`.

#### TC-F07-06: Future Date Input Prevention
- **Requirement**: R2 (Date Boundaries)
- **Objective**: Verify that selecting a future date (tomorrow or beyond) prevents attendance submission.
- **Inputs**: Select date `2026-08-25` (future date).
- **Expected Output**: UI displays warning "No se puede registrar asistencia en fechas futuras"; Submit button disabled.
- **Verification Mechanism**: Assert `isFutureDate(selectedDate) === true` and form blocks submission.

---

### 3.8 Feature F-08: Observaciones Input & Sanitization (Requirement R2)

#### TC-F08-01: Successful Submission of Free-Text Observaciones
- **Requirement**: R2 (Observaciones)
- **Objective**: Verify that valid observations (e.g. "3 alumnos en taller de química") persist correctly with the attendance record.
- **Inputs**: Enter text `"3 alumnos retirados antes por examen técnico"` in Observaciones field and submit.
- **Expected Output**: Record saved with `observaciones` field containing the exact text.
- **Verification Mechanism**: Query `attendance_records` for course and date; assert `record.observaciones === "3 alumnos retirados antes por examen técnico"`.

#### TC-F08-02: Diacritics and Spanish Character Encoding Fidelity
- **Requirement**: R2 (Encoding Integrity)
- **Objective**: Ensure full support for Spanish characters: `á, é, í, ó, ú, ñ, ü, Á, É, Í, Ó, Ú, Ñ, ¿, ¡`.
- **Inputs**: Enter `"Año lectivo: evaluación técnica de electromecánica con el Prof. Peña"`.
- **Expected Output**: String is stored and retrieved without character corruption (UTF-8 encoding).
- **Verification Mechanism**: Assert stored and fetched string equals input verbatim.

#### TC-F08-03: XSS & HTML Injection Sanitization
- **Requirement**: R2, R5 (Security)
- **Objective**: Ensure that malicious HTML/JavaScript in observations is sanitized and not executed when rendered on dashboard.
- **Inputs**: Enter `<script>alert('XSS')</script><img src=x onerror=alert(1)>`.
- **Expected Output**: Content rendered as escaped text or sanitized; script does not execute in DOM.
- **Verification Mechanism**: Render text in Dashboard summary component; assert DOM does not contain active script element.

#### TC-F08-04: Observaciones Field Character Limit Enforcement
- **Requirement**: R2 (Form Limits)
- **Objective**: Verify that the observations field enforces max length constraint (e.g. 500 characters).
- **Inputs**: Enter 600 characters string into Observaciones textarea.
- **Expected Output**: Input is truncated to 500 characters or validation error shown "Máximo 500 caracteres".
- **Verification Mechanism**: Assert `sanitizedText.length <= 500`.

#### TC-F08-05: Clearing / Updating Existing Observaciones
- **Requirement**: R2 (Updates)
- **Objective**: Verify updating an existing record to remove or change observations.
- **Inputs**: Edit today's record: clear observations input and submit.
- **Expected Output**: Record updated in DB with `observaciones: null` or empty string.
- **Verification Mechanism**: Assert `record.observaciones === null || record.observaciones === ''`.

#### TC-F08-06: Observaciones Propagation to Daily Summary Table
- **Requirement**: R2, R3 (Dashboard View)
- **Objective**: Verify that course-level observations are visible in the dashboard summary table/notes section for directivos.
- **Inputs**: Query dashboard for date containing submitted observations.
- **Expected Output**: Dashboard notes section lists course name and its observations.
- **Verification Mechanism**: Assert dashboard notes list includes `{ course: '6° 1ª', note: '...' }`.

---

### 3.9 Feature F-09: Staff Absences Entry Subform (Requirement R2)

#### TC-F09-01: Record Teacher Absence (`Docente`)
- **Requirement**: R2 (Staff Absences)
- **Objective**: Verify recording an absent teacher for the active shift and date.
- **Inputs**: Name: `Prof. Gomez Carlos`, Role: `Docente`, Subject/Area: `Química Analítica`, Reason: `Licencia médica Art. 114a`, Shift: `Vespertino`, Date: `2026-08-20`.
- **Expected Output**: Row inserted into `staff_absences`; success toast shown.
- **Verification Mechanism**: Query `staff_absences`; assert row matches all input attributes.

#### TC-F09-02: Record Auxiliary Staff Absence (`Auxiliar`)
- **Requirement**: R2 (Staff Absences)
- **Objective**: Verify recording an absent auxiliary/support staff member.
- **Inputs**: Name: `Rodriguez Maria`, Role: `Auxiliar`, Subject/Area: `Portería / Mantenimiento`, Reason: `Fuerza mayor`, Shift: `Mañana`, Date: `2026-08-20`.
- **Expected Output**: Row inserted with `role_type: 'Auxiliar'`.
- **Verification Mechanism**: Assert `staff_absences` contains record with `role_type === 'Auxiliar'`.

#### TC-F09-03: Multiple Staff Absences in Single Session
- **Requirement**: R2 (Staff Absences)
- **Objective**: Verify adding multiple staff absences sequentially for the same shift.
- **Inputs**: Add 3 distinct staff members (2 teachers, 1 auxiliary) on date `2026-08-20`.
- **Expected Output**: All 3 records stored in `staff_absences`; displayed in list.
- **Verification Mechanism**: Query `staff_absences` by shift and date; assert `count === 3`.

#### TC-F09-04: Staff Absence Required Field Validation
- **Requirement**: R2 (Validation)
- **Objective**: Ensure absence submission is blocked if Staff Name or Role Type is missing.
- **Inputs**: Attempt to add absence with empty Name and valid Reason.
- **Expected Output**: Form displays error "El nombre del personal es obligatorio"; record not created.
- **Verification Mechanism**: Assert form validation returns invalid and DB insert is not called.

#### TC-F09-05: Delete / Remove Staff Absence Entry
- **Requirement**: R2 (Staff Absences CRUD)
- **Objective**: Verify deleting a staff absence entry recorded by mistake.
- **Inputs**: Click delete button on previously recorded staff absence.
- **Expected Output**: Record removed from `staff_absences` table; UI list updates.
- **Verification Mechanism**: Delete record; assert query `staff_absences.select().eq('id', id)` returns null/empty.

#### TC-F09-06: Shift Isolation for Staff Absences
- **Requirement**: R2, R3 (Shift Scoping)
- **Objective**: Verify staff absences recorded in Vespertino shift do not appear when viewing Mañana shift.
- **Inputs**: Record absence in Vespertino; query absences for Mañana.
- **Expected Output**: Mañana absence list does not include the Vespertino record.
- **Verification Mechanism**: Assert `getStaffAbsences('manana', date)` returns only Mañana records.

---

### 3.10 Feature F-10: Shift Switcher Tabs (Requirement R3)

#### TC-F10-01: Instant Tab Switching Between 3 Shifts
- **Requirement**: R3 (Shift Navigation)
- **Objective**: Verify seamless UI tab switching between Mañana, Tarde, and Vespertino.
- **Inputs**: Click 'Tarde' tab, then 'Vespertino' tab, then 'Mañana' tab.
- **Expected Output**: Active tab state updates immediately; dashboard loads corresponding shift courses.
- **Verification Mechanism**: Assert `activeShift` state equals clicked tab code (`'manana' | 'tarde' | 'vespertino'`).

#### TC-F10-02: Vespertino Tab Filters Exactly to 10 Vespertino Courses
- **Requirement**: R3, R4 (Shift Scoping)
- **Objective**: Verify that selecting Vespertino displays only the 10 official CSV courses.
- **Inputs**: Select Vespertino shift tab.
- **Expected Output**: Summary table displays 10 course rows matching `5°4ª`, `6°1ª`, `6°2ª`, `6°3ª`, `6°4ª`, `7°1ª`, `7°2ª`, `7°3ª`, `7°4ª`, `1°1ª C.TEC.MMO`.
- **Verification Mechanism**: Assert table row count equals 10 and course names match CSV.

#### TC-F10-03: Mañana Tab Displays Mañana Catalog Exclusively
- **Requirement**: R3 (Shift Scoping)
- **Objective**: Verify Mañana tab displays only morning courses (Ciclo Básico 1° to 3° and morning Ciclo Superior).
- **Inputs**: Select Mañana tab.
- **Expected Output**: Table displays only courses assigned to `shift_id === 'manana'`.
- **Verification Mechanism**: Assert all rendered course rows have `shift_id === 'manana'`.

#### TC-F10-04: Tarde Tab Displays Tarde Catalog Exclusively
- **Requirement**: R3 (Shift Scoping)
- **Objective**: Verify Tarde tab displays only afternoon courses.
- **Inputs**: Select Tarde tab.
- **Expected Output**: Table displays only courses assigned to `shift_id === 'tarde'`.
- **Verification Mechanism**: Assert all rendered course rows have `shift_id === 'tarde'`.

#### TC-F10-05: URL Query Parameter State Synchronization
- **Requirement**: R3, R5 (State & Bookmarking)
- **Objective**: Verify that switching shifts synchronizes URL parameter `?shift=vespertino` and restoring URL restores tab.
- **Inputs**: Navigate directly to `/dashboard?shift=vespertino&date=2026-08-20`.
- **Expected Output**: Dashboard initializes with Vespertino tab active and date set to `2026-08-20`.
- **Verification Mechanism**: Inspect URL search params and active component state.

#### TC-F10-06: Date Context Preservation Across Tab Switches
- **Requirement**: R3 (Usability)
- **Objective**: Ensure that selecting a historical date (e.g. `2026-08-15`) and switching tabs maintains the selected date.
- **Inputs**: Change date to `2026-08-15`; switch from Mañana to Vespertino.
- **Expected Output**: Vespertino dashboard displays data for `2026-08-15`.
- **Verification Mechanism**: Assert `selectedDate` remains `'2026-08-15'` after tab switch.

---

### 3.11 Feature F-11: Official 11-Column Daily Summary Table (Requirement R3)

#### TC-F11-01: Table Renders Exact 11 Official Columns Matching Paper Template
- **Requirement**: R3 (Table Layout)
- **Objective**: Verify table renders exactly 11 columns in the precise order specified in `PARTE GENERALES TV.xlsx - T.V.csv`:
  1. Cursos
  2. Orientación
  3. Inscriptos Varones ($I_V$)
  4. Inscriptos Mujeres ($I_M$)
  5. Inscriptos Total ($I_T$)
  6. Presentes Varones ($P_V$)
  7. Presentes Mujeres ($P_M$)
  8. Presentes Total ($P_T$)
  9. Ausentes Varones ($A_V$)
  10. Ausentes Mujeres ($A_M$)
  11. Ausentes Total ($A_T$)
- **Inputs**: Render `DailySummaryTable` with test attendance data.
- **Expected Output**: 11 column headers match official labels and layout.
- **Verification Mechanism**: Inspect table `th` elements; assert headers count === 11 and match official names.

#### TC-F11-02: Strict Course Sorting Order
- **Requirement**: R3 (Institutional Sorting)
- **Objective**: Verify that courses in the table are sorted in official institutional hierarchy (Year ascending, Division ascending, Special cycles last).
- **Inputs**: Render Vespertino table (5°4ª, 6°1ª-4ª, 7°1ª-4ª, 1°1ª C.TEC.MMO).
- **Expected Output**: Rows rendered in order: `5° 4ª`, `6° 1ª`, `6° 2ª`, `6° 3ª`, `6° 4ª`, `7° 1ª`, `7° 2ª`, `7° 3ª`, `7° 4ª`, `1° 1ª C.TEC.MMO`.
- **Verification Mechanism**: Extract course names from table rows; assert array matches exact expected order.

#### TC-F11-03: Unsubmitted Course Placeholder Rendering
- **Requirement**: R3 (Pending Courses)
- **Objective**: Verify unsubmitted courses display baseline enrollment numbers and dashes/empty cells for Presentes and Ausentes.
- **Inputs**: Course `7° 3ª` has not submitted attendance today.
- **Expected Output**: Row displays `7° 3ª | TECET | 20 | 9 | 29 | - | - | - | - | - | -`; status indicator shows "Pendiente".
- **Verification Mechanism**: Assert Presentes/Ausentes cells render `-` and pending status is flagged.

#### TC-F11-04: Submitted Course Accurate Value Rendering
- **Requirement**: R3 (Submitted Courses)
- **Objective**: Verify submitted courses display exact submitted numbers.
- **Inputs**: Course `6° 1ª` submitted $P_V=10, P_M=4, A_V=1, A_M=0$.
- **Expected Output**: Row renders `6° 1ª | TECQU | 11 | 4 | 15 | 10 | 4 | 14 | 1 | 0 | 1`.
- **Verification Mechanism**: Assert cell values in row for `6° 1ª` match submitted values.

#### TC-F11-05: Visual Status Badging (Completo vs Pendiente)
- **Requirement**: R3 (UI Indicators)
- **Objective**: Verify clear visual distinction between submitted and pending courses.
- **Inputs**: 8 courses submitted, 2 pending.
- **Expected Output**: 8 rows display green badge / check; 2 rows display amber badge / clock; header shows "8/10 Cursos Completados".
- **Verification Mechanism**: Assert completion counter in header equals `8/10` and status badges match.

#### TC-F11-06: Technical Orientation Column Fidelity
- **Requirement**: R3 (Orientation Display)
- **Objective**: Verify orientation column renders exact technical acronyms (`TECQU`, `TECMM`, `TECET`, `C.TEC.MMO`) or blank for basic cycle.
- **Inputs**: Inspect orientation column across all rows.
- **Expected Output**: Orientations match course definitions; basic cycle courses have empty cell or `-`.
- **Verification Mechanism**: Assert `cell.textContent === course.orientation || '-'`.

---

### 3.12 Feature F-12: Bottom Totals Row & Shift Percentage (Requirement R3)

#### TC-F12-01: Baseline Inscriptos Summation for Vespertino ($119 + 53 = 172$)
- **Requirement**: R3 (Column Totals)
- **Objective**: Verify bottom row calculates exact column sums for enrollment matching CSV:
  $$\sum I_V = 119, \quad \sum I_M = 53, \quad \sum I_T = 172$$
- **Inputs**: Load 10 Vespertino courses.
- **Expected Output**: Totals row displays Inscriptos: Varones = `119`, Mujeres = `53`, Total = `172`.
- **Verification Mechanism**: Call `calculateShiftTotals(vespertinoRows)`; assert `inscriptosV === 119`, `inscriptosM === 53`, `inscriptosT === 172`.

#### TC-F12-02: Presentes Column Summation ($\sum P_V, \sum P_M, \sum P_T$)
- **Requirement**: R3 (Column Totals)
- **Objective**: Verify live summation of Presentes columns across all submitted courses.
- **Inputs**: 10 courses submit attendance with $\sum P_V = 105, \sum P_M = 48$.
- **Expected Output**: Totals row displays $\sum P_V = 105, \sum P_M = 48, \sum P_T = 153$.
- **Verification Mechanism**: Assert `totals.presentesV === 105`, `totals.presentesM === 48`, `totals.presentesT === 153`.

#### TC-F12-03: Ausentes Column Summation ($\sum A_V, \sum A_M, \sum A_T$)
- **Requirement**: R3 (Column Totals)
- **Objective**: Verify live summation of Ausentes columns across all submitted courses.
- **Inputs**: 10 courses submit attendance with $\sum A_V = 14, \sum A_M = 5$.
- **Expected Output**: Totals row displays $\sum A_V = 14, \sum A_M = 5, \sum A_T = 19$.
- **Verification Mechanism**: Assert `totals.ausentesV === 14`, `totals.ausentesM === 5`, `totals.ausentesT === 19`.

#### TC-F12-04: Overall Totals Conservation Invariant ($\sum P_T + \sum A_T = \sum I_T$)
- **Requirement**: R3 (Mathematical Invariant)
- **Objective**: Verify that for a 100% submitted shift, the grand total of Presentes plus Ausentes equals Inscriptos:
  $$153 + 19 = 172$$
- **Inputs**: Full Vespertino submission data.
- **Expected Output**: $\sum P_T + \sum A_T === \sum I_T$.
- **Verification Mechanism**: Assert `totals.presentesT + totals.ausentesT === totals.inscriptosT`.

#### TC-F12-05: Shift Overall Attendance Percentage Calculation
- **Requirement**: R3 (Shift Percentage)
- **Objective**: Verify calculation of overall shift attendance percentage:
  $$\%Asistencia = \left(\frac{153}{172}\right) \times 100 = 88.95\%$$
- **Inputs**: $\sum P_T = 153, \sum I_T = 172$.
- **Expected Output**: Overall shift attendance displays `88.95%`.
- **Verification Mechanism**: Assert `totals.porcentajeAsistencia === 88.95`.

#### TC-F12-06: Partial Shift Submission Totals Calculation
- **Requirement**: R3 (Partial Totals)
- **Objective**: Verify calculation behavior when only a subset of courses have submitted (e.g. 5 of 10).
- **Inputs**: 5 courses submitted ($\sum P_T = 70, \sum A_T = 10, \sum I_{T,\text{submitted}} = 80$); 5 courses pending.
- **Expected Output**: Totals row calculates Presentes/Ausentes from submitted courses ($P_T=70, A_T=10$); displays percentage based on submitted enrollment ($70/80 = 87.50\%$) with explicit note "5 cursos pendientes de entrega".
- **Verification Mechanism**: Assert `calculatePartialShiftTotals(rows)` produces correct submitted sums and pending count.

---

### 3.13 Feature F-13: Attendance Trend Charts (Requirement R3)

#### TC-F13-01: Time-Series Attendance Percentage Chart Rendering
- **Requirement**: R3 (Analytics)
- **Objective**: Verify Recharts time-series line chart renders daily attendance percentage across selected date range.
- **Inputs**: 7 days of attendance records for Turno Vespertino.
- **Expected Output**: Line chart renders 7 data points on X-axis with correct Y-axis values between 0% and 100%.
- **Verification Mechanism**: Verify chart dataset props contain 7 points with matching `{ date, porcentaje }` properties.

#### TC-F13-02: Chart Filtering by Specific Shift
- **Requirement**: R3 (Analytics Filtering)
- **Objective**: Verify switching chart filter between Mañana, Tarde, Vespertino, or School-Wide updates the trend curve.
- **Inputs**: Select filter 'Mañana'; then select 'Vespertino'.
- **Expected Output**: Chart dynamically re-renders series reflecting Mañana data, then Vespertino data.
- **Verification Mechanism**: Assert chart data array updates to match filtered shift records.

#### TC-F13-03: Isolated Course-Level Trend Filtering
- **Requirement**: R3 (Course Analytics)
- **Objective**: Verify filtering chart to a single course (e.g. `6° 1ª TECQU`) plots that course's individual attendance evolution.
- **Inputs**: Select course filter `6° 1ª TECQU`.
- **Expected Output**: Chart displays daily attendance curve specifically for `6° 1ª`.
- **Verification Mechanism**: Assert data series points correspond to `course_id === '6-1'`.

#### TC-F13-04: Date Range Selector (7 Days / 30 Days / Custom)
- **Requirement**: R3 (Analytics Controls)
- **Objective**: Verify date range picker updates the time horizon of the analytics chart.
- **Inputs**: Switch date range from '7 días' to '30 días'.
- **Expected Output**: Chart X-axis expands to 30 date intervals.
- **Verification Mechanism**: Assert query params / dataset length expands to requested 30-day window.

#### TC-F13-05: Non-Class Day / Weekend Data Handling
- **Requirement**: R3 (Edge Handling)
- **Objective**: Ensure weekends and holidays with no attendance data do not cause chart crashes or divide-by-zero errors.
- **Inputs**: Date range including Saturday and Sunday with zero attendance records.
- **Expected Output**: Chart skips or bridges null days cleanly without throwing uncaught exceptions.
- **Verification Mechanism**: Pass empty data for weekend dates; assert chart component renders successfully.

#### TC-F13-06: Interactive Chart Tooltip Data Accuracy
- **Requirement**: R3 (Interactive Analytics)
- **Objective**: Verify hover tooltip displays exact Date, $I_T$, $P_T$, $A_T$, and $\%Asistencia$.
- **Inputs**: Simulate hover on data point for `2026-08-20` ($P_T=153, I_T=172$).
- **Expected Output**: Tooltip payload contains `Date: 20/08/2026`, `Inscriptos: 172`, `Presentes: 153`, `Ausentes: 19`, `Asistencia: 88.95%`.
- **Verification Mechanism**: Assert `getTooltipPayload(dataPoint)` returns expected structured data.

---

### 3.14 Feature F-14: Absent Staff Summary Panel (Requirement R3)

#### TC-F14-01: Dashboard Absent Staff Widget Listing
- **Requirement**: R3 (Staff Absence Dashboard)
- **Objective**: Verify dashboard displays all absent staff members for the selected shift and date.
- **Inputs**: 2 teachers and 1 auxiliary recorded absent in Vespertino on `2026-08-20`.
- **Expected Output**: Widget lists all 3 records with Name, Role badge, Subject/Area, and Reason.
- **Verification Mechanism**: Assert widget child elements count === 3 and content matches stored records.

#### TC-F14-02: Role Badging (Docente vs Auxiliar)
- **Requirement**: R3 (Visual Hierarchy)
- **Objective**: Verify distinct badge styling for Teachers vs Auxiliaries.
- **Inputs**: Render list with 1 `Docente` and 1 `Auxiliar`.
- **Expected Output**: `Docente` displays blue badge; `Auxiliar` displays purple/teal badge.
- **Verification Mechanism**: Assert badge CSS classes / text content match role types.

#### TC-F14-03: Zero Absence State Institutional Banner
- **Requirement**: R3 (Empty State)
- **Objective**: Verify informative empty state when no staff absences are reported.
- **Inputs**: Select date and shift with zero records in `staff_absences`.
- **Expected Output**: Widget displays green check icon and text "Sin ausencias de personal registradas en este turno".
- **Verification Mechanism**: Assert empty state banner is present and table is empty.

#### TC-F14-04: Real-time Shift Synchronization of Staff Absences
- **Requirement**: R3 (Shift Scoping)
- **Objective**: Verify changing shift tab updates the absent staff panel to reflect that shift's absences.
- **Inputs**: Switch tab from Vespertino (3 absences) to Mañana (1 absence).
- **Expected Output**: Panel updates to show only the 1 Mañana absence.
- **Verification Mechanism**: Assert displayed absences array length === 1.

#### TC-F14-05: Direct Admin Action: Quick Add / Remove from Panel
- **Requirement**: R3 (Admin Convenience)
- **Objective**: Verify Admin / Preceptor can add or delete staff absences directly from the dashboard panel.
- **Inputs**: Admin clicks "Agregar Ausencia" in panel; submits new absence.
- **Expected Output**: New absence immediately appears in list.
- **Verification Mechanism**: Assert absence created and list re-rendered.

#### TC-F14-06: Inclusion of Staff Absences in Printable Reports
- **Requirement**: R3 (Reporting Integration)
- **Objective**: Verify absent staff records are passed to the PDF/Excel export data pipeline.
- **Inputs**: Request export payload for shift with 2 staff absences.
- **Expected Output**: Export payload includes `staffAbsences: [...]` array with 2 records.
- **Verification Mechanism**: Assert export generation input data contains `staffAbsences` array.

---

### 3.15 Feature F-15: Excel (.xlsx) Export Engine (Requirement R3)

#### TC-F15-01: Valid Workbook Generation and Filename Standard
- **Requirement**: R3 (Excel Export)
- **Objective**: Verify that clicking Excel export downloads a valid `.xlsx` file named according to standard: `Parte_General_[TURNO]_[YYYY-MM-DD].xlsx`.
- **Inputs**: Trigger export for Turno Vespertino on date `2026-08-20`.
- **Expected Output**: Excel workbook generated with filename `Parte_General_VESPERTINO_2026-08-20.xlsx`; MIME type `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
- **Verification Mechanism**: Parse generated buffer with SheetJS (`xlsx.read(buffer, { type: 'buffer' })`); assert workbook is valid.

#### TC-F15-02: Institutional Header Block Layout in Excel
- **Requirement**: R3 (Paper Layout Replication)
- **Objective**: Verify Excel sheet header matches official paper form header:
  - Row 1: `ESCUELA DE EDUCACIÓN SECUNDARIA TÉCNICA N° 3 "Ntra. Sra. de la Merced"`
  - Row 5: `PARTE GENERAL`
  - Row 6: `ALUMNOS`
  - Row 7: `LOMA HERMOSA, [DD] de [MES] de [YYYY]`
- **Inputs**: Read header cells of generated worksheet.
- **Expected Output**: Header text strings match official institutional wording.
- **Verification Mechanism**: Assert cell `A1` or merged range contains school title; date cell contains formatted date string.

#### TC-F15-03: 11-Column Attendance Matrix Cell Mapping
- **Requirement**: R3 (Paper Layout Replication)
- **Objective**: Verify exact cell coordinates and column headers for the 11-column matrix:
  - Column A: `CURSOS`
  - Column B: `ORIENTACIÓN`
  - Columns C, D, E: `INSCRIPTOS (V, M, T)`
  - Columns F, G, H: `PRESENTES (V, M, T)`
  - Columns I, J, K: `AUSENTES (V, M, T)`
- **Inputs**: Inspect row 9 & 10 column header definitions.
- **Expected Output**: Column layout matches CSV reference file cell by cell.
- **Verification Mechanism**: Assert worksheet headers in row 9-10 match expected structure.

#### TC-F15-04: Dynamic SUM Formulas in Excel Totals Row
- **Requirement**: R3 (Excel Formulas)
- **Objective**: Ensure the Totals row in the Excel sheet uses native spreadsheet formulas (e.g. `=SUM(C11:C20)`) rather than static dead numbers.
- **Inputs**: Inspect cell formulas in the Totals row (e.g. Row 21).
- **Expected Output**: Inscriptos V total cell contains formula `=SUM(C11:C20)`; Presentes total contains `=SUM(F11:F20)`; Ausentes total contains `=SUM(I11:I20)`.
- **Verification Mechanism**: Check `worksheet['C21'].f` or cell formula attribute; assert formula matches `=SUM(...)`.

#### TC-F15-05: Export Observaciones and Staff Absences Sub-blocks
- **Requirement**: R3 (Complete Report)
- **Objective**: Verify that Observaciones and "AUSENTE DE DOCENTES Y AUXILIARES" sections appear below the main table matching paper layout.
- **Inputs**: Export shift data containing 2 course observations and 1 staff absence.
- **Expected Output**: Section `OBSERVACIONES` lists course notes; section `AUSENTE DE DOCENTES Y AUXILIARES:` lists staff names and reasons.
- **Verification Mechanism**: Assert text exists in cells below totals row.

#### TC-F15-06: Multi-Shift Workbook Structure
- **Requirement**: R3 (Multi-Shift Export)
- **Objective**: Verify option to export all 3 shifts in a single workbook with 3 tabs (`Mañana`, `Tarde`, `Vespertino`).
- **Inputs**: Trigger "Exportar Todos los Turnos" for date `2026-08-20`.
- **Expected Output**: Workbook contains 3 worksheets: `Manana`, `Tarde`, `Vespertino`, each populated with its respective shift data.
- **Verification Mechanism**: Assert `workbook.SheetNames` equals `['Mañana', 'Tarde', 'Vespertino']`.

---

### 3.16 Feature F-16: PDF Printable Export Engine (Requirement R3)

#### TC-F16-01: Valid PDF Document Generation
- **Requirement**: R3 (PDF Export)
- **Objective**: Verify clicking PDF export generates a valid PDF document matching standard printable format.
- **Inputs**: Trigger PDF export for Vespertino on `2026-08-20`.
- **Expected Output**: Generates PDF stream with MIME type `application/pdf`; magic header starts with `%PDF-`.
- **Verification Mechanism**: Verify PDF byte stream header starts with `%PDF-1.`.

#### TC-F16-02: Official Institutional Header & Layout
- **Requirement**: R3 (Institutional Layout)
- **Objective**: Verify PDF header includes school name, subtitle "Ntra. Sra. de la Merced", "PARTE GENERAL ALUMNOS", and "LOMA HERMOSA, [Fecha]".
- **Inputs**: Inspect PDF text structure.
- **Expected Output**: Header elements positioned at top margin with proper font weights.
- **Verification Mechanism**: Verify PDF generator calls with header configuration.

#### TC-F16-03: 11-Column Table Rendered via autotable
- **Requirement**: R3 (Table Fidelity)
- **Objective**: Verify 11-column table rendered with proper column widths, grid lines, and right-aligned numeric columns.
- **Inputs**: Generate PDF for 10 Vespertino courses.
- **Expected Output**: Table contains 10 course rows + 1 header + 1 totals row; columns aligned cleanly without page overflow.
- **Verification Mechanism**: Verify `jspdf-autotable` configuration: columns count === 11, data rows count === 10.

#### TC-F16-04: Totals Row Highlighting & Bold Typography
- **Requirement**: R3 (Visual Hierarchy)
- **Objective**: Verify Totals row in PDF has distinct styling (bold font, light gray or institutional border background).
- **Inputs**: Inspect totals row styling configuration.
- **Expected Output**: Totals row styled with `fontStyle: 'bold'`, `fillColor: [240, 240, 240]`.
- **Verification Mechanism**: Assert `autotable` hook configures bold weight and background on final row.

#### TC-F16-05: Signature Lines in Document Footer
- **Requirement**: R3 (Official Certification)
- **Objective**: Verify bottom of PDF includes official institutional signature blocks:
  - Left: `____________________________` / `Firma Preceptor/a de Turno`
  - Right: `____________________________` / `Firma Directivo / Regente`
- **Inputs**: Inspect footer elements of generated PDF.
- **Expected Output**: Two signature lines present at bottom of page.
- **Verification Mechanism**: Assert PDF footer generator adds signature text blocks.

#### TC-F16-06: PDF Single Page Fit Guarantee
- **Requirement**: R3, R5 (Print Layout)
- **Objective**: Verify that the daily report for a shift fits cleanly onto a single A4 page without spilling into page 2.
- **Inputs**: Generate PDF for Vespertino (10 courses, 2 observations, 2 staff absences).
- **Expected Output**: Total page count of document === 1.
- **Verification Mechanism**: Assert `doc.internal.getNumberOfPages() === 1`.

---

### 3.17 Feature F-17: Course Catalog CRUD (Requirement R4)

#### TC-F17-01: Admin Creates New Course Successfully
- **Requirement**: R4 (Course Management)
- **Objective**: Verify Admin can create a new course with full metadata.
- **Inputs**: Name: `4° 1°`, Shift: `manana`, Year: `4`, Division: `1`, Cycle: `superior`, Orientation: `TECQU`, Inscriptos Varones: `15`, Inscriptos Mujeres: `12`.
- **Expected Output**: Record inserted in `courses`; `inscriptos_total` generated as `27`; `is_active: true`.
- **Verification Mechanism**: Query `courses` table; assert record exists with `inscriptos_total === 27`.

#### TC-F17-02: Duplicate Course Name in Same Shift Rejection
- **Requirement**: R4 (Uniqueness Constraint)
- **Objective**: Ensure unique constraint on `(name, shift_id)` prevents creating duplicate courses in the same shift.
- **Inputs**: Attempt to insert course `6° 1ª` with `shift_id === 'vespertino'` when `6° 1ª` already exists in Vespertino.
- **Expected Output**: Database rejects insertion with unique constraint violation (`23505`).
- **Verification Mechanism**: Catch DB error; assert duplicate key error returned.

#### TC-F17-03: Admin Updates Course Enrollment Baseline
- **Requirement**: R4 (Enrollment Updates)
- **Objective**: Verify Admin can update enrollment numbers ($I_V, I_M$) for an existing course.
- **Inputs**: Update `6° 1ª TECQU` enrollment from $(11, 4)$ to $(12, 5)$.
- **Expected Output**: Course updated; `inscriptos_total` recalculates to `17`; future attendance uses new baseline.
- **Verification Mechanism**: Update course; assert `course.inscriptos_varones === 12` and `course.inscriptos_total === 17`.

#### TC-F17-04: Historical Attendance Snapshot Isolation upon Course Enrollment Update
- **Requirement**: R2, R4 (Historical Data Isolation)
- **Objective**: Ensure updating course enrollment does NOT alter or corrupt past attendance records (snapshots must be preserved).
- **Inputs**: Course `6° 1ª` had attendance on `2026-08-19` with snapshot $I_V=11, I_M=4, I_T=15$. Admin updates course enrollment on `2026-08-20` to $(12, 5)$.
- **Expected Output**: Attendance record for `2026-08-19` retains `snapshot_inscriptos_v: 11, snapshot_inscriptos_m: 4, snapshot_inscriptos_total: 15`.
- **Verification Mechanism**: Query attendance record for `2026-08-19`; assert snapshot columns remain `11, 4, 15`.

#### TC-F17-05: Soft-Delete / Deactivate Course (`is_active = false`)
- **Requirement**: R4 (Course Lifecycle)
- **Objective**: Verify Admin can deactivate a course, removing it from daily attendance selectors while preserving historical records.
- **Inputs**: Admin deactivates course `7° 4ª TECET` (`is_active = false`).
- **Expected Output**: `courses.is_active` set to `false`; course omitted from teacher picker; past reports retain historical data.
- **Verification Mechanism**: Assert `course.is_active === false`; query historical attendance succeeds.

#### TC-F17-06: Restrict Hard Deletion on Courses with Attendance Records
- **Requirement**: R4 (Relational Integrity)
- **Objective**: Verify that attempting hard `DELETE` on a course that has attendance records is rejected by foreign key `ON DELETE RESTRICT`.
- **Inputs**: Execute `DELETE FROM courses WHERE id = '6-1'` (which has attendance records).
- **Expected Output**: Database raises foreign key restriction violation (`23503`).
- **Verification Mechanism**: Catch DB error; assert deletion rejected.

---

### 3.18 Feature F-18: Seed Data Initializer & CSV Baseline Validation (Requirement R4)

#### TC-F18-01: Three Shifts Population in Seed Data
- **Requirement**: R4 (School Structure)
- **Objective**: Verify that seed migration creates all 3 school shifts: Mañana, Tarde, Vespertino.
- **Inputs**: Execute seed migration; query `shifts` table.
- **Expected Output**: 3 records exist with codes `'manana'`, `'tarde'`, `'vespertino'`.
- **Verification Mechanism**: Query `shifts`; assert `count === 3` and codes match.

#### TC-F18-02: Exact 10 Vespertino Courses from CSV Seeded
- **Requirement**: R4, Original CSV
- **Objective**: Verify all 10 courses from `PARTE GENERALES TV.xlsx - T.V.csv` are seeded with exact metadata:
  1. `5° 4ª` - `TECET` - V: 8, M: 0, T: 8
  2. `6° 1ª` - `TECQU` - V: 11, M: 4, T: 15
  3. `6° 2ª` - `TECMM` - V: 9, M: 14, T: 23
  4. `6° 3ª` - `TECET` - V: 23, M: 2, T: 25
  5. `6° 4ª` - `TECET` - V: 6, M: 0, T: 6
  6. `7° 1ª` - `TECQU` - V: 5, M: 8, T: 13
  7. `7° 2ª` - `TECMM` - V: 9, M: 9, T: 18
  8. `7° 3ª` - `TECET` - V: 20, M: 9, T: 29
  9. `7° 4ª` - `TECET` - V: 8, M: 0, T: 8
  10. `1° 1ª` - `C.TEC.MMO` - V: 20, M: 7, T: 27
- **Inputs**: Query Vespertino courses from database.
- **Expected Output**: 10 records returned with exact matching names, orientations, and enrollment numbers.
- **Verification Mechanism**: Assert each course from CSV matches DB record identically.

#### TC-F18-03: Vespertino Total Enrollment Sum Verification ($119 / 53 / 172$)
- **Requirement**: R4, Original CSV
- **Objective**: Verify that total enrollment sum across all 10 seeded Vespertino courses equals CSV totals:
  $$\sum I_V = 119, \quad \sum I_M = 53, \quad \sum I_T = 172$$
- **Inputs**: Calculate sum of `inscriptos_varones`, `inscriptos_mujeres`, `inscriptos_total` for Vespertino courses.
- **Expected Output**: Varones sum = `119`, Mujeres sum = `53`, Total sum = `172`.
- **Verification Mechanism**: Assert aggregated sums equal `119, 53, 172`.

#### TC-F18-04: Ciclo Básico Seed Catalog for Mañana and Tarde
- **Requirement**: R4 (Complete Structure)
- **Objective**: Verify seed data includes the complete Ciclo Básico structure:
  - 1° Year: Divisions 1ª to 5ª (1°1ª, 1°2ª, 1°3ª, 1°4ª, 1°5ª)
  - 2° Year: Divisions 1ª to 5ª (2°1ª, 2°2ª, 2°3ª, 2°4ª, 2°5ª)
  - 3° Year: Divisions 1ª to 4ª (3°1ª, 3°2ª, 3°3ª, 3°4ª)
- **Inputs**: Query Ciclo Básico courses for Mañana and Tarde shifts.
- **Expected Output**: All 14 basic cycle courses per shift exist with `cycle === 'basico'`.
- **Verification Mechanism**: Assert course count and division names match specification.

#### TC-F18-05: Default Demo User Accounts Seeded Across All 3 Roles
- **Requirement**: R1 (Seed Users)
- **Objective**: Verify seed data provides initial accounts for testing:
  - Admin: `admin@eest3.edu.ar` (role: `'administrador'`)
  - Preceptor: `preceptor.tv@eest3.edu.ar` (role: `'preceptor'`)
  - Profesor: `prof.quimica@eest3.edu.ar` (role: `'profesor'`)
- **Inputs**: Query seeded profiles.
- **Expected Output**: All 3 profiles exist with correct roles and active status.
- **Verification Mechanism**: Assert profiles found with corresponding role types.

#### TC-F18-06: Seed Migration Idempotency
- **Requirement**: R4 (DevOps & Testing)
- **Objective**: Verify that re-executing `seed.sql` on an existing database does not produce primary key collisions or duplicate rows.
- **Inputs**: Run `seed.sql` twice consecutively (`ON CONFLICT DO NOTHING` / `UPSERT`).
- **Expected Output**: Migration completes cleanly with exit code 0; row counts unchanged.
- **Verification Mechanism**: Execute seed twice; assert `courses.length` remains unchanged.

---

### 3.19 Feature F-19: User & Role Management (Requirements R1, R4)

#### TC-F19-01: Admin Creates New User Account
- **Requirement**: R1, R4 (User Management)
- **Objective**: Verify Admin can create a new staff account with full name, email, and role.
- **Inputs**: Name: `Prof. Perez Laura`, Email: `perez.laura@eest3.edu.ar`, Role: `profesor`.
- **Expected Output**: User created in Supabase Auth and synced to `profiles` table.
- **Verification Mechanism**: Call `userService.createUser(...)`; assert profile created with `role === 'profesor'`.

#### TC-F19-02: Admin Assigns Courses to Teacher (`course_assignments`)
- **Requirement**: R1 (Course Assignment)
- **Objective**: Verify Admin can link multiple courses to a teacher in `course_assignments`.
- **Inputs**: Link teacher `perez.laura` to courses `6° 3ª TECET` and `7° 3ª TECET`.
- **Expected Output**: 2 rows inserted into `course_assignments`; teacher can access these courses.
- **Verification Mechanism**: Query `course_assignments.select().eq('user_id', teacherId)`; assert returns 2 records.

#### TC-F19-03: Admin Changes User Role (Role Escalation / Demotion)
- **Requirement**: R1 (Role Assignment)
- **Objective**: Verify Admin can promote a user from `profesor` to `preceptor`.
- **Inputs**: Update user role from `profesor` to `preceptor`.
- **Expected Output**: `profiles.role` updated to `'preceptor'`; user receives preceptor privileges.
- **Verification Mechanism**: Update role; assert `profile.role === 'preceptor'`.

#### TC-F19-04: Admin Toggles User Active Status (`is_active = false`)
- **Requirement**: R1 (Account Lifecycle)
- **Objective**: Verify Admin can deactivate a staff user account.
- **Inputs**: Set `is_active = false` for user `perez.laura`.
- **Expected Output**: User status set to inactive; user cannot log in or submit attendance.
- **Verification Mechanism**: Assert `profile.is_active === false`.

#### TC-F19-05: Admin Revokes Course Assignment from Teacher
- **Requirement**: R1 (Course Assignment)
- **Objective**: Verify Admin can remove a course assignment from a teacher.
- **Inputs**: Delete assignment linking `prof.quimica` to `7° 1ª TECQU`.
- **Expected Output**: Assignment deleted; course immediately removed from teacher's course selector.
- **Verification Mechanism**: Delete assignment; query teacher courses; assert `7° 1ª` is no longer returned.

#### TC-F19-06: Non-Admin Privilege Rejection for User Management Operations
- **Requirement**: R1 (Authorization Boundaries)
- **Objective**: Verify Preceptor or Profesor attempting to create users or assign courses is rejected with HTTP 403.
- **Inputs**: Authenticated as Preceptor; attempt to call `userService.createUser(...)` or `assignCourse(...)`.
- **Expected Output**: Request rejected with RLS permission denied / HTTP 403.
- **Verification Mechanism**: Call user management function with Preceptor token; assert error returned.

---

### 3.20 Feature F-20: Realtime Subscriptions & Dashboard Live Sync (Requirement R3)

#### TC-F20-01: Teacher Attendance Submission Emits Realtime Event
- **Requirement**: R3 (Realtime Engine)
- **Objective**: Verify that inserting/updating an attendance record generates a Postgres realtime broadcast event on `attendance_records` channel.
- **Inputs**: Teacher submits attendance for `6° 1ª TECQU`.
- **Expected Output**: Supabase realtime channel receives `INSERT` or `UPDATE` payload with new attendance record data.
- **Verification Mechanism**: Subscribe to `postgres_changes` on `attendance_records`; assert event received with matching record ID.

#### TC-F20-02: Live Row Update on Open Admin Dashboard
- **Requirement**: R3 (Live Dashboard)
- **Objective**: Verify that an open Admin Dashboard updates the specific course row in real time without page reload.
- **Inputs**: Dashboard open on Turno Vespertino; receive realtime update for `6° 1ª` ($P_V=10, P_M=4, A_V=1, A_M=0$).
- **Expected Output**: `6° 1ª` row transitions from "Pendiente" to "Completo" displaying new Presentes/Ausentes values.
- **Verification Mechanism**: Simulate realtime message; assert table state updates reactively.

#### TC-F20-03: Reactive Re-calculation of Shift Totals and Overall Percentage
- **Requirement**: R3 (Live Totals)
- **Objective**: Verify that when a realtime attendance event is received, the bottom Totals row and shift percentage immediately re-aggregate.
- **Inputs**: Dashboard receives realtime update adding 14 Presentes and 1 Ausente.
- **Expected Output**: Totals row $\sum P_T$ increments by 14, $\sum A_T$ increments by 1, and $\%Asistencia$ updates.
- **Verification Mechanism**: Assert totals state recalculates dynamically upon event ingestion.

#### TC-F20-04: Realtime Broadcasting of Staff Absences
- **Requirement**: R3 (Staff Realtime)
- **Objective**: Verify that adding a staff absence in attendance module broadcasts event and adds row to Absent Staff panel on dashboard.
- **Inputs**: User adds staff absence `Prof. Gomez Carlos`.
- **Expected Output**: Absent Staff panel on dashboard receives event and inserts new row in real time.
- **Verification Mechanism**: Assert realtime listener on `staff_absences` updates panel list.

#### TC-F20-05: Realtime Reconnect & State Reconciliation
- **Requirement**: R3, R5 (Network Resilience)
- **Objective**: Verify that after temporary network disconnect, realtime client reconnects and fetches missing records to reconcile state.
- **Inputs**: Simulate WebSocket disconnect; submit 2 records during disconnect; reconnect WebSocket.
- **Expected Output**: Client reconnects and executes reconciliation query to fetch latest state.
- **Verification Mechanism**: Trigger reconnect handler; assert state matches DB state.

#### TC-F20-06: Shift Scoping for Realtime Events
- **Requirement**: R3 (Performance & Scoping)
- **Objective**: Verify that realtime events for Mañana shift do not trigger unnecessary DOM re-renders on an active Vespertino dashboard tab.
- **Inputs**: Active tab is Vespertino; receive realtime event for Mañana course `1° 1ª`.
- **Expected Output**: Event is ignored by Vespertino table component; no re-render or totals alteration.
- **Verification Mechanism**: Assert filter `event.new.shift_id === activeShiftId` prevents state update.

---

## 4. Cross-Feature Subsystem Deep Dives

```
+--------------------------------------------------------------------------------------------------+
|                                    E.E.S.T. N° 3 ARCHITECTURE                                    |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|   [Subsystem A: Auth & Roles]         [Subsystem B: Attendance Entry]    [Subsystem C: Dashboard]|
|   F01: Supabase Authentication        F03: Assigned Course Selector       F10: Shift Switcher    |
|   F02: Role Redirection & Guards      F04: Pre-populated Header           F11: 11-Col Summary    |
|   F19: User & Course Assignments      F05: Dual-Gender Math Inputs        F12: Bottom Totals     |
|                                       F06: Disparity Blocking & Trg       F13: Trend Charts      |
|                                       F07: Historical Locking & Date      F14: Absent Staff Panel|
|                                       F08: Observaciones Text Field       F20: Realtime Live Sync|
|                                       F09: Staff Absences Subform                                |
|                                                                                                  |
|   [Subsystem D: Export Engines]       [Subsystem E: Course Catalog]                              |
|   F15: Excel (.xlsx) Export Engine    F17: Course Catalog CRUD                                   |
|   F16: Printable PDF Export Engine    F18: Seed Data Initializer (CSV Baseline)                  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Subsystem A: Authentication, Role-Based Guards & User Management
- **Interaction Contract**:
  - `Profile` model defines role permissions: `administrador` (Full access), `preceptor` (Dashboard, Attendance, Read-only admin), `profesor` (Attendance submission for assigned courses only).
  - `course_assignments` associates `(user_id, course_id)`.
  - Opaque-box tests verify that access rules are enforced both client-side (via `RoleGuard` and `ProtectedRoute`) and database-side (via PostgreSQL Row Level Security policies).

### Subsystem B: Attendance Dual-Gender Math, Disparity Blocking & Locking
- **Mathematical Invariant Engine**:
  - Male validation: $P_V + A_V = I_V \iff \Delta_V = (P_V + A_V) - I_V = 0$
  - Female validation: $P_M + A_M = I_M \iff \Delta_M = (P_M + A_M) - I_M = 0$
  - Total validation: $P_T + A_T = I_T \iff \Delta_T = (P_T + A_T) - I_T = 0$
  - Percentage: $\%Asistencia = \left(\frac{P_T}{I_T}\right) \times 100$
- **Blocking Mechanism**:
  - UI: Submit button `disabled={!validation.isValid}`.
  - DB: Trigger `trg_validate_and_snapshot_attendance` rolls back transaction on any non-zero disparity.
- **Historical Locking**:
  - `is_locked` is true when `record.date < today` for `profesor` role.

### Subsystem C: Dashboard Summary, 11-Column Layout, Totals & Trends
- **Tabular Layout**:
  - Exactly 11 columns matching `PARTE GENERALES TV.xlsx - T.V.csv`.
  - Column totals: $\sum I_V, \sum I_M, \sum I_T, \sum P_V, \sum P_M, \sum P_T, \sum A_V, \sum A_M, \sum A_T$.
  - Shift Percentage: $\left(\frac{\sum P_T}{\sum I_T}\right) \times 100$.
- **Realtime Integration**:
  - Subscribes to Supabase realtime events on `attendance_records` and `staff_absences`.

### Subsystem D: Institutional Export Engines
- **Excel Export Engine (`excelGenerator.ts`)**:
  - SheetJS-driven workbook generation.
  - Native Excel formula generation (`=SUM(C11:C20)`).
  - Exact cell placement for Header, 11-Column Table, Totals, Observaciones, and Staff Absences.
- **PDF Export Engine (`pdfGenerator.ts`)**:
  - jsPDF + jspdf-autotable printable document generation.
  - Institutional typography, single-page fit guarantee, and dual signature lines.

### Subsystem E: Course Catalog CRUD & Seed Data Integrity
- **Seed Baseline**:
  - 10 Vespertino courses from CSV (Total enrolled = 172: 119 Varones, 53 Mujeres).
  - 3 Shifts: Mañana, Tarde, Vespertino.
  - Complete Ciclo Básico (1°-3°) and Ciclo Superior (4°-7° with TECQU/TECMM/TECET) structure.

---

## 5. Opaque-Box Test Harness Integration Blueprint

The Tier 1 test suite executes against an opaque-box test harness interface (`OpaqueTestHarness`), ensuring that test assertions remain decoupled from internal refactoring.

```typescript
export interface OpaqueTestHarness {
  // Auth interface
  login(email: string, pass: string): Promise<{ token: string; profile: Profile }>;
  logout(): Promise<void>;
  
  // Attendance interface
  getAssignedCourses(token: string): Promise<Course[]>;
  getCourseMetadata(token: string, courseId: string): Promise<Course>;
  submitAttendance(token: string, payload: AttendanceInputPayload): Promise<AttendanceResult>;
  getAttendanceRecord(token: string, courseId: string, date: string): Promise<AttendanceRecord>;
  
  // Dashboard & Table interface
  getDailySummary(token: string, shiftCode: string, date: string): Promise<DailySummaryReport>;
  
  // Staff Absence interface
  submitStaffAbsence(token: string, payload: StaffAbsencePayload): Promise<StaffAbsence>;
  getStaffAbsences(token: string, shiftCode: string, date: string): Promise<StaffAbsence[]>;
  
  // Export interface
  generateExcelExport(token: string, shiftCode: string, date: string): Promise<Uint8Array>;
  generatePdfExport(token: string, shiftCode: string, date: string): Promise<Uint8Array>;
  
  // Admin interface
  createCourse(token: string, courseData: NewCourseData): Promise<Course>;
  updateCourse(token: string, courseId: string, updateData: Partial<Course>): Promise<Course>;
  createUser(token: string, userData: NewUserData): Promise<Profile>;
  assignCourse(token: string, teacherId: string, courseId: string): Promise<void>;
}
```

---

## 6. Coverage Scorecard & Invariant Verification Checklist

| Dimension | Target Specification | Tier 1 Coverage | Status |
|---|---|---|---|
| **Features Covered** | F-01 to F-20 (20 features) | 20 / 20 (100%) | **VERIFIED** |
| **Requirements Traceability** | R1, R2, R3, R4, R5 | Complete mapping across all 5 requirements | **VERIFIED** |
| **Tests per Feature** | $\ge 5$ tests per feature | 6 tests per feature (120 tests total) | **VERIFIED** |
| **Total Test Count** | $\ge 100$ total tests | 120 total tests | **EXCEEDED** |
| **Shifts Covered** | Mañana, Tarde, Vespertino | 3 / 3 shifts covered | **VERIFIED** |
| **User Roles Covered** | Administrador, Preceptor, Profesor | 3 / 3 roles covered | **VERIFIED** |
| **CSV Seed Courses** | 10 Vespertino courses (172 enrolled) | All 10 courses explicitly verified | **VERIFIED** |
| **Dual-Gender Invariants** | $P_V+A_V=I_V$ and $P_M+A_M=I_M$ | Verified at UI, API, and DB Trigger levels | **VERIFIED** |
| **Export Engines** | .xlsx (formulas) and .pdf (autotable) | 12 dedicated export test cases | **VERIFIED** |
| **Realtime Updates** | Live sync on table and totals | 6 dedicated realtime test cases | **VERIFIED** |

---
*Report produced by E2E Explorer 2 (Tier 1 Feature Coverage Specialist)*
