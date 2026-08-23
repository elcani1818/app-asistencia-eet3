## 2026-08-20T14:23:30Z
<USER_REQUEST>
You are Reviewer 1 for Milestone 1 (M1: Database & Auth Engine).
Your working directory is: d:\CanY\PROYECTOS CANY\App colegio\.agents\m1_reviewer_1
Master blueprint: d:\CanY\PROYECTOS CANY\App colegio\PROJECT.md
Original request: d:\CanY\PROYECTOS CANY\App colegio\ORIGINAL_REQUEST.md
Scope document: d:\CanY\PROYECTOS CANY\App colegio\.agents\sub_orch_m1\SCOPE.md
Worker handoff: d:\CanY\PROYECTOS CANY\App colegio\.agents\m1_worker_1\handoff.md

Your Task:
Review the PostgreSQL DDL schema, Tables, Extensions, Enums, Generated Columns, Security Definer Functions, and Row Level Security (RLS) Policies in:
- `supabase/migrations/20260820000000_m1_database_and_auth.sql`

Review Criteria:
1. Completeness: Are all 7 tables (`shifts`, `profiles`, `courses`, `course_assignments`, `attendance_records`, `staff_absences`, `attendance_audit_logs`) and 4 ENUMs properly defined?
2. Generated Columns: Are `courses.inscriptos_total`, `attendance_records.total_presentes`, `total_ausentes`, `total_matricula`, and `snapshot_inscriptos_total` defined as `GENERATED ALWAYS AS (...) STORED`?
3. RLS Recursion Prevention: Are helper functions (`auth_user_role()`, `is_admin()`, `is_preceptor()`, `is_assigned_to_course()`) defined as `SECURITY DEFINER STABLE` with explicit `search_path` to prevent infinite recursion on `profiles`?
4. Role Permissions: Are RLS policies for `administrador`, `preceptor`, and `profesor` correctly defined on all tables?
5. Write your detailed review and verdict (APPROVE or REQUEST_CHANGES) to `d:\CanY\PROYECTOS CANY\App colegio\.agents\m1_reviewer_1\analysis.md` and your `handoff.md`.
6. Send a message to parent when complete.
</USER_REQUEST>
