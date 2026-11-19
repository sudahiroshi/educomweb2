import { describe, expect, test } from 'vitest';
import { GITHUB_URL_MAX, planAddToGitHub } from './github-actions';

describe('記事を GitHub に追加', () => {
  const path = 'src/content/news/2026-11-19-a.md';

  test('短い記事は内容入りの新規作成画面', () => {
    const plan = planAddToGitHub(path, '---\ntitle: あ\n---\n\n本文\n');
    expect(plan.mode).toBe('direct');
    expect(new URL(plan.url).searchParams.get('value')).toBe('---\ntitle: あ\n---\n\n本文\n');
  });

  test('長い記事はコピーして貼り付ける手順（URL の上限を超える）', () => {
    const md = '---\ntitle: あ\n---\n\n' + 'あ'.repeat(800) + '\n';
    const plan = planAddToGitHub(path, md);
    expect(plan.mode).toBe('paste');
    expect(plan.mode === 'paste' && plan.length).toBeGreaterThan(GITHUB_URL_MAX);
    expect(new URL(plan.url).searchParams.has('value')).toBe(false);
    expect(new URL(plan.url).searchParams.get('filename')).toBe(path);
  });

  test('既存記事を修正した場合は既存ファイルの編集画面（ファイル名を変えたら新規）', () => {
    expect(planAddToGitHub(path, 'x', path)).toEqual({
      mode: 'edit',
      url: 'https://github.com/sudahiroshi/educomweb2/edit/main/src/content/news/2026-11-19-a.md',
    });
    expect(planAddToGitHub(path, 'x', 'src/content/news/2026-11-18-old.md').mode).toBe('direct');
  });
});
