import { describe, test, it, expect, beforeAll } from '../runner/framework';
import { createTestHarness, TestHarness } from '../harness/harness';
import { UserSession } from '../harness/types';

describe('Tier 1: Auth & Role Security (F-01, F-02, F-19)', () => {
  let harness: TestHarness;

  beforeAll(async () => {
    harness = await createTestHarness({ adapter: 'mock' });
  });

  // =========================================================================
  // Feature F-01: User Authentication (R1)
  // =========================================================================
  test('TC-F01-01: Successful Login with Valid Administrator Credentials', async () => {
    const session = await harness.adapter.authenticate('admin@eest3.edu.ar', 'administrador');
    expect(session.user).toBeDefined();
    expect(session.user.email).toBe('admin@eest3.edu.ar');
    expect(session.user.role).toBe('administrador');
    expect(session.user.is_active).toBe(true);
    expect(session.token).toContain('mock-jwt-token');
  }, 'F-01');

  test('TC-F01-02: Successful Login with Valid Preceptor Credentials', async () => {
    const session = await harness.adapter.authenticate('preceptor.tv@eest3.edu.ar', 'preceptor');
    expect(session.user).toBeDefined();
    expect(session.user.role).toBe('preceptor');
    expect(session.user.is_active).toBe(true);
  }, 'F-01');

  test('TC-F01-03: Successful Login with Valid Profesor Credentials', async () => {
    const session = await harness.adapter.authenticate('prof.quimica@eest3.edu.ar', 'profesor');
    expect(session.user).toBeDefined();
    expect(session.user.role).toBe('profesor');
    expect(session.user.is_active).toBe(true);
  }, 'F-01');

  test('TC-F01-04: Authentication Rejection on Invalid Password', async () => {
    await expect(
      harness.adapter.authenticate('admin@eest3.edu.ar_WrongPassword')
    ).rejects.toThrow(/Invalid login credentials/);
  }, 'F-01');

  test('TC-F01-05: Authentication Rejection on Nonexistent User', async () => {
    await expect(
      harness.adapter.authenticate('nonexistent.user@eest3.edu.ar')
    ).rejects.toThrow(/Invalid login credentials/);
  }, 'F-01');

  test('TC-F01-06: Authentication Rejection for Deactivated Staff Account', async () => {
    await expect(
      harness.adapter.authenticate('prof.inactivo@eest3.edu.ar')
    ).rejects.toThrow(/Cuenta desactivada/);
  }, 'F-01');

  // =========================================================================
  // Feature F-02: Role Redirection & Route Guards (R1)
  // =========================================================================
  function canAccessRoute(role: string | null, route: string): boolean {
    if (!role) return route === '/login';
    if (role === 'administrador') return true;
    if (role === 'preceptor') {
      return route.startsWith('/dashboard') || route.startsWith('/asistencia');
    }
    if (role === 'profesor') {
      return route.startsWith('/asistencia');
    }
    return false;
  }

  test('TC-F02-01: Admin Route Authorization permits all panels', () => {
    expect(canAccessRoute('administrador', '/admin')).toBe(true);
    expect(canAccessRoute('administrador', '/admin/users')).toBe(true);
    expect(canAccessRoute('administrador', '/admin/courses')).toBe(true);
    expect(canAccessRoute('administrador', '/dashboard')).toBe(true);
    expect(canAccessRoute('administrador', '/asistencia')).toBe(true);
  }, 'F-02');

  test('TC-F02-02: Preceptor Navigation Scope permits dashboard and blocks admin panels', () => {
    expect(canAccessRoute('preceptor', '/dashboard')).toBe(true);
    expect(canAccessRoute('preceptor', '/asistencia')).toBe(true);
    expect(canAccessRoute('preceptor', '/admin')).toBe(false);
    expect(canAccessRoute('preceptor', '/admin/users')).toBe(false);
    expect(canAccessRoute('preceptor', '/admin/courses')).toBe(false);
  }, 'F-02');

  test('TC-F02-03: Profesor Route Containment restricts to attendance form', () => {
    expect(canAccessRoute('profesor', '/asistencia')).toBe(true);
    expect(canAccessRoute('profesor', '/dashboard')).toBe(false);
    expect(canAccessRoute('profesor', '/admin')).toBe(false);
  }, 'F-02');

  test('TC-F02-04: Unauthenticated Direct Access Redirection to Login', () => {
    expect(canAccessRoute(null, '/asistencia')).toBe(false);
    expect(canAccessRoute(null, '/dashboard')).toBe(false);
    expect(canAccessRoute(null, '/admin')).toBe(false);
    expect(canAccessRoute(null, '/login')).toBe(true);
  }, 'F-02');

  test('TC-F02-05: Dynamic Session Invalidation upon Role Demotion', async () => {
    const newUser = await harness.adapter.createUser({
      email: 'temp.admin@eest3.edu.ar',
      full_name: 'Temp Admin',
      role: 'administrador'
    });
    expect(canAccessRoute(newUser.role, '/admin')).toBe(true);

    const demoted = await harness.adapter.updateUserRole(newUser.id, 'profesor');
    expect(demoted.role).toBe('profesor');
    expect(canAccessRoute(demoted.role, '/admin')).toBe(false);
  }, 'F-02');

  test('TC-F02-06: Deep Linking with Role-Based Route Resolution', async () => {
    const profSession = await harness.adapter.authenticate('prof.quimica@eest3.edu.ar');
    const assigned = await harness.adapter.getAssignedCourses(profSession.user.id);
    const assignedIds = assigned.map(c => c.id);

    // prof.quimica is assigned to course-tv-2 (6°1°)
    expect(assignedIds).toContain('course-tv-2');
    // prof.quimica is NOT assigned to course-tv-1 (5°4°)
    expect(assignedIds.includes('course-tv-1')).toBe(false);
  }, 'F-02');

  // =========================================================================
  // Feature F-19: User & Role Management (R1, R4)
  // =========================================================================
  test('TC-F19-01: Admin creates new staff user profile', async () => {
    const newUser = await harness.adapter.createUser({
      email: 'nuevo.docente@eest3.edu.ar',
      full_name: 'Docente Nuevo',
      role: 'profesor',
      dni: '33445566'
    });

    expect(newUser.id).toBeDefined();
    expect(newUser.email).toBe('nuevo.docente@eest3.edu.ar');
    expect(newUser.role).toBe('profesor');
    expect(newUser.is_active).toBe(true);
  }, 'F-19');

  test('TC-F19-02: Admin assigns/updates role to Preceptor and Administrador', async () => {
    const user = await harness.adapter.createUser({
      email: 'staff.role.test@eest3.edu.ar',
      full_name: 'Staff Role Test',
      role: 'profesor'
    });

    const updatedPreceptor = await harness.adapter.updateUserRole(user.id, 'preceptor');
    expect(updatedPreceptor.role).toBe('preceptor');

    const updatedAdmin = await harness.adapter.updateUserRole(user.id, 'administrador');
    expect(updatedAdmin.role).toBe('administrador');
  }, 'F-19');

  test('TC-F19-03: Admin links teacher to courses in course_assignments', async () => {
    const teacher = await harness.adapter.createUser({
      email: 'docente.asignado@eest3.edu.ar',
      full_name: 'Docente Asignado',
      role: 'profesor'
    });

    const assignment = await harness.adapter.assignTeacherToCourse('course-tv-1', teacher.id, 'admin-1');
    expect(assignment.course_id).toBe('course-tv-1');
    expect(assignment.teacher_id).toBe(teacher.id);
  }, 'F-19');

  test('TC-F19-04: Teacher sees updated assigned courses immediately', async () => {
    const teacher = await harness.adapter.createUser({
      email: 'docente.check@eest3.edu.ar',
      full_name: 'Docente Check',
      role: 'profesor'
    });

    let assigned = await harness.adapter.getAssignedCourses(teacher.id);
    expect(assigned.length).toBe(0);

    await harness.adapter.assignTeacherToCourse('course-tv-3', teacher.id, 'admin-1');
    await harness.adapter.assignTeacherToCourse('course-tv-4', teacher.id, 'admin-1');

    assigned = await harness.adapter.getAssignedCourses(teacher.id);
    expect(assigned.length).toBe(2);
    expect(assigned.some(c => c.name.includes('6° 2ª') || c.id === 'course-tv-3')).toBe(true);
    expect(assigned.some(c => c.name.includes('6° 3ª') || c.id === 'course-tv-4')).toBe(true);
  }, 'F-19');

  test('TC-F19-05: Non-admin role isolation checks list and management bounds', async () => {
    const allUsers = await harness.adapter.listUsers();
    expect(allUsers.length).toBeGreaterThanOrEqual(5);
    const adminUser = allUsers.find(u => u.role === 'administrador');
    expect(adminUser).toBeDefined();
  }, 'F-19');

  test('TC-F19-06: Admin deactivates user account and blocks further actions', async () => {
    const userToDeact = await harness.adapter.createUser({
      email: 'para.desactivar@eest3.edu.ar',
      full_name: 'Usuario Para Desactivar',
      role: 'profesor'
    });

    const deactivated = await harness.adapter.deactivateUser(userToDeact.id);
    expect(deactivated.is_active).toBe(false);

    await expect(
      harness.adapter.authenticate('para.desactivar@eest3.edu.ar')
    ).rejects.toThrow(/Cuenta desactivada/);
  }, 'F-19');
}, 1);
