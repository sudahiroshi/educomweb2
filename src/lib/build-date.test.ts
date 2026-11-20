import { describe, expect, test } from 'vitest';
import { resolveBuildToday } from './build-date';

describe('ビルド日', () => {
  test('指定がなければ日本時間の今日', () => {
    expect(resolveBuildToday(undefined, new Date('2027-03-31T15:00:00Z'))).toBe('2027-04-01');
    expect(resolveBuildToday('', new Date('2027-03-31T14:59:59Z'))).toBe('2027-03-31');
  });

  test('時計がおかしい環境（1970年など）ではエラー', () => {
    expect(() => resolveBuildToday(undefined, new Date(0))).toThrow();
  });

  test('環境変数で差し替え（不正な値はエラー）', () => {
    expect(resolveBuildToday('2027-04-03')).toBe('2027-04-03');
    expect(() => resolveBuildToday('2027-02-30')).toThrow();
    expect(() => resolveBuildToday('20270403')).toThrow();
  });
});
