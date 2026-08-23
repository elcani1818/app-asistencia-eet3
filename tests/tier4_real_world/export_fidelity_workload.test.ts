import { describe, it, expect, beforeAll } from '../runner/framework';
import { createTestHarness, TestHarness, getTodayString } from '../harness/harness';
import { UserSession } from '../harness/types';

describe('Tier 4: Export Engine Binary & Visual Stream Fidelity', () => {
  let harness: TestHarness;
  let adminSession: UserSession;

  beforeAll(async () => {
    harness = await createTestHarness({ adapter: 'mock' });
    adminSession = await harness.createAdminActor();
  });

  it('EXP-01: Excel binary buffer adheres to OpenXML ZIP format specifications', async () => {
    const today = getTodayString();
    const excelBuffer = await harness.adapter.generateExcelExport(today, 'vespertino');

    expect(excelBuffer).toBeDefined();
    expect(excelBuffer.length).toBeGreaterThan(50);
    // Magic bytes PK\x03\x04
    expect(excelBuffer[0]).toBe(0x50);
    expect(excelBuffer[1]).toBe(0x4B);
  });

  it('EXP-02: Excel export contains required cell coordinates and dynamic formulas (=SUM)', async () => {
    const today = getTodayString();
    const excelBuffer = await harness.adapter.generateExcelExport(today, 'vespertino');
    const jsonStr = excelBuffer.toString('utf-8');

    expect(jsonStr).toContain('formulas');
    expect(jsonStr).toContain('=SUM(C7:C16)');
    expect(jsonStr).toContain('=SUM(D7:D16)');
    expect(jsonStr).toContain('=SUM(E7:E16)');
  });

  it('EXP-03: PDF export conforms to %PDF-1.x and contains A4 dimensions and signatures', async () => {
    const today = getTodayString();
    const pdfBuffer = await harness.adapter.generatePdfExport(today, 'vespertino');
    const pdfStr = pdfBuffer.toString('utf-8');

    expect(pdfStr.startsWith('%PDF-1.')).toBe(true);
    expect(pdfStr).toContain('%%EOF');
    expect(pdfStr).toContain('MediaBox [0 0 595.28 841.89]');
    expect(pdfStr).toContain('ESCUELA DE EDUCACIÓN SECUNDARIA TÉCNICA N° 3');
    expect(pdfStr).toContain('Firma Preceptor');
    expect(pdfStr).toContain('Firma Directivo');
  });
}, 4);
