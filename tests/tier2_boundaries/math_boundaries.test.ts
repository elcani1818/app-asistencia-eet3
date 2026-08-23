import { describe, it, test, expect, beforeAll } from '../runner/framework';
import {
  createTestHarness,
  TestHarness,
  validateAttendanceRow,
  calculateAttendancePercentage,
  getTodayString
} from '../harness/harness';
import { UserSession } from '../harness/types';

describe('Tier 2: Mathematical & Boundary Validation', () => {
  let harness: TestHarness;
  let teacherSession: UserSession;

  beforeAll(async () => {
    harness = await createTestHarness({ adapter: 'mock' });
    teacherSession = await harness.createTeacherActor('5° 4ª');
  });

  it('T2-01: Zero female course enrollment (5° 4ª TECET) permits valid male input and locks female to zero', async () => {
    // 5° 4ª has I_V = 8, I_M = 0, I_T = 8
    const res = validateAttendanceRow(8, 0, 7, 0, 1, 0);
    expect(res.isValid).toBe(true);
    expect(res.varonesValid).toBe(true);
    expect(res.mujeresValid).toBe(true);
    expect(res.varonesDisparity).toBe(0);
    expect(res.mujeresDisparity).toBe(0);

    const invalidRes = validateAttendanceRow(8, 0, 7, 1, 1, 0);
    expect(invalidRes.isValid).toBe(false);
    expect(invalidRes.mujeresValid).toBe(false);
    expect(invalidRes.mujeresDisparity).toBe(1);

    const record = await harness.adapter.submitAttendance(teacherSession, {
      courseName: '5° 4ª',
      date: getTodayString(),
      presentes_v: 7,
      ausentes_v: 1,
      presentes_m: 0,
      ausentes_m: 0
    });
    expect(record.presentes_total).toBe(7);
    expect(record.ausentes_total).toBe(1);
    expect(record.inscriptos_total_snapshot).toBe(8);
  });

  it('T2-02: Zero male course or all-female cohort handles valid female counts symmetrically', () => {
    // Synthetic cohort: 0 V, 25 M, 25 T
    const validRes = validateAttendanceRow(0, 25, 0, 25, 0, 0);
    expect(validRes.isValid).toBe(true);
    expect(validRes.varonesValid).toBe(true);
    expect(validRes.mujeresValid).toBe(true);

    const invalidRes = validateAttendanceRow(0, 25, 1, 24, 0, 1);
    expect(invalidRes.isValid).toBe(false);
    expect(invalidRes.varonesValid).toBe(false);
    expect(invalidRes.varonesDisparity).toBe(1);
  });

  it('T2-03: 100% full attendance computes 100.00% without divide-by-zero or overflow', () => {
    const res = validateAttendanceRow(11, 4, 11, 4, 0, 0);
    expect(res.isValid).toBe(true);

    const pct = calculateAttendancePercentage(15, 15);
    expect(pct).toBe(100.0);
  });

  it('T2-04: 0% attendance (total absenteeism) computes 0.00% cleanly', () => {
    const res = validateAttendanceRow(9, 14, 0, 0, 9, 14);
    expect(res.isValid).toBe(true);

    const pct = calculateAttendancePercentage(0, 23);
    expect(pct).toBe(0.0);
  });

  it('T2-05: Maximum cohort size (50 students) calculates totals and validations cleanly', () => {
    const res = validateAttendanceRow(25, 25, 24, 23, 1, 2);
    expect(res.isValid).toBe(true);
    expect(res.totalValid).toBe(true);

    const pct = calculateAttendancePercentage(47, 50);
    expect(pct).toBe(94.0);
  });

  it('T2-06: Negative inputs are strictly rejected at validation and schema layers', () => {
    const res = validateAttendanceRow(11, 4, -1, 4, 12, 0);
    expect(res.isValid).toBe(false);
    expect(res.errorMessage).toContain('negativos');
  });

  it('T2-07: Non-integer / Decimal numbers are rejected by integer validation', () => {
    const res = validateAttendanceRow(11, 4, 10.5, 4, 0.5, 0);
    expect(res.isValid).toBe(false);
    expect(res.errorMessage).toContain('enteros');
  });

  it('T2-08: Disparity matrix exhaustive verification across over/under counts', () => {
    // DISP-02: Under-count V by 1
    const d2 = validateAttendanceRow(11, 4, 9, 4, 1, 0);
    expect(d2.isValid).toBe(false);
    expect(d2.varonesDisparity).toBe(-1);

    // DISP-03: Over-count V by 1
    const d3 = validateAttendanceRow(11, 4, 11, 4, 1, 0);
    expect(d3.isValid).toBe(false);
    expect(d3.varonesDisparity).toBe(1);

    // DISP-04: Under-count M by 1
    const d4 = validateAttendanceRow(11, 4, 10, 3, 1, 0);
    expect(d4.isValid).toBe(false);
    expect(d4.mujeresDisparity).toBe(-1);

    // DISP-05: Over-count M by 1
    const d5 = validateAttendanceRow(11, 4, 10, 4, 1, 1);
    expect(d5.isValid).toBe(false);
    expect(d5.mujeresDisparity).toBe(1);
  });
}, 2);
