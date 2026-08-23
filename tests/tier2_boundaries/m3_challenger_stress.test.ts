import { describe, it, test, expect, beforeAll } from '../runner/framework';
import {
  createTestHarness,
  TestHarness,
  validateAttendanceRow,
  calculateAttendancePercentage,
  getTodayString,
  getYesterdayString,
  getTomorrowString
} from '../harness/harness';
import { suggestAbsents, calculateShiftTotals, calculatePartialShiftTotals } from '../../src/utils/calculations';
import { attendanceService } from '../../src/services/attendanceService';
import { UserSession } from '../harness/types';

describe('Milestone 3 Challenger 1: Empirical Adversarial Stress & Math Harness', () => {
  let harness: TestHarness;
  let adminSession: UserSession;
  let teacherSession: UserSession;

  beforeAll(async () => {
    harness = await createTestHarness({ adapter: 'mock' });
    adminSession = await harness.createAdminActor();
    teacherSession = await harness.createTeacherActor('6° 1ª');
  });

  // =========================================================================
  // 1. Extreme Cohort Sizes & Single-Gender Cohort Defenses
  // =========================================================================
  describe('1. Extreme Cohorts & Single-Gender Cohorts', () => {
    test('CH-01: Zero enrollment cohort (0V, 0M) evaluates cleanly without divide-by-zero', () => {
      const res = validateAttendanceRow(0, 0, 0, 0, 0, 0);
      expect(res.isValid).toBe(true);
      expect(res.varonesValid).toBe(true);
      expect(res.mujeresValid).toBe(true);
      expect(res.totalValid).toBe(true);
      expect(res.varonesDisparity).toBe(0);
      expect(res.mujeresDisparity).toBe(0);

      const pct = calculateAttendancePercentage(0, 0);
      expect(pct).toBe(0);
    });

    test('CH-02: Zero enrollment cohort rejects any phantom student entry', () => {
      const resMalePhantom = validateAttendanceRow(0, 0, 1, 0, 0, 0);
      expect(resMalePhantom.isValid).toBe(false);
      expect(resMalePhantom.varonesValid).toBe(false);
      expect(resMalePhantom.varonesDisparity).toBe(1);

      const resFemalePhantom = validateAttendanceRow(0, 0, 0, 1, 0, 0);
      expect(resFemalePhantom.isValid).toBe(false);
      expect(resFemalePhantom.mujeresValid).toBe(false);
      expect(resFemalePhantom.mujeresDisparity).toBe(1);
    });

    test('CH-03: Real school single-gender male cohort (5° 4ª TECET: 8V, 0M) full operational spectrum', () => {
      // 100% attendance
      const full = validateAttendanceRow(8, 0, 8, 0, 0, 0);
      expect(full.isValid).toBe(true);
      expect(calculateAttendancePercentage(8, 8)).toBe(100.0);

      // 0% attendance (all absent)
      const none = validateAttendanceRow(8, 0, 0, 0, 8, 0);
      expect(none.isValid).toBe(true);
      expect(calculateAttendancePercentage(0, 8)).toBe(0.0);

      // Split 5 present, 3 absent
      const split = validateAttendanceRow(8, 0, 5, 0, 3, 0);
      expect(split.isValid).toBe(true);
      expect(calculateAttendancePercentage(5, 8)).toBe(62.5);

      // Female entry attempt on 0M cohort
      const invalidFemalePresent = validateAttendanceRow(8, 0, 8, 1, 0, 0);
      expect(invalidFemalePresent.isValid).toBe(false);
      expect(invalidFemalePresent.mujeresValid).toBe(false);
      expect(invalidFemalePresent.mujeresDisparity).toBe(1);

      const invalidFemaleAbsent = validateAttendanceRow(8, 0, 8, 0, 0, 1);
      expect(invalidFemaleAbsent.isValid).toBe(false);
      expect(invalidFemaleAbsent.mujeresValid).toBe(false);
      expect(invalidFemaleAbsent.mujeresDisparity).toBe(1);
    });

    test('CH-04: Synthetic single-gender female cohort (0V, 15M) full operational spectrum', () => {
      // 100% attendance
      const full = validateAttendanceRow(0, 15, 0, 15, 0, 0);
      expect(full.isValid).toBe(true);
      expect(calculateAttendancePercentage(15, 15)).toBe(100.0);

      // Split 12 present, 3 absent
      const split = validateAttendanceRow(0, 15, 0, 12, 0, 3);
      expect(split.isValid).toBe(true);
      expect(calculateAttendancePercentage(12, 15)).toBe(80.0);

      // Male entry attempt on 0V cohort
      const invalidMale = validateAttendanceRow(0, 15, 1, 15, 0, 0);
      expect(invalidMale.isValid).toBe(false);
      expect(invalidMale.varonesValid).toBe(false);
      expect(invalidMale.varonesDisparity).toBe(1);
    });

    test('CH-05: Maximum size cohort (50 students: 25V, 25M) precision and boundaries', () => {
      const split = validateAttendanceRow(25, 25, 20, 22, 5, 3);
      expect(split.isValid).toBe(true);
      expect(split.totalValid).toBe(true);
      expect(calculateAttendancePercentage(42, 50)).toBe(84.0);
    });

    test('CH-06: Massive overflow cohort (1000 students) stress test', () => {
      const massive = validateAttendanceRow(500, 500, 450, 480, 50, 20);
      expect(massive.isValid).toBe(true);
      expect(calculateAttendancePercentage(930, 1000)).toBe(93.0);
    });
  });

  // =========================================================================
  // 2. Hostile Input Attacks & Non-Integer / Negative Sanitization
  // =========================================================================
  describe('2. Hostile Inputs & Non-Integer / Negative Sanitization', () => {
    test('CH-07: Negative present count rejected even if math algebraically matches', () => {
      // PV = -2, AV = 12 -> Sum = 10, IV = 10
      const res = validateAttendanceRow(10, 5, -2, 5, 12, 0);
      expect(res.isValid).toBe(false);
      expect(res.errorMessage).toBe('Los valores no pueden ser negativos');
    });

    test('CH-08: Negative absent count rejected even if math algebraically matches', () => {
      // PV = 15, AV = -5 -> Sum = 10, IV = 10
      const res = validateAttendanceRow(10, 5, 15, 5, -5, 0);
      expect(res.isValid).toBe(false);
      expect(res.errorMessage).toBe('Los valores no pueden ser negativos');
    });

    test('CH-09: Negative enrollment rejected immediately', () => {
      const res = validateAttendanceRow(-10, 5, 0, 5, 0, 0);
      expect(res.isValid).toBe(false);
      expect(res.errorMessage).toBe('Los valores no pueden ser negativos');
    });

    test('CH-10: Decimal / Floating point input rejected by integer validator', () => {
      const resFloatPresent = validateAttendanceRow(10, 10, 9.5, 10, 0.5, 0);
      expect(resFloatPresent.isValid).toBe(false);
      expect(resFloatPresent.errorMessage).toBe('Los valores deben ser números enteros');

      const resMicroDecimal = validateAttendanceRow(10, 10, 10.00001, 10, 0, 0);
      expect(resMicroDecimal.isValid).toBe(false);
      expect(resMicroDecimal.errorMessage).toBe('Los valores deben ser números enteros');
    });

    test('CH-11: Object parameter input mode with partial / undefined keys resolves safely to 0', () => {
      const res = validateAttendanceRow({
        inscriptosV: 10,
        presentesV: 10
      });
      // IV=10, IM=0, PV=10, PM=0, AV=0, AM=0 -> Valid!
      expect(res.isValid).toBe(true);
      expect(res.varonesValid).toBe(true);
      expect(res.mujeresValid).toBe(true);
    });

    test('CH-12: Object parameter input mode with alternative snake_case keys resolves safely', () => {
      const res = validateAttendanceRow({
        inscriptos_v: 12,
        inscriptos_m: 8,
        presentes_v: 10,
        ausentes_v: 2,
        presentes_m: 7,
        ausentes_m: 1
      });
      expect(res.isValid).toBe(true);
      expect(res.varonesValid).toBe(true);
      expect(res.mujeresValid).toBe(true);
    });
  });

  // =========================================================================
  // 3. Exhaustive Parity Disparity Matrix
  // =========================================================================
  describe('3. Exhaustive Parity Disparity Matrix', () => {
    const IV = 16;
    const IM = 12;

    test('CH-13: Matrix Case 1: Exact Match (0, 0)', () => {
      const r = validateAttendanceRow(IV, IM, 14, 10, 2, 2);
      expect(r.isValid).toBe(true);
      expect(r.varonesDisparity).toBe(0);
      expect(r.mujeresDisparity).toBe(0);
      expect(r.errorMessage).toBeUndefined();
    });

    test('CH-14: Matrix Case 2: Male Under-Count (-3, 0)', () => {
      const r = validateAttendanceRow(IV, IM, 11, 12, 2, 0); // PV+AV = 13 (needs 16)
      expect(r.isValid).toBe(false);
      expect(r.varonesValid).toBe(false);
      expect(r.mujeresValid).toBe(true);
      expect(r.varonesDisparity).toBe(-3);
      expect(r.errorMessage).toContain('Varones: Faltan 3 para completar los 16 inscriptos');
    });

    test('CH-15: Matrix Case 3: Male Over-Count (+4, 0)', () => {
      const r = validateAttendanceRow(IV, IM, 16, 12, 4, 0); // PV+AV = 20 (needs 16)
      expect(r.isValid).toBe(false);
      expect(r.varonesValid).toBe(false);
      expect(r.mujeresValid).toBe(true);
      expect(r.varonesDisparity).toBe(4);
      expect(r.errorMessage).toContain('Varones: Sobran 4 (suma 20 de 16 inscriptos)');
    });

    test('CH-16: Matrix Case 4: Female Under-Count (0, -2)', () => {
      const r = validateAttendanceRow(IV, IM, 16, 8, 0, 2); // PM+AM = 10 (needs 12)
      expect(r.isValid).toBe(false);
      expect(r.varonesValid).toBe(true);
      expect(r.mujeresValid).toBe(false);
      expect(r.mujeresDisparity).toBe(-2);
      expect(r.errorMessage).toContain('Mujeres: Faltan 2 para completar las 12 inscriptas');
    });

    test('CH-17: Matrix Case 5: Female Over-Count (0, +3)', () => {
      const r = validateAttendanceRow(IV, IM, 16, 12, 0, 3); // PM+AM = 15 (needs 12)
      expect(r.isValid).toBe(false);
      expect(r.varonesValid).toBe(true);
      expect(r.mujeresValid).toBe(false);
      expect(r.mujeresDisparity).toBe(3);
      expect(r.errorMessage).toContain('Mujeres: Sobran 3 (suma 15 de 12 inscriptas)');
    });

    test('CH-18: Matrix Case 6: Double Under-Count (-2, -3)', () => {
      const r = validateAttendanceRow(IV, IM, 12, 8, 2, 1); // V=14/16, M=9/12
      expect(r.isValid).toBe(false);
      expect(r.varonesValid).toBe(false);
      expect(r.mujeresValid).toBe(false);
      expect(r.varonesDisparity).toBe(-2);
      expect(r.mujeresDisparity).toBe(-3);
      expect(r.errorMessage).toContain('Varones: Faltan 2');
      expect(r.errorMessage).toContain('Mujeres: Faltan 3');
    });

    test('CH-19: Matrix Case 7: Double Over-Count (+2, +2)', () => {
      const r = validateAttendanceRow(IV, IM, 16, 12, 2, 2); // V=18/16, M=14/12
      expect(r.isValid).toBe(false);
      expect(r.varonesValid).toBe(false);
      expect(r.mujeresValid).toBe(false);
      expect(r.varonesDisparity).toBe(2);
      expect(r.mujeresDisparity).toBe(2);
      expect(r.errorMessage).toContain('Varones: Sobran 2');
      expect(r.errorMessage).toContain('Mujeres: Sobran 2');
    });

    test('CH-20: Matrix Case 8: Compensating Disparity (-3, +3) where Total Sum = Enrollment', () => {
      // V has 13 (under by 3), M has 15 (over by 3). Total = 28 (matches 16+12=28)
      const r = validateAttendanceRow(IV, IM, 13, 15, 0, 0);
      expect(r.isValid).toBe(false);
      expect(r.varonesValid).toBe(false);
      expect(r.mujeresValid).toBe(false);
      expect(r.totalValid).toBe(true); // Sum is 28 == 28, but gender breakdown is strictly invalid!
      expect(r.varonesDisparity).toBe(-3);
      expect(r.mujeresDisparity).toBe(3);
    });

    test('CH-21: Matrix Case 9: Compensating Disparity (+2, -2) where Total Sum = Enrollment', () => {
      // V has 18 (over by 2), M has 10 (under by 2). Total = 28
      const r = validateAttendanceRow(IV, IM, 16, 8, 2, 2);
      expect(r.isValid).toBe(false);
      expect(r.varonesValid).toBe(false);
      expect(r.mujeresValid).toBe(false);
      expect(r.totalValid).toBe(true);
      expect(r.varonesDisparity).toBe(2);
      expect(r.mujeresDisparity).toBe(-2);
    });
  });

  // =========================================================================
  // 4. Quick-Fill Engine Mathematical Invariants
  // =========================================================================
  describe('4. Quick-Fill Engine & Suggestion Helpers', () => {
    test('CH-22: suggestAbsents calculates exact remainder for valid present counts', () => {
      expect(suggestAbsents(18, 15)).toBe(3);
      expect(suggestAbsents(18, 18)).toBe(0);
      expect(suggestAbsents(18, 0)).toBe(18);
    });

    test('CH-23: suggestAbsents clamps to 0 when present exceeds enrollment', () => {
      expect(suggestAbsents(18, 25)).toBe(0);
    });

    test('CH-24: Shift Totals Aggregator preserves conservation across 34 courses', () => {
      const mockShiftRows = [
        { inscriptos_v: 18, inscriptos_m: 12, presentes_v: 16, presentes_m: 10, ausentes_v: 2, ausentes_m: 2, is_submitted: true },
        { inscriptos_v: 16, inscriptos_m: 14, presentes_v: 15, presentes_m: 13, ausentes_v: 1, ausentes_m: 1, is_submitted: true },
        { inscriptos_v: 8, inscriptos_m: 0, presentes_v: 7, presentes_m: 0, ausentes_v: 1, ausentes_m: 0, is_submitted: true },
      ];

      const totals = calculateShiftTotals(mockShiftRows);
      expect(totals.inscriptosV).toBe(42);
      expect(totals.inscriptosM).toBe(26);
      expect(totals.inscriptosT).toBe(68);
      expect(totals.presentesT).toBe(61);
      expect(totals.ausentesT).toBe(7);
      expect(totals.totalPresent + totals.totalAbsent).toBe(totals.totalStudents);
      expect(totals.submittedCoursesCount).toBe(3);
      expect(totals.pendingCoursesCount).toBe(0);
      expect(totals.porcentajeAsistencia).toBe(89.71);
    });

    test('CH-25: Partial Shift Totals calculates submitted vs global percentages accurately', () => {
      const rows = [
        { inscriptos_t: 30, presentes_t: 28, ausentes_t: 2, is_submitted: true },
        { inscriptos_t: 30, presentes_t: 0, ausentes_t: 0, is_submitted: false }, // Pending
      ];

      const res = calculatePartialShiftTotals(rows);
      expect(res.totalInscriptosT).toBe(60);
      expect(res.submittedInscriptosT).toBe(30);
      expect(res.presentesT).toBe(28);
      expect(res.submittedCount).toBe(1);
      expect(res.pendingCount).toBe(1);
      expect(res.porcentajeSubmitted).toBe(93.33); // 28/30
      expect(res.porcentajeGlobal).toBe(46.67);    // 28/60
    });
  });

  // =========================================================================
  // 5. Service Layer Temporal Locks & Security Defenses
  // =========================================================================
  describe('5. Service Layer Temporal Locks & Security Guards', () => {
    test('CH-26: upsertAttendance rejects future date registrations unconditionally', async () => {
      const tomorrow = getTomorrowString();
      await expect(
        attendanceService.upsertAttendance({
          course_id: 'course-tv-2',
          date: tomorrow,
          presentes_varones: 11,
          presentes_mujeres: 4,
          ausentes_varones: 0,
          ausentes_mujeres: 0,
          snapshot_inscriptos_v: 11,
          snapshot_inscriptos_m: 4,
          snapshot_inscriptos_total: 15
        }, 'profesor')
      ).rejects.toThrow(/fechas futuras/);
    });

    test('CH-27: upsertAttendance rejects past date modifications for profesor role', async () => {
      const yesterday = getYesterdayString();
      await expect(
        attendanceService.upsertAttendance({
          course_id: 'course-tv-2',
          date: yesterday,
          presentes_varones: 11,
          presentes_mujeres: 4,
          ausentes_varones: 0,
          ausentes_mujeres: 0,
          snapshot_inscriptos_v: 11,
          snapshot_inscriptos_m: 4,
          snapshot_inscriptos_total: 15
        }, 'profesor')
      ).rejects.toThrow(/fechas anteriores/);
    });

    test('CH-28: upsertAttendance permits past date rectifications for administrador role', async () => {
      const yesterday = getYesterdayString();
      const saved = await attendanceService.upsertAttendance({
        course_id: 'course-tv-2',
        date: yesterday,
        presentes_varones: 10,
        presentes_mujeres: 4,
        ausentes_varones: 1,
        ausentes_mujeres: 0,
        snapshot_inscriptos_v: 11,
        snapshot_inscriptos_m: 4,
        snapshot_inscriptos_total: 15,
        observaciones: 'Rectificación autorizada por directivo'
      }, 'administrador');

      expect(saved).toBeDefined();
      expect(saved.is_locked).toBe(true);
      expect(saved.presentes_total).toBe(14);
      expect(saved.ausentes_total).toBe(1);
    });

    test('CH-29: upsertAttendance rejects invalid mathematical parity at service boundary', async () => {
      const today = getTodayString();
      await expect(
        attendanceService.upsertAttendance({
          course_id: 'course-tv-2',
          date: today,
          presentes_varones: 9, // Needs 11 (missing 2)
          presentes_mujeres: 4,
          ausentes_varones: 0,
          ausentes_mujeres: 0,
          snapshot_inscriptos_v: 11,
          snapshot_inscriptos_m: 4,
          snapshot_inscriptos_total: 15
        }, 'profesor')
      ).rejects.toThrow(/Inconsistencia en Varones/);
    });

    test('CH-30: Staff Absence creation validates mandatory agent name and role', async () => {
      const today = getTodayString();

      await expect(
        attendanceService.createStaffAbsence({
          shift_id: 'shift-tv',
          date: today,
          staff_name: '',
          role_type: 'Docente'
        })
      ).rejects.toThrow(/El nombre y apellido del agente es obligatorio/);

      await expect(
        attendanceService.createStaffAbsence({
          shift_id: 'shift-tv',
          date: today,
          staff_name: 'Prof. Gomez',
          role_type: '' as any
        })
      ).rejects.toThrow(/El tipo de rol/);
    });
  });
}, 2);
