import { describe, it, expect, beforeAll } from '../runner/framework';
import { createTestHarness, TestHarness, getTodayString } from '../harness/harness';
import { UserSession, AttendanceRecord } from '../harness/types';

describe('Tier 3: Pairwise Flow - Teacher Submit to Admin Realtime Sync', () => {
  let harness: TestHarness;
  let teacher61: UserSession;

  beforeAll(async () => {
    harness = await createTestHarness({ adapter: 'mock' });
    teacher61 = await harness.createTeacherActor('6° 1ª');
  });

  it('T3-PAIR-01: Teacher submission triggers instant Realtime event broadcast', async () => {
    let captured: AttendanceRecord | null = null;
    const unsub = harness.adapter.subscribeToAttendance(rec => {
      captured = rec;
    });

    const today = getTodayString();
    await harness.adapter.submitAttendance(teacher61, {
      courseName: '6° 1ª',
      date: today,
      presentes_v: 10,
      ausentes_v: 1,
      presentes_m: 4,
      ausentes_m: 0
    });

    expect(captured).toBeDefined();
    expect(captured!.presentes_total).toBe(14);
    expect(captured!.ausentes_total).toBe(1);
    unsub();
  });

  it('T3-PAIR-02: Realtime broadcast transitions course status from Pendiente to Cargado', async () => {
    const today = getTodayString();
    const report = await harness.adapter.getShiftParteGeneral(today, 'vespertino');
    const row61 = report.courses.find(c => c.course_name.includes('6° 1ª'));

    expect(row61).toBeDefined();
    expect(row61!.is_submitted).toBe(true);
    expect(row61!.presentes_t).toBe(14);
  });

  it('T3-PAIR-03: Totals row recalculates dynamic sums across all columns on realtime update', async () => {
    const today = getTodayString();
    const report = await harness.adapter.getShiftParteGeneral(today, 'vespertino');

    expect(report.totals.presentes_v).toBe(10);
    expect(report.totals.presentes_m).toBe(4);
    expect(report.totals.presentes_t).toBe(14);
    expect(report.totals.ausentes_v).toBe(1);
    expect(report.totals.ausentes_m).toBe(0);
    expect(report.totals.ausentes_t).toBe(1);
    expect(report.totals.porcentaje_asistencia_general).toBeGreaterThan(0);
  });

  it('T3-PAIR-04: Progress counter widget increments submitted courses count', async () => {
    const today = getTodayString();
    const report = await harness.adapter.getShiftParteGeneral(today, 'vespertino');
    expect(report.totals.submitted_courses_count).toBe(1);
    expect(report.totals.total_courses_count).toBe(10);
  });
}, 3);
