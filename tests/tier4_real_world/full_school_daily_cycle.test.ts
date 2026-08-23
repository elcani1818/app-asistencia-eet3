import { describe, it, expect, beforeAll } from '../runner/framework';
import { createTestHarness, TestHarness, getTodayString } from '../harness/harness';
import { UserSession } from '../harness/types';
import referenceData from '../fixtures/reference_tv.json';
import schoolStructure from '../fixtures/school_structure.json';

describe('Tier 4: Real-World Multi-Shift School Workload Simulation', () => {
  let harness: TestHarness;
  let adminSession: UserSession;
  let preceptorTM: UserSession;
  let preceptorTT: UserSession;
  let preceptorTV: UserSession;

  beforeAll(async () => {
    harness = await createTestHarness({ adapter: 'mock' });
    adminSession = await harness.createAdminActor();
    preceptorTM = await harness.createPreceptorActor('manana');
    preceptorTT = await harness.createPreceptorActor('tarde');
    preceptorTV = await harness.createPreceptorActor('vespertino');
  });

  it('T4-SIM-01: Full School Master Catalog Bootstrap (34 Courses, 842 Students)', async () => {
    const allCourses = await harness.adapter.getCourses();
    expect(allCourses.length).toBe(34);

    const tm = allCourses.filter(c => c.shift_id === 'shift-tm');
    const tt = allCourses.filter(c => c.shift_id === 'shift-tt');
    const tv = allCourses.filter(c => c.shift_id === 'shift-tv');

    expect(tm.length).toBe(12);
    expect(tt.length).toBe(12);
    expect(tv.length).toBe(10);

    const sumT = allCourses.reduce((acc, c) => acc + c.inscriptos_total, 0);
    expect(sumT).toBe(842);
  });

  it('T4-SIM-02: Turno Mañana Phase Execution (12 Courses, 340 Students, 2 Staff Absences)', async () => {
    const today = getTodayString();
    const tmCourses = await harness.adapter.getCourses('shift-tm');

    // Simulate 12 teachers submitting attendance
    for (const c of tmCourses) {
      const pv = Math.max(0, c.inscriptos_varones - 1);
      const av = c.inscriptos_varones - pv;
      const pm = Math.max(0, c.inscriptos_mujeres - 1);
      const am = c.inscriptos_mujeres - pm;

      await harness.adapter.submitAttendance(adminSession, {
        course_id: c.id,
        date: today,
        presentes_v: pv,
        ausentes_v: av,
        presentes_m: pm,
        ausentes_m: am,
        observaciones: `TM ${c.name} entregado`
      });
    }

    // Preceptor logs 2 absences
    await harness.adapter.recordStaffAbsence(preceptorTM, {
      date: today,
      shift_code: 'manana',
      staff_name: 'Prof. Pérez TM',
      role_type: 'Docente',
      reason: 'Art 114 a-1'
    });
    await harness.adapter.recordStaffAbsence(preceptorTM, {
      date: today,
      shift_code: 'manana',
      staff_name: 'Aux. Gómez TM',
      role_type: 'Auxiliar',
      reason: 'Fuerza Mayor'
    });

    const reportTM = await harness.adapter.getShiftParteGeneral(today, 'manana');
    expect(reportTM.totals.submitted_courses_count).toBe(12);
    expect(reportTM.totals.inscriptos_t).toBe(340);
    expect(reportTM.staff_absences.length).toBe(2);
  });

  it('T4-SIM-03: Turno Tarde Phase Execution (12 Courses, 330 Students, 1 Staff Absence)', async () => {
    const today = getTodayString();
    const ttCourses = await harness.adapter.getCourses('shift-tt');

    for (const c of ttCourses) {
      const pv = Math.max(0, c.inscriptos_varones - 1);
      const av = c.inscriptos_varones - pv;
      const pm = Math.max(0, c.inscriptos_mujeres - 1);
      const am = c.inscriptos_mujeres - pm;

      await harness.adapter.submitAttendance(adminSession, {
        course_id: c.id,
        date: today,
        presentes_v: pv,
        ausentes_v: av,
        presentes_m: pm,
        ausentes_m: am,
        observaciones: `TT ${c.name} entregado`
      });
    }

    await harness.adapter.recordStaffAbsence(preceptorTT, {
      date: today,
      shift_code: 'tarde',
      staff_name: 'Prof. Rossi TT',
      role_type: 'Docente',
      reason: 'Licencia Médica'
    });

    const reportTT = await harness.adapter.getShiftParteGeneral(today, 'tarde');
    expect(reportTT.totals.submitted_courses_count).toBe(12);
    expect(reportTT.totals.inscriptos_t).toBe(330);
    expect(reportTT.staff_absences.length).toBe(1);
  });

  it('T4-SIM-04: Turno Vespertino Phase Execution (10 Courses Matching CSV, 172 Students)', async () => {
    const today = getTodayString();

    for (const c of referenceData.courses) {
      const dbCourse = await harness.adapter.getCourseByName(c.name);
      expect(dbCourse).toBeDefined();

      const pv = c.sample_presentes_v;
      const av = c.inscriptos_v - pv;
      const pm = c.sample_presentes_m;
      const am = c.inscriptos_m - pm;

      await harness.adapter.submitAttendance(adminSession, {
        course_id: dbCourse!.id,
        date: today,
        presentes_v: pv,
        ausentes_v: av,
        presentes_m: pm,
        ausentes_m: am,
        observaciones: c.sample_obs
      });
    }

    await harness.adapter.recordStaffAbsence(preceptorTV, {
      date: today,
      shift_code: 'vespertino',
      staff_name: 'Prof. Martínez TV',
      role_type: 'Docente',
      reason: 'Art 115'
    });

    const reportTV = await harness.adapter.getShiftParteGeneral(today, 'vespertino');
    expect(reportTV.totals.submitted_courses_count).toBe(10);
    expect(reportTV.totals.inscriptos_v).toBe(119);
    expect(reportTV.totals.inscriptos_m).toBe(53);
    expect(reportTV.totals.inscriptos_t).toBe(172);
    expect(reportTV.totals.presentes_t).toBe(155);
    expect(reportTV.totals.ausentes_t).toBe(17);
    expect(reportTV.totals.porcentaje_asistencia_general).toBe(90.12);
  });

  it('T4-SIM-05: Whole-School Consolidation (34/34 Courses Submitted, 100% Data Integrity)', async () => {
    const today = getTodayString();
    const repTM = await harness.adapter.getShiftParteGeneral(today, 'manana');
    const repTT = await harness.adapter.getShiftParteGeneral(today, 'tarde');
    const repTV = await harness.adapter.getShiftParteGeneral(today, 'vespertino');

    const totalSubmitted = repTM.totals.submitted_courses_count + repTT.totals.submitted_courses_count + repTV.totals.submitted_courses_count;
    const totalEnrolled = repTM.totals.inscriptos_t + repTT.totals.inscriptos_t + repTV.totals.inscriptos_t;
    const totalPresentes = repTM.totals.presentes_t + repTT.totals.presentes_t + repTV.totals.presentes_t;
    const totalAusentes = repTM.totals.ausentes_t + repTT.totals.ausentes_t + repTV.totals.ausentes_t;

    expect(totalSubmitted).toBe(34);
    expect(totalEnrolled).toBe(842);
    expect(totalPresentes + totalAusentes).toBe(842);
  });
}, 4);
