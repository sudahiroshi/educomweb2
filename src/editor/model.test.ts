import { describe, expect, test } from 'vitest';
import type { ContentIndex } from './content-index';
import {
  draftFilesDir,
  draftId,
  draftPath,
  emptyDraft,
  emptySession,
  emptyTalk,
  isDraftEmpty,
  toFrontmatter,
  validateDraft,
  type Draft,
} from './model';

const index: ContentIndex = {
  generatedAt: '',
  entries: [
    {
      collection: 'events',
      id: '2027-03-09-asj-spring',
      path: 'src/content/events/2027-03-09-asj-spring.md',
      title: 'A',
    },
    {
      collection: 'news',
      id: '2026-11-19-renewal',
      path: 'src/content/news/2026-11-19-renewal.md',
      title: 'B',
    },
  ],
};

function newsDraft(): Draft {
  const d = emptyDraft('news', '2026-11-20');
  d.slug = 'site-news';
  d.news.title = 'タイトル';
  d.body = '本文';
  return d;
}

describe('ID・保存先', () => {
  test('種類ごとの ID とパス', () => {
    const n = newsDraft();
    expect(draftId(n)).toBe('2026-11-20-site-news');
    expect(draftPath(n)).toBe('src/content/news/2026-11-20-site-news.md');
    expect(draftFilesDir(n)).toBe('public/files/news/2026-11-20-site-news');

    const e = emptyDraft('asj');
    e.slug = 'spring';
    expect(draftId(e)).toBe('');
    e.event.startDate = '2027-03-09';
    expect(draftPath(e)).toBe('src/content/events/2027-03-09-spring.md');

    const c = emptyDraft('committee');
    c.committee.fiscalYear = '2027';
    expect(draftPath(c)).toBe('src/content/committee/2027.md');

    const p = emptyDraft('pages');
    p.slug = 'about';
    expect(draftPath(p)).toBe('src/content/pages/about.md');
  });
});

describe('フロントマターへの変換', () => {
  test('キーの順序は spec の表の順、空の項目と既定値は出さない', () => {
    const d = emptyDraft('cosponsored', '2026-11-01');
    d.slug = 'meeting';
    d.event.title = ' 研究会 ';
    d.event.startDate = '2027-01-23';
    d.event.listInActivities = true;
    d.event.links = [
      { key: 'a', label: '公式', url: 'https://example.org/' },
      { key: 'b', label: '', url: '' },
    ];
    const s = emptySession();
    s.name = 'セッション';
    s.startTime = '13:00';
    const t1 = emptyTalk();
    t1.title = '演題';
    t1.presenter = '氏名';
    t1.hasCoauthors = true;
    s.talks = [t1, emptyTalk()];
    d.event.sessions = [s];
    const fm = toFrontmatter(d);
    expect(Object.keys(fm)).toEqual([
      'kind',
      'title',
      'published',
      'startDate',
      'links',
      'listInActivities',
      'sessions',
    ]);
    expect(fm).toEqual({
      kind: 'cosponsored',
      title: '研究会',
      published: '2026-11-01',
      startDate: '2027-01-23',
      links: [{ label: '公式', url: 'https://example.org/' }],
      listInActivities: true,
      sessions: [
        {
          name: 'セッション',
          startTime: '13:00',
          talks: [{ title: '演題', presenter: '氏名', hasCoauthors: true }],
        },
      ],
    });
  });

  test('活動記録では listInActivities を出さない', () => {
    const d = emptyDraft('activity');
    d.event.listInActivities = true;
    expect(toFrontmatter(d)).not.toHaveProperty('listInActivities');
  });

  test('運営委員：年度は数値、空の行は出さない', () => {
    const d = emptyDraft('committee', '2027-04-01');
    d.committee.fiscalYear = '2027';
    d.committee.members = [
      { key: 'a', role: '委員長', name: '氏名', affiliation: '' },
      { key: 'b', role: '', name: '', affiliation: '' },
    ];
    expect(toFrontmatter(d)).toEqual({
      fiscalYear: 2027,
      published: '2027-04-01',
      members: [{ role: '委員長', name: '氏名' }],
    });
  });

  test('その他のページ：メニューに出さないときだけ showInMenu: false', () => {
    const d = emptyDraft('pages');
    d.page.title = '委員会について';
    d.page.menuOrder = '10';
    expect(toFrontmatter(d)).toEqual({ title: '委員会について', menuOrder: 10 });
    d.page.showInMenu = false;
    expect(toFrontmatter(d)).toEqual({ title: '委員会について', showInMenu: false, menuOrder: 10 });
  });
});

describe('検査（サイトと同じ規則）', () => {
  test('正しいお知らせはエラーなし', () => {
    expect(validateDraft(newsDraft(), index)).toEqual([]);
  });

  test('必須・スラッグ・本文', () => {
    const d = emptyDraft('news', '2026-11-20');
    const paths = validateDraft(d, index).map((i) => i.path);
    expect(paths).toEqual(expect.arrayContaining(['title', 'slug', 'body']));
    d.slug = 'Bad Slug';
    expect(validateDraft(d, index).find((i) => i.path === 'slug')?.message).toContain(
      '半角英小文字',
    );
  });

  test('ID の重複（読み込んだ記事自身は除く）', () => {
    const d = newsDraft();
    d.news.published = '2026-11-19';
    d.slug = 'renewal';
    expect(validateDraft(d, index).some((i) => i.message.includes('すでにあります'))).toBe(true);
    d.loadedPath = 'src/content/news/2026-11-19-renewal.md';
    expect(validateDraft(d, index).some((i) => i.message.includes('すでにあります'))).toBe(false);
  });

  test('関連記事が一覧にない', () => {
    const d = newsDraft();
    d.news.related = ['2027-03-09-asj-spring', '2027-01-01-nothing'];
    expect(validateDraft(d, index)).toEqual([
      { path: 'related.1', message: '関連記事「2027-01-01-nothing」が見つかりません' },
    ]);
  });

  test('events：終了日・セッション日付・時刻（スキーマの path がそのまま入力欄を指す）', () => {
    const d = emptyDraft('asj', '2026-11-01');
    d.slug = 'spring';
    d.event.title = 't';
    d.event.startDate = '2027-03-09';
    d.event.endDate = '2027-03-08';
    const s = emptySession();
    s.name = 's';
    s.startTime = '15:00';
    s.endTime = '13:00';
    d.event.sessions = [s];
    const paths = validateDraft(d, index).map((i) => i.path);
    expect(paths).toEqual(expect.arrayContaining(['endDate', 'sessions.0.endTime']));
  });

  test('運営委員：年度の形式', () => {
    const d = emptyDraft('committee', '2027-04-01');
    d.committee.fiscalYear = '令和9';
    d.committee.members = [{ key: 'a', role: '委員長', name: '氏名', affiliation: '' }];
    expect(validateDraft(d, index).some((i) => i.path === 'fiscalYear')).toBe(true);
  });

  test('その他のページ：予約語', () => {
    const d = emptyDraft('pages');
    d.slug = 'news';
    d.page.title = 't';
    d.body = '本文';
    expect(validateDraft(d, index).some((i) => i.message.includes('サイトが使うパス'))).toBe(true);
  });
});

describe('入力中かどうか', () => {
  test('初期値だけなら空、何か入れたら空でない', () => {
    expect(isDraftEmpty(emptyDraft('news', '2026-11-19'), '2026-11-19')).toBe(true);
    expect(isDraftEmpty(emptyDraft('committee', '2026-11-19'), '2026-11-19')).toBe(true);
    const d = emptyDraft('news', '2026-11-19');
    d.news.title = 'a';
    expect(isDraftEmpty(d, '2026-11-19')).toBe(false);
    const b = emptyDraft('pages');
    b.body = '本文';
    expect(isDraftEmpty(b)).toBe(false);
  });
});
