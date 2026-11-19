// @ts-check
import { defineConfig } from 'astro/config';
import { site } from './src/config/site.ts';
import { markdownConfig } from './src/lib/markdown/config.ts';

// https://astro.build/config
export default defineConfig({
  site: site.url,
  trailingSlash: 'always',
  // Markdown は unified で変換する（設定は src/lib/markdown/config.ts）
  markdown: markdownConfig,
});
