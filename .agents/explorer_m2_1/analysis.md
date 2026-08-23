# Technical Investigation & Architecture Specification: Frontend Foundation (M2)

**Project**: Sistema de Asistencia Digital y "Parte General de Alumnos"  
**Institution**: Escuela de Educación Secundaria Técnica N° 3 — "Ntra. Sra. de la Merced" (Loma Hermosa)  
**Agent**: Explorer 1 (`explorer_m2_1`)  
**Date**: 2026-08-20  
**Milestone**: M2 (Frontend Foundation, Design System, Auth & State Management Layer)

---

## 1. Executive Summary & Objective

This report establishes the complete technical foundation and configuration architecture for Milestone 2 (M2) of the E.E.S.T. N° 3 Attendance System. It provides exact, production-ready specifications and file templates for:

1. **`package.json`**: Complete production & development dependency manifests, scripts covering local development, build validation, and the 4-tier E2E test runner (`npx tsx tests/runner/index.ts`).
2. **Build & Compiler Toolchain**:
   - `vite.config.ts`: React plugin, path alias `@/` mapping to `src/`, development server settings, build optimizations.
   - `tsconfig.json` & `tsconfig.node.json`: Strict TypeScript compiler options with DOM and Node resolution.
   - `tailwind.config.js`: Institutional color tokens (`escuela-navy` #0f2942, `escuela-blue` #1e5f8a, `escuela-gold` #c59b27, `escuela-light` #f4f7fa, `escuela-border` #e2e8f0, etc.), responsive breakpoints (375px mobile to 1280px+ desktop), container centering.
   - `postcss.config.js`: Tailwind CSS and Autoprefixer pipeline.
   - `index.html`: Institutional metadata, viewport configuration, Spanish language attributes, title branding.
   - `src/index.css`: Tailwind directives, institutional typography tokens, accessible focus rings, scrollbars.
3. **Target Code Layout (`src/`)**: Clean modular hierarchy supporting Milestones M2 (Foundation & Auth), M3 (Attendance Form & Math Engine), M4 (Summary Table, Trends & Exports), and M5 (Catalog CRUD & User Admin) without requiring structural refactors.
4. **Integration & Compatibility Analysis**: Verifies seamless integration with existing M1 artifacts (`src/lib/supabase.ts`, `src/types/database.ts`, `supabase/seed.sql`) and test infrastructure (`tests/runner/index.ts`, `tests/fixtures/test_users.json`).

---

## 2. Package Manifest Specification (`package.json`)

### 2.1 Dependencies Rationale & Matrix

| Package | Version | Purpose & Milestone Mapping |
|---|---|---|
| `react` | `^18.3.1` | Core UI library for declarative component architecture (M2–M5) |
| `react-dom` | `^18.3.1` | React DOM rendering engine (M2) |
| `react-router-dom` | `^6.26.2` | Declarative client-side routing, navigation, and role-based route protection guards (M2) |
| `@supabase/supabase-js` | `^2.45.4` | Official Supabase client for Auth, Database queries, RPC calls, and Realtime WebSocket subscriptions (M1–M5) |
| `lucide-react` | `^0.441.0` | Accessible, tree-shakeable SVG icons for navigation, status indicators, and actions (M2–M5) |
| `recharts` | `^2.12.7` | High-performance SVG charts for attendance trend visualization and metrics (M4) |
| `jspdf` | `^2.5.1` | Client-side PDF generator for official "Parte General" printable documents (M4) |
| `jspdf-autotable` | `^3.8.3` | Multi-column table layout plugin with headers, sums, and styling for PDF generation (M4) |
| `xlsx` | `^0.18.5` | SheetJS Excel engine for generating formatted `.xlsx` workbooks with native `=SUM` formulas (M4) |
| `clsx` | `^2.1.1` | Utility for constructing conditional className strings (M2) |
| `tailwind-merge` | `^2.5.2` | Utility to safely merge Tailwind CSS classes without conflict (M2) |

### 2.2 DevDependencies Matrix

| Package | Version | Purpose |
|---|---|---|
| `vite` | `^5.4.6` | Modern next-generation frontend tooling and bundler |
| `@vitejs/plugin-react` | `^4.3.1` | Official Vite plugin for React Fast Refresh and JSX transformation |
| `typescript` | `^5.5.4` | Type-safe static analysis across all source code and test files |
| `@types/react` | `^18.3.8` | Type definitions for React |
| `@types/react-dom` | `^18.3.0` | Type definitions for React DOM |
| `@types/node` | `^20.16.5` | Type definitions for Node.js APIs (path, fs, buffer) |
| `tailwindcss` | `^3.4.11` | Utility-first CSS framework for responsive institutional UI |
| `postcss` | `^8.4.47` | Tool for transforming styles with JS plugins |
| `autoprefixer` | `^10.4.20` | PostCSS plugin to parse CSS and add vendor prefixes |
| `tsx` | `^4.19.1` | TypeScript execute runner for executing E2E test suites directly |

### 2.3 Proposed `package.json` File Template

```json
{
  "name": "eest3-parte-general",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "description": "Sistema Digital de Asistencia y Parte General Diario - E.E.S.T. N° 3 Ntra. Sra. de la Merced (Loma Hermosa)",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "npx tsx tests/runner/index.ts --tier=all",
    "test:tier1": "npx tsx tests/runner/index.ts --tier=1",
    "test:tier2": "npx tsx tests/runner/index.ts --tier=2",
    "test:tier3": "npx tsx tests/runner/index.ts --tier=3",
    "test:tier4": "npx tsx tests/runner/index.ts --tier=4",
    "test:e2e": "npx tsx tests/runner/index.ts --tier=all",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.4",
    "clsx": "^2.1.1",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.3",
    "lucide-react": "^0.441.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.2",
    "recharts": "^2.12.7",
    "tailwind-merge": "^2.5.2",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@types/node": "^20.16.5",
    "@types/react": "^18.3.8",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.11",
    "tsx": "^4.19.1",
    "typescript": "^5.5.4",
    "vite": "^5.4.6"
  }
}
```

---

## 3. Build Tooling & Configuration Templates

### 3.1 Vite Configuration (`vite.config.ts`)

Key requirements:
- Support React plugin with Fast Refresh.
- Resolve path alias `@/` to `<project_root>/src/` for clean imports across all modules.
- Set standard port `5173` with host listening for local/network testing.
- Configure build chunking and sourcemaps.

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    strictPort: false,
  },
  preview: {
    port: 4173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          charts: ['recharts'],
          export: ['jspdf', 'jspdf-autotable', 'xlsx'],
        },
      },
    },
  },
});
```

---

### 3.2 TypeScript Configuration (`tsconfig.json` & `tsconfig.node.json`)

#### `tsconfig.json`
Key settings:
- `target`: `"ES2022"`, `module`: `"ESNext"`, `moduleResolution`: `"Bundler"` (or `"Node"`).
- `jsx`: `"react-jsx"`.
- `strict`: `true` for maximum type safety.
- `paths`: `"@/*": ["./src/*"]`.
- Include `src` and `tests`.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolvePackageJsonExports": true,
    "resolvePackageJsonImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting / Strictness */
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,

    /* Path Aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src", "tests", "vite.config.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

#### `tsconfig.node.json`
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

---

### 3.3 PostCSS Configuration (`postcss.config.js`)

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

---

### 3.4 Tailwind CSS Configuration (`tailwind.config.js`)

The institutional visual identity of **E.E.S.T. N° 3 "Ntra. Sra. de la Merced"** is built upon official technical education tones:
- **`escuela-navy`**: Primary institutional dark navy (`#0f2942` / `#0a1c2e`). Used for header banners, main branding, table headers.
- **`escuela-blue`**: Institutional secondary blue (`#1e5f8a` / `#2574a9`). Used for active navigation links, focus rings, primary action buttons.
- **`escuela-light`**: Neutral background canvas (`#f4f7fa` / `#f8fafc`). Soft institutional gray-blue preventing eye strain.
- **`escuela-gold`**: Technical accent amber/gold (`#c59b27` / `#e5a93c`). Used for badges, technical emblems, cycle highlights.
- **`escuela-green`**: Success / Presentism green (`#16a34a` / `#22c55e`). Used for valid math indicators, high attendance tags.
- **`escuela-red`**: Disparity / Absentism red (`#dc2626` / `#ef4444`). Used for mathematical mismatch warnings, absent count tags.

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        escuela: {
          navy: {
            DEFAULT: '#0f2942',
            50: '#f0f5fa',
            100: '#d9e6f2',
            200: '#b3cee6',
            300: '#80aed4',
            400: '#4d8ec2',
            500: '#2a6fa8',
            600: '#1e5f8a',
            700: '#174a6c',
            800: '#0f2942',
            900: '#0a1c2e',
            950: '#050e17',
          },
          blue: {
            DEFAULT: '#1e5f8a',
            light: '#3b82f6',
            dark: '#174a6c',
          },
          gold: {
            DEFAULT: '#c59b27',
            light: '#e5a93c',
            dark: '#9a781b',
          },
          light: {
            DEFAULT: '#f4f7fa',
            50: '#ffffff',
            100: '#f8fafc',
            200: '#f1f5f9',
            300: '#e2e8f0',
          },
          border: '#e2e8f0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      screens: {
        'xs': '375px', // Standard mobile viewport target
      },
    },
  },
  plugins: [],
};
```

---

### 3.5 Institutional HTML Entrypoint (`index.html`)

```html
<!DOCTYPE html>
<html lang="es" class="h-full bg-escuela-light">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta name="theme-color" content="#0f2942" />
    <meta name="description" content="Sistema Digital de Asistencia y Parte General Diario - E.E.S.T. N° 3 Ntra. Sra. de la Merced (Loma Hermosa)" />
    <title>E.E.S.T. N° 3 — Parte General de Alumnos</title>
    <!-- Inter Font -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  </head>
  <body class="h-full text-slate-800 antialiased selection:bg-escuela-navy-100 selection:text-escuela-navy-900">
    <div id="root" class="h-full flex flex-col"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

### 3.6 Global Stylesheet (`src/index.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html, body {
    @apply h-full antialiased font-sans bg-escuela-light text-slate-800;
  }

  /* Improve touch targets and inputs on mobile */
  input[type="number"]::-webkit-inner-spin-button,
  input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type="number"] {
    -moz-appearance: textfield;
  }
}

@layer components {
  /* Institutional Container */
  .institutional-container {
    @apply max-w-7xl mx-auto px-3 sm:px-6 lg:px-8;
  }

  /* Institutional Card */
  .institutional-card {
    @apply bg-white rounded-xl shadow-sm border border-escuela-border transition-all duration-200;
  }

  /* Interactive Stepper Button */
  .stepper-btn {
    @apply w-11 h-11 flex items-center justify-center rounded-lg font-bold text-lg border transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed;
  }

  /* Status Badges */
  .badge-valid {
    @apply inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200;
  }

  .badge-invalid {
    @apply inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200;
  }

  .badge-pending {
    @apply inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200;
  }
}

/* Custom Scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #f1f5f9;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
```

---

## 4. Code Layout & Architecture Under `src/`

To guarantee that Milestones M2, M3, M4, and M5 evolve without code breaking or structural reorganizations, the following architecture is defined:

```
src/
├── assets/                     # Institutional logos, SVG crest, school badges
│   └── logo-eest3.svg
├── components/
│   ├── common/                 # Core Design System atoms & molecules (M2)
│   │   ├── Header.tsx          # Institutional header with crest, shift badge, date
│   │   ├── Navbar.tsx          # Responsive navbar with role pill badges & mobile drawer
│   │   ├── Button.tsx          # Institutional button with variants & loading state
│   │   ├── Input.tsx           # Accessible input with label, error message, numeric mode
│   │   ├── Card.tsx            # Standard container card with title & footer actions
│   │   ├── Badge.tsx           # Role badges, status pills, cycle tags
│   │   ├── Modal.tsx           # Accessible modal dialog
│   │   └── LoadingSpinner.tsx  # Smooth animated loader
│   ├── auth/                   # Authentication & Access Control (M2)
│   │   ├── LoginForm.tsx       # Institutional login card with demo quick-login buttons
│   │   ├── ProtectedRoute.tsx  # Route guard checking active session
│   │   ├── RoleGuard.tsx       # Route guard checking user role (/admin/*, /attendance, /dashboard)
│   │   └── ForbiddenView.tsx   # 403 Access Denied view with return button
│   ├── attendance/             # Daily Attendance Entry Module (M3)
│   │   ├── AttendanceForm.tsx  # Teacher & preceptor main attendance form
│   │   ├── CourseSelector.tsx  # Assigned course picker with orientation tags
│   │   ├── GenderCounter.tsx   # Touch steppers & numeric input for V and M
│   │   ├── ValidationBanner.tsx# Real-time disparity indicator badge
│   │   └── StaffAbsenceForm.tsx# Absent teachers & auxiliary staff subform
│   ├── dashboard/              # Daily General Report & Analytics (M4)
│   │   ├── ShiftSwitcher.tsx   # Instant tab switching (Mañana, Tarde, Vespertino, Todos)
│   │   ├── DailySummaryTable.tsx# 11-column table mirroring exact CSV paper layout
│   │   ├── TotalsRow.tsx       # Bottom table totals row with math conservation
│   │   ├── TrendCharts.tsx     # Recharts time-series & bar analytics
│   │   └── AbsentStaffPanel.tsx# Daily absent staff summary widget
│   ├── admin/                  # Catalog & User Administration (M5)
│   │   ├── CourseCatalog.tsx   # Master 34-course CRUD table
│   │   ├── CourseModal.tsx     # Add/Edit course modal with shift & enrollment
│   │   ├── UserManagement.tsx  # User list with role badges & activate/deactivate
│   │   └── TeacherAssignModal.tsx# Teacher course assignment checklist
│   └── export/                 # Document Export Controls (M4)
│       └── ExportControls.tsx  # 1-click Excel & PDF export buttons with feedback
├── contexts/                   # React Context Providers
│   ├── AuthContext.tsx         # User session, login, logout, switchDemoUser (M2)
│   └── AttendanceContext.tsx   # Active shift, selected date, realtime attendance data (M3/M4)
├── hooks/                      # Custom React Hooks
│   ├── useAuth.ts              # Hook to consume AuthContext (M2)
│   ├── useAttendance.ts        # Hook to fetch & submit attendance records (M3)
│   ├── useCourses.ts           # Hook to list & manage courses (M3/M5)
│   └── useRealtime.ts          # Hook for Supabase WebSocket subscription (M4)
├── lib/
│   ├── supabase.ts             # Typed Supabase client (M1)
│   └── constants.ts            # Institutional constants, shift times, cycle names
├── services/                   # Supabase & Backend API Service Layer
│   ├── authService.ts          # Supabase auth sign-in/out & mock fallback
│   ├── attendanceService.ts    # Attendance submissions, RPC fn_get_shift_parte_general
│   ├── courseService.ts        # Courses CRUD and teacher assignments
│   └── userService.ts          # Profiles management and role assignment
├── types/
│   ├── database.ts             # Supabase schema types generated in M1
│   └── index.ts                # Application domain models, contracts, UI types
├── utils/                      # Pure functional calculations, formatters & exporters
│   ├── calculations.ts         # Math engine: validateAttendanceRow, calculateShiftTotals
│   ├── formatters.ts           # Argentine Spanish date formatters, percentages
│   ├── excelExporter.ts        # OpenXML Excel generator with formulas (=SUM) (M4)
│   └── pdfExporter.ts          # jsPDF / autotable printable A4 generator (M4)
├── App.tsx                     # Main Router & Role Shell
├── main.tsx                    # React Entrypoint
└── index.css                   # Global styles & Tailwind
```

---

## 5. Domain Models & Calculation Engine Contracts

### 5.1 Domain Types (`src/types/index.ts`)

```typescript
export type AppRole = 'administrador' | 'preceptor' | 'profesor';
export type ShiftCode = 'manana' | 'tarde' | 'vespertino';
export type CycleType = 'basico' | 'superior' | 'tecnico_especial';
export type OrientationType = 'TECQU' | 'TECMM' | 'TECET' | 'C.TEC.MMO' | null;

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  dni?: string;
  is_active: boolean;
  assigned_course_ids?: string[];
}

export interface UserSession {
  user: UserProfile;
  token: string;
}

export interface Shift {
  id: string;
  code: ShiftCode;
  name: string;
  start_time: string;
  end_time: string;
  sort_order: number;
}

export interface Course {
  id: string;
  shift_id: string;
  name: string;
  year: number;
  division: number;
  cycle: CycleType;
  orientation: OrientationType;
  inscriptos_varones: number;
  inscriptos_mujeres: number;
  inscriptos_total: number;
  is_active: boolean;
  sort_order: number;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  course_id: string;
  shift_id: string;
  submitted_by: string;
  inscriptos_varones_snapshot: number;
  inscriptos_mujeres_snapshot: number;
  inscriptos_total_snapshot: number;
  presentes_varones: number;
  presentes_mujeres: number;
  presentes_total: number;
  ausentes_varones: number;
  ausentes_mujeres: number;
  ausentes_total: number;
  observaciones?: string;
  is_locked: boolean;
  submitted_at: string;
}

export interface StaffAbsence {
  id: string;
  date: string;
  shift_id: string;
  staff_name: string;
  role_type: string; // 'Docente' | 'Auxiliar'
  subject_or_area?: string;
  reason?: string;
  observations?: string;
  created_by: string;
}

export interface ShiftSummaryData {
  date: string;
  shift_id: string;
  shift_code: ShiftCode;
  shift_name: string;
  courses: Array<{
    course_id: string;
    course_name: string;
    year: number;
    division: number;
    cycle: CycleType;
    orientation: string | null;
    inscriptos_v: number;
    inscriptos_m: number;
    inscriptos_t: number;
    presentes_v: number;
    presentes_m: number;
    presentes_t: number;
    ausentes_v: number;
    ausentes_m: number;
    ausentes_t: number;
    porcentaje_asistencia: number;
    observaciones: string;
    is_submitted: boolean;
    is_locked: boolean;
  }>;
  totals: {
    inscriptos_v: number;
    inscriptos_m: number;
    inscriptos_t: number;
    presentes_v: number;
    presentes_m: number;
    presentes_t: number;
    ausentes_v: number;
    ausentes_m: number;
    ausentes_t: number;
    porcentaje_asistencia_general: number;
    total_courses_count: number;
    submitted_courses_count: number;
  };
  staff_absences: StaffAbsence[];
}
```

---

### 5.2 Calculation Engine (`src/utils/calculations.ts`)

```typescript
export interface ValidationResult {
  isValid: boolean;
  varonesValid: boolean;
  mujeresValid: boolean;
  totalValid: boolean;
  varonesDisparity: number; // (P_V + A_V) - I_V
  mujeresDisparity: number; // (P_M + A_M) - I_M
  errorMessage?: string;
}

export function validateAttendanceRow(
  inscriptosV: number,
  inscriptosM: number,
  presentesV: number,
  presentesM: number,
  ausentesV: number,
  ausentesM: number
): ValidationResult {
  // 1. Check non-negative inputs
  if (presentesV < 0 || presentesM < 0 || ausentesV < 0 || ausentesM < 0 ||
      inscriptosV < 0 || inscriptosM < 0) {
    return {
      isValid: false,
      varonesValid: false,
      mujeresValid: false,
      totalValid: false,
      varonesDisparity: 0,
      mujeresDisparity: 0,
      errorMessage: 'Los valores no pueden ser negativos'
    };
  }

  // 2. Check integer values
  if (!Number.isInteger(presentesV) || !Number.isInteger(presentesM) ||
      !Number.isInteger(ausentesV) || !Number.isInteger(ausentesM)) {
    return {
      isValid: false,
      varonesValid: false,
      mujeresValid: false,
      totalValid: false,
      varonesDisparity: 0,
      mujeresDisparity: 0,
      errorMessage: 'Los valores deben ser números enteros'
    };
  }

  // 3. Compute disparities
  const varonesDisparity = (presentesV + ausentesV) - inscriptosV;
  const mujeresDisparity = (presentesM + ausentesM) - inscriptosM;
  const totalDisparity = ((presentesV + presentesM) + (ausentesV + ausentesM)) - (inscriptosV + inscriptosM);

  const varonesValid = varonesDisparity === 0;
  const mujeresValid = mujeresDisparity === 0;
  const totalValid = totalDisparity === 0;
  const isValid = varonesValid && mujeresValid;

  let errorMessage: string | undefined;
  if (!isValid) {
    const errParts: string[] = [];
    if (!varonesValid) {
      if (varonesDisparity < 0) {
        errParts.push(`Varones: Faltan ${Math.abs(varonesDisparity)} para completar los ${inscriptosV} inscriptos`);
      } else {
        errParts.push(`Varones: Sobran ${varonesDisparity} (suma ${presentesV + ausentesV} de ${inscriptosV} inscriptos)`);
      }
    }
    if (!mujeresValid) {
      if (mujeresDisparity < 0) {
        errParts.push(`Mujeres: Faltan ${Math.abs(mujeresDisparity)} para completar las ${inscriptosM} inscriptas`);
      } else {
        errParts.push(`Mujeres: Sobran ${mujeresDisparity} (suma ${presentesM + ausentesM} de ${inscriptosM} inscriptas)`);
      }
    }
    errorMessage = errParts.join('; ');
  }

  return {
    isValid,
    varonesValid,
    mujeresValid,
    totalValid,
    varonesDisparity,
    mujeresDisparity,
    errorMessage
  };
}

export function calculateAttendancePercentage(presentesTotal: number, inscriptosTotal: number): number {
  if (inscriptosTotal <= 0) return 0;
  return Number(((presentesTotal / inscriptosTotal) * 100).toFixed(2));
}

export function calculateShiftTotals(rows: Array<{
  inscriptos_varones?: number;
  inscriptos_v?: number;
  inscriptos_mujeres?: number;
  inscriptos_m?: number;
  inscriptos_total?: number;
  inscriptos_t?: number;
  presentes_varones?: number;
  presentes_v?: number;
  presentes_mujeres?: number;
  presentes_m?: number;
  presentes_total?: number;
  presentes_t?: number;
  ausentes_varones?: number;
  ausentes_v?: number;
  ausentes_mujeres?: number;
  ausentes_m?: number;
  ausentes_total?: number;
  ausentes_t?: number;
}>) {
  let inscriptosV = 0;
  let inscriptosM = 0;
  let inscriptosT = 0;
  let presentesV = 0;
  let presentesM = 0;
  let presentesT = 0;
  let ausentesV = 0;
  let ausentesM = 0;
  let ausentesT = 0;

  for (const r of rows) {
    const iv = r.inscriptos_varones ?? r.inscriptos_v ?? 0;
    const im = r.inscriptos_mujeres ?? r.inscriptos_m ?? 0;
    const it = r.inscriptos_total ?? r.inscriptos_t ?? (iv + im);

    const pv = r.presentes_varones ?? r.presentes_v ?? 0;
    const pm = r.presentes_mujeres ?? r.presentes_m ?? 0;
    const pt = r.presentes_total ?? r.presentes_t ?? (pv + pm);

    const av = r.ausentes_varones ?? r.ausentes_v ?? 0;
    const am = r.ausentes_mujeres ?? r.ausentes_m ?? 0;
    const at = r.ausentes_total ?? r.ausentes_t ?? (av + am);

    inscriptosV += iv;
    inscriptosM += im;
    inscriptosT += it;

    presentesV += pv;
    presentesM += pm;
    presentesT += pt;

    ausentesV += av;
    ausentesM += am;
    ausentesT += at;
  }

  const porcentajeAsistencia = calculateAttendancePercentage(presentesT, inscriptosT);

  return {
    inscriptosV,
    inscriptosM,
    inscriptosT,
    presentesV,
    presentesM,
    presentesT,
    ausentesV,
    ausentesM,
    ausentesT,
    porcentajeAsistencia
  };
}
```

---

## 6. Spanish Date & Value Formatters (`src/utils/formatters.ts`)

```typescript
export function formatFormalSpanishDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  return `${day} de ${months[month - 1]} de ${year}`;
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function formatPercentage(val: number): string {
  return `${val.toFixed(1)}%`;
}

export function getShiftLabel(shiftCode: string): string {
  switch (shiftCode) {
    case 'manana':
      return 'Turno Mañana';
    case 'tarde':
      return 'Turno Tarde';
    case 'vespertino':
      return 'Turno Vespertino';
    default:
      return shiftCode;
  }
}
```

---

## 7. Authentication Context & Demo Accounts Specification

### 7.1 Pre-configured Demo Accounts

To enable instant verification and role simulation (admin, preceptor, teacher):

| Account Type | Email | Role | Scope |
|---|---|---|---|
| **Directivo / Admin** | `admin@eest3.edu.ar` | `administrador` | All courses, shifts, user admin, catalog CRUD, historical override |
| **Preceptor T.V.** | `preceptor.tv@eest3.edu.ar` | `preceptor` | Turno Vespertino summary table, staff absences, export, all courses |
| **Preceptor T.M.** | `preceptor.tm@eest3.edu.ar` | `preceptor` | Turno Mañana summary table, staff absences, export |
| **Preceptor T.T.** | `preceptor.tt@eest3.edu.ar` | `preceptor` | Turno Tarde summary table, staff absences, export |
| **Prof. Química** | `prof.quimica@eest3.edu.ar` | `profesor` | Assigned to `6° 1ª TECQU`, `7° 1ª TECQU`, `4° 1ª TECQU` |
| **Prof. Electromecánica** | `prof.electrom@eest3.edu.ar` | `profesor` | Assigned to `5° 4ª TECET`, `6° 3ª TECET`, `6° 4ª TECET`, `7° 3ª TECET`, `7° 4ª TECET` |
| **Prof. Construcciones** | `prof.construc@eest3.edu.ar` | `profesor` | Assigned to `6° 2ª TECMM`, `7° 2ª TECMM`, `1° 1ª C.TEC.MMO` |

---

## 8. Implementation Checklist for Worker Agent (M2)

- [ ] Write `package.json` with all specified dependencies, devDependencies, and test scripts.
- [ ] Write `vite.config.ts` with React plugin and `@/` path alias.
- [ ] Write `tsconfig.json` and `tsconfig.node.json`.
- [ ] Write `tailwind.config.js` with `escuela-navy`, `escuela-blue`, `escuela-gold`, `escuela-light`.
- [ ] Write `postcss.config.js`.
- [ ] Write `index.html` with institutional title, meta tags, and Spanish language code.
- [ ] Write `src/index.css` with Tailwind directives and component utility classes.
- [ ] Write `src/types/index.ts` with unified domain models.
- [ ] Write `src/utils/calculations.ts` and `src/utils/formatters.ts`.
- [ ] Write `src/contexts/AuthContext.tsx` and `src/hooks/useAuth.ts`.
- [ ] Write `src/components/common/` (Header, Navbar, Button, Input, Card, Badge, Modal, LoadingSpinner).
- [ ] Write `src/components/auth/` (LoginForm, ProtectedRoute, RoleGuard, ForbiddenView).
- [ ] Write `src/App.tsx` and `src/main.tsx`.
- [ ] Run full verification test suite: `npx tsx tests/runner/index.ts --tier=all`.
