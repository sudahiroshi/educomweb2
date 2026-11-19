import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { parseFrontmatter } from '../lib/frontmatter';
import { committeeSchema, eventSchema, newsSchema } from '../schemas';
import { importMarkdown } from './import';
import { emptyDraft, emptySession, emptyTalk, toFrontmatter } from './model';
import { toMarkdown } from './serialize';

describe('.md の書き出し（spec 6.8）', () => {
  test('キー順・空項目の省略・LF・末尾の改行1つ', () => {
    const d = emptyDraft('news', '2026-11-19');
    d.slug = 'renewal';
    d.news.title = 'Webサイトをリニューアルしました';
    d.news.summary = 'お知らせ: 新しいサイト';
    d.body = '\r\n本文1行目\r\n本文2行目\r\n\r\n\r\n';
    expect(toMarkdown(d)).toBe(
      [
        '---',
        'title: Webサイトをリニューアルしました',
        'published: 2026-11-19',
        'summary: "お知らせ: 新しいサイト"',
        '---',
        '',
        '本文1行目',
        '本文2行目',
        '',
      ].join('\n'),
    );
  });

  test('本文がなければフロントマターだけ', () => {
    const d = emptyDraft('committee', '2027-04-01');
    d.committee.fiscalYear = '2027';
    d.committee.members = [{ key: 'a', role: '委員長', name: '[氏名]', affiliation: '' }];
    expect(toMarkdown(d)).toBe(
      [
        '---',
        'fiscalYear: 2027',
        'published: 2027-04-01',
        'members:',
        '  - role: 委員長',
        '    name: "[氏名]"',
        '---',
        '',
      ].join('\n'),
    );
  });

  test('数字だけの講演番号・時刻も正しく読み戻せる', () => {
    const d = emptyDraft('asj', '2026-11-01');
    d.slug = 'spring';
    d.event.title = 't';
    d.event.startDate = '2027-03-09';
    const s = emptySession();
    s.name = 's';
    s.startTime = '09:30';
    const t = emptyTalk();
    t.number = '12';
    t.title = '演題';
    t.presenter = '氏名';
    s.talks = [t];
    d.event.sessions = [s];
    const md = toMarkdown(d);
    expect(md).toContain('startTime: "09:30"');
    expect(md).toContain('number: "12"');
    const parsed = parseFrontmatter(md).data;
    expect(eventSchema.parse(parsed).sessions?.[0]).toMatchObject({
      startTime: '09:30',
      talks: [{ number: '12' }],
    });
  });

  test('サンプル記事を読み込んで書き出すと、同じ内容になる', () => {
    for (const [path, schema] of [
      ['src/content/events/2027-03-09-sample-asj-spring-2027.md', eventSchema],
      ['src/content/news/2026-11-01-sample-asj-spring-2027-guide.md', newsSchema],
      ['src/content/committee/2026.md', committeeSchema],
    ] as const) {
      const original = readFileSync(path, 'utf8');
      const r = importMarkdown(original, path);
      expect(r.ok).toBe(true);
      if (!r.ok) continue;
      const md = toMarkdown(r.draft);
      const before = parseFrontmatter(original);
      const after = parseFrontmatter(md);
      expect(schema.parse(after.data)).toEqual(schema.parse(before.data));
      expect(after.body.trim()).toBe(before.body.trim());
      // もう一度読み込んで書き出しても変わらない
      const again = importMarkdown(md, path);
      expect(again.ok && toMarkdown(again.draft)).toBe(md);
      expect(again.ok && toFrontmatter(again.draft)).toEqual(toFrontmatter(r.draft));
    }
  });
});
