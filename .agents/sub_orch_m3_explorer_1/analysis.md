# Milestone 3 — Technical Analysis & UX Component Architecture Specification
**Module**: Daily Attendance Entry & Live Validation Module (`src/components/attendance/`)  
**Institution**: Escuela de Educación Secundaria Técnica N° 3 "Ntra. Sra. de la Merced" (Loma Hermosa)  
**Target View**: `/attendance` (Teacher & Preceptor Daily Attendance Entry)  
**Author**: M3 Explorer 1  
**Date**: 2026-08-20  

---

## 1. Executive Summary & Problem Boundary

The Daily Attendance Entry Module (M3) is the primary operational surface for **Docentes** (Teachers), **Preceptores** (Preceptors), and **Directivos / Administradores** to register and validate daily attendance for the school's 34 courses across three shifts (**Mañana**, **Tarde**, and **Vespertino**).

### Core Responsibilities
1. **Dual-Gender Mathematical Invariant Enforcement**:
   $$\begin{cases} P_V + A_V = I_V \\ P_M + A_M = I_M \\ P_T = P_V + P_M \\ A_T = A_V + A_M \\ \%A = \left(\frac{P_T}{I_T}\right) \times 100 \end{cases}$$
   Submission is **hard-blocked** unless $P_V + A_V = I_V$ and $P_M + A_M = I_M$. Compensating errors across genders (e.g. $P_V+1$ and $P_M-1$) are strictly forbidden.
2. **Role-Based Scoping & Course Selection**:
   - `profesor`: Only sees courses assigned to them via `course_assignments`.
   - `preceptor`: Sees all courses within their shift (or all active courses).
   - `administrador`: Accesses all 34 courses with full retroactive override capabilities.
3. **Temporal Lifecycle & Lockout**:
   - `date = TODAY`: Editable by all authorized roles.
   - `date < TODAY`: Hard locked to **Read-Only** for `profesor`, with visual lockout banner. Editable only by `administrador`.
   - `date > TODAY`: Blocked from submission.
4. **Staff Absences & Incidents Logging**:
   - Modal and subform for logging absent teachers and auxiliary staff (*Ausencias de Docentes y Auxiliares*).
   - Rich free-text observations field (*Observaciones*) for daily course novelties.
5. **Mobile-First Ergonomics**:
   - High-contrast, touch-optimized numeric inputs ($\ge 44\text{px}$ targets, `inputMode="numeric"`, `pattern="[0-9]*"`).
   - Sticky bottom action bar on mobile viewports (375px) ensuring zero horizontal scrolling and immediate validation feedback.

---

## 2. Component Hierarchy & System Architecture

```
src/
└── components/
    └── attendance/
        ├── AttendanceView.tsx         <-- Main Page Container & Tab Orchestrator
        │   ├── DateSelector.tsx       <-- Date Picker, "Hoy" shortcut & Lockout Banner
        │   ├── CourseSelector.tsx     <-- Role-filtered course search & badge list
        │   ├── CourseHeaderCard.tsx   <-- Course metadata & official enrollment (I_V, I_M, I_T)
        │   ├── AttendanceForm.tsx     <-- Dual-gender input grid, live totals, %A & actions
        │   │   ├── ValidationBadge.tsx <-- Parity status pill (Verificado vs Disparidad)
        │   │   ├── DisparityAlert.tsx  <-- Detailed arithmetic breakdown & error helper
        │   │   └── ObservacionesField.tsx <-- Daily notes & incidents textarea
        │   └── StaffAbsenceForm.tsx   <-- Modal / subform for logging absent staff
        └── index.ts                   <-- Clean barrel export
```

### Data Flow Diagram

```
                +------------------------------------+
                |       AuthContext (useAuth)        |
                |  user: { role, assigned_courses }  |
                +-----------------+------------------+
                                  |
                                  v
                +------------------------------------+
                |         AttendanceView             |
                |  State: selectedDate, courseId     |
                +--------+------------------+--------+
                         |                  |
            +------------+                  +------------+
            v                                            v
  +--------------------+                       +--------------------+
  |   CourseSelector   |                       |    DateSelector    |
  | (Filtered by role) |                       | (Lockout Evaluator)|
  +---------+----------+                       +---------+----------+
            | (selectedCourse)                           | (selectedDate)
            +--------------------+-----------------------+
                                 |
                                 v
                +------------------------------------+
                |        useAttendance Hook          |
                | - attendanceRecord (DB / Draft)    |
                | - P_V, P_M, A_V, A_M, Obs          |
                | - Parity Validation Engine         |
                | - saveAttendance() mutation        |
                | - staffAbsences list & mutations   |
                +-----------------+------------------+
                                  |
            +---------------------+---------------------+
            v                                           v
  +--------------------+                      +--------------------+
  |  CourseHeaderCard  |                      |   AttendanceForm   |
  |  (I_V, I_M, I_T)   |                      |  (P_V, P_M, A_V,   |
  +--------------------+                      |   A_M, %A, Actions)|
                                              +---------+----------+
                                                        |
                                          +-------------+-------------+
                                          v                           v
                                +-------------------+       +--------------------+
                                |  ValidationBadge  |       |  StaffAbsenceForm  |
                                |  DisparityAlert   |       |  (Modal & List)    |
                                +-------------------+       +--------------------+
```

---

## 3. Comprehensive Component Specifications

### 3.1 `AttendanceView.tsx` (Main Container)
- **Path**: `src/components/attendance/AttendanceView.tsx`
- **Purpose**: Page-level controller orchestrating course selection, date synchronization, attendance records, staff absences, and layout tabs.
- **Props**: None (Page component mounted at `/attendance`).
- **Internal State & Hooks**:
  ```typescript
  export const AttendanceView: React.FC = () => {
    const { user, hasRole, assignedCourseIds } = useAuth();
    
    // Core parameters
    const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'attendance' | 'staff_absences'>('attendance');
    const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);

    // Course list query
    const { courses, isLoadingCourses, errorCourses } = useCourses({
      userRole: user?.role,
      assignedCourseIds: user?.role === 'profesor' ? assignedCourseIds : undefined,
    });

    // Auto-select first available course if none selected
    useEffect(() => {
      if (!selectedCourseId && courses.length > 0) {
        setSelectedCourseId(courses[0].id);
      }
    }, [courses, selectedCourseId]);

    const currentCourse = useMemo(() => 
      courses.find(c => c.id === selectedCourseId) || null,
      [courses, selectedCourseId]
    );

    // Attendance state & mutations hook
    const {
      attendanceState,
      validation,
      isLocked,
      isSubmitted,
      isLoadingRecord,
      isSaving,
      updatePresentesVarones,
      updatePresentesMujeres,
      updateAusentesVarones,
      updateAusentesMujeres,
      updateObservaciones,
      quickFillAllPresent,
      quickFillAllAbsent,
      autoCompleteAbsents,
      saveAttendance,
      staffAbsences,
      createStaffAbsence,
      deleteStaffAbsence,
    } = useAttendance({
      course: currentCourse,
      date: selectedDate,
      userRole: user?.role,
      userId: user?.id,
    });
  ```
- **Layout Architecture**:
  - **Header Bar**: Title ("Carga de Asistencia Diaria"), Role Badge, Shift Indicator, Tab Switcher ("Asistencia de Alumnos" / "Ausencias de Personal").
  - **Responsive Grid**:
    - Desktop (`lg:grid lg:grid-cols-12 lg:gap-8`):
      - Left Sidebar (`lg:col-span-4 space-y-6`): `DateSelector`, `CourseSelector`.
      - Right Main Panel (`lg:col-span-8 space-y-6`): `CourseHeaderCard`, `AttendanceForm`, `DisparityAlert`, `ObservacionesField`, and Staff Absences quick badge.
    - Mobile (`flex flex-col space-y-4`): Vertically stacked with sticky action bar.

---

### 3.2 `CourseSelector.tsx` (Course Selector)
- **Path**: `src/components/attendance/CourseSelector.tsx`
- **Purpose**: Searchable, categorized course list allowing fast switching between divisions with visual indicators for technical orientation, shift, and enrollment count.
- **Props Specification**:
  ```typescript
  export interface CourseSelectorProps {
    courses: Course[];
    selectedCourseId: string | null;
    onSelectCourse: (courseId: string) => void;
    isLoading?: boolean;
    userRole?: AppRole;
    className?: string;
  }
  ```
- **Component Features**:
  1. **Search Input**: Live filter matching course name (e.g. `"6° 1ª"` or `"6 1"`), orientation (`"TECQU"`, `"Química"`), or shift.
  2. **Cycle & Orientation Grouping**: Groups courses by Ciclo Básico, Ciclo Superior, and Ciclo Especial.
  3. **Visual Badges**:
     - `TECQU` (Cyan): "Técnico Químico"
     - `TECMM` (Amber): "Maestro Mayor de Obra"
     - `TECET` (Blue): "Electromecánica"
     - `C.TEC.MMO` (Orange): "Ciclo Técnico MMO"
     - `basico` (Slate): "Ciclo Básico"
  4. **Shift Pill**: `TM` (Mañana), `TT` (Tarde), `TV` (Vespertino).
  5. **Empty State Handling**:
     - For `profesor` with 0 assigned courses: Renders an institutional prompt: *"No tiene cursos asignados para la carga de asistencia. Solicite la asignación a la Dirección o Preceptoría."*
     - For search query with no matches: *"No se encontraron cursos coincidentes."*
  6. **Ergonomics**: Mobile dropdown `<select>` option or compact scrollable pill list; Desktop rich card list.

---

### 3.3 `CourseHeaderCard.tsx` (Course Display Card)
- **Path**: `src/components/attendance/CourseHeaderCard.tsx`
- **Purpose**: High-visibility institutional card anchoring the attendance form. Shows official enrollment numbers ($I_V, I_M, I_T$), orientation badges, submission status, and submitter attribution.
- **Props Specification**:
  ```typescript
  export interface CourseHeaderCardProps {
    course: Course;
    shiftName?: string;
    isSubmitted?: boolean;
    submittedAt?: string | null;
    submittedByName?: string | null;
    isLocked?: boolean;
    className?: string;
  }
  ```
- **Visual Anatomy & Metric Grid**:
  ```
  +-------------------------------------------------------------------------------+
  |  6° 1ª División — Ciclo Superior               [ TECQU ] [ Turno Vespertino ]  |
  |  E.E.S.T. N° 3 "Ntra. Sra. de la Merced"       Estado: [ Registrado ✓ ]       |
  +-------------------------------------------------------------------------------+
  |   MATRÍCULA OFICIAL REGISTRADA (INSCRIPTOS)                                   |
  |   +-----------------------+-----------------------+-----------------------+   |
  |   |   VARONES (I_V)       |   MUJERES (I_M)       |   TOTAL ALUMNOS (I_T) |   |
  |   |        11             |         4             |          15           |   |
  |   +-----------------------+-----------------------+-----------------------+   |
  |   Última actualización: 20/08/2026 19:45 hs • Por: Prof. Carlos Química       |
  +-------------------------------------------------------------------------------+
  ```
- **Zero-Female Course Handling** (e.g. `5° 4ª`, `6° 4ª`, `7° 4ª` TECET):
  - Displays $I_M = 0$ clearly with a neutral muted badge.
  - Automatically helps the form lock female inputs to 0.

---

### 3.4 `AttendanceForm.tsx` (Core Dual-Gender Form)
- **Path**: `src/components/attendance/AttendanceForm.tsx`
- **Purpose**: Interactive data entry grid for $P_V, P_M, A_V, A_M$, live totals $P_T, A_T$, live $\%A$, quick-fill helpers, and submit triggers.
- **Props Specification**:
  ```typescript
  export interface AttendanceFormProps {
    course: Course;
    date: string;
    presentesVarones: number | '';
    presentesMujeres: number | '';
    ausentesVarones: number | '';
    ausentesMujeres: number | '';
    observaciones: string;
    validation: ValidationResult;
    isLocked: boolean;
    isSubmitted: boolean;
    isSaving: boolean;
    onChangePresentesVarones: (val: number | '') => void;
    onChangePresentesMujeres: (val: number | '') => void;
    onChangeAusentesVarones: (val: number | '') => void;
    onChangeAusentesMujeres: (val: number | '') => void;
    onChangeObservaciones: (val: string) => void;
    onQuickFillAllPresent: () => void;
    onQuickFillAllAbsent: () => void;
    onAutoCompleteAbsents: () => void;
    onSubmit: () => Promise<void>;
    className?: string;
  }
  ```

#### Live Calculation Invariants & Formulas
1. **Presentes Total**:
   $$P_T = (P_V \text{ as number} \ge 0 ? P_V : 0) + (P_M \text{ as number} \ge 0 ? P_M : 0)$$
2. **Ausentes Total**:
   $$A_T = (A_V \text{ as number} \ge 0 ? A_V : 0) + (A_M \text{ as number} \ge 0 ? A_M : 0)$$
3. **Total Matrícula Ingresada**:
   $$M_{\text{ingresada}} = P_T + A_T$$
4. **Live Attendance Percentage**:
   $$\%A = \begin{cases} \text{round}\left(\frac{P_T}{I_T} \times 100, 2\right) & \text{if } I_T > 0 \\ 0.00 & \text{if } I_T = 0 \end{cases}$$
5. **Real-time Disparity Deltas**:
   $$\Delta_V = (P_V + A_V) - I_V \qquad \text{and} \qquad \Delta_M = (P_M + A_M) - I_M$$

#### Dual-Gender Interactive Matrix UI
```
+-------------------------------------------------------------------------------+
|  ASISTENCIA DUAL-GÉNERO                                                       |
|                                                                               |
|  [ BOTONES DE AUTOCOMPLETADO RÁPIDO ]                                          |
|  [ ✓ Todos Presentes ]  [ ✕ Todos Ausentes ]  [ ⚡ Autocompletar Ausentes ]   |
|                                                                               |
|  +-----------------------------------+-----------------------------------+    |
|  |           VARONES (I_V = 11)      |          MUJERES (I_M = 4)        |    |
|  +-----------------------------------+-----------------------------------+    |
|  |  Presentes (P_V):                 |  Presentes (P_M):                 |    |
|  |  [  10  ]                         |  [   4  ]                         |    |
|  |                                   |                                   |    |
|  |  Ausentes (A_V):                  |  Ausentes (A_M):                  |    |
|  |  [   1  ]                         |  [   0  ]                         |    |
|  |                                   |                                   |    |
|  |  Suma Varones: 11 / 11 (✓ OK)     |  Suma Mujeres: 4 / 4 (✓ OK)       |    |
|  +-----------------------------------+-----------------------------------+    |
|                                                                               |
|  RESUMEN CALCULADO EN TIEMPO REAL:                                            |
|  • Presentes Totales (P_T): 14 / 15                                           |
|  • Ausentes Totales (A_T): 1 / 15                                             |
|  • Porcentaje de Asistencia (%A): 93.33%                                      |
|  • Paridad: [ ✓ VERIFICADO: P + A = I ]                                       |
|                                                                               |
|  OBSERVACIONES / NOVEDADES DEL CURSO:                                         |
|  [ 3 alumnos retirados antes por examen técnico...                         ]  |
|                                                                               |
|  [ GUARDAR ASISTENCIA ]  (Deshabilitado si hay disparidad o fecha bloqueada)  |
+-------------------------------------------------------------------------------+
```

#### Quick-Fill Helper Algorithms (F-06)
1. **`onQuickFillAllPresent()`**:
   - Sets $P_V = I_V$
   - Sets $P_M = I_M$
   - Sets $A_V = 0$
   - Sets $A_M = 0$
   - Result: $100\%$ attendance, $\Delta_V = 0, \Delta_M = 0$.
2. **`onQuickFillAllAbsent()`**:
   - Sets $P_V = 0$
   - Sets $P_M = 0$
   - Sets $A_V = I_V$
   - Sets $A_M = I_M$
   - Result: $0\%$ attendance, $\Delta_V = 0, \Delta_M = 0$.
3. **`onAutoCompleteAbsents()`**:
   - Reads current $P_V$ and $P_M$.
   - Computes $A_V = \max(0, I_V - (P_V \text{ or } 0))$.
   - Computes $A_M = \max(0, I_M - (P_M \text{ or } 0))$.
   - Instantly resolves pending absent counts without requiring mental subtraction.

---

### 3.5 `ValidationBadge.tsx` and `DisparityAlert.tsx` (Real-Time Live Parity)

#### `ValidationBadge.tsx`
- **Path**: `src/components/attendance/ValidationBadge.tsx`
- **Purpose**: Compact visual badge providing immediate feedback on whether the form state satisfies mathematical invariants.
- **Props Specification**:
  ```typescript
  export interface ValidationBadgeProps {
    validation: ValidationResult;
    isSubmitted?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
  }
  ```
- **Visual States**:
  - `isValid === true`: Emerald/Green badge with `CheckCircle2` icon:
    `"Paridad Verificada (P + A = I)"`
  - `isValid === false` (has input): Rose/Red badge with `AlertCircle` icon:
    `"Disparidad en Matrícula"`
  - Incomplete / Zero state: Slate/Neutral badge with `Info` icon:
    `"Pendiente de Carga"`

#### `DisparityAlert.tsx`
- **Path**: `src/components/attendance/DisparityAlert.tsx`
- **Purpose**: Diagnostic warning banner shown dynamically when $\Delta_V \neq 0$ or $\Delta_M \neq 0$. Prevents accidental submission and guides the user to resolve discrepancies.
- **Props Specification**:
  ```typescript
  export interface DisparityAlertProps {
    validation: ValidationResult;
    inscriptosV: number;
    inscriptosM: number;
    presentesV: number;
    presentesM: number;
    ausentesV: number;
    ausentesM: number;
    className?: string;
  }
  ```
- **Diagnostic Logic & Message Composition**:
  ```typescript
  export const DisparityAlert: React.FC<DisparityAlertProps> = ({
    validation,
    inscriptosV,
    inscriptosM,
    presentesV,
    presentesM,
    ausentesV,
    ausentesM,
    className = '',
  }) => {
    if (validation.isValid) return null;

    const messages: string[] = [];

    if (!validation.varonesValid) {
      const sumV = presentesV + ausentesV;
      const diffV = Math.abs(validation.varonesDisparity);
      if (validation.varonesDisparity < 0) {
        messages.push(`Varones: Faltan ${diffV} alumno(s) para completar los ${inscriptosV} inscriptos (Suma actual: ${sumV}).`);
      } else {
        messages.push(`Varones: Sobran ${diffV} alumno(s) (Suma actual: ${sumV} de ${inscriptosV} inscriptos).`);
      }
    }

    if (!validation.mujeresValid) {
      const sumM = presentesM + ausentesM;
      const diffM = Math.abs(validation.mujeresDisparity);
      if (validation.mujeresDisparity < 0) {
        messages.push(`Mujeres: Faltan ${diffM} alumna(s) para completar las ${inscriptosM} inscriptas (Suma actual: ${sumM}).`);
      } else {
        messages.push(`Mujeres: Sobran ${diffM} alumna(s) (Suma actual: ${sumM} de ${inscriptosM} inscriptas).`);
      }
    }

    return (
      <div className={`p-4 rounded-xl border border-rose-200 bg-rose-50/90 text-rose-950 shadow-xs ${className}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-bold text-rose-900">
              No se puede guardar el parte diario: Existe una discrepancia matemática
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-xs text-rose-800">
              {messages.map((msg, idx) => (
                <li key={idx} className="font-medium">{msg}</li>
              ))}
            </ul>
            <p className="text-[11px] text-rose-700 mt-1">
              * Recuerde que la suma de Presentes + Ausentes debe coincidir de forma independiente para cada género.
            </p>
          </div>
        </div>
      </div>
    );
  };
  ```

---

### 3.6 `DateSelector.tsx` (Date Picker & Historical Lockout)
- **Path**: `src/components/attendance/DateSelector.tsx`
- **Purpose**: Institutional date selector with day navigation, "Hoy" shortcut, ISO date validation, and past date lockout warnings.
- **Props Specification**:
  ```typescript
  export interface DateSelectorProps {
    selectedDate: string; // 'YYYY-MM-DD'
    onSelectDate: (date: string) => void;
    userRole?: AppRole;
    isLocked?: boolean;
    className?: string;
  }
  ```
- **Rules & Interactions**:
  1. Defaults to `getTodayString()` ($YYYY-MM-DD$).
  2. "Hoy" Button: Snaps calendar back to current date.
  3. `<` / `>` Buttons: Decrement or increment selected date by 1 day.
  4. Max Date constraint: Cannot pick future dates ($date > today$).
  5. **Historical Lockout Banner (F-07)**:
     - When `userRole === 'profesor'` and `selectedDate < getTodayString()`, renders an amber warning banner:
       ```
       ⚠️ MODO SOLO LECTURA
       La fecha seleccionada (20/08/2026) es anterior a la fecha actual.
       Como docente puede visualizar los datos registrados pero no modificarlos.
       Para solicitar correcciones comuníquese con el equipo directivo.
       ```
     - For `administrador`, renders an admin notice:
       ```
       🛡️ MODO EDICIÓN DIRECTIVA
       Editando fecha histórica con permisos de administrador.
       ```

---

### 3.7 `StaffAbsenceForm.tsx` (Modal / Subform for Staff Absences)
- **Path**: `src/components/attendance/StaffAbsenceForm.tsx`
- **Purpose**: Modal and subform for logging and viewing absent teachers and auxiliaries (*Ausencias de Docentes y Auxiliares*).
- **Props Specification**:
  ```typescript
  export interface StaffAbsenceFormProps {
    isOpen: boolean;
    onClose: () => void;
    shiftId: string;
    shiftCode: ShiftCode;
    date: string;
    absences: StaffAbsence[];
    courses: Course[];
    onSaveAbsence: (absence: CreateStaffAbsenceParams) => Promise<void>;
    onDeleteAbsence: (absenceId: string) => Promise<void>;
    canManage: boolean; // Preceptors and Admins
    className?: string;
  }
  ```
- **Form Fields & Validation**:
  - `staff_name`: Text (Required). Label: "Nombre y Apellido del Agente".
  - `role_type`: Radio toggle (Required): `'Docente'` | `'Auxiliar'`.
  - `subject_or_area`: Text (Optional for Auxiliar, Recommended for Docente). Label: "Materia / Taller / Área".
  - `course_id`: Dropdown (Optional). Allows linking absence to a specific course if relevant.
  - `reason`: Text / Dropdown (e.g. "Licencia Médica Art. 114 a-1", "Fuerza Mayor", "Comisión de Servicio", "Asuntos Particulares").
  - `observations`: Textarea (Optional).
- **Embedded Absences List**:
  - Displays logged absences for the active shift and date.
  - Delete button with confirmation for authorized users.

---

### 3.8 `ObservacionesField.tsx` (Incidents & Notes Field)
- **Path**: `src/components/attendance/ObservacionesField.tsx`
- **Purpose**: Free-text textarea for recording daily course incidents, early student departures, workshop notes, or disciplinary remarks.
- **Props Specification**:
  ```typescript
  export interface ObservacionesFieldProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    maxLength?: number; // Default 500
    placeholder?: string;
    className?: string;
  }
  ```
- **Features**:
  - Live character counter: `[ ${value.length} / 500 caracteres ]`.
  - Full Unicode / diacritics support (accents, ñ).
  - Clean styling with focus ring matching institutional blue.

---

## 4. Hook Architecture: `src/hooks/useAttendance.ts`

To decouple the presentation layer from Supabase / API operations, M3 relies on `useAttendance.ts`.

### Hook Contract Specification
```typescript
export interface UseAttendanceOptions {
  course: Course | null;
  date: string;
  userRole?: AppRole;
  userId?: string;
}

export interface UseAttendanceReturn {
  // Current Form Values
  presentesVarones: number | '';
  presentesMujeres: number | '';
  ausentesVarones: number | '';
  ausentesMujeres: number | '';
  observaciones: string;
  
  // Computed Totals & Validation
  presentesTotal: number;
  ausentesTotal: number;
  attendancePercentage: number;
  validation: ValidationResult;

  // Metadata & State
  attendanceRecord: AttendanceRecord | null;
  isSubmitted: boolean;
  isLocked: boolean;
  isLoadingRecord: boolean;
  isSaving: boolean;
  error: string | null;

  // Mutation Handlers
  updatePresentesVarones: (val: number | '') => void;
  updatePresentesMujeres: (val: number | '') => void;
  updateAusentesVarones: (val: number | '') => void;
  updateAusentesMujeres: (val: number | '') => void;
  updateObservaciones: (val: string) => void;
  
  // Quick-Fill Helpers
  quickFillAllPresent: () => void;
  quickFillAllAbsent: () => void;
  autoCompleteAbsents: () => void;
  resetForm: () => void;
  
  // API Actions
  saveAttendance: () => Promise<AttendanceRecord>;
  
  // Staff Absences
  staffAbsences: StaffAbsence[];
  isLoadingAbsences: boolean;
  createStaffAbsence: (params: CreateStaffAbsenceParams) => Promise<StaffAbsence>;
  deleteStaffAbsence: (id: string) => Promise<void>;
}
```

---

## 5. Service Architecture: `src/services/attendanceService.ts`

Communicates with Supabase database tables (`attendance_records`, `staff_absences`, `courses`, `course_assignments`).

### Method Signatures
```typescript
export interface AttendanceService {
  getAttendanceByCourseAndDate(
    courseId: string, 
    date: string
  ): Promise<AttendanceRecord | null>;

  upsertAttendanceRecord(
    record: SubmitAttendanceParams & {
      course_id: string;
      shift_id: string;
      submitted_by: string;
      inscriptos_varones_snapshot: number;
      inscriptos_mujeres_snapshot: number;
    }
  ): Promise<AttendanceRecord>;

  getStaffAbsencesByShiftAndDate(
    shiftId: string, 
    date: string
  ): Promise<StaffAbsence[]>;

  createStaffAbsence(
    params: CreateStaffAbsenceParams & { shift_id: string; created_by: string }
  ): Promise<StaffAbsence>;

  deleteStaffAbsence(
    absenceId: string
  ): Promise<void>;

  getCoursesForUser(
    userId: string,
    role: AppRole,
    shiftId?: string
  ): Promise<Course[]>;
}
```

---

## 6. Responsive UX Specifications & Tailwind Design Tokens

### 6.1 Mobile Viewport (375px — Android / iPhone)
1. **Touch Target Size**:
   - All input boxes, quick-fill buttons, and submit buttons must have `min-h-[44px]` and `min-w-[44px]`.
2. **Numeric Input Ergonomics**:
   - `<input type="number" inputMode="numeric" pattern="[0-9]*" min="0" />` triggers the native numeric keypad on mobile devices without decimal points.
   - Text inputs utilize auto-select on focus (`onFocus={(e) => e.target.select()}`) so teachers can overwrite values in a single keystroke.
3. **Sticky Bottom Action Bar**:
   ```html
   <div class="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 z-30 sm:hidden">
     <div class="flex items-center justify-between gap-3">
       <ValidationBadge validation={validation} size="sm" />
       <Button 
         variant="primary" 
         size="md" 
         disabled={!validation.isValid || isLocked || isSaving}
         isLoading={isSaving}
         onClick={onSubmit}
         className="w-1/2"
       >
         {isSubmitted ? 'Actualizar' : 'Guardar'}
       </Button>
     </div>
   </div>
   ```
4. **Padding & Overflow**:
   - `px-3 py-4 max-w-full overflow-x-hidden` prevents any horizontal viewport scroll.

### 6.2 Desktop Viewport (1280px+)
1. **Side-by-Side Dual Column Grid**:
   - Left Panel (`w-1/3` or `col-span-4`): Sticky Sidebar with Course Selector and Date Picker.
   - Right Panel (`w-2/3` or `col-span-8`): Course Header Card, Dual-Gender Attendance Form, Quick Actions, Disparity Alert, Observaciones, and Staff Absences widget.
2. **Key Shortcut Support**:
   - `Tab` / `Shift+Tab`: Clean natural navigation order ($P_V \rightarrow P_M \rightarrow A_V \rightarrow A_M \rightarrow \text{Observaciones} \rightarrow \text{Guardar}$).
   - `Ctrl+Enter` / `Cmd+Enter`: Submits form if valid.

---

## 7. Accessibility (a11y) & Edge Cases

### 7.1 Accessibility Standards
- **ARIA Attributes**:
  - `aria-invalid={!validation.isValid}` on disparate input fields.
  - `aria-describedby="disparity-error"` linking input to the disparity explanation.
  - `role="alert"` on `DisparityAlert` for live screen reader announcements.
- **Color Contrast**:
  - All text meets WCAG AA standards (minimum 4.5:1 ratio against background).
  - Red error text uses `text-rose-900` over `bg-rose-50` (ratio > 7:1).
  - Green validation text uses `text-emerald-900` over `bg-emerald-50`.

### 7.2 Exhaustive Edge Case Matrix
| Edge Case | Behavior / Resolution |
|---|---|
| **Zero-female cohort** ($I_M = 0$, e.g. `5° 4ª TECET`) | Female inputs disabled/locked to 0. Entering $P_M > 0$ or $A_M > 0$ triggers disparity alert. Form is valid with $P_V + A_V = I_V$ and $P_M = 0, A_M = 0$. |
| **Zero-male cohort** ($I_V = 0$) | Male inputs locked to 0. Valid with $P_M + A_M = I_M$ and $P_V = 0, A_V = 0$. |
| **100% Attendance** ($P_T = I_T, A_T = 0$) | Percentage computes $100.00\%$ cleanly without math errors. |
| **0% Attendance** ($P_T = 0, A_T = I_T$) | Percentage computes $0.00\%$ cleanly without divide-by-zero errors. |
| **Compensating Errors** ($P_V=10/11, P_M=5/4$) | Hard blocked. Total is 15/15, but per-gender validation fails. |
| **Negative Input** ($P_V = -1$) | Sanitized to 0 or rejected with "Los valores no pueden ser negativos". |
| **Decimal Input** ($P_V = 10.5$) | Sanitized to integer or rejected with "Los valores deben ser números enteros". |
| **Past Date Selection** | Read-only mode activated for `profesor`; inputs disabled; banner displayed. |
| **Future Date Selection** | Calendar picker disables dates $> \text{today}$. |
| **No Assigned Courses** | Informational empty state card with guidance to contact administration. |

---

## 8. Implementation Roadmap for M3 Worker

1. **Step 1: Services & Hooks**
   - Create `src/services/attendanceService.ts` with mock & Supabase adapters.
   - Create `src/hooks/useCourses.ts` and `src/hooks/useAttendance.ts`.
2. **Step 2: Atom & Molecule Components**
   - Create `src/components/attendance/ValidationBadge.tsx`
   - Create `src/components/attendance/DisparityAlert.tsx`
   - Create `src/components/attendance/ObservacionesField.tsx`
   - Create `src/components/attendance/DateSelector.tsx`
   - Create `src/components/attendance/CourseHeaderCard.tsx`
3. **Step 3: Organisms & Subforms**
   - Create `src/components/attendance/CourseSelector.tsx`
   - Create `src/components/attendance/StaffAbsenceForm.tsx`
   - Create `src/components/attendance/AttendanceForm.tsx`
4. **Step 4: View Integration & Route Connection**
   - Create `src/components/attendance/AttendanceView.tsx` and barrel export `src/components/attendance/index.ts`.
   - Update `src/App.tsx` replacing `AttendanceViewPlaceholder` with `<AttendanceView />`.
5. **Step 5: Verification & E2E Validation**
   - Run Tier 1 test runner (`npx tsx tests/runner/index.ts --tier=1`) and Tier 2 boundary tests (`npx tsx tests/runner/index.ts --tier=2`).
