// @ts-check
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import { site } from './src/config/site.ts';
import { markdownConfig } from './src/lib/markdown/config.ts';

// https://astro.build/config
export default defineConfig({
  site: site.url,
  trailingSlash: 'always',
  // Markdown は unified で変換する（設定は src/lib/markdown/config.ts）
  markdown: markdownConfig,
  integrations: [
    // 編集画面のアイランドと、サイト・プレビュー共通の表示部品（spec 1.3・5.6）
    preact(),
    // サイトマップ（spec 7章）。編集画面・検索ページ・404 は載せない
    sitemap({
      filter: (page) => !/\/(editor|search|404)(\/|$)/.test(new URL(page).pathname),
    }),
  ],
});
