import { describe, expect, test } from 'vitest';
import { textLang } from './lang';

describe('textLang', () => {
  test('英語のみなら en', () => {
    expect(textLang('International Congress on Acoustics 2027')).toBe('en');
    expect(textLang('ICA 2027: Education in Acoustics')).toBe('en');
  });

  test('日本語を含めば undefined', () => {
    expect(textLang('日本音響学会 2027年春季研究発表会')).toBeUndefined();
    expect(textLang('［サンプル］Acoustics Education Symposium')).toBeUndefined();
    expect(textLang('2027')).toBeUndefined();
  });
});
