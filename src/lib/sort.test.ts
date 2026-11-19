import { describe, expect, test } from 'vitest';
import { compareFiscalYearDesc, compareNews } from './sort';

const news = (id: string, published: string, updated?: string) => ({
  id,
  data: updated === undefined ? { published } : { published, updated },
});

describe('お知らせの並び', () => {
  test('掲載日の降順、同日は更新日→ID', () => {
    const list = [
      news('2026-11-01-a', '2026-11-01'),
      news('2026-11-19-b', '2026-11-19'),
      news('2026-11-19-c', '2026-11-19', '2026-11-20'),
      news('2026-11-19-d', '2026-11-19'),
    ];
    expect([...list].sort(compareNews).map((n) => n.id)).toEqual([
      '2026-11-19-c',
      '2026-11-19-d',
      '2026-11-19-b',
      '2026-11-01-a',
    ]);
  });
});

describe('年度の並び', () => {
  test('降順', () => {
    expect([2024, 2026, 2025].sort(compareFiscalYearDesc)).toEqual([2026, 2025, 2024]);
  });
});
