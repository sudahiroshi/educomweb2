import { describe, expect, test } from 'vitest';
import { eventUrl, KIND_LABELS, kindFiscalYearUrl, kindListTitle, kindListUrl } from './event-kind';

describe('種類ごとの表示名と URL', () => {
  test('ラベル（T-07 既定案）', () => {
    expect(KIND_LABELS.activity.short).toBe('委員会活動');
    expect(KIND_LABELS.asj).toEqual({ full: '音響学会研究発表会', short: '研究発表会' });
  });

  test('URL', () => {
    expect(kindListUrl('activity')).toBe('/activities/');
    expect(kindListUrl('cosponsored')).toBe('/meetings/cosponsored/');
    expect(eventUrl({ id: '2026-08-05-a', data: { kind: 'activity' } })).toBe(
      '/activities/2026-08-05-a/',
    );
    expect(eventUrl({ id: '2027-03-09-b', data: { kind: 'asj' } })).toBe(
      '/meetings/asj/2027-03-09-b/',
    );
    expect(kindFiscalYearUrl('international', 2025)).toBe('/meetings/international/fy/2025/');
  });

  test('一覧ページの名前', () => {
    expect(kindListTitle('activity')).toBe('活動記録');
    expect(kindListTitle('asj')).toBe('音響学会研究発表会');
  });
});
