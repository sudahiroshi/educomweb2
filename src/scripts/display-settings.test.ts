import { describe, expect, test } from 'vitest';
import { FONT_SIZE_KEY, INIT_SCRIPT, isFontSize, isTheme, THEME_KEY } from './display-settings';

describe('表示設定', () => {
  test('保存キー（CLAUDE.md・spec 5.4・5.5）', () => {
    expect(THEME_KEY).toBe('asj-edcom:theme');
    expect(FONT_SIZE_KEY).toBe('asj-edcom:font-size');
  });

  test('値の判定', () => {
    expect(isTheme('dark')).toBe(true);
    expect(isTheme('blue')).toBe(false);
    expect(isFontSize('xlarge')).toBe(true);
    expect(isFontSize('huge')).toBe(false);
  });

  test('描画前スクリプトは保存キーを使い、try/catch で囲む', () => {
    expect(INIT_SCRIPT).toContain('"asj-edcom:theme"');
    expect(INIT_SCRIPT).toContain('"asj-edcom:font-size"');
    expect(INIT_SCRIPT).toContain('try{');
    expect(INIT_SCRIPT).toContain('prefers-color-scheme: dark');
  });

  test('描画前スクリプトの動作（保存値・OS設定・不正値）', () => {
    const run = (stored: Record<string, string>, prefersDark: boolean, throws = false) => {
      const dataset: Record<string, string> = {};
      const fakeWindow = {
        matchMedia: () => ({ matches: prefersDark }),
      };
      const fakeStorage = {
        getItem: (k: string) => {
          if (throws) throw new Error('blocked');
          return stored[k] ?? null;
        },
      };
      new Function('document', 'window', 'localStorage', INIT_SCRIPT)(
        { documentElement: { dataset } },
        fakeWindow,
        fakeStorage,
      );
      return dataset;
    };
    expect(run({}, false)).toEqual({ theme: 'light', fontSize: 'normal', js: '' });
    expect(run({}, true)).toEqual({ theme: 'dark', fontSize: 'normal', js: '' });
    expect(run({ [THEME_KEY]: 'light', [FONT_SIZE_KEY]: 'xlarge' }, true)).toEqual({
      theme: 'light',
      fontSize: 'xlarge',
      js: '',
    });
    expect(run({ [THEME_KEY]: 'blue', [FONT_SIZE_KEY]: 'huge' }, true)).toEqual({
      theme: 'dark',
      fontSize: 'normal',
      js: '',
    });
    expect(run({}, true, true)).toEqual({ theme: 'dark', fontSize: 'normal', js: '' });
  });
});
