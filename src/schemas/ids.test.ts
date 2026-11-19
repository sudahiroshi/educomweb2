import { describe, expect, test } from 'vitest';
import { checkCommitteeYear, checkEntryId, splitDatedId } from './index';

describe('ID の検査', () => {
  test('news・events は {日付}-{スラッグ}', () => {
    expect(checkEntryId('news', '2026-11-19-site-renewal')).toEqual([]);
    expect(checkEntryId('events', '2027-03-09-asj-spring-2027')).toEqual([]);
    expect(checkEntryId('news', 'site-renewal')).toHaveLength(1);
    expect(checkEntryId('news', '2026-02-30-abc')).toHaveLength(1);
    expect(checkEntryId('news', '2026-11-19-ab')).toHaveLength(1);
    expect(checkEntryId('events', '2026-11-19-Site')).toHaveLength(1);
  });

  test('サブフォルダは不可', () => {
    expect(checkEntryId('news', '2026/2026-11-19-site-renewal')).toHaveLength(1);
  });

  test('committee は4桁の年度', () => {
    expect(checkEntryId('committee', '2026')).toEqual([]);
    expect(checkEntryId('committee', 'fy2026')).toHaveLength(1);
  });

  test('pages はスラッグかつ予約語でない', () => {
    expect(checkEntryId('pages', 'about')).toEqual([]);
    expect(checkEntryId('pages', 'news')).toHaveLength(1);
    expect(checkEntryId('pages', 'ab')).toHaveLength(1);
  });

  test('分解', () => {
    expect(splitDatedId('2026-11-19-site-renewal')).toEqual({
      date: '2026-11-19',
      slug: 'site-renewal',
    });
    expect(splitDatedId('about')).toBeUndefined();
  });

  test('運営委員の年度とファイル名', () => {
    expect(checkCommitteeYear('2026', 2026)).toBeUndefined();
    expect(checkCommitteeYear('2026', 2025)).toBeTypeOf('string');
  });
});
