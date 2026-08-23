# Technical Analysis & Architecture Specification: RBAC, Historical Lockout, Routing & Test Alignment (M3)

**Author**: Explorer 3 (Milestone 3 Sub-Orchestration)  
**Target Milestone**: M3 (Teacher & Preceptor Daily Attendance Entry Module)  
**Institution**: Escuela de Educación Secundaria Técnica N° 3 "Ntra. Sra. de la Merced" (Loma Hermosa)  
**Date**: 2026-08-20  

---

## 1. Executive Summary

Milestone 3 delivers the core data entry module for daily attendance ("Parte General de Alumnos"). This technical document establishes the precise architectural contracts, security mechanisms, routing structure, and test boundary matrix governing:
1. **Role-Based Access Control (RBAC)** across `profesor`, `preceptor`, and `administrador`.
2. **Historical Date Lockout & Temporal Invariants** enforcing same-day editability for teachers while permitting direct administrative overrides.
3. **Application Routing & Shell Layout Integration** in `src/App.tsx` and `src/components/common/Navbar.tsx`.
4. **Comprehensive Test Suite Alignment** across all 153 test cases (Tiers 1–4) with detailed edge-case specifications for Features F-03 through F-09.

---

## 2. Role-Based Access Control (RBAC) & Course Selector Integration

### 2.1 Role Matrix & Capabilities

| Capability / Action | Profesor | Preceptor | Administrador | Enforcing Layers |
|---|:---:|:---:|:---:|---|
| **Course Scope** | Assigned courses only (`course_assignments`) | All courses in assigned shift (or all shifts) | Full 34-course catalog | UI Selector, RLS (`courses_select_policy`), DB Queries |
| **0 Assigned Courses State** | Graceful empty warning card | N/A (always sees shift courses) | N/A (always sees all courses) | UI Component `CourseSelector.tsx` |
| **Today's Attendance Entry** | Allowed (assigned courses) | Allowed (shift courses) | Allowed (all courses) | UI Form, RLS (`attendance_insert_policy`), DB Trigger |
| **Same-Day Modification** | Allowed until 23:59:59 (if not `is_locked`) | Allowed | Allowed | UI Form, RLS (`attendance_update_policy`) |
| **Historical Past-Date Edit** | **BLOCKED (Read-Only Lockout Banner)** | Read-Only (view historical) / Admin override | **Allowed (Full Historical Bypass)** | UI DateSelector, RLS, DB Trigger `fn_date_lock_attendance` |
| **Future Date Entry** | **BLOCKED (Hard Validation)** | **BLOCKED (Hard Validation)** | **BLOCKED (Hard Validation)** | UI DatePicker max limit, DB Trigger `fn_date_lock_attendance` |
| **Staff Absences Entry** | Read/Log for shift | Full CRUD for shift | Full CRUD for all shifts | UI `StaffAbsenceForm`, RLS `staff_absences_manage_admin_preceptor` |
| **Course Catalog Administration** | Forbidden (403) | Forbidden (403) | Full CRUD | RouteGuard `/admin/courses` |
| **User & Role Management** | Forbidden (403) | Forbidden (403) | Full CRUD | RouteGuard `/admin/users` |

---

### 2.2 Course Selection Flow & Role Filtering

```
                           [User Enters /attendance]
                                      │
                                [Check Role]
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            ▼                         ▼                         ▼
      [Role: profesor]        [Role: preceptor]       [Role: administrador]
            │                         │                         │
  Fetch assigned courses    Fetch courses for shift   Fetch all 34 courses
  from course_assignments   (filter by shift_id/code) across 3 shifts
            │                         │                         │
    ┌───────┴───────┐                 │                         │
    │               │                 │                         │
[Count = 0]    [Count > 0]            │                         │
    │               │                 │                         │
Display Empty   Populate Dropdown     Populate Dropdown         Populate Dropdown
Warning Card    Select 1st course     Select 1st course         Select 1st course
```

#### Detailed Query Specifications:
1. **Profesor Query**:
   ```sql
   SELECT c.* 
   FROM courses c
   INNER JOIN course_assignments ca ON ca.course_id = c.id
   WHERE ca.user_id = :current_user_id 
     AND ca.is_active = true 
     AND c.is_active = true
   ORDER BY c.sort_order ASC;
   ```
2. **Preceptor Query**:
   ```sql
   SELECT c.* 
   FROM courses c
   WHERE c.is_active = true
     AND (:shift_id IS NULL OR c.shift_id = :shift_id)
   ORDER BY c.sort_order ASC;
   ```
3. **Administrador Query**:
   ```sql
   SELECT c.* 
   FROM courses c
   WHERE c.is_active = true
   ORDER BY c.shift_id, c.sort_order ASC;
   ```

#### Invariant Rules for Course Switching:
- **Exclusion of Inactive Courses (TC-F03-04)**: Any course where `is_active = false` must be filtered out of the course picker.
- **State Reset on Switch (TC-F03-05)**: Changing the selected course immediately resets any dirty/unsubmitted form state, clears local validation errors, and loads the new course's baseline enrollment ($I_V, I_M, I_T$) and any existing attendance record for the active date.
- **Horizontal Access Security (TC-SEC-01, TC-SEC-02)**: If a `profesor` manipulates client state or API parameters to submit attendance for an unassigned course (e.g. `6° 2ª` when assigned to `6° 1ª`), the server/adapter rejects the mutation with `403 Forbidden: Profesor no asignado a este curso`.

---

## 3. Date Selector & Historical Edit Lockout Architecture

### 3.1 Temporal Rules & Matrix

```
       Past Dates (< Today)              Today (=== Today)             Future Dates (> Today)
 ──────────────────────────────────┼────────────────────────────┼───────────────────────────────────
 • Profesor: READ-ONLY LOCKOUT     • Profesor: EDITABLE         • ALL ROLES: HARD BLOCKED
   - Inputs disabled ($P, A, Obs$) • Preceptor: EDITABLE        - Date picker max = today
   - Quick-fill buttons disabled   • Admin: EDITABLE            - UI error: "No se puede registrar
   - Submit button hidden/disabled • Upsert on duplicate          asistencia en fechas futuras"
   - Amber Lockout Banner visible  • Trigger validates math     - DB Trigger raises exception
 • Preceptor: View / Read-only
 • Admin: EDITABLE (Override)
```

### 3.2 Lockout Warning Banner Specification
When a `profesor` selects a date strictly prior to today (`selectedDate < getTodayString()`):
1. **Visual Banner** (`bg-amber-50 border-amber-300 text-amber-900`):
   - **Icon**: `Lock` or `AlertTriangle` (Lucide React, `text-amber-600`).
   - **Title**: `Registro Histórico Bloqueado (Solo Lectura)`
   - **Message**: `Los registros de fechas anteriores no pueden ser modificados por el personal docente. Para solicitar una rectificación, contacte al equipo de conducción / directivo.`
2. **Form Input Disabling**:
   - `disabled={isHistoricalLocked}` on all `Input` fields for $P_V, P_M, A_V, A_M$, and `Observaciones`.
   - "Todos Presentes", "Todos Ausentes", "Autocompletar Ausentes" buttons are disabled or hidden.
   - Primary Submit Button is replaced by a disabled button or badge: `[ 🔒 Registro Histórico Cerrado ]`.

### 3.3 Database & API Enforcement
- Database Trigger `fn_date_lock_attendance`:
  ```sql
  IF public.is_admin() THEN
      RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  IF TG_OP = 'INSERT' AND NEW.date < CURRENT_DATE THEN
      RAISE EXCEPTION 'Bloqueo de Fecha: No se permite registrar partes de asistencia de fechas pasadas (%). Solo administradores pueden realizar cargas retroactivas.', NEW.date;
  ELSIF TG_OP = 'UPDATE' AND OLD.date < CURRENT_DATE THEN
      RAISE EXCEPTION 'Bloqueo de Fecha: No se permite modificar partes de asistencia de fechas pasadas (%). Contacte a un directivo para solicitar una corrección.', OLD.date;
  END IF;
  ```
- RLS Policy `attendance_insert_policy` & `attendance_update_policy` enforces `date = CURRENT_DATE` for non-admin/preceptors.

---

## 4. Routing, Navigation & Application Shell Integration

### 4.1 Route Table (`src/App.tsx`)

| Route Path | Allowed Roles | Component / View | Layout Wrapping | Purpose |
|---|---|---|---|---|
| `/login` | Public | `LoginView` | Standalone (no shell) | Authentication screen |
| `/` | Authenticated | `RootRedirect` | Shell (`AppShellLayout`) | Dispatches to role home |
| `/attendance` | `profesor`, `preceptor`, `administrador` | `AttendanceView` | Shell (`AppShellLayout`) | Daily Attendance Entry (M3) |
| `/asistencia` | `profesor`, `preceptor`, `administrador` | `<Navigate to="/attendance" replace />` | Shell (`AppShellLayout`) | Canonical Spanish URL alias |
| `/dashboard` | `preceptor`, `administrador` | `DashboardView` | Shell (`AppShellLayout`) | Daily Summary Table & Analytics (M4) |
| `/admin/courses` | `administrador` | `CourseCatalogView` | Shell (`AppShellLayout`) | Course catalog CRUD (M5) |
| `/admin/users` | `administrador` | `UserManagementView` | Shell (`AppShellLayout`) | User management & RBAC (M5) |
| `/403` | Authenticated | `Forbidden403` | Standalone / Shell | Access denied feedback |
| `*` | Any | `<Navigate to="/" replace />` | Shell | Catch-all redirect |

### 4.2 Root Redirect Rules (`RootRedirect`)
```typescript
const RootRedirect: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (user.role === 'profesor') return <Navigate to="/attendance" replace />;
  return <Navigate to="/dashboard" replace />;
};
```

### 4.3 Navigation Bar Alignment (`src/components/common/Navbar.tsx`)
1. **Nav Item Definition**:
   ```typescript
   {
     label: 'Cargar Asistencia',
     path: '/attendance',
     icon: ClipboardCheck,
     allowedRoles: ['profesor', 'preceptor', 'administrador']
   }
   ```
2. **Active Path Matching**:
   ```typescript
   const isActive = location.pathname === item.path || 
     (item.path === '/attendance' && location.pathname === '/asistencia');
   ```

---

## 5. Test Case & Boundary Edge-Case Alignment (F-03 to F-09)

The following matrix maps every requirement, invariant, and edge case from `TEST_INFRA.md` and test tiers (1–4) to concrete design constraints:

| Feature ID | Test Code | Boundary / Edge Case | Expected System Behavior | Design Verification Reference |
|---|---|---|---|---|
| **F-03** | `TC-F03-01` | Teacher Assigned Filter | Only assigned courses returned in dropdown | `getAssignedCourses(user.id)` in `attendanceService.ts` |
| **F-03** | `TC-F03-02` | Preceptor Scope | All courses in shift returned | Preceptor shift selector query |
| **F-03** | `TC-F03-03` | Admin Scope | Full 34 courses available | Admin full catalog access |
| **F-03** | `TC-F03-04` | Inactive Courses | Archived courses omitted from list | Query filter `.eq('is_active', true)` |
| **F-03** | `TC-F03-05` | Course Switch Reset | Dirty form state cleared on switch | State reset hook in `useAttendance` |
| **F-03** | `TC-F03-06` | Zero Assigned Courses | Teacher with 0 courses sees empty card | Graceful placeholder: "Sin cursos asignados" |
| **F-04** | `TC-F04-01` | Header Metadata | Displays Name, Year, Division, Shift | `CourseHeaderCard.tsx` badges |
| **F-04** | `TC-F04-02` | Orientation Tag | TECQU, TECMM, TECET, C.TEC.MMO tags displayed | Orientation badge color coding |
| **F-04** | `TC-F04-03` | Ciclo Básico Header | Ciclo Básico shows cycle tag with null orientation | Orientation badge omitted cleanly |
| **F-04** | `TC-F04-04` | CSV TV Baseline (10) | Matches CSV counts (119V, 53M, 172T total) | Baseline $I_V, I_M, I_T$ snapshot |
| **F-04** | `TC-F04-05` | Zero Female Course | 5° 4ª has $I_M = 0$, $I_V = 8$ | Locks $P_M = 0, A_M = 0$, enables $P_V, A_V$ |
| **F-04** | `TC-F04-06` | Conservation Law | $I_V + I_M = I_T$ always preserved | DB Generated Column & client math |
| **F-05** | `TC-F05-01` | Presentes Sum | $P_T = P_V + P_M$ calculated live | React state live calculation |
| **F-05** | `TC-F05-02` | Ausentes Sum | $A_T = A_V + A_M$ calculated live | React state live calculation |
| **F-05** | `TC-F05-03` | Percentage Accuracy | $(P_T / I_T) \times 100$ rounded to 2 decimals | `calculateAttendancePercentage(14, 15) -> 93.33` |
| **F-05** | `TC-F05-04` | 100% Attendance | $P_T = I_T \implies 100.00\%$ | No overflow or rounding drift |
| **F-05** | `TC-F05-05` | 0% Attendance | $P_T = 0 \implies 0.00\%$ | Handled cleanly without errors |
| **F-05** | `TC-F05-06` | Negative Numbers | Inputs < 0 rejected | Validation flag `isValid = false` |
| **F-05** | `T2-07` | Non-Integer / Decimal | Decimals (e.g. 10.5) rejected | `Number.isInteger` check in validator |
| **F-05** | `Boundary` | Empty Field Default | Empty input string parsed as 0 | Form parsing `parseInt(val) \|\| 0` |
| **F-06** | `TC-F06-01` | Parity Match | $P_V+A_V=I_V \land P_M+A_M=I_M \implies$ Valid | Green `ValidationBadge` ("Paridad Verificada") |
| **F-06** | `TC-F06-02` | Male Disparity | $P_V+A_V \neq I_V$ blocks submission | Red `DisparityAlert` ("Varones: Faltan 1") |
| **F-06** | `TC-F06-03` | Female Disparity | $P_M+A_M \neq I_M$ blocks submission | Red `DisparityAlert` ("Mujeres: Sobran 1") |
| **F-06** | `TC-F06-04` | Compensating Error | $P_V+A_V=10$ ($I_V=11$), $P_M+A_M=5$ ($I_M=4$) | Total sum = 15, but per-gender FAILS |
| **F-06** | `TC-F06-05` | DB Trigger Guard | DB rejects disparity payload | Trigger `trg_validate_attendance_math` |
| **F-06** | `TC-F06-06` | Dynamic Recovery | Form re-enables submit once disparity is fixed | Immediate live revalidation |
| **F-07** | `TC-F07-01` | Default Date | Defaults to current date (`YYYY-MM-DD`) | `getTodayString()` |
| **F-07** | `TC-F07-02` | Today Editable | Submitting today succeeds | Upsert attendance record |
| **F-07** | `TC-F07-03` | Teacher Past Date Lock | Past date for teacher is read-only | UI disabled + Lockout Banner |
| **F-07** | `TC-F07-04` | API Past Date Block | Backend blocks past date edit for teachers | 403 Forbidden error |
| **F-07** | `TC-F07-05` | Admin Past Override | Admin can edit/submit past dates | Admin bypass in trigger and RLS |
| **F-07** | `TC-F07-06` | Future Date Block | Future dates disabled in picker and API | DatePicker `max={today}`, API rejection |
| **F-07** | `T2-DATE-01` | Leap Year | `2024-02-29` parsed and formatted | Spanish formatter leap year handling |
| **F-07** | `T2-DATE-02` | Month Transition | `2026-08-31` to `2026-09-01` date isolation | Shift summary isolates by exact date |
| **F-08** | `TC-F08-01` | Observaciones Text | Free-text observations stored and retrieved | Saved in `attendance_records.observations` |
| **F-08** | `TC-F08-02` | Spanish Diacritics | Accents, ñ, uppercase diacritics preserved | UTF-8 storage & rendering |
| **F-08** | `TC-F08-03` | XSS / HTML Escape | `<script>alert(1)</script>` safely stored/rendered | React JSX automatic escaping |
| **F-08** | `TC-F08-04` | Max Length 500 | Long text up to 500 chars tolerated | Textarea `maxLength={500}` with counter |
| **F-08** | `TC-F08-05` | Clear Observaciones | Empty string clears observations | Handled on upsert |
| **F-08** | `TC-F08-06` | Shift Report Flow | Observaciones propagate to daily summary row | Visible in `ParteGeneralCourseRow` |
| **F-09** | `TC-F09-01` | Docente Absence | Record teacher absence with reason | Stored in `staff_absences` |
| **F-09** | `TC-F09-02` | Auxiliar Absence | Record auxiliary staff absence | Role type `Auxiliar` |
| **F-09** | `TC-F09-03` | Multiple Absences | Multiple staff absences per shift/day | Rendered in absence table |
| **F-09** | `TC-F09-04` | Required Fields | Missing `staff_name` or `role_type` rejected | Validation error on subform |
| **F-09** | `TC-F09-05` | Delete Absence | Preceptor/Admin can delete absence entry | `deleteStaffAbsence(id)` |
| **F-09** | `TC-F09-06` | Shift Isolation | Absence in Turno Mañana not visible in Vespertino | Filtered strictly by `shift_id` |

---

## 6. Component Architecture & Data Flow (`src/components/attendance/`)

### 6.1 Component Hierarchy
```
AttendanceView (Container / Orchestrator)
├── DateSelector (Date picker, "Hoy" shortcut, Lockout indicator)
├── LockoutWarningBanner (Visible when teacher views past date)
├── CourseSelector (Role-filtered dropdown, Shift pills, Search)
├── CourseHeaderCard (Course name, Year, Division, Orientation badge, Enrolled counts)
├── AttendanceForm (Dual-gender grid, live inputs, quick-fill buttons)
│   ├── DualGenderInputGrid ($P_V, P_M, A_V, A_M$ inputs)
│   ├── LiveTotalsCard ($P_T, A_T, \%Asistencia$ live badge)
│   ├── QuickFillToolbar ("Todos Presentes", "Todos Ausentes", "Autocompletar Ausentes")
│   ├── ValidationBadge (Green "Paridad Verificada" / Red "Disparidad")
│   ├── DisparityAlert (Breakdown of exact delta per gender)
│   └── ObservacionesField (500-char textarea with Spanish support)
└── StaffAbsenceSection (Collapsible modal / subform for preceptors/teachers)
    ├── StaffAbsenceForm (Name, Role [Docente/Auxiliar], Subject, Reason)
    └── StaffAbsenceList (Table of absences for current date & shift with delete action)
```

### 6.2 Service Contract (`src/services/attendanceService.ts`)
```typescript
export interface AttendanceService {
  // Course fetching
  getCoursesForUser(userId: string, role: Role, shiftId?: string): Promise<Course[]>;
  
  // Attendance operations
  getAttendanceByCourseAndDate(courseId: string, date: string): Promise<AttendanceRecord | null>;
  saveAttendance(record: SubmitAttendanceParams, user: User): Promise<AttendanceRecord>;
  
  // Staff absence operations
  getStaffAbsencesByShiftAndDate(shiftId: string, date: string): Promise<StaffAbsence[]>;
  createStaffAbsence(absence: CreateStaffAbsenceParams, userId: string): Promise<StaffAbsence>;
  deleteStaffAbsence(absenceId: string): Promise<void>;
}
```

### 6.3 State Management Hook (`src/hooks/useAttendance.ts`)
The hook encapsulates all state transitions, parity validations, optimistic updates, and lockout logic:
- `selectedDate`: string (`YYYY-MM-DD`)
- `selectedCourseId`: string
- `courses`: Course[] (filtered by role)
- `currentCourse`: Course | null
- `formData`: `{ pv: number; pm: number; av: number; am: number; observaciones: string }`
- `validation`: `ValidationResult` (from `validateAttendanceRow`)
- `isHistoricalLocked`: boolean (true if role is `profesor` and `selectedDate < getTodayString()`)
- `staffAbsences`: StaffAbsence[]
- `isSubmitting`, `isLoading`, `error`, `successMessage`
- Actions: `setCourse`, `setDate`, `updateField`, `quickFillAllPresent`, `quickFillAllAbsent`, `quickFillAutoAbsent`, `submitAttendance`, `addStaffAbsence`, `removeStaffAbsence`.

---

## 7. Implementation Recommendations for M3 Worker

1. **Strict Input Sanitization**:
   - Ensure input change handlers parse numbers using `Math.max(0, parseInt(e.target.value, 10) || 0)`.
   - Prevent decimal entry and negative signs via HTML attributes `min="0" step="1"` and regex sanitization.
2. **Zero-Enrollment Gender Handling (e.g. 5° 4ª with 0 Females)**:
   - When `inscriptos_mujeres === 0`, automatically set $P_M = 0$ and $A_M = 0$ and render the female input fields as disabled with value 0 to guide the user intuitively.
3. **Quick-Fill Actions Logic**:
   - **"Todos Presentes"**: Sets $P_V = I_V, P_M = I_M, A_V = 0, A_M = 0$.
   - **"Todos Ausentes"**: Sets $P_V = 0, P_M = 0, A_V = I_V, A_M = I_M$.
   - **"Autocompletar Ausentes"**: Given current $P_V, P_M$, automatically calculates $A_V = \max(0, I_V - P_V)$ and $A_M = \max(0, I_M - P_M)$.
4. **Optimistic & Safe Submit Flow**:
   - On submit, verify `validation.isValid === true` client-side before dispatching network request.
   - If `!validation.isValid`, scroll to / focus `DisparityAlert` and show error toast.
   - On successful submit, show institutional green success toast: `Parte de asistencia registrado exitosamente para [Curso]`.
