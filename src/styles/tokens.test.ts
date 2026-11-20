/**
 * 色のコントラスト比（plan 11.2、spec 5.1・8章）。
 * tokens.css のライト・ダークの値を読み、文字と背景の組み合わせが 4.5:1 以上かを確かめる。
 * 実際の画面での組み合わせは npm run check:a11y（axe の color-contrast）でも点検している。
 */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
const darkStart = css.lastIndexOf("[data-theme='dark']");

function tokensOf(block: string): Map<string, string> {
  return new Map(
    [...block.matchAll(/--color-([a-z-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [
      m[1] ?? '',
      (m[2] ?? '').toLowerCase(),
    ]),
  );
}

const themes = {
  light: tokensOf(css.slice(0, darkStart)),
  dark: tokensOf(css.slice(darkStart)),
};

/** WCAG 2 の相対輝度 */
function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

/** 文字色 → その文字が載る背景（spec 5.1 の用途どおり） */
const TEXT_PAIRS: Record<string, string[]> = {
  text: ['bg', 'surface', 'accent-soft'],
  muted: ['bg', 'surface', 'accent-soft'],
  accent: ['bg', 'surface', 'accent-soft'],
  'on-accent': ['accent'],
  'accent-soft-text': ['accent-soft', 'bg', 'surface'],
};

describe.each(Object.entries(themes))('%s', (_theme, tokens) => {
  test('spec 5.1 のトークンがすべて定義されている', () => {
    expect([...tokens.keys()].sort()).toEqual(
      [
        'accent',
        'accent-soft',
        'accent-soft-text',
        'bg',
        'border',
        'focus',
        'muted',
        'on-accent',
        'surface',
        'text',
        'wave-sub',
      ].sort(),
    );
  });

  for (const [fg, backgrounds] of Object.entries(TEXT_PAIRS)) {
    for (const bg of backgrounds) {
      test(`文字 ${fg} / 背景 ${bg} が 4.5:1 以上`, () => {
        expect(contrastRatio(tokens.get(fg) ?? '', tokens.get(bg) ?? '')).toBeGreaterThanOrEqual(
          4.5,
        );
      });
    }
  }
});

test('相対輝度の計算（白と黒は 21:1）', () => {
  expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
  expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
});
