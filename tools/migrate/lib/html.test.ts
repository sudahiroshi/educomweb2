import { describe, expect, it } from 'vitest';
import { linksOf, normalizeText, pageInfo, parseHtml, resolveLink } from './html.ts';
import { parseMenu } from './menu.ts';
import { topItems } from './top-items.ts';

describe('normalizeText', () => {
  it('和文の途中の改行と字下げを詰める', () => {
    expect(normalizeText('ビギナーズセミ\n      ナー')).toBe('ビギナーズセミナー');
  });
  it('英数字の間の改行は空白1つにする', () => {
    expect(normalizeText('Mats\n  Krouthen (抄訳:\n  神戸大学')).toBe(
      'Mats Krouthen (抄訳: 神戸大学',
    );
  });
});

describe('resolveLink', () => {
  it('サイト内の相対パスを legacy/ からのパスにする', () => {
    expect(resolveLink('meeting/kokusaikaigi.html', 'FAS2002.pdf')).toEqual({
      path: 'meeting/FAS2002.pdf',
      external: false,
    });
    expect(resolveLink('state/members.html', '../images/a.png#x').path).toBe('images/a.png');
  });
  it('http・https は外部', () => {
    expect(resolveLink('top.html', 'http://www.asj.gr.jp/')).toEqual({
      path: undefined,
      external: true,
    });
  });
});

describe('pageInfo・linksOf', () => {
  const tree = parseHtml(
    '<title>T</title><h1>見出し</h1><a href="\nhttp://example.com/a\n">リン\nク</a><img src="x.png" alt="画像">',
  );
  it('h1 が1つならその文字を見出しにする', () => {
    expect(pageInfo(tree)).toEqual({ title: 'T', heading: '見出し' });
  });
  it('h1 が複数なら <title> を見出しにする', () => {
    expect(pageInfo(parseHtml('<title>T</title><h1>a</h1><h1>b</h1>')).heading).toBe('T');
  });
  it('a と img を、前後の空白を除いて取り出す', () => {
    expect(linksOf(tree, 'demo/links.html')).toEqual([
      { kind: 'a', raw: 'http://example.com/a', text: 'リンク', path: undefined, external: true },
      { kind: 'img', raw: 'x.png', text: '画像', path: 'demo/x.png', external: false },
    ]);
  });
});

describe('parseMenu', () => {
  it('区分ごとの項目と、リンクのない項目を読む', () => {
    const tree = parseHtml(
      '<div class="menubox"><h2>区分A</h2><ul><li><a href="top.html">お知らせ</a></li><li>活動方針</li></ul></div>',
    );
    expect(parseMenu(tree)).toEqual([
      { section: '区分A', label: 'お知らせ', href: 'top.html', path: 'top.html', external: false },
      { section: '区分A', label: '活動方針', href: undefined, path: undefined, external: false },
    ]);
  });
});

describe('topItems', () => {
  it('囲みの直下の項目だけを読み、入れ子の項目は含めない', () => {
    const tree = parseHtml(
      '<div class="contentsbox01"><h1>お知らせ</h1><ul><li>A<ul><li>A-1</ul><li>B</ul></div>',
    );
    expect(topItems(tree).map((i) => [i.box, i.text])).toEqual([
      ['お知らせ', 'A A-1'],
      ['お知らせ', 'B'],
    ]);
  });
});
