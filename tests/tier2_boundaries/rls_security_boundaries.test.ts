import { describe, it, expect, beforeAll } from '../runner/framework';
import { createTestHarness, TestHarness, getTodayString } from '../harness/harness';
import { UserSession } from '../harness/types';

describe('Tier 2: Role Escalation, Permission Boundaries & Security Attacks', () => {
  let harness: TestHarness;
  let teacherA: UserSession;
  let teacherB: UserSession;

  beforeAll(async () => {
    harness = await createTestHarness({ adapter: 'mock' });
    teacherA = await harness.createTeacherActor('6° 1ª');
    teacherB = await harness.createTeacherActor('6° 2ª');
  });

  it('T2-SEC-01: Teacher Horizontal Course Access Attack is blocked by RLS', async () => {
    // Teacher A is assigned to 6° 1ª. Attempting to submit for 6° 2ª must be rejected.
    const today = getTodayString();
    await expect(
      harness.adapter.submitAttendance(teacherA, {
        courseName: '6° 2ª',
        date: today,
        presentes_v: 8,
        ausentes_v: 1,
        presentes_m: 12,
        ausentes_m: 2
      })
    ).rejects.toThrow(/Profesor no asignado/);
  });

  it('T2-SEC-02: Teacher Horizontal Access Attack on 1° 1ª C.TEC.MMO is blocked', async () => {
    const today = getTodayString();
    await expect(
      harness.adapter.submitAttendance(teacherA, {
        courseName: '1° 1ª C.TEC.MMO',
        date: today,
        presentes_v: 18,
        ausentes_v: 2,
        presentes_m: 6,
        ausentes_m: 1
      })
    ).rejects.toThrow(/Profesor no asignado/);
  });

  it('T2-SEC-03: Deactivated User Lockout prevents authentication and actions', async () => {
    const tempUser = await harness.adapter.createUser({
      email: 'deact.attack@eest3.edu.ar',
      full_name: 'Deact Attack',
      role: 'profesor'
    });

    await harness.adapter.deactivateUser(tempUser.id);
    await expect(
      harness.adapter.authenticate('deact.attack@eest3.edu.ar')
    ).rejects.toThrow(/Cuenta desactivada/);
  });
}, 2);
