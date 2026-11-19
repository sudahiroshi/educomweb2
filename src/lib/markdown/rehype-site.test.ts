import { describe, expect, test } from 'vitest';
import type { Root } from 'hast';
import rehypeSite from './rehype-site';
import { isExternalUrl } from './external';

function run(tree: Root): Root {
  rehypeSite()(tree);
  return tree;
}

describe('isExternalUrl', () => {
  test('外部・内部の判定', () => {
    expect(isExternalUrl('https://acoustics.jp/')).toBe(true);
    expect(isExternalUrl('http://example.org/a')).toBe(true);
    expect(isExternalUrl('https://asj-edcom.acoustics.jp/news/')).toBe(false);
    expect(isExternalUrl('/committee/')).toBe(false);
    expect(isExternalUrl('#top')).toBe(false);
    expect(isExternalUrl('mailto:a@example.org')).toBe(false);
  });
});

describe('rehypeSite', () => {
  test('表を横スクロール枠で囲み、見出しセルに scope を付ける', () => {
    const tree = run({
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'table',
          properties: {},
          children: [
            {
              type: 'element',
              tagName: 'thead',
              properties: {},
              children: [
                {
                  type: 'element',
                  tagName: 'tr',
                  properties: {},
                  children: [{ type: 'element', tagName: 'th', properties: {}, children: [] }],
                },
              ],
            },
          ],
        },
      ],
    });
    const wrapper = tree.children[0];
    expect(wrapper).toMatchObject({
      tagName: 'div',
      properties: { className: ['table-scroll'], role: 'region', tabIndex: 0 },
    });
    expect(JSON.stringify(wrapper)).toContain('"scope":"col"');
  });

  test('外部リンクにアイコンと読み上げ文言を付け、内部リンクはそのまま', () => {
    const tree = run({
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'a',
          properties: { href: 'https://acoustics.jp/' },
          children: [{ type: 'text', value: '日本音響学会' }],
        },
        {
          type: 'element',
          tagName: 'a',
          properties: { href: '/news/' },
          children: [{ type: 'text', value: 'お知らせ' }],
        },
      ],
    });
    const [ext, int] = tree.children;
    expect(ext).toMatchObject({ properties: { className: ['external-link'] } });
    expect(JSON.stringify(ext)).toContain('（外部サイト）');
    expect(int).toMatchObject({ properties: { href: '/news/' } });
    expect(JSON.stringify(int)).not.toContain('外部サイト');
  });

  test('脚注のリンク先に rehype-sanitize と同じ接頭辞を付ける', () => {
    const tree = run({
      type: 'root',
      children: [
        {
          type: 'element',
          tagName: 'a',
          properties: { href: '#fn-1', dataFootnoteRef: '' },
          children: [],
        },
        { type: 'element', tagName: 'a', properties: { href: '#section' }, children: [] },
      ],
    });
    expect(tree.children[0]).toMatchObject({ properties: { href: '#user-content-fn-1' } });
    expect(tree.children[1]).toMatchObject({ properties: { href: '#section' } });
  });
});
