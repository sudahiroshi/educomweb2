/**
 * ブラウザで Markdown を HTML にする（編集画面のプレビュー。spec 6.4）。
 * サイトのビルド（astro.config.mjs → src/lib/markdown/config.ts）と同じ GFM・remark-rehype の設定・
 * rehype プラグイン（生の HTML の解析 → 無害化 → 表・外部リンク・脚注の調整）を使う。
 * 結果が同じであることは markdown-render.test.ts で確かめる。
 */
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import rehypeHeadingIds from './heading-ids';
import { rehypePlugins, remarkRehypeOptions } from './options';

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  // Astro と同じく allowDangerousHtml を有効にし、生の HTML は rehype-raw → rehype-sanitize で扱う
  .use(remarkRehype, { allowDangerousHtml: true, ...remarkRehypeOptions })
  .use(rehypePlugins)
  .use(rehypeHeadingIds)
  .use(rehypeStringify, { allowDangerousHtml: true });

export function renderMarkdown(markdown: string): string {
  return String(processor.processSync(markdown));
}
