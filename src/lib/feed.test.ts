import { describe, expect, test } from 'vitest';
import { buildFeedItems, feedDate } from './feed';

describe('RSS の項目', () => {
  test('お知らせと events を掲載日の新しい順に並べる（同日は ID の降順）', () => {
    const items = buildFeedItems(
      [
        { id: '2026-11-19-a', body: '本文A', data: { title: 'A', published: '2026-11-19' } },
        { id: '2026-04-01-b', data: { title: 'B', published: '2026-04-01', summary: '概要B' } },
      ],
      [
        { id: '2027-03-09-c', data: { kind: 'asj', title: 'C', published: '2026-11-19' } },
        { id: '2026-08-05-d', data: { kind: 'activity', title: 'D', published: '2026-07-01' } },
      ],
    );
    expect(items.map((i) => i.title)).toEqual(['C', 'A', 'D', 'B']);
    expect(items[0]?.link).toBe('/meetings/asj/2027-03-09-c/');
    expect(items[2]?.link).toBe('/activities/2026-08-05-d/');
    expect(items[1]?.description).toBe('本文A');
    expect(items[3]?.description).toBe('概要B');
  });

  test('件数の上限', () => {
    const news = Array.from({ length: 5 }, (_, i) => ({
      id: `2026-01-0${i + 1}-n`,
      data: { title: String(i), published: `2026-01-0${i + 1}` },
    }));
    expect(buildFeedItems(news, [], 3)).toHaveLength(3);
  });

  test('日付は日本時間 0時（UTC の前日 15時）', () => {
    expect(feedDate('2026-11-19').toISOString()).toBe('2026-11-18T15:00:00.000Z');
  });
});
