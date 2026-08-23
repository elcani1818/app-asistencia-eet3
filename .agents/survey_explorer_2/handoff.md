# Handoff Report — Backend & Database Architecture
**Agent**: survey_explorer_2 (Backend & Database Architecture Specialist)  
**Date**: 2026-08-20  
**Handoff Type**: Hard (Investigation & Design Survey Complete)  

---

## 1. Observation

1. **`ORIGINAL_REQUEST.md` (Lines 10–30)**:
   - "Reference data — the current paper-based attendance form for the evening shift (turno vespertino) is available as a CSV file at `d:\CanY\PROYECTOS CANY\App colegio\PARTE GENERALES TV.xlsx - T.V.csv`."
   - School structure defined: Three shifts (Mañana, Tarde, Vespertino). Ciclo Básico (1°-3°), Ciclo Superior (4°-7° with TECQU, TECMM, TECET orientations), and Ciclo Técnico Especial (1°1ª C.TEC.MMO).
   - "Validation prevents submission where Presentes + Ausentes ≠ Inscriptos for either gender (V or M)."
   - "A teacher can edit their submission for the current day; past days are read-only."
   - Three roles: Administrador, Preceptor, Profesor.

2. **`PARTE GENERALES TV.xlsx - T.V.csv` (Lines 9–25)**:
   - 10 active courses for Turno Vespertino:
     - Line 11: `5º4º, TECET, 8, -, 8`
     - Line 12: `6º1º, TECQU, 11, 4, 15`
     - Line 13: `6º2º, TECMM, 9, 14, 23`
     - Line 14: `6º3º, TECET, 23, 2, 25`
     - Line 15: `6º4º, TECET, 6, -, 6`
     - Line 16: `7º1º, TECQU, 5, 8, 13`
     - Line 17: `7º2º, TECMM, 9, 9, 18`
     - Line 18: `7º3º, TECET, 20, 9, 29`
     - Line 19: `7º4º, TECET, 8, -, 8`
     - Line 20: `1° 1°, C.TEC.MMO, 20, 7, 27`
     - Line 23: `TOTAL: 119 Varones, 53 Mujeres, 172 Total`
     - Lines 24–25: `OBSERVACIONES` and `AUSENTE DE DOCENTES Y AUXILIARES`.

3. **Supabase Environment & MCP Toolset**:
   - Supabase tools are available in the MCP registry (`C:\Users\el_ca\.gemini\antigravity\mcp\supabase`).
   - The interactive permission prompt timed out as expected during non-interactive autonomous exploration; full DDL, RLS, triggers, views, and seed data scripts have been formalized directly into `analysis.md` for zero-friction execution.

---

## 2. Logic Chain

1. **Role Separation & Authentication**:
   - *Observation 1* establishes three distinct roles (`administrador`, `preceptor`, `profesor`).
   - *Reasoning*: A 1:1 linked `public.profiles` table referencing `auth.users(id) ON DELETE CASCADE` with custom enum `app_role` provides clean integration with Supabase Auth, while `SECURITY DEFINER` functions (`is_admin()`, `is_preceptor()`, `is_assigned_to_course()`) prevent RLS policy recursion.

2. **Data Integrity & Immutability**:
   - *Observation 1* requires $V + M = T$ and $\text{Presentes} + \text{Ausentes} = \text{Inscriptos}$.
   - *Reasoning*: Enforcing totals as `GENERATED ALWAYS AS (varones + mujeres) STORED` columns guarantees that database records, client displays, and exports are mathematically identical and immune to frontend formatting discrepancies.
   - *Reasoning*: A PostgreSQL `BEFORE INSERT OR UPDATE` trigger `trg_validate_and_snapshot_attendance` validates the $\text{Presentes} + \text{Ausentes} = \text{Inscriptos}$ rule per gender at the database engine level and snapshots enrollment numbers so historical records remain true even if course enrollment changes later.

3. **Course & Shift Organization**:
   - *Observations 1 & 2* define the exact course lists and orientations.
   - *Reasoning*: Three shifts (`shifts`) support independent course catalogues (`courses`). Vespertino is seeded with the exact 10 courses and 172 enrolled students from the CSV. Mañana and Tarde are seeded with the standard technical school structure (1°–3° basic divisions, 4°–7° technical divisions).

4. **Row Level Security (RLS)**:
   - *Observation 1* states that teachers can only view/submit their assigned courses on the current date, whereas preceptors and admins have broader oversight.
   - *Reasoning*: The attendance RLS policies enforce `is_assigned_to_course(course_id)` AND `date = CURRENT_DATE` for non-admin/non-preceptor users during write operations. Admins retain full CRUD privileges.

5. **Aggregation & Paper Form Replication**:
   - *Observation 2* shows the layout of the paper Parte General including absent staff.
   - *Reasoning*: A PostgreSQL function `fn_get_shift_parte_general(p_date, p_shift_code)` computes the tabular grid, summary totals, and absent staff in a single roundtrip JSONB payload for rapid rendering and PDF/Excel generation.

---

## 3. Caveats

1. **Enrollment for Mañana and Tarde**:
   - The CSV only contained enrollment counts for Turno Vespertino. Mañana and Tarde courses have been initialized in the seed script with 0 inscriptos and are ready for the administrator to populate via the UI.
2. **Current Date Timezone**:
   - The database triggers and default dates use `CURRENT_DATE` / `timezone('utc'::text, now())`. For schools in Argentina (UTC-3), the server time should be handled in `America/Argentina/Buenos_Aires` or converted accordingly in client submissions.

---

## 4. Conclusion

The complete PostgreSQL / Supabase database architecture is fully designed, documented, and ready for deployment:
- **Schema & DDL**: Complete tables (`shifts`, `profiles`, `courses`, `course_assignments`, `attendance_records`, `staff_absences`, `attendance_audit_logs`).
- **Data Protection**: Full Row Level Security (RLS) policies and security functions.
- **Triggers**: Automatic profile creation, validation of attendance sums, enrollment snapshotting, and audit logging.
- **Seed Scripts**: Turno Vespertino seeded with exact 10 CSV courses (172 total inscriptos); Turnos Mañana and Tarde seeded with standard 1°–7° curriculum.
- **Reporting**: Stored procedures for daily Parte General aggregation and attendance trend analytics.

All artifacts are detailed in `d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_2\analysis.md`.

---

## 5. Verification Method

To verify the schema design and integrity rules independently:
1. Inspect `d:\CanY\PROYECTOS CANY\App colegio\.agents\survey_explorer_2\analysis.md` to review the DDL, RLS policies, triggers, and seed data.
2. Verify Vespertino course counts against `d:\CanY\PROYECTOS CANY\App colegio\PARTE GENERALES TV.xlsx - T.V.csv`:
   - 10 courses, 119 Varones, 53 Mujeres, 172 Total Inscriptos.
3. Test trigger behavior in Supabase SQL editor or local PostgreSQL instance:
   - Inserting attendance with $\text{Presentes} + \text{Ausentes} \neq \text{Inscriptos}$ raises a validation error.
   - Teacher query attempting to insert past date or unassigned course is blocked by RLS.
