import { describe, expect, test } from 'vitest';
import {
  eventDateLabel,
  eventUrl,
  KIND_LABELS,
  kindFiscalYearUrl,
  kindListTitle,
  kindListUrl,
  upcomingTexts,
} from './event-kind';

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
    expect(kindListUrl('media')).toBe('/media/');
    expect(eventUrl({ id: '2024-09-14-c', data: { kind: 'media' } })).toBe('/media/2024-09-14-c/');
    expect(kindFiscalYearUrl('media', 2024)).toBe('/media/fy/2024/');
  });

  test('一覧ページの名前', () => {
    expect(kindListTitle('activity')).toBe('活動記録');
    expect(kindListTitle('asj')).toBe('音響学会研究発表会');
    expect(kindListTitle('media')).toBe('メディア出演');
  });

  test('日付の見出しと開催予定欄の文言（メディア出演は掲載・放送）', () => {
    expect(eventDateLabel('asj')).toBe('開催日');
    expect(eventDateLabel('media')).toBe('掲載日・放送日');
    expect(upcomingTexts(undefined).title).toBe('開催予定');
    expect(upcomingTexts('media')).toEqual({
      title: '掲載・放送予定',
      empty: '現在予定されている掲載・放送はありません。',
    });
  });
});
