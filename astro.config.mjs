// @ts-check
import { unified } from '@astrojs/markdown-remark';
import { defineConfig } from 'astro/config';
import { site } from './src/config/site.ts';
import { rehypePlugins, remarkRehypeOptions } from './src/lib/markdown/options.ts';

// https://astro.build/config
export default defineConfig({
  site: site.url,
  trailingSlash: 'always',
  markdown: {
    // Astro 7 の既定（Sätteri）ではなく unified を使い、編集画面のプレビュー（unified ＋ remark-gfm）と
    // 同じ処理・同じ rehype プラグインで変換する（spec 1.3・6.4）
    processor: unified({
      gfm: true,
      smartypants: false,
      remarkRehype: remarkRehypeOptions,
      // 生の HTML を無害化（spec 6.4）してから、表・外部リンクを整える
      rehypePlugins,
    }),
    // 無害化で崩れるため、コードの色付けは使わない
    syntaxHighlight: false,
  },
});
