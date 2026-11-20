import { describe, expect, it } from 'vitest';
import { toMarkdownFile } from './frontmatter.ts';
import { parseHtml } from './html.ts';
import { joinWideLines, nodesToMarkdown } from './to-markdown.ts';

describe('joinWideLines', () => {
  it('和文の途中の改行と字下げを詰める', () => {
    expect(joinWideLines('ビギナーズセミ\n      ナー')).toBe('ビギナーズセミナー');
  });
  it('改行の直前に半角空白があれば、区切りとして空白を1つ残す', () => {
    expect(joinWideLines('つくり方ー \n\t   坂本')).toBe('つくり方ー 坂本');
  });
  it('改行の前後の全角空白を除く', () => {
    expect(joinWideLines('しました。\n\u3000\u3000次')).toBe('しました。次');
    expect(joinWideLines('Index\n\u3000\u3000')).toBe('Index\n');
  });
});

describe('nodesToMarkdown', () => {
  const md = (html: string) => {
    const root = parseHtml(`<body>${html}</body>`);
    const html_ = root.children.find((c) => c.type === 'element');
    const body =
      html_?.type === 'element'
        ? html_.children.find((c) => c.type === 'element' && c.tagName === 'body')
        : undefined;
    return body?.type === 'element' ? nodesToMarkdown(body.children) : '';
  };
  it('箇条書きは「- 」、リンクの文字の前後の空白は除く', () => {
    expect(md('<ul><li>A<li>掲載は<a href="https://e.org/">\n JSTAGE</a>へ</ul>')).toBe(
      '- A\n- 掲載は[JSTAGE](https://e.org/)へ',
    );
  });
});

describe('toMarkdownFile', () => {
  it('空の項目を出さず、時刻を二重引用符で囲み、末尾に改行を1つ付ける', () => {
    expect(
      toMarkdownFile({ title: 'T', endDate: undefined, links: [], time: '13:00' }, '\n本文\n\n'),
    ).toBe('---\ntitle: T\ntime: "13:00"\n---\n\n本文\n');
  });
  it('本文がなければフロントマターだけ', () => {
    expect(toMarkdownFile({ title: 'T' })).toBe('---\ntitle: T\n---\n');
  });
});
