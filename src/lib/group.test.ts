import { describe, expect, test } from 'vitest';
import { groupByFiscalYear } from './group';

describe('groupByFiscalYear', () => {
  test('年度で振り分け、年度は降順、中の順序は保つ', () => {
    const items = ['2026-11-19', '2026-04-01', '2026-03-31', '2024-10-01'];
    const { byFiscalYear, fiscalYears } = groupByFiscalYear(items, (d) => d);
    expect(fiscalYears).toEqual([2026, 2025, 2024]);
    expect(byFiscalYear.get(2026)).toEqual(['2026-11-19', '2026-04-01']);
    expect(byFiscalYear.get(2025)).toEqual(['2026-03-31']);
  });

  test('空', () => {
    expect(groupByFiscalYear([], (d: string) => d).fiscalYears).toEqual([]);
  });
});
