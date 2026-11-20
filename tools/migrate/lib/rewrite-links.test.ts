import { describe, expect, it } from 'vitest';
import type { Element } from 'hast';
import { findAll, parseHtml } from './html.ts';
import type { LinkStatus } from './link-check.ts';
import { Review } from './review.ts';
import { rewriteLinks, type RewriteOptions } from './rewrite-links.ts';
import { nodesToMarkdown } from './to-markdown.ts';

const status = (url: string, s: Partial<LinkStatus>): [string, LinkStatus] => [
  url,
  { url, status: 200, redirectedTo: undefined, error: undefined, ...s },
];

function setup(existing: string[] = []) {
  const review = new Review();
  const copied: string[] = [];
  const options: RewriteOptions = {
    statuses: new Map([
      status('http://ok.example/', {}),
      status('http://old.example/a', { redirectedTo: 'https://new.example/a' }),
      status('http://gone.example/a.pdf', { redirectedTo: 'https://gone.example/' }),
      status('http://dead.example/', { status: undefined, error: 'ENOTFOUND' }),
      status('http://blocked.example/', { status: 403 }),
    ]),
    pageUrls: new Map([['plan/kaisaikiroku.html', '/history/']]),
    attachmentExists: (p) => existing.includes(p),
    copyAttachment: (p) => copied.push(p),
    review,
  };
  const run = (html: string, page = 'plan/x.html') => {
    const div = findAll(parseHtml(`<div>${html}</div>`), 'div')[0] as Element;
    return nodesToMarkdown(rewriteLinks(div, page, 'out.md', options).children);
  };
  return { run, review, copied };
}

describe('rewriteLinks', () => {
  it('正常な外部リンクはそのまま、転送されるものは転送先にする', () => {
    const { run, review } = setup();
    expect(run('<a href="http://ok.example/" target="_blank">A</a>')).toBe(
      '[A](http://ok.example/)',
    );
    expect(run('<a href="http://old.example/a">B</a>')).toBe('[B](https://new.example/a)');
    expect(review.items).toHaveLength(1);
  });

  it('切れたリンク・トップへ転送されるリンクは外して文字だけ残す（T-31）', () => {
    const { run, review } = setup();
    expect(run('は<a href="http://gone.example/a.pdf">\n 資料</a>へ')).toBe('は資料へ');
    expect(run('<a href="http://dead.example/">C</a>')).toBe('C');
    expect(review.items).toHaveLength(2);
  });

  it('拒否されたリンクは残して要確認にする', () => {
    const { run, review } = setup();
    expect(run('<a href="http://blocked.example/">D</a>')).toBe('[D](http://blocked.example/)');
    expect(review.items[0]?.message).toContain('ブラウザで開けるか要確認');
  });

  it('サイト内のページは移行先の URL に、移行しないページはリンクを外す', () => {
    const { run } = setup();
    expect(run('<a href="kaisaikiroku.html">活動</a>', 'plan/recent.html')).toBe(
      '[活動](/history/)',
    );
    expect(run('<a href="recent.html">最近</a>', 'plan/kaisaikiroku.html')).toBe('最近');
  });

  it('添付ファイルはあれば /files/legacy/ に写し、なければリンクを外す。画像がなければ除く', () => {
    const { run, copied } = setup(['meeting/FAS2002.pdf']);
    expect(run('<a href="FAS2002.pdf">PDF</a>', 'meeting/kokusaikaigi.html')).toBe(
      '[PDF](/files/legacy/meeting/FAS2002.pdf)',
    );
    expect(copied).toEqual(['meeting/FAS2002.pdf']);
    expect(run('<a href="x.pdf">X</a>', 'doc/q_and_a.html')).toBe('X');
    expect(run('名前<img src="../images/a.png" alt="mail">', 'state/members.html')).toBe('名前');
  });
});
