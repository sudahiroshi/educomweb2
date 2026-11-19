// 開発用：全ページの横はみ出し・欠けを点検する（spec 5.5・8章、plan 5.4）
// ビルド結果（dist/）のページを、プレビューサーバー経由で開いて調べる。
// - ページ全体の横スクロール（scrollWidth > clientWidth）
// - 表示幅の外にはみ出した要素（横スクロール枠＝role="region" かつ tabindex="0" の領域・pre の中は除く）
// 使い方: npm run build && npx astro preview --port 4329 を起動した状態で
//   node tools/dev/check-overflow.mjs [幅=320] [文字サイズ=xlarge] [テーマ=light] [--menu]
import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { chromium } from 'playwright-core';

const BASE = process.env.BASE_URL ?? 'http://localhost:4329';
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const [width = '320', fontSize = 'xlarge', theme = 'light'] = args;
const openMenu = process.argv.includes('--menu');

function* htmlFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(p);
    else if (entry.name.endsWith('.html')) yield p;
  }
}
const paths = [...htmlFiles('dist')]
  .map((f) => '/' + relative('dist', f).replace(/index\.html$/, ''))
  .sort();

const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: Number(width), height: 800 } });
await context.addInitScript(
  ([t, f]) => {
    try {
      localStorage.setItem('asj-edcom:theme', t);
      localStorage.setItem('asj-edcom:font-size', f);
    } catch {
      // 無視
    }
  },
  [theme, fontSize],
);
const page = await context.newPage();
const problems = [];

for (const path of paths) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  if (openMenu) {
    const toggle = page.locator('[data-nav-toggle]');
    if (await toggle.isVisible()) await toggle.click();
  }
  const result = await page.evaluate(() => {
    const doc = document.documentElement;
    const vw = doc.clientWidth;
    const SCROLLER = '[role="region"][tabindex="0"], pre';
    const scrollers = (el) => el.closest(SCROLLER);
    const offenders = [];
    for (const el of document.body.querySelectorAll('*')) {
      if (scrollers(el) && !el.matches(SCROLLER)) continue;
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      if (el.closest('.visually-hidden, .sr-only, .skip-link')) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right > vw + 1 || r.left < -1) {
        offenders.push(
          `${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).split(' ')[0] : ''}（${Math.round(r.left)}〜${Math.round(r.right)}px）`,
        );
      }
    }
    return { overflow: doc.scrollWidth - doc.clientWidth, offenders: offenders.slice(0, 5) };
  });
  if (result.overflow > 0 || result.offenders.length > 0) {
    problems.push(`${path}: 横はみ出し ${result.overflow}px ${result.offenders.join(', ')}`);
  }
}
await browser.close();

console.log(
  `${paths.length} ページ（幅 ${width}px、文字サイズ ${fontSize}、${theme}${openMenu ? '、メニューを開く' : ''}）を点検しました。`,
);
if (problems.length > 0) {
  console.log(problems.join('\n'));
  process.exit(1);
}
console.log('横はみ出し・欠けはありません。');
