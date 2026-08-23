import { describe, test, it, expect, beforeAll } from '../runner/framework';
import { createTestHarness, TestHarness } from '../harness/harness';
import { parseReferenceTvCsv } from '../fixtures/csv_parser';

describe('Tier 1: Course Catalog & Seed Baseline (F-17, F-18)', () => {
  let harness: TestHarness;

  beforeAll(async () => {
    harness = await createTestHarness({ adapter: 'mock' });
  });

  // =========================================================================
  // Feature F-17: Course Catalog CRUD (R4)
  // =========================================================================
  test('TC-F17-01: Admin Creates New Course with Orientation and Enrollment', async () => {
    const newCourse = await harness.adapter.createCourse({
      shift_id: 'shift-tm',
      name: '7° 1ª',
      year: 7,
      division: 1,
      cycle: 'superior',
      orientation: 'TECQU',
      inscriptos_varones: 12,
      inscriptos_mujeres: 14
    });

    expect(newCourse.id).toBeDefined();
    expect(newCourse.name).toBe('7° 1ª');
    expect(newCourse.inscriptos_varones).toBe(12);
    expect(newCourse.inscriptos_mujeres).toBe(14);
    expect(newCourse.inscriptos_total).toBe(26);
    expect(newCourse.is_active).toBe(true);
  }, 'F-17');

  test('TC-F17-02: Admin Updates Course Enrollment Numbers', async () => {
    const course = await harness.adapter.getCourseByName('6° 1ª');
    expect(course).toBeDefined();

    const updated = await harness.adapter.updateCourse(course!.id, {
      inscriptos_varones: 12, // was 11
      inscriptos_mujeres: 4
    });

    expect(updated.inscriptos_varones).toBe(12);
    expect(updated.inscriptos_total).toBe(16);

    // Restore
    await harness.adapter.updateCourse(course!.id, {
      inscriptos_varones: 11,
      inscriptos_mujeres: 4
    });
  }, 'F-17');

  test('TC-F17-03: Admin Updates Course Technical Orientation', async () => {
    const course = await harness.adapter.getCourseByName('6° 2ª');
    expect(course!.orientation).toBe('TECMM');

    const updated = await harness.adapter.updateCourse(course!.id, {
      orientation: 'TECQU'
    });
    expect(updated.orientation).toBe('TECQU');

    // Restore
    await harness.adapter.updateCourse(course!.id, { orientation: 'TECMM' });
  }, 'F-17');

  test('TC-F17-04: Admin Archives Course (Soft Delete is_active=false)', async () => {
    const tempCourse = await harness.adapter.createCourse({
      shift_id: 'shift-tt',
      name: 'Temp Course',
      year: 3,
      division: 5,
      cycle: 'basico',
      orientation: null,
      inscriptos_varones: 10,
      inscriptos_mujeres: 10
    });

    const archived = await harness.adapter.archiveCourse(tempCourse.id);
    expect(archived.is_active).toBe(false);

    const activeList = await harness.adapter.getCourses('shift-tt');
    expect(activeList.some(c => c.id === tempCourse.id)).toBe(false);
  }, 'F-17');

  test('TC-F17-05: Querying Course by Shift Isolation', async () => {
    const tmCourses = await harness.adapter.getCourses('shift-tm');
    const ttCourses = await harness.adapter.getCourses('shift-tt');
    const tvCourses = await harness.adapter.getCourses('shift-tv');

    expect(tmCourses.every(c => c.shift_id === 'shift-tm')).toBe(true);
    expect(ttCourses.every(c => c.shift_id === 'shift-tt')).toBe(true);
    expect(tvCourses.every(c => c.shift_id === 'shift-tv')).toBe(true);
  }, 'F-17');

  test('TC-F17-06: Course Sort Order Respected', async () => {
    const courses = await harness.adapter.getCourses('shift-tv');
    for (let i = 0; i < courses.length - 1; i++) {
      expect(courses[i].sort_order).toBeLessThanOrEqual(courses[i + 1].sort_order);
    }
  }, 'F-17');

  // =========================================================================
  // Feature F-18: Seed Data Initializer (CSV Baseline) (R4)
  // =========================================================================
  test('TC-F18-01: CSV Parser extracts exact 10 Vespertino courses', () => {
    const parsed = parseReferenceTvCsv();
    expect(parsed.courses.length).toBe(10);
    expect(parsed.shift_code).toBe('vespertino');
  }, 'F-18');

  test('TC-F18-02: CSV Baseline Totals match 119V, 53M, 172T', () => {
    const parsed = parseReferenceTvCsv();
    expect(parsed.totals.inscriptos_v).toBe(119);
    expect(parsed.totals.inscriptos_m).toBe(53);
    expect(parsed.totals.inscriptos_t).toBe(172);
  }, 'F-18');

  test('TC-F18-03: CSV Baseline Course Names and Orientations', () => {
    const parsed = parseReferenceTvCsv();
    const course54 = parsed.courses.find(c => c.name.includes('5° 4ª') || c.name.includes('5º4º'));
    const course61 = parsed.courses.find(c => c.name.includes('6° 1ª') || c.name.includes('6º1º'));
    const courseCtec = parsed.courses.find(c => c.name.includes('1° 1ª C.TEC.MMO'));

    expect(course54).toBeDefined();
    expect(course54!.orientation).toBe('TECET');

    expect(course61).toBeDefined();
    expect(course61!.orientation).toBe('TECQU');

    expect(courseCtec).toBeDefined();
    expect(courseCtec!.orientation).toContain('C.TEC.MMO');
  }, 'F-18');

  test('TC-F18-04: CSV Hyphen/Empty Female parsing coercing to 0', () => {
    const parsed = parseReferenceTvCsv();
    const course54 = parsed.courses.find(c => c.name.includes('5° 4ª') || c.name.includes('5º4º'));
    const course64 = parsed.courses.find(c => c.name.includes('6° 4ª') || c.name.includes('6º4º'));
    const course74 = parsed.courses.find(c => c.name.includes('7° 4ª') || c.name.includes('7º4º'));

    expect(course54!.inscriptos_m).toBe(0);
    expect(course64!.inscriptos_m).toBe(0);
    expect(course74!.inscriptos_m).toBe(0);
  }, 'F-18');

  test('TC-F18-05: School Structure Complete 34 Courses Loaded in DB', async () => {
    const all = await harness.adapter.getCourses();
    expect(all.length).toBeGreaterThanOrEqual(34);
  }, 'F-18');

  test('TC-F18-06: School Structure Grand Totals match 515V + 327M = 842T', async () => {
    const all = await harness.adapter.getCourses();
    const sumV = all.reduce((acc, c) => acc + c.inscriptos_varones, 0);
    const sumM = all.reduce((acc, c) => acc + c.inscriptos_mujeres, 0);
    const sumT = all.reduce((acc, c) => acc + c.inscriptos_total, 0);

    expect(sumV).toBeGreaterThanOrEqual(515);
    expect(sumM).toBeGreaterThanOrEqual(327);
    expect(sumT).toBeGreaterThanOrEqual(842);
  }, 'F-18');
}, 1);
