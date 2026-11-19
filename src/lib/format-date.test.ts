import { describe, expect, test } from 'vitest';
import {
  dateBlock,
  formatDate,
  formatEventDate,
  formatSessionDateTime,
  formatYearMonth,
} from './format-date';

describe('日付の表示', () => {
  test('掲載日', () => {
    expect(formatDate('2026-11-19')).toBe('2026年11月19日');
    expect(formatDate('2027-03-09')).toBe('2027年3月9日');
  });

  test('年月', () => {
    expect(formatYearMonth('2026-09-01')).toBe('2026年9月');
  });

  test('開催日：1日', () => {
    expect(formatEventDate('2027-03-09')).toBe('2027年3月9日（火）');
    expect(formatEventDate('2027-03-09', '2027-03-09')).toBe('2027年3月9日（火）');
  });

  test('開催日：同月内', () => {
    expect(formatEventDate('2027-03-09', '2027-03-11')).toBe('2027年3月9日（火）〜11日（木）');
  });

  test('開催日：月またぎ', () => {
    expect(formatEventDate('2027-03-30', '2027-04-02')).toBe('2027年3月30日（火）〜4月2日（金）');
  });

  test('開催日：年またぎ', () => {
    expect(formatEventDate('2026-12-28', '2027-01-05')).toBe(
      '2026年12月28日（月）〜2027年1月5日（火）',
    );
  });

  test('セッション日時', () => {
    expect(formatSessionDateTime('2027-03-10', '13:00', '15:00')).toBe(
      '3月10日（水） 13:00〜15:00',
    );
    expect(formatSessionDateTime('2027-03-10')).toBe('3月10日（水）');
    expect(formatSessionDateTime(undefined, '13:00')).toBe('13:00〜');
    expect(formatSessionDateTime()).toBe('');
  });

  test('日付ブロック', () => {
    expect(dateBlock('2027-03-09')).toEqual({ year: '2027', month: '3月', day: '9日' });
    expect(dateBlock('2027-03-09', '2027-03-11')).toEqual({
      year: '2027',
      month: '3月',
      day: '9日〜11日',
    });
    expect(dateBlock('2027-03-30', '2027-04-02')).toEqual({
      year: '2027',
      month: '3月',
      day: '30日〜4月2日',
    });
    expect(dateBlock('2026-12-28', '2027-01-05')).toEqual({
      year: '2026',
      month: '12月',
      day: '28日〜1月5日',
    });
  });
});
