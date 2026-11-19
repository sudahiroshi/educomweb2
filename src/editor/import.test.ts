import { describe, expect, test } from 'vitest';
import { detectFromPath, detectKind, importMarkdown } from './import';
import { toFrontmatter } from './model';

describe('既存記事の読み込み', () => {
  test('パスから種類と ID', () => {
    expect(detectFromPath('src/content/events/2027-03-09-a.md')).toEqual({
      collection: 'events',
      id: '2027-03-09-a',
    });
    expect(detectFromPath('2026.md')).toEqual({ id: '2026' });
  });

  test('フロントマターから種類を推定', () => {
    expect(detectKind({ kind: 'asj' })).toBe('asj');
    expect(detectKind({ fiscalYear: 2026, members: [] })).toBe('committee');
    expect(detectKind({ title: 'a', menuOrder: 10 })).toBe('pages');
    expect(detectKind({ title: 'a', published: '2026-01-01' })).toBeUndefined();
    expect(detectKind({ title: 'a' }, 'news')).toBe('news');
  });

  test('events を読み込み、フロントマターに戻すと同じ内容になる', () => {
    const md = [
      '---',
      'kind: asj',
      'title: 研究発表会',
      'published: 2026-11-01',
      'startDate: 2027-03-09',
      'endDate: 2027-03-11',
      'listInActivities: true',
      'sessions:',
      '  - name: 音響教育',
      '    startTime: "13:00"',
      '    talks:',
      '      - number: 2-3-1',
      '        title: 演題',
      '        presenter: 氏名',
      '        hasCoauthors: true',
      '---',
      '',
      '本文',
      '',
    ].join('\n');
    const r = importMarkdown(md, 'src/content/events/2027-03-09-spring.md');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.draft.kind).toBe('asj');
    expect(r.draft.slug).toBe('spring');
    expect(r.draft.loadedPath).toBe('src/content/events/2027-03-09-spring.md');
    expect(r.draft.body).toBe('本文\n');
    expect(toFrontmatter(r.draft)).toEqual({
      kind: 'asj',
      title: '研究発表会',
      published: '2026-11-01',
      startDate: '2027-03-09',
      endDate: '2027-03-11',
      listInActivities: true,
      sessions: [
        {
          name: '音響教育',
          startTime: '13:00',
          talks: [{ number: '2-3-1', title: '演題', presenter: '氏名', hasCoauthors: true }],
        },
      ],
    });
  });

  test('種類が判定できないとき・書式エラー', () => {
    expect(importMarkdown('---\ntitle: a\n---\n', 'a.md')).toMatchObject({
      ok: false,
      reason: 'unknown-kind',
    });
    expect(importMarkdown('---\ntitle: a\n---\n', 'a.md', 'news')).toMatchObject({ ok: true });
    expect(importMarkdown('---\ntitle: [a\n---\n', 'a.md')).toMatchObject({
      ok: false,
      reason: 'error',
    });
  });
});
