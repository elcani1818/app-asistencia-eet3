## 2026-08-20T14:28:12Z
You are Worker 2 for Milestone 1 (M1: Database & Auth Engine).
Your working directory is: d:\CanY\PROYECTOS CANY\App colegio\.agents\m1_worker_2

Master Blueprint: d:\CanY\PROYECTOS CANY\App colegio\PROJECT.md
Target File: d:\CanY\PROYECTOS CANY\App colegio\supabase\migrations\20260820000000_m1_database_and_auth.sql

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your Task:
Apply Challenger 1's precision audit trail fix in `supabase/migrations/20260820000000_m1_database_and_auth.sql`:
In table `public.attendance_audit_logs` (around line 184):
Change `attendance_id UUID REFERENCES public.attendance_records(id) ON DELETE CASCADE,` to `attendance_id UUID,` (or `attendance_id UUID REFERENCES public.attendance_records(id) ON DELETE SET NULL,`, with recommendation `attendance_id UUID` so that when `AFTER DELETE` triggers fire, logging the deletion of an attendance record never triggers a foreign key constraint violation, and deleting records preserves full historical audit logs).

Verify that `fn_attendance_audit` works seamlessly for INSERT, UPDATE, and DELETE.
Document your changes in `d:\CanY\PROYECTOS CANY\App colegio\.agents\m1_worker_2\changes.md` and `handoff.md`.
Send a message to parent when complete.
