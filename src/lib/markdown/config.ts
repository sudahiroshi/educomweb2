/**
 * Astro の Markdown 設定（astro.config.mjs の markdown）。
 * テスト（markdown-render.test.ts）からも同じ設定で変換し、結果を固定して確かめる。
 *
 * Astro 7 の既定（Sätteri）ではなく unified を使う（ユーザー判断、2026-11-19）。
 * 編集画面のプレビュー（unified ＋ remark-gfm）と同じ処理・同じ rehype プラグインで変換するため（spec 1.3・6.4）。
 */
import { unified } from '@astrojs/markdown-remark';
import { rehypePlugins, remarkRehypeOptions } from './options';

export const markdownConfig = {
  processor: unified({
    gfm: true,
    smartypants: false,
    remarkRehype: remarkRehypeOptions,
    // 生の HTML を無害化（spec 6.4）してから、表・外部リンクを整える
    rehypePlugins,
  }),
  // 無害化で崩れるため、コードの色付けは使わない
  syntaxHighlight: false as const,
};
