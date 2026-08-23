import { describe, test, it, expect, beforeAll } from '../runner/framework';
import { createTestHarness, TestHarness, getTodayString } from '../harness/harness';

describe('Tier 1: Export Engine & Fidelity (F-15, F-16)', () => {
  let harness: TestHarness;

  beforeAll(async () => {
    harness = await createTestHarness({ adapter: 'mock' });
  });

  // =========================================================================
  // Feature F-15: Excel (.xlsx) Export Engine (R3)
  // =========================================================================
  test('TC-F15-01: Excel Export Generates Valid OpenXML ZIP Buffer', async () => {
    const today = getTodayString();
    const buffer = await harness.adapter.generateExcelExport(today, 'vespertino');
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(10);

    // Verify ZIP magic bytes: PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4B);
    expect(buffer[2]).toBe(0x03);
    expect(buffer[3]).toBe(0x04);
  }, 'F-15');

  test('TC-F15-02: Excel Export Matches Sheet Name and Metadata', async () => {
    const today = getTodayString();
    const buffer = await harness.adapter.generateExcelExport(today, 'vespertino');
    const contentStr = buffer.toString('utf-8');
    expect(contentStr).toContain('Parte General - Turno Vespertino');
    expect(contentStr).toContain('ESCUELA DE EDUCACIÓN SECUNDARIA TÉCNICA N° 3');
  }, 'F-15');

  test('TC-F15-03: Excel Export Contains All 10 Vespertino Course Rows', async () => {
    const today = getTodayString();
    const buffer = await harness.adapter.generateExcelExport(today, 'vespertino');
    const contentStr = buffer.toString('utf-8');
    expect(contentStr).toContain('5° 4ª');
    expect(contentStr).toContain('6° 1ª');
    expect(contentStr).toContain('7° 3ª');
    expect(contentStr).toContain('1° 1ª C.TEC.MMO');
  }, 'F-15');

  test('TC-F15-04: Excel Export Contains Mathematical Formulas in Totals Row', async () => {
    const today = getTodayString();
    const buffer = await harness.adapter.generateExcelExport(today, 'vespertino');
    const contentStr = buffer.toString('utf-8');
    expect(contentStr).toContain('=SUM(C7:C16)');
    expect(contentStr).toContain('=SUM(D7:D16)');
    expect(contentStr).toContain('=SUM(E7:E16)');
  }, 'F-15');

  test('TC-F15-05: Excel Export Multi-Shift Execution (Mañana and Tarde)', async () => {
    const today = getTodayString();
    const bufferTM = await harness.adapter.generateExcelExport(today, 'manana');
    const bufferTT = await harness.adapter.generateExcelExport(today, 'tarde');

    expect(bufferTM.toString('utf-8')).toContain('Turno Mañana');
    expect(bufferTT.toString('utf-8')).toContain('Turno Tarde');
  }, 'F-15');

  test('TC-F15-06: Excel Export Includes Absent Staff Section', async () => {
    const today = getTodayString();
    const buffer = await harness.adapter.generateExcelExport(today, 'vespertino');
    const contentStr = buffer.toString('utf-8');
    expect(contentStr).toContain('absentStaff');
  }, 'F-15');

  // =========================================================================
  // Feature F-16: PDF Printable Export Engine (R3)
  // =========================================================================
  test('TC-F16-01: PDF Export Begins with Standard %PDF- Header', async () => {
    const today = getTodayString();
    const pdfBuffer = await harness.adapter.generatePdfExport(today, 'vespertino');
    expect(pdfBuffer).toBeDefined();
    const headerStr = pdfBuffer.slice(0, 8).toString('utf-8');
    expect(headerStr).toContain('%PDF-1.');
  }, 'F-16');

  test('TC-F16-02: PDF Export Ends with Standard %%EOF Marker', async () => {
    const today = getTodayString();
    const pdfBuffer = await harness.adapter.generatePdfExport(today, 'vespertino');
    const footerStr = pdfBuffer.slice(pdfBuffer.length - 10).toString('utf-8');
    expect(footerStr).toContain('%%EOF');
  }, 'F-16');

  test('TC-F16-03: PDF Document Contains Institutional Header', async () => {
    const today = getTodayString();
    const pdfBuffer = await harness.adapter.generatePdfExport(today, 'vespertino');
    const pdfText = pdfBuffer.toString('utf-8');
    expect(pdfText).toContain('ESCUELA DE EDUCACIÓN SECUNDARIA TÉCNICA N° 3');
    expect(pdfText).toContain('Ntra. Sra. de la Merced');
    expect(pdfText).toContain('PARTE GENERAL - ALUMNOS');
    expect(pdfText).toContain('LOMA HERMOSA');
  }, 'F-16');

  test('TC-F16-04: PDF Document Contains Course Table Entries & Totals', async () => {
    const today = getTodayString();
    const pdfBuffer = await harness.adapter.generatePdfExport(today, 'vespertino');
    const pdfText = pdfBuffer.toString('utf-8');
    expect(pdfText).toContain('6° 1ª');
    expect(pdfText).toContain('TECQU');
    expect(pdfText).toContain('TOTAL: Inscriptos: 119V, 53M, 172T');
  }, 'F-16');

  test('TC-F16-05: PDF Document Contains Preceptor and Directivo Signature Lines', async () => {
    const today = getTodayString();
    const pdfBuffer = await harness.adapter.generatePdfExport(today, 'vespertino');
    const pdfText = pdfBuffer.toString('utf-8');
    expect(pdfText).toContain('Firma Preceptor');
    expect(pdfText).toContain('Firma Directivo');
  }, 'F-16');

  test('TC-F16-06: PDF Geometry Definition Matches A4 Page (595.28 x 841.89)', async () => {
    const today = getTodayString();
    const pdfBuffer = await harness.adapter.generatePdfExport(today, 'vespertino');
    const pdfText = pdfBuffer.toString('utf-8');
    expect(pdfText).toContain('MediaBox [0 0 595.28 841.89]');
  }, 'F-16');
}, 1);
