import { describe, expect, test } from 'vitest';
import { formatPresenter } from './talk';

describe('発表者の表示', () => {
  test('共著者ありなら「他」を付ける', () => {
    expect(formatPresenter({ presenter: '音響 太郎', hasCoauthors: true })).toBe('音響 太郎 他');
    expect(formatPresenter({ presenter: '音響 太郎', hasCoauthors: false })).toBe('音響 太郎');
  });
});
