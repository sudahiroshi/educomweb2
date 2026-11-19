import { describe, expect, test } from 'vitest';
import { z } from 'astro/zod';
import {
  committeeSchema,
  createNewsSchema,
  dateSchema,
  eventSchema,
  isReservedPageSlug,
  isValidDateString,
  linkSchema,
  newsSchema,
  pageSchema,
  slugSchema,
  timeSchema,
} from './index';

/** 失敗したときの issue の path を "a.0.b" 形式で返す */
function errorPaths(schema: z.ZodType, data: unknown): string[] {
  const r = schema.safeParse(data);
  return r.success ? [] : r.error.issues.map((i) => i.path.join('.'));
}

describe('日付', () => {
  test('実在日付の判定（うるう年を含む）', () => {
    expect(isValidDateString('2026-11-19')).toBe(true);
    expect(isValidDateString('2028-02-29')).toBe(true);
    expect(isValidDateString('2026-02-29')).toBe(false);
    expect(isValidDateString('2100-02-29')).toBe(false);
    expect(isValidDateString('2000-02-29')).toBe(true);
    expect(isValidDateString('2026-04-31')).toBe(false);
    expect(isValidDateString('2026-13-01')).toBe(false);
    expect(isValidDateString('2026-1-1')).toBe(false);
  });

  test('文字列はそのまま受け付ける', () => {
    expect(dateSchema.parse('2027-03-09')).toBe('2027-03-09');
  });

  test('YAML の timestamp（UTC 0時の Date）は元の文字列に戻す', () => {
    // Astro のフロントマター読み込みでは引用符なしの日付が Date になる
    expect(dateSchema.parse(new Date('2027-03-09'))).toBe('2027-03-09');
    expect(dateSchema.parse(new Date('2027-01-01'))).toBe('2027-01-01');
  });

  test('形式違い・存在しない日付は不可', () => {
    expect(dateSchema.safeParse('2027/03/09').success).toBe(false);
    expect(dateSchema.safeParse('2027-02-30').success).toBe(false);
    expect(dateSchema.safeParse(20270309).success).toBe(false);
  });
});

describe('時刻', () => {
  test('HH:MM（24時間制）', () => {
    expect(timeSchema.safeParse('00:00').success).toBe(true);
    expect(timeSchema.safeParse('23:59').success).toBe(true);
    expect(timeSchema.safeParse('24:00').success).toBe(false);
    expect(timeSchema.safeParse('9:00').success).toBe(false);
  });
});

describe('外部リンク', () => {
  test('http と https を許可し、それ以外は不可', () => {
    expect(linkSchema.safeParse({ label: '公式', url: 'https://example.org/' }).success).toBe(true);
    expect(linkSchema.safeParse({ label: '公式', url: 'http://example.org/' }).success).toBe(true);
    expect(linkSchema.safeParse({ label: '公式', url: 'ftp://example.org/' }).success).toBe(false);
    expect(linkSchema.safeParse({ label: '公式', url: 'example.org' }).success).toBe(false);
    expect(linkSchema.safeParse({ label: ' ', url: 'https://example.org/' }).success).toBe(false);
  });
});

describe('スラッグ', () => {
  test('形式と長さ', () => {
    expect(slugSchema.safeParse('site-renewal').success).toBe(true);
    expect(slugSchema.safeParse('ab').success).toBe(false);
    expect(slugSchema.safeParse('a'.repeat(61)).success).toBe(false);
    expect(slugSchema.safeParse('Site').success).toBe(false);
    expect(slugSchema.safeParse('a--b').success).toBe(false);
    expect(slugSchema.safeParse('-abc').success).toBe(false);
  });
});

describe('news', () => {
  const ok = { title: 'サイトをリニューアルしました', published: '2026-11-19' };

  test('最小構成', () => {
    expect(newsSchema.parse(ok)).toEqual(ok);
  });

  test('必須・文字数', () => {
    expect(errorPaths(newsSchema, { published: '2026-11-19' })).toEqual(['title']);
    expect(errorPaths(newsSchema, { ...ok, title: 'あ'.repeat(121) })).toEqual(['title']);
  });

  test('更新日は掲載日以降', () => {
    expect(errorPaths(newsSchema, { ...ok, updated: '2026-11-18' })).toEqual(['updated']);
    expect(newsSchema.safeParse({ ...ok, updated: '2026-11-19' }).success).toBe(true);
  });

  test('related の要素の型を差し替えられる', () => {
    const custom = createNewsSchema(z.literal('x'));
    expect(custom.safeParse({ ...ok, related: ['x'] }).success).toBe(true);
    expect(custom.safeParse({ ...ok, related: ['y'] }).success).toBe(false);
  });
});

describe('events', () => {
  const ok = {
    kind: 'asj',
    title: '日本音響学会 2027年春季研究発表会',
    published: '2026-11-01',
    startDate: '2027-03-09',
    endDate: '2027-03-11',
  };

  test('既定値', () => {
    const e = eventSchema.parse(ok);
    expect(e.listInActivities).toBe(false);
  });

  test('種類は4つのみ', () => {
    expect(errorPaths(eventSchema, { ...ok, kind: 'other' })).toEqual(['kind']);
  });

  test('終了日は開始日以降（1日開催は終了日なし）', () => {
    expect(errorPaths(eventSchema, { ...ok, endDate: '2027-03-08' })).toEqual(['endDate']);
    expect(eventSchema.safeParse({ ...ok, endDate: '2027-03-09' }).success).toBe(true);
    const { endDate: _endDate, ...oneDay } = ok;
    expect(eventSchema.safeParse(oneDay).success).toBe(true);
  });

  test('セッションの日付は開催期間内', () => {
    const s = (date: string) => ({ ...ok, sessions: [{ name: '音響教育', date }] });
    expect(eventSchema.safeParse(s('2027-03-09')).success).toBe(true);
    expect(eventSchema.safeParse(s('2027-03-11')).success).toBe(true);
    expect(errorPaths(eventSchema, s('2027-03-12'))).toEqual(['sessions.0.date']);
    expect(errorPaths(eventSchema, s('2027-03-08'))).toEqual(['sessions.0.date']);
  });

  test('1日開催ではセッションの日付は開始日のみ', () => {
    const { endDate: _endDate, ...oneDay } = ok;
    const data = { ...oneDay, sessions: [{ name: 'A', date: '2027-03-10' }] };
    expect(errorPaths(eventSchema, data)).toEqual(['sessions.0.date']);
  });

  test('終了時刻は開始時刻より後', () => {
    const t = (startTime: string, endTime: string) => ({
      ...ok,
      sessions: [{ name: 'A', startTime, endTime }],
    });
    expect(eventSchema.safeParse(t('13:00', '15:00')).success).toBe(true);
    expect(errorPaths(eventSchema, t('13:00', '13:00'))).toEqual(['sessions.0.endTime']);
  });

  test('講演：番号の数値は文字列に、共著者ありの既定は false', () => {
    const e = eventSchema.parse({
      ...ok,
      sessions: [{ name: 'A', talks: [{ number: 12, title: '演題', presenter: '氏名' }] }],
    });
    expect(e.sessions?.[0]?.talks?.[0]).toEqual({
      number: '12',
      title: '演題',
      presenter: '氏名',
      hasCoauthors: false,
    });
  });

  test('講演：演題と発表者は必須', () => {
    const data = { ...ok, sessions: [{ name: 'A', talks: [{ title: '演題' }] }] };
    expect(errorPaths(eventSchema, data)).toEqual(['sessions.0.talks.0.presenter']);
  });
});

describe('committee', () => {
  const ok = {
    fiscalYear: 2026,
    published: '2026-04-01',
    members: [{ role: '委員長', name: '[氏名]', affiliation: '[所属]' }],
  };

  test('最小構成', () => {
    expect(committeeSchema.safeParse(ok).success).toBe(true);
  });

  test('名簿は1名以上、役職と氏名は必須', () => {
    expect(errorPaths(committeeSchema, { ...ok, members: [] })).toEqual(['members']);
    expect(errorPaths(committeeSchema, { ...ok, members: [{ role: '委員' }] })).toEqual([
      'members.0.name',
    ]);
  });

  test('年度は整数', () => {
    expect(errorPaths(committeeSchema, { ...ok, fiscalYear: '2026' })).toEqual(['fiscalYear']);
    expect(errorPaths(committeeSchema, { ...ok, fiscalYear: 2026.5 })).toEqual(['fiscalYear']);
  });
});

describe('pages', () => {
  test('既定値', () => {
    expect(pageSchema.parse({ title: '委員会について' })).toEqual({
      title: '委員会について',
      showInMenu: true,
      menuOrder: 100,
    });
  });

  test('予約語', () => {
    expect(isReservedPageSlug('news')).toBe(true);
    expect(isReservedPageSlug('pagefind')).toBe(true);
    expect(isReservedPageSlug('about')).toBe(false);
  });
});
