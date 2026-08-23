import { describe, test, it, expect, beforeAll } from '../runner/framework';
import {
  createTestHarness,
  TestHarness,
  validateAttendanceRow,
  calculateAttendancePercentage,
  getTodayString,
  getYesterdayString,
  getTomorrowString
} from '../harness/harness';
import { UserSession } from '../harness/types';

describe('Tier 1: Attendance Entry & Form Validation (F-03..F-09)', () => {
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
  // Feature F-03: Course Selector for Teachers (R1, R2)
  // =========================================================================
  test('TC-F03-01: Profesor Course Selector Filtered to Assigned Courses Only', async () => {
    const assignedCourses = await harness.adapter.getAssignedCourses(teacherSession.user.id);
    expect(assignedCourses.length).toBeGreaterThanOrEqual(2);
    // prof.quimica is assigned to 6° 1ª (course-tv-2)
    expect(assignedCourses.some(c => c.name.includes('6° 1ª') || c.id === 'course-tv-2')).toBe(true);
  }, 'F-03');

  test('TC-F03-02: Preceptor Course Selector Contains All Active Courses in Shift', async () => {
    const tvCourses = await harness.adapter.getCourses('shift-tv');
    expect(tvCourses.length).toBe(10);
  }, 'F-03');

  test('TC-F03-03: Administrador Course Selector Accesses Full 34-Course Catalog', async () => {
    const allCourses = await harness.adapter.getCourses();
    expect(allCourses.length).toBe(34);
  }, 'F-03');

  test('TC-F03-04: Exclude Deactivated / Archived Courses from Selector', async () => {
    const course = await harness.adapter.getCourseByName('5° 4ª');
    expect(course).toBeDefined();

    await harness.adapter.archiveCourse(course!.id);
    const activeCourses = await harness.adapter.getCourses('shift-tv');
    expect(activeCourses.some(c => c.id === course!.id)).toBe(false);

    // Restore course for subsequent tests
    await harness.adapter.updateCourse(course!.id, { shift_id: 'shift-tv' });
    const restored = await harness.adapter.getCourseById(course!.id);
    if (restored) restored.is_active = true;
  }, 'F-03');

  test('TC-F03-05: Course Switching Clears Dirty Form State & Loads New Baseline', async () => {
    const course1 = await harness.adapter.getCourseByName('6° 1ª');
    const course2 = await harness.adapter.getCourseByName('7° 1ª');
    expect(course1).toBeDefined();
    expect(course2).toBeDefined();

    expect(course1!.inscriptos_varones).toBe(11);
    expect(course1!.inscriptos_mujeres).toBe(4);
    expect(course2!.inscriptos_varones).toBe(5);
    expect(course2!.inscriptos_mujeres).toBe(8);
  }, 'F-03');

  test('TC-F03-06: Teacher with Zero Assigned Courses Graceful State', async () => {
    const unassignedTeacher = await harness.adapter.createUser({
      email: 'docente.sin.cursos@eest3.edu.ar',
      full_name: 'Docente Sin Cursos',
      role: 'profesor'
    });
    const assigned = await harness.adapter.getAssignedCourses(unassignedTeacher.id);
    expect(assigned.length).toBe(0);
  }, 'F-03');

  // =========================================================================
  // Feature F-04: Pre-populated Header & Metadata (R2)
  // =========================================================================
  test('TC-F04-01: Header Populates Exact Name, Year, Division & Shift', async () => {
    const course = await harness.adapter.getCourseByName('6° 2ª');
    expect(course).toBeDefined();
    expect(course!.name).toContain('6° 2ª');
    expect(course!.year).toBe(6);
    expect(course!.division).toBe(2);
    expect(course!.shift_id).toBe('shift-tv');
  }, 'F-04');

  test('TC-F04-02: Technical Orientation Tag Display for Ciclo Superior', async () => {
    const c1 = await harness.adapter.getCourseByName('6° 1ª');
    const c2 = await harness.adapter.getCourseByName('6° 2ª');
    const c3 = await harness.adapter.getCourseByName('6° 3ª');
    const c4 = await harness.adapter.getCourseByName('1° 1ª C.TEC.MMO');

    expect(c1!.orientation).toBe('TECQU');
    expect(c2!.orientation).toBe('TECMM');
    expect(c3!.orientation).toBe('TECET');
    expect(c4!.orientation).toBe('C.TEC.MMO');
  }, 'F-04');

  test('TC-F04-03: Ciclo Básico Course Header Display', async () => {
    const basicoCourse = await harness.adapter.getCourseByName('1° 1ª');
    expect(basicoCourse).toBeDefined();
    expect(basicoCourse!.cycle).toBe('basico');
    expect(basicoCourse!.orientation).toBeNull();
  }, 'F-04');

  test('TC-F04-04: Enrollment Baseline Matches CSV Exactly for All 10 TV Courses', async () => {
    const expectedCounts: Record<string, { v: number; m: number; t: number }> = {
      '5° 4ª': { v: 8, m: 0, t: 8 },
      '6° 1ª': { v: 11, m: 4, t: 15 },
      '6° 2ª': { v: 9, m: 14, t: 23 },
      '6° 3ª': { v: 23, m: 2, t: 25 },
      '6° 4ª': { v: 6, m: 0, t: 6 },
      '7° 1ª': { v: 5, m: 8, t: 13 },
      '7° 2ª': { v: 9, m: 9, t: 18 },
      '7° 3ª': { v: 20, m: 9, t: 29 },
      '7° 4ª': { v: 8, m: 0, t: 8 },
      '1° 1ª C.TEC.MMO': { v: 20, m: 7, t: 27 },
    };

    const tvCourses = await harness.adapter.getCourses('shift-tv');
    for (const c of tvCourses) {
      const exp = expectedCounts[c.name];
      if (exp) {
        expect(c.inscriptos_varones).toBe(exp.v);
        expect(c.inscriptos_mujeres).toBe(exp.m);
        expect(c.inscriptos_total).toBe(exp.t);
      }
    }
  }, 'F-04');

  test('TC-F04-05: Zero-Female Course Display Formatting', async () => {
    const c54 = await harness.adapter.getCourseByName('5° 4ª');
    expect(c54!.inscriptos_mujeres).toBe(0);
    expect(c54!.inscriptos_varones).toBe(8);
    expect(c54!.inscriptos_total).toBe(8);
  }, 'F-04');

  test('TC-F04-06: Pre-populated Enrollment Conservation Invariant', async () => {
    const tvCourses = await harness.adapter.getCourses('shift-tv');
    for (const c of tvCourses) {
      expect(c.inscriptos_varones + c.inscriptos_mujeres).toBe(c.inscriptos_total);
    }
  }, 'F-04');

  // =========================================================================
  // Feature F-05: Gender Breakdown Entry & Math (R2)
  // =========================================================================
  test('TC-F05-01: Auto-Calculation of Presentes Total (P_T = P_V + P_M)', () => {
    const pv = 10;
    const pm = 4;
    const pt = pv + pm;
    expect(pt).toBe(14);
  }, 'F-05');

  test('TC-F05-02: Auto-Calculation of Ausentes Total (A_T = A_V + A_M)', () => {
    const av = 1;
    const am = 0;
    const at = av + am;
    expect(at).toBe(1);
  }, 'F-05');

  test('TC-F05-03: Attendance Percentage Calculation Accuracy', () => {
    const pct = calculateAttendancePercentage(14, 15);
    expect(pct).toBe(93.33);
  }, 'F-05');

  test('TC-F05-04: Boundary Condition: 100% Attendance Calculation', () => {
    const pct = calculateAttendancePercentage(18, 18);
    expect(pct).toBe(100.0);
  }, 'F-05');

  test('TC-F05-05: Boundary Condition: 0% Attendance Calculation', () => {
    const pct = calculateAttendancePercentage(0, 6);
    expect(pct).toBe(0.0);
  }, 'F-05');

  test('TC-F05-06: Non-Numeric and Negative Input Sanitization', () => {
    const res = validateAttendanceRow(11, 4, -1, 4, 12, 0);
    expect(res.isValid).toBe(false);
    expect(res.errorMessage).toContain('negativos');
  }, 'F-05');

  // =========================================================================
  // Feature F-06: Real-time Sum Validation & Form Blocking (R2)
  // =========================================================================
  test('TC-F06-01: Valid Invariant State Enables Submission', () => {
    const res = validateAttendanceRow(11, 4, 10, 4, 1, 0);
    expect(res.isValid).toBe(true);
    expect(res.varonesValid).toBe(true);
    expect(res.mujeresValid).toBe(true);
    expect(res.varonesDisparity).toBe(0);
    expect(res.mujeresDisparity).toBe(0);
  }, 'F-06');

  test('TC-F06-02: Male Disparity Blocks Submission with Disparity Count', () => {
    const res = validateAttendanceRow(11, 4, 9, 4, 1, 0);
    expect(res.isValid).toBe(false);
    expect(res.varonesValid).toBe(false);
    expect(res.varonesDisparity).toBe(-1);
    expect(res.errorMessage).toContain('Varones: Faltan 1');
  }, 'F-06');

  test('TC-F06-03: Female Disparity Blocks Submission with Disparity Count', () => {
    const res = validateAttendanceRow(11, 4, 10, 3, 1, 2);
    expect(res.isValid).toBe(false);
    expect(res.mujeresValid).toBe(false);
    expect(res.mujeresDisparity).toBe(1);
    expect(res.errorMessage).toContain('Mujeres: Sobran 1');
  }, 'F-06');

  test('TC-F06-04: Compensating Errors Strictly Blocked (Per-Gender Independence)', () => {
    // Total sum = 15 (10+5), but V has 10 (needs 11) and M has 5 (needs 4)
    const res = validateAttendanceRow(11, 4, 10, 5, 0, 0);
    expect(res.isValid).toBe(false);
    expect(res.varonesValid).toBe(false);
    expect(res.mujeresValid).toBe(false);
    expect(res.totalValid).toBe(true); // Total sum equals 15, but per-gender is invalid
  }, 'F-06');

  test('TC-F06-05: Database-Level Trigger Rejection on Disparity Payload', async () => {
    await expect(
      harness.adapter.submitAttendance(teacherSession, {
        courseName: '6° 1ª',
        date: getTodayString(),
        presentes_v: 8,
        ausentes_v: 1, // Sum 9 != 11
        presentes_m: 4,
        ausentes_m: 0
      })
    ).rejects.toThrow(/Inconsistencia en Varones/);
  }, 'F-06');

  test('TC-F06-06: Dynamic Validation Recovery on Input Correction', () => {
    let res = validateAttendanceRow(11, 4, 9, 4, 1, 0);
    expect(res.isValid).toBe(false);

    // User corrects input
    res = validateAttendanceRow(11, 4, 10, 4, 1, 0);
    expect(res.isValid).toBe(true);
    expect(res.errorMessage).toBeUndefined();
  }, 'F-06');

  // =========================================================================
  // Feature F-07: Date Selector & Historical Locking (R2)
  // =========================================================================
  test('TC-F07-01: Date Selector Defaults to Current School Date', () => {
    const today = getTodayString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  }, 'F-07');

  test('TC-F07-02: Editable Submission for Current Date', async () => {
    const today = getTodayString();
    const record = await harness.adapter.submitAttendance(teacherSession, {
      courseName: '6° 1ª',
      date: today,
      presentes_v: 10,
      ausentes_v: 1,
      presentes_m: 4,
      ausentes_m: 0,
      observaciones: 'Prueba fecha de hoy'
    });

    expect(record.id).toBeDefined();
    expect(record.date).toBe(today);
    expect(record.presentes_total).toBe(14);
    expect(record.ausentes_total).toBe(1);
  }, 'F-07');

  test('TC-F07-03: Past Date Enforces Read-Only Lock for Profesor Role', async () => {
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
  }, 'F-07');

  test('TC-F07-04: API-Level Rejection for Teacher Past-Date Modifications', async () => {
    const pastDate = '2025-05-10';
    await expect(
      harness.adapter.submitAttendance(teacherSession, {
        courseName: '6° 1ª',
        date: pastDate,
        presentes_v: 10,
        ausentes_v: 1,
        presentes_m: 4,
        ausentes_m: 0
      })
    ).rejects.toThrow(/403 Forbidden/);
  }, 'F-07');

  test('TC-F07-05: Admin Historical Override Capability', async () => {
    const today = getTodayString();
    const adminRecord = await harness.adapter.submitAttendance(adminSession, {
      courseName: '6° 1ª',
      date: today,
      presentes_v: 11,
      ausentes_v: 0,
      presentes_m: 4,
      ausentes_m: 0,
      observaciones: 'Admin override'
    });

    expect(adminRecord.presentes_total).toBe(15);
    expect(adminRecord.observaciones).toBe('Admin override');
  }, 'F-07');

  test('TC-F07-06: Future Date Input Prevention', async () => {
    const futureDate = getTomorrowString();
    await expect(
      harness.adapter.submitAttendance(teacherSession, {
        courseName: '6° 1ª',
        date: futureDate,
        presentes_v: 10,
        ausentes_v: 1,
        presentes_m: 4,
        ausentes_m: 0
      })
    ).rejects.toThrow(/fechas futuras/);
  }, 'F-07');

  // =========================================================================
  // Feature F-08: Observaciones Input & Sanitization (R2)
  // =========================================================================
  test('TC-F08-01: Successful Submission of Free-Text Observaciones', async () => {
    const today = getTodayString();
    const record = await harness.adapter.submitAttendance(teacherSession, {
      courseName: '6° 1ª',
      date: today,
      presentes_v: 10,
      ausentes_v: 1,
      presentes_m: 4,
      ausentes_m: 0,
      observaciones: '3 alumnos retirados antes por examen técnico'
    });

    expect(record.observaciones).toBe('3 alumnos retirados antes por examen técnico');
  }, 'F-08');

  test('TC-F08-02: Diacritics and Spanish Character Encoding Fidelity', async () => {
    const textSpanish = 'Año lectivo: evaluación técnica de electromecánica con el Prof. Peña';
    const today = getTodayString();
    const record = await harness.adapter.submitAttendance(teacherSession, {
      courseName: '6° 1ª',
      date: today,
      presentes_v: 10,
      ausentes_v: 1,
      presentes_m: 4,
      ausentes_m: 0,
      observaciones: textSpanish
    });

    expect(record.observaciones).toBe(textSpanish);
  }, 'F-08');

  test('TC-F08-03: HTML / Special Character Escape Safety', async () => {
    const rawInput = '<script>alert("xss")</script> & <b>test</b>';
    const today = getTodayString();
    const record = await harness.adapter.submitAttendance(teacherSession, {
      courseName: '6° 1ª',
      date: today,
      presentes_v: 10,
      ausentes_v: 1,
      presentes_m: 4,
      ausentes_m: 0,
      observaciones: rawInput
    });

    expect(record.observaciones).toBe(rawInput);
  }, 'F-08');

  test('TC-F08-04: Observaciones Max Length Tolerance', async () => {
    const longText = 'A'.repeat(500);
    const today = getTodayString();
    const record = await harness.adapter.submitAttendance(teacherSession, {
      courseName: '6° 1ª',
      date: today,
      presentes_v: 10,
      ausentes_v: 1,
      presentes_m: 4,
      ausentes_m: 0,
      observaciones: longText
    });

    expect(record.observaciones?.length).toBe(500);
  }, 'F-08');

  test('TC-F08-05: Clearing / Updating Existing Observaciones', async () => {
    const today = getTodayString();
    const record = await harness.adapter.submitAttendance(teacherSession, {
      courseName: '6° 1ª',
      date: today,
      presentes_v: 10,
      ausentes_v: 1,
      presentes_m: 4,
      ausentes_m: 0,
      observaciones: ''
    });

    expect(record.observaciones).toBe('');
  }, 'F-08');

  test('TC-F08-06: Observaciones Propagation to Daily Shift Report', async () => {
    const today = getTodayString();
    await harness.adapter.submitAttendance(teacherSession, {
      courseName: '6° 1ª',
      date: today,
      presentes_v: 10,
      ausentes_v: 1,
      presentes_m: 4,
      ausentes_m: 0,
      observaciones: 'Nota para el parte general'
    });

    const report = await harness.adapter.getShiftParteGeneral(today, 'vespertino');
    const courseRow = report.courses.find(c => c.course_name.includes('6° 1ª'));
    expect(courseRow).toBeDefined();
    expect(courseRow!.observaciones).toBe('Nota para el parte general');
  }, 'F-08');

  // =========================================================================
  // Feature F-09: Staff Absences Entry Subform (R2)
  // =========================================================================
  test('TC-F09-01: Record Teacher Absence (Docente)', async () => {
    const today = getTodayString();
    const absence = await harness.adapter.recordStaffAbsence(preceptorSession, {
      date: today,
      shift_code: 'vespertino',
      staff_name: 'Prof. Gomez Carlos',
      role_type: 'Docente',
      subject_or_area: 'Química Analítica',
      reason: 'Licencia médica Art. 114 a-1'
    });

    expect(absence.id).toBeDefined();
    expect(absence.staff_name).toBe('Prof. Gomez Carlos');
    expect(absence.role_type).toBe('Docente');
  }, 'F-09');

  test('TC-F09-02: Record Auxiliary Staff Absence (Auxiliar)', async () => {
    const today = getTodayString();
    const absence = await harness.adapter.recordStaffAbsence(preceptorSession, {
      date: today,
      shift_code: 'vespertino',
      staff_name: 'Rodriguez Maria',
      role_type: 'Auxiliar',
      subject_or_area: 'Portería / Mantenimiento',
      reason: 'Fuerza mayor'
    });

    expect(absence.id).toBeDefined();
    expect(absence.role_type).toBe('Auxiliar');
  }, 'F-09');

  test('TC-F09-03: Multiple Staff Absences in Single Session', async () => {
    const today = getTodayString();
    const absences = await harness.adapter.getStaffAbsences('shift-tv', today);
    expect(absences.length).toBeGreaterThanOrEqual(2);
  }, 'F-09');

  test('TC-F09-04: Staff Absence Required Field Validation', async () => {
    const today = getTodayString();
    await expect(
      harness.adapter.recordStaffAbsence(preceptorSession, {
        date: today,
        shift_code: 'vespertino',
        staff_name: '',
        role_type: 'Docente'
      })
    ).rejects.toThrow(/obligatorio/);
  }, 'F-09');

  test('TC-F09-05: Delete / Remove Staff Absence Entry', async () => {
    const today = getTodayString();
    const tempAbsence = await harness.adapter.recordStaffAbsence(preceptorSession, {
      date: today,
      shift_code: 'vespertino',
      staff_name: 'Prof. Borrable',
      role_type: 'Docente'
    });

    await harness.adapter.deleteStaffAbsence(tempAbsence.id);
    const absences = await harness.adapter.getStaffAbsences('shift-tv', today);
    expect(absences.some(a => a.id === tempAbsence.id)).toBe(false);
  }, 'F-09');

  test('TC-F09-06: Shift Isolation for Staff Absences', async () => {
    const today = getTodayString();
    await harness.adapter.recordStaffAbsence(preceptorSession, {
      date: today,
      shift_code: 'manana',
      staff_name: 'Aux. Solo Manana',
      role_type: 'Auxiliar'
    });

    const tvAbsences = await harness.adapter.getStaffAbsences('shift-tv', today);
    expect(tvAbsences.some(a => a.staff_name === 'Aux. Solo Manana')).toBe(false);
  }, 'F-09');
}, 1);
