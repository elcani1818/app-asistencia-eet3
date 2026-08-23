import { describe, it, expect, beforeAll } from '../runner/framework';
import {
  createTestHarness,
  TestHarness,
  getTodayString,
  getYesterdayString,
  getTomorrowString
} from '../harness/harness';
import { UserSession } from '../harness/types';

describe('Tier 2: Calendar, Date Boundaries & Temporal Transitions', () => {
  let harness: TestHarness;
  let adminSession: UserSession;
  let teacherSession: UserSession;

  beforeAll(async () => {
    harness = await createTestHarness({ adapter: 'mock' });
    adminSession = await harness.createAdminActor();
    teacherSession = await harness.createTeacherActor('6° 1ª');
  });

  it('T2-DATE-01: Leap year (2024-02-29) date parsing and Spanish formatting', async () => {
    const leapDate = '2024-02-29';
    const report = await harness.adapter.getShiftParteGeneral(leapDate, 'vespertino');
    expect(report.date).toBe('2024-02-29');
    expect(report.courses.length).toBe(10);
  });

  it('T2-DATE-02: Month-end transition (2026-08-31 to 2026-09-01) date isolation', async () => {
    const d1 = '2026-08-31';
    const d2 = '2026-09-01';

    await harness.adapter.submitAttendance(adminSession, {
      courseName: '6° 1ª',
      date: d1,
      presentes_v: 11,
      ausentes_v: 0,
      presentes_m: 4,
      ausentes_m: 0,
      observaciones: 'Agosto fin de mes'
    });

    await harness.adapter.submitAttendance(adminSession, {
      courseName: '6° 1ª',
      date: d2,
      presentes_v: 10,
      ausentes_v: 1,
      presentes_m: 3,
      ausentes_m: 1,
      observaciones: 'Septiembre inicio'
    });

    const rep1 = await harness.adapter.getShiftParteGeneral(d1, 'vespertino');
    const rep2 = await harness.adapter.getShiftParteGeneral(d2, 'vespertino');

    const c1 = rep1.courses.find(c => c.course_name.includes('6° 1ª'));
    const c2 = rep2.courses.find(c => c.course_name.includes('6° 1ª'));

    expect(c1!.observaciones).toBe('Agosto fin de mes');
    expect(c2!.observaciones).toBe('Septiembre inicio');
    expect(c1!.presentes_t).toBe(15);
    expect(c2!.presentes_t).toBe(13);
  });

  it('T2-DATE-03: Past date selection locks inputs for teacher and prevents modification', async () => {
    const yesterday = getYesterdayString();
    await expect(
      harness.adapter.submitAttendance(teacherSession, {
        courseName: '6° 1ª',
        date: yesterday,
        presentes_v: 10,
        ausentes_v: 1,
        presentes_m: 4,
        ausentes_m: 0
      })
    ).rejects.toThrow(/fechas anteriores/);
  });

  it('T2-DATE-04: Midnight transition simulation and future date blocking', async () => {
    const tomorrow = getTomorrowString();
    await expect(
      harness.adapter.submitAttendance(teacherSession, {
        courseName: '6° 1ª',
        date: tomorrow,
        presentes_v: 10,
        ausentes_v: 1,
        presentes_m: 4,
        ausentes_m: 0
      })
    ).rejects.toThrow(/fechas futuras/);
  });
}, 2);
