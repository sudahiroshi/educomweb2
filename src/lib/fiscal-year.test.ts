import { describe, expect, test } from 'vitest';
import { eventFiscalYear, fiscalYearOf, formatFiscalYear } from './fiscal-year';

describe('年度', () => {
  test('境目は4月1日', () => {
    expect(fiscalYearOf('2027-03-31')).toBe(2026);
    expect(fiscalYearOf('2027-04-01')).toBe(2027);
    expect(fiscalYearOf('2027-01-01')).toBe(2026);
    expect(fiscalYearOf('2026-12-31')).toBe(2026);
  });

  test('events は開始日で決める（年度をまたぐ開催）', () => {
    expect(eventFiscalYear({ data: { startDate: '2027-03-30' } })).toBe(2026);
  });

  test('表示', () => {
    expect(formatFiscalYear(2026)).toBe('2026年度');
  });
});
