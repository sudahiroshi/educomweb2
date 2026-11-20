import { describe, expect, it } from 'vitest';
import { reviewMarkdown } from './review-markdown.ts';

describe('reviewMarkdown', () => {
  it('ファイルごとにまとめ、同じ指摘は1つにし、コレクションの順に並べる', () => {
    const md = reviewMarkdown([
      { target: 'src/content/pages/a.md', message: 'P' },
      { target: 'src/content/news/b.md', message: 'N' },
      { target: 'src/content/news/b.md', message: 'N' },
      { target: 'top.html', message: 'X' },
    ]);
    expect(md).toContain('（3 件、3 ファイル）');
    const order = ['## お知らせ', '## その他のページ', '## そのほか'].map((h) => md.indexOf(h));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(md).toContain('### `src/content/news/b.md`\n\n- [ ] N\n\n');
  });
});
