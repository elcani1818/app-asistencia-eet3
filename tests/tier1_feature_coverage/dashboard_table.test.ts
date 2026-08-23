import { describe, test, it, expect, beforeAll } from '../runner/framework';
import {
  createTestHarness,
  TestHarness,
  calculateShiftTotals,
  calculatePartialShiftTotals,
  getTodayString
} from '../harness/harness';
import { UserSession, AttendanceRecord } from '../harness/types';

describe('Tier 1: Dashboard, Reporting & Realtime (F-10..F-14, F-20)', () => {
  let harness: TestHarness;
  let adminSession: UserSession;
  let preceptorSession: UserSession;
  let teacherSession: UserSession;

  beforeAll(async () => {
    harness = await createTestHarness({ adapter: 'mock' });
    adminSession = await harness.createAdminActor();
    preceptorSession = await harness.createPreceptorActor('vespertino');
    teacherSession = await harness.getPredefinedTeacher('prof.quimica@eest3.edu.ar');
  });

  // =========================================================================
  // Feature F-10: Shift Switcher Tabs (R3)
  // =========================================================================
  test('TC-F10-01: Instant Tab Switching Between 3 Shifts', async () => {
    const shifts = await harness.adapter.getShifts();
    expect(shifts.length).toBe(3);
    expect(shifts.map(s => s.code)).toEqual(['manana', 'tarde', 'vespertino']);
  }, 'F-10');

  test('TC-F10-02: Vespertino Tab Filters Exactly to 10 Vespertino Courses', async () => {
    const report = await harness.adapter.getShiftParteGeneral(getTodayString(), 'vespertino');
    expect(report.courses.length).toBe(10);
    expect(report.shift_code).toBe('vespertino');
  }, 'F-10');

  test('TC-F10-03: Mañana Tab Displays Mañana Catalog Exclusively', async () => {
    const report = await harness.adapter.getShiftParteGeneral(getTodayString(), 'manana');
    expect(report.courses.length).toBe(12);
    expect(report.shift_code).toBe('manana');
  }, 'F-10');

  test('TC-F10-04: Tarde Tab Displays Tarde Catalog Exclusively', async () => {
    const report = await harness.adapter.getShiftParteGeneral(getTodayString(), 'tarde');
    expect(report.courses.length).toBe(12);
    expect(report.shift_code).toBe('tarde');
  }, 'F-10');

  test('TC-F10-05: Shift Isolation for Course Lists', async () => {
    const tmCourses = await harness.adapter.getCourses('shift-tm');
    const tvCourses = await harness.adapter.getCourses('shift-tv');
    const overlap = tmCourses.filter(tm => tvCourses.some(tv => tv.id === tm.id));
    expect(overlap.length).toBe(0);
  }, 'F-10');

  test('TC-F10-06: Date Context Preservation Across Tab Switches', async () => {
    const date = '2026-08-15';
    const repTM = await harness.adapter.getShiftParteGeneral(date, 'manana');
    const repTV = await harness.adapter.getShiftParteGeneral(date, 'vespertino');
    expect(repTM.date).toBe(date);
    expect(repTV.date).toBe(date);
  }, 'F-10');

  // =========================================================================
  // Feature F-11: Official 11-Column Daily Summary Table (R3)
  // =========================================================================
  test('TC-F11-01: Table Renders Exact 11 Official Columns Matching Paper Template', async () => {
    const report = await harness.adapter.getShiftParteGeneral(getTodayString(), 'vespertino');
    const row = report.courses[0];

    // Verify presence of all 11 column values
    expect(row.course_name).toBeDefined();
    expect(row.orientation !== undefined).toBe(true);
    expect(row.inscriptos_v).toBeDefined();
    expect(row.inscriptos_m).toBeDefined();
    expect(row.inscriptos_t).toBeDefined();
    expect(row.presentes_v).toBeDefined();
    expect(row.presentes_m).toBeDefined();
    expect(row.presentes_t).toBeDefined();
    expect(row.ausentes_v).toBeDefined();
    expect(row.ausentes_m).toBeDefined();
    expect(row.ausentes_t).toBeDefined();
  }, 'F-11');

  test('TC-F11-02: Strict Course Sorting Order', async () => {
    const report = await harness.adapter.getShiftParteGeneral(getTodayString(), 'vespertino');
    const courseNames = report.courses.map(c => c.course_name);
    expect(courseNames[0]).toContain('5° 4ª');
    expect(courseNames[1]).toContain('6° 1ª');
    expect(courseNames[courseNames.length - 1]).toContain('1° 1ª C.TEC.MMO');
  }, 'F-11');

  test('TC-F11-03: Unsubmitted Course Placeholder Rendering', async () => {
    const report = await harness.adapter.getShiftParteGeneral('2026-01-01', 'vespertino');
    const unsubmitted = report.courses.find(c => !c.is_submitted);
    expect(unsubmitted).toBeDefined();
    expect(unsubmitted!.presentes_t).toBe(0);
    expect(unsubmitted!.is_submitted).toBe(false);
  }, 'F-11');

  test('TC-F11-04: Submitted Course Accurate Value Rendering', async () => {
    const today = getTodayString();
    await harness.adapter.submitAttendance(teacherSession, {
      courseName: '6° 1ª',
      date: today,
      presentes_v: 10,
      ausentes_v: 1,
      presentes_m: 4,
      ausentes_m: 0
    });

    const report = await harness.adapter.getShiftParteGeneral(today, 'vespertino');
    const row = report.courses.find(c => c.course_name.includes('6° 1ª'));
    expect(row!.is_submitted).toBe(true);
    expect(row!.presentes_v).toBe(10);
    expect(row!.presentes_m).toBe(4);
    expect(row!.presentes_t).toBe(14);
    expect(row!.ausentes_v).toBe(1);
    expect(row!.ausentes_m).toBe(0);
    expect(row!.ausentes_t).toBe(1);
  }, 'F-11');

  test('TC-F11-05: Visual Status Badging (Completo vs Pendiente)', async () => {
    const today = getTodayString();
    const report = await harness.adapter.getShiftParteGeneral(today, 'vespertino');
    expect(report.totals.total_courses_count).toBe(10);
    expect(report.totals.submitted_courses_count).toBeGreaterThanOrEqual(1);
  }, 'F-11');

  test('TC-F11-06: Technical Orientation Column Fidelity', async () => {
    const report = await harness.adapter.getShiftParteGeneral(getTodayString(), 'vespertino');
    const quimicaRow = report.courses.find(c => c.course_name.includes('6° 1ª'));
    const mmoRow = report.courses.find(c => c.course_name.includes('6° 2ª'));
    const elecRow = report.courses.find(c => c.course_name.includes('6° 3ª'));

    expect(quimicaRow!.orientation).toBe('TECQU');
    expect(mmoRow!.orientation).toBe('TECMM');
    expect(elecRow!.orientation).toBe('TECET');
  }, 'F-11');

  // =========================================================================
  // Feature F-12: Bottom Totals Row & Shift Percentage (R3)
  // =========================================================================
  test('TC-F12-01: Baseline Inscriptos Summation for Vespertino (119 + 53 = 172)', async () => {
    const report = await harness.adapter.getShiftParteGeneral(getTodayString(), 'vespertino');
    expect(report.totals.inscriptos_v).toBe(119);
    expect(report.totals.inscriptos_m).toBe(53);
    expect(report.totals.inscriptos_t).toBe(172);
  }, 'F-12');

  test('TC-F12-02: Presentes Column Summation (Sigma P_V, Sigma P_M, Sigma P_T)', () => {
    const rows = [
      { inscriptos_v: 11, inscriptos_m: 4, inscriptos_t: 15, presentes_v: 10, presentes_m: 4, presentes_t: 14, ausentes_v: 1, ausentes_m: 0, ausentes_t: 1 },
      { inscriptos_v: 9, inscriptos_m: 14, inscriptos_t: 23, presentes_v: 8, presentes_m: 12, presentes_t: 20, ausentes_v: 1, ausentes_m: 2, ausentes_t: 3 }
    ];
    const totals = calculateShiftTotals(rows);
    expect(totals.presentesV).toBe(18);
    expect(totals.presentesM).toBe(16);
    expect(totals.presentesT).toBe(34);
  }, 'F-12');

  test('TC-F12-03: Ausentes Column Summation (Sigma A_V, Sigma A_M, Sigma A_T)', () => {
    const rows = [
      { inscriptos_v: 11, inscriptos_m: 4, inscriptos_t: 15, presentes_v: 10, presentes_m: 4, presentes_t: 14, ausentes_v: 1, ausentes_m: 0, ausentes_t: 1 },
      { inscriptos_v: 9, inscriptos_m: 14, inscriptos_t: 23, presentes_v: 8, presentes_m: 12, presentes_t: 20, ausentes_v: 1, ausentes_m: 2, ausentes_t: 3 }
    ];
    const totals = calculateShiftTotals(rows);
    expect(totals.ausentesV).toBe(2);
    expect(totals.ausentesM).toBe(2);
    expect(totals.ausentesT).toBe(4);
  }, 'F-12');

  test('TC-F12-04: Overall Totals Conservation Invariant (Sigma P_T + Sigma A_T = Sigma I_T)', () => {
    const rows = [
      { inscriptos_v: 11, inscriptos_m: 4, inscriptos_t: 15, presentes_v: 10, presentes_m: 4, presentes_t: 14, ausentes_v: 1, ausentes_m: 0, ausentes_t: 1 },
      { inscriptos_v: 9, inscriptos_m: 14, inscriptos_t: 23, presentes_v: 8, presentes_m: 12, presentes_t: 20, ausentes_v: 1, ausentes_m: 2, ausentes_t: 3 }
    ];
    const totals = calculateShiftTotals(rows);
    expect(totals.presentesT + totals.ausentesT).toBe(totals.inscriptosT);
  }, 'F-12');

  test('TC-F12-05: Shift Overall Attendance Percentage Calculation', () => {
    const rows = [
      { inscriptos_v: 119, inscriptos_m: 53, inscriptos_t: 172, presentes_v: 107, presentes_m: 48, presentes_t: 155, ausentes_v: 12, ausentes_m: 5, ausentes_t: 17 }
    ];
    const totals = calculateShiftTotals(rows);
    expect(totals.porcentajeAsistencia).toBe(90.12);
  }, 'F-12');

  test('TC-F12-06: Partial Shift Submission Totals Calculation', () => {
    const rows = [
      { inscriptos_v: 10, inscriptos_m: 10, inscriptos_t: 20, presentes_v: 9, presentes_m: 9, presentes_t: 18, ausentes_v: 1, ausentes_m: 1, ausentes_t: 2, is_submitted: true },
      { inscriptos_v: 10, inscriptos_m: 10, inscriptos_t: 20, presentes_v: 0, presentes_m: 0, presentes_t: 0, ausentes_v: 0, ausentes_m: 0, ausentes_t: 0, is_submitted: false }
    ];
    const partial = calculatePartialShiftTotals(rows);
    expect(partial.submittedCount).toBe(1);
    expect(partial.pendingCount).toBe(1);
    expect(partial.submittedInscriptosT).toBe(20);
    expect(partial.presentesT).toBe(18);
    expect(partial.porcentajeSubmitted).toBe(90.0);
  }, 'F-12');

  // =========================================================================
  // Feature F-13: Attendance Trend Charts (R3)
  // =========================================================================
  test('TC-F13-01: Time-Series Attendance Percentage Chart Rendering', async () => {
    const trends = await harness.adapter.getAttendanceTrends({
      startDate: '2026-08-14',
      endDate: '2026-08-20',
      shiftCode: 'vespertino'
    });

    expect(trends.length).toBe(7);
    expect(trends[0].date).toBe('2026-08-14');
    expect(trends[6].date).toBe('2026-08-20');
  }, 'F-13');

  test('TC-F13-02: Chart Filtering by Specific Shift', async () => {
    const tvTrends = await harness.adapter.getAttendanceTrends({
      startDate: '2026-08-19',
      endDate: '2026-08-20',
      shiftCode: 'vespertino'
    });
    expect(tvTrends.length).toBe(2);
    expect(tvTrends.every(t => t.shift_code === 'vespertino')).toBe(true);
  }, 'F-13');

  test('TC-F13-03: School-Wide Consolidated Trend Aggregation', async () => {
    const allTrends = await harness.adapter.getAttendanceTrends({
      startDate: '2026-08-20',
      endDate: '2026-08-20'
    });
    expect(allTrends.length).toBe(1);
    expect(allTrends[0].inscriptos_total).toBe(842); // 340 + 330 + 172
  }, 'F-13');

  test('TC-F13-04: Trend Bounds Between 0% and 100%', async () => {
    const trends = await harness.adapter.getAttendanceTrends({
      startDate: '2026-08-20',
      endDate: '2026-08-20'
    });
    for (const p of trends) {
      expect(p.porcentaje_asistencia).toBeGreaterThanOrEqual(0);
      expect(p.porcentaje_asistencia).toBeLessThanOrEqual(100);
    }
  }, 'F-13');

  test('TC-F13-05: Empty Date Range Graceful Handling', async () => {
    const emptyTrends = await harness.adapter.getAttendanceTrends({
      startDate: '2026-08-20',
      endDate: '2026-08-19' // Inverted date
    });
    expect(emptyTrends.length).toBe(0);
  }, 'F-13');

  test('TC-F13-06: Date Formatting for Analytics X-Axis', async () => {
    const trends = await harness.adapter.getAttendanceTrends({
      startDate: '2026-08-20',
      endDate: '2026-08-20'
    });
    expect(trends[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  }, 'F-13');

  // =========================================================================
  // Feature F-14: Absent Staff Summary Panel (R3)
  // =========================================================================
  test('TC-F14-01: Summary Panel Lists All Absent Staff for Selected Date and Shift', async () => {
    const today = getTodayString();
    const absences = await harness.adapter.getStaffAbsences('shift-tv', today);
    expect(absences.length).toBeGreaterThanOrEqual(1);
  }, 'F-14');

  test('TC-F14-02: Absence Badging by Role Type (Docente vs Auxiliar)', async () => {
    const today = getTodayString();
    const absences = await harness.adapter.getStaffAbsences('shift-tv', today);
    const hasDocente = absences.some(a => a.role_type === 'Docente');
    expect(hasDocente).toBe(true);
  }, 'F-14');

  test('TC-F14-03: Absence Reason & Subject Display', async () => {
    const today = getTodayString();
    const absences = await harness.adapter.getStaffAbsences('shift-tv', today);
    const docAbsence = absences.find(a => a.role_type === 'Docente');
    if (docAbsence) {
      expect(docAbsence.subject_or_area).toBeDefined();
      expect(docAbsence.reason).toBeDefined();
    }
  }, 'F-14');

  test('TC-F14-04: Empty State Rendering When No Staff Absent', async () => {
    const absences = await harness.adapter.getStaffAbsences('shift-tv', '2025-01-01');
    expect(absences.length).toBe(0);
  }, 'F-14');

  test('TC-F14-05: Realtime Absence Removal upon Deletion', async () => {
    const today = getTodayString();
    const temp = await harness.adapter.recordStaffAbsence(preceptorSession, {
      date: today,
      shift_code: 'vespertino',
      staff_name: 'Staff Temp Abs',
      role_type: 'Auxiliar'
    });
    await harness.adapter.deleteStaffAbsence(temp.id);
    const list = await harness.adapter.getStaffAbsences('shift-tv', today);
    expect(list.some(a => a.id === temp.id)).toBe(false);
  }, 'F-14');

  test('TC-F14-06: Absent Staff Count in Daily Header', async () => {
    const today = getTodayString();
    const report = await harness.adapter.getShiftParteGeneral(today, 'vespertino');
    expect(report.staff_absences.length).toBeGreaterThanOrEqual(1);
  }, 'F-14');

  // =========================================================================
  // Feature F-20: Realtime Subscriptions & Sync (R3)
  // =========================================================================
  test('TC-F20-01: Realtime Subscription Receives New Attendance Record', async () => {
    let receivedRecord: AttendanceRecord | null = null;
    const unsubscribe = harness.adapter.subscribeToAttendance(record => {
      receivedRecord = record;
    });

    const today = getTodayString();
    await harness.adapter.submitAttendance(teacherSession, {
      courseName: '6° 1ª',
      date: today,
      presentes_v: 10,
      ausentes_v: 1,
      presentes_m: 4,
      ausentes_m: 0
    });

    expect(receivedRecord).toBeDefined();
    expect(receivedRecord!.presentes_total).toBe(14);
    unsubscribe();
  }, 'F-20');

  test('TC-F20-02: Realtime Update Triggers Shift Summary Recomputation', async () => {
    const today = getTodayString();
    const beforeReport = await harness.adapter.getShiftParteGeneral(today, 'vespertino');

    // Submit another course
    const profElectrom = await harness.getPredefinedTeacher('prof.electrom@eest3.edu.ar');
    await harness.adapter.submitAttendance(profElectrom, {
      courseName: '5° 4ª',
      date: today,
      presentes_v: 7,
      ausentes_v: 1,
      presentes_m: 0,
      ausentes_m: 0
    });

    const afterReport = await harness.adapter.getShiftParteGeneral(today, 'vespertino');
    expect(afterReport.totals.submitted_courses_count).toBeGreaterThanOrEqual(beforeReport.totals.submitted_courses_count);
  }, 'F-20');

  test('TC-F20-03: Realtime Multiple Subscribers Broadcast Isolation', async () => {
    let count1 = 0;
    let count2 = 0;
    const unsub1 = harness.adapter.subscribeToAttendance(() => { count1++; });
    const unsub2 = harness.adapter.subscribeToAttendance(() => { count2++; });

    const today = getTodayString();
    await harness.adapter.submitAttendance(teacherSession, {
      courseName: '6° 1ª',
      date: today,
      presentes_v: 10,
      ausentes_v: 1,
      presentes_m: 4,
      ausentes_m: 0
    });

    expect(count1).toBe(1);
    expect(count2).toBe(1);

    unsub1();
    unsub2();
  }, 'F-20');

  test('TC-F20-04: Unsubscribe Detaches Realtime Listener Cleanly', async () => {
    let calls = 0;
    const unsub = harness.adapter.subscribeToAttendance(() => { calls++; });
    unsub();

    const today = getTodayString();
    await harness.adapter.submitAttendance(teacherSession, {
      courseName: '6° 1ª',
      date: today,
      presentes_v: 10,
      ausentes_v: 1,
      presentes_m: 4,
      ausentes_m: 0
    });

    expect(calls).toBe(0);
  }, 'F-20');

  test('TC-F20-05: Realtime Broadcast Retains Complete Payload Attributes', async () => {
    let captured: AttendanceRecord | null = null;
    const unsub = harness.adapter.subscribeToAttendance(rec => { captured = rec; });

    const today = getTodayString();
    await harness.adapter.submitAttendance(teacherSession, {
      courseName: '6° 1ª',
      date: today,
      presentes_v: 10,
      ausentes_v: 1,
      presentes_m: 4,
      ausentes_m: 0,
      observaciones: 'Realtime payload test'
    });

    expect(captured).toBeDefined();
    expect(captured!.observaciones).toBe('Realtime payload test');
    expect(captured!.inscriptos_total_snapshot).toBe(15);
    unsub();
  }, 'F-20');

  test('TC-F20-06: Realtime Re-sync Under Concurrent Submissions', async () => {
    let eventCount = 0;
    const unsub = harness.adapter.subscribeToAttendance(() => { eventCount++; });

    const profElectrom = await harness.getPredefinedTeacher('prof.electrom@eest3.edu.ar');
    const today = getTodayString();

    await Promise.all([
      harness.adapter.submitAttendance(teacherSession, {
        courseName: '6° 1ª',
        date: today,
        presentes_v: 10,
        ausentes_v: 1,
        presentes_m: 4,
        ausentes_m: 0
      }),
      harness.adapter.submitAttendance(profElectrom, {
        courseName: '5° 4ª',
        date: today,
        presentes_v: 7,
        ausentes_v: 1,
        presentes_m: 0,
        ausentes_m: 0
      })
    ]);

    expect(eventCount).toBe(2);
    unsub();
  }, 'F-20');
}, 1);
