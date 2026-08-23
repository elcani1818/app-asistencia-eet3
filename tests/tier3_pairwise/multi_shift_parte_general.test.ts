import { describe, it, expect, beforeAll } from '../runner/framework';
import { createTestHarness, TestHarness, getTodayString } from '../harness/harness';
import { UserSession } from '../harness/types';

describe('Tier 3: Pairwise Flow - Multi-Shift Parte General Aggregation & Isolation', () => {
  let harness: TestHarness;
  let adminSession: UserSession;
  let preceptorTM: UserSession;
  let preceptorTV: UserSession;

  beforeAll(async () => {
    harness = await createTestHarness({ adapter: 'mock' });
    adminSession = await harness.createAdminActor();
    preceptorTM = await harness.createPreceptorActor('manana');
    preceptorTV = await harness.createPreceptorActor('vespertino');
  });

  it('T3-PAIR-07: Instant shift switcher tab toggles between TM, TT, TV with zero state leakage', async () => {
    const today = getTodayString();
    const start = Date.now();

    const repTM = await harness.adapter.getShiftParteGeneral(today, 'manana');
    const repTT = await harness.adapter.getShiftParteGeneral(today, 'tarde');
    const repTV = await harness.adapter.getShiftParteGeneral(today, 'vespertino');

    const duration = Date.now() - start;

    expect(duration).toBeLessThan(500);
    expect(repTM.courses.length).toBe(12);
    expect(repTT.courses.length).toBe(12);
    expect(repTV.courses.length).toBe(10);
  });

  it('T3-PAIR-08: Whole-School Consolidated calculation correctly aggregates 842 students across 34 courses', async () => {
    const today = getTodayString();
    const repTM = await harness.adapter.getShiftParteGeneral(today, 'manana');
    const repTT = await harness.adapter.getShiftParteGeneral(today, 'tarde');
    const repTV = await harness.adapter.getShiftParteGeneral(today, 'vespertino');

    const totalInscriptos = repTM.totals.inscriptos_t + repTT.totals.inscriptos_t + repTV.totals.inscriptos_t;
    const totalCourses = repTM.totals.total_courses_count + repTT.totals.total_courses_count + repTV.totals.total_courses_count;

    expect(totalInscriptos).toBe(842);
    expect(totalCourses).toBe(34);
  });

  it('T3-PAIR-09: Staff absences in Turno Vespertino do not appear in Turno Mañana or Turno Tarde panels', async () => {
    const today = getTodayString();
    await harness.adapter.recordStaffAbsence(preceptorTV, {
      date: today,
      shift_code: 'vespertino',
      staff_name: 'Prof. Exclusivo TV',
      role_type: 'Docente'
    });

    const tmAbs = await harness.adapter.getStaffAbsences('shift-tm', today);
    const ttAbs = await harness.adapter.getStaffAbsences('shift-tt', today);
    const tvAbs = await harness.adapter.getStaffAbsences('shift-tv', today);

    expect(tvAbs.some(a => a.staff_name === 'Prof. Exclusivo TV')).toBe(true);
    expect(tmAbs.some(a => a.staff_name === 'Prof. Exclusivo TV')).toBe(false);
    expect(ttAbs.some(a => a.staff_name === 'Prof. Exclusivo TV')).toBe(false);
  });

  it('T3-PAIR-10: Concurrent submission of multiple courses resolves without race conditions or data loss', async () => {
    const today = getTodayString();
    const teacherTM = await harness.createTeacherActor('1° 1ª');
    const teacherTV = await harness.createTeacherActor('7° 4ª');

    await Promise.all([
      harness.adapter.submitAttendance(teacherTM, {
        courseName: '1° 1ª',
        date: today,
        presentes_v: 17,
        ausentes_v: 1,
        presentes_m: 12,
        ausentes_m: 0
      }),
      harness.adapter.submitAttendance(teacherTV, {
        courseName: '7° 4ª',
        date: today,
        presentes_v: 8,
        ausentes_v: 0,
        presentes_m: 0,
        ausentes_m: 0
      })
    ]);

    const repTM = await harness.adapter.getShiftParteGeneral(today, 'manana');
    const repTV = await harness.adapter.getShiftParteGeneral(today, 'vespertino');

    const cTM = repTM.courses.find(c => c.course_name.includes('1° 1ª'));
    const cTV = repTV.courses.find(c => c.course_name.includes('7° 4ª'));

    expect(cTM!.is_submitted).toBe(true);
    expect(cTV!.is_submitted).toBe(true);
    expect(cTM!.presentes_t).toBe(29);
    expect(cTV!.presentes_t).toBe(8);
  });
}, 3);
