import { describe, it, expect, beforeAll } from '../runner/framework';
import { createTestHarness, TestHarness, getTodayString } from '../harness/harness';
import { UserSession } from '../harness/types';

describe('Tier 3: Pairwise Flow - Course Edit & Historical Snapshot Preservation', () => {
  let harness: TestHarness;
  let adminSession: UserSession;
  let teacherSession: UserSession;

  beforeAll(async () => {
    harness = await createTestHarness({ adapter: 'mock' });
    adminSession = await harness.createAdminActor();
    teacherSession = await harness.createTeacherActor('6° 1ª');
  });

  it('T3-PAIR-05: Course enrollment edit preserves historical attendance snapshot on Day 1', async () => {
    const day1 = '2026-08-19';

    // 1. Submit attendance for Day 1 with original enrollment (11 V, 4 M, 15 T)
    const recDay1 = await harness.adapter.submitAttendance(adminSession, {
      courseName: '6° 1ª',
      date: day1,
      presentes_v: 10,
      ausentes_v: 1,
      presentes_m: 4,
      ausentes_m: 0
    });

    expect(recDay1.inscriptos_varones_snapshot).toBe(11);
    expect(recDay1.inscriptos_mujeres_snapshot).toBe(4);
    expect(recDay1.inscriptos_total_snapshot).toBe(15);

    // 2. Admin edits course in catalog (a new student joins -> 12 V, 4 M, 16 T)
    const course = await harness.adapter.getCourseByName('6° 1ª');
    await harness.adapter.updateCourse(course!.id, {
      inscriptos_varones: 12,
      inscriptos_mujeres: 4
    });

    // 3. Verify Day 1 historical report still preserves snapshot (11 V, 4 M, 15 T)
    const reportDay1 = await harness.adapter.getShiftParteGeneral(day1, 'vespertino');
    const rowDay1 = reportDay1.courses.find(c => c.course_name.includes('6° 1ª'));

    expect(rowDay1!.inscriptos_v).toBe(11);
    expect(rowDay1!.inscriptos_m).toBe(4);
    expect(rowDay1!.inscriptos_t).toBe(15);
    expect(rowDay1!.presentes_t).toBe(14);
    expect(rowDay1!.ausentes_t).toBe(1);
  });

  it('T3-PAIR-06: New submission on Day 2 strictly enforces updated catalog baseline', async () => {
    const day2 = getTodayString();

    // 1. Attempting old sum (10 + 1 = 11) is now rejected because baseline is 12
    await expect(
      harness.adapter.submitAttendance(teacherSession, {
        courseName: '6° 1ª',
        date: day2,
        presentes_v: 10,
        ausentes_v: 1, // sum = 11 != 12
        presentes_m: 4,
        ausentes_m: 0
      })
    ).rejects.toThrow(/Inconsistencia en Varones/);

    // 2. Submitting valid sum (11 + 1 = 12) succeeds and captures new snapshot
    const recDay2 = await harness.adapter.submitAttendance(teacherSession, {
      courseName: '6° 1ª',
      date: day2,
      presentes_v: 11,
      ausentes_v: 1,
      presentes_m: 4,
      ausentes_m: 0
    });

    expect(recDay2.inscriptos_varones_snapshot).toBe(12);
    expect(recDay2.inscriptos_total_snapshot).toBe(16);

    // Clean up baseline
    const course = await harness.adapter.getCourseByName('6° 1ª');
    await harness.adapter.updateCourse(course!.id, {
      inscriptos_varones: 11,
      inscriptos_mujeres: 4
    });
  });
}, 3);
