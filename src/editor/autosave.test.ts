// @vitest-environment happy-dom
import { beforeEach, describe, expect, test } from 'vitest';
import { clearDraft, DRAFT_KEY, formatSavedAt, loadDraft, saveDraft } from './autosave';
import { emptyDraft } from './model';

describe('下書きのブラウザ内保存', () => {
  beforeEach(() => localStorage.clear());

  test('保存して読み込み、消去する', () => {
    const d = emptyDraft('asj', '2026-11-19');
    d.event.title = '研究発表会';
    expect(saveDraft(d, new Date('2026-11-19T03:04:00Z'))).toBe(true);
    expect(loadDraft()).toEqual({ savedAt: '2026-11-19T03:04:00.000Z', draft: d });
    clearDraft();
    expect(loadDraft()).toBeNull();
  });

  test('壊れた値・形の違う値は無視する', () => {
    localStorage.setItem(DRAFT_KEY, '{broken');
    expect(loadDraft()).toBeNull();
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: 'x', draft: { kind: 'blog' } }));
    expect(loadDraft()).toBeNull();
  });

  test('localStorage が使えない環境でも例外にならない', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    } as unknown as Storage;
    expect(saveDraft(emptyDraft(), new Date(), broken)).toBe(false);
    expect(loadDraft(broken)).toBeNull();
    expect(() => clearDraft(broken)).not.toThrow();
  });

  test('保存日時の表示（日本時間）', () => {
    expect(formatSavedAt('2026-11-19T03:04:00Z')).toBe('2026/11/19 12:04');
  });
});
