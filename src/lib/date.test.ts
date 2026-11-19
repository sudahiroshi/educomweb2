import { describe, expect, test } from 'vitest';
import { parseYmd, todayInTokyo, weekdayOf } from './date';

describe('todayInTokyo', () => {
  test('日本時間の0時で日付が変わる（UTC 15:00）', () => {
    expect(todayInTokyo(new Date('2026-03-31T14:59:59Z'))).toBe('2026-03-31');
    expect(todayInTokyo(new Date('2026-03-31T15:00:00Z'))).toBe('2026-04-01');
  });

  test('年またぎ', () => {
    expect(todayInTokyo(new Date('2026-12-31T14:59:59Z'))).toBe('2026-12-31');
    expect(todayInTokyo(new Date('2026-12-31T15:00:00Z'))).toBe('2027-01-01');
  });
});

describe('weekdayOf', () => {
  test('spec の例', () => {
    expect(weekdayOf('2027-03-09')).toBe('火');
    expect(weekdayOf('2027-03-10')).toBe('水');
    expect(weekdayOf('2027-03-11')).toBe('木');
  });

  test('うるう日・年始', () => {
    expect(weekdayOf('2028-02-29')).toBe('火');
    expect(weekdayOf('2027-01-01')).toBe('金');
  });
});

describe('parseYmd', () => {
  test('分解と形式違い', () => {
    expect(parseYmd('2026-04-01')).toEqual({ year: 2026, month: 4, day: 1 });
    expect(() => parseYmd('2026/04/01')).toThrow();
  });
});
