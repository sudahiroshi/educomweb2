// 開発用：主要ページの画面を撮って保存し、前回の画像と画素単位で比べる（見た目を変えない改修の確認用）
// 使い方: node tools/dev/visual-snapshot.mjs <保存先フォルダ> [比較元フォルダ]
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const [outDir, baseDir] = process.argv.slice(2);
const BASE = process.env.BASE_URL ?? 'http://localhost:4329';
const PAGES = [
  '/',
  '/news/',
  '/news/2026-11-01-sample-asj-spring-2027-guide/',
  '/activities/',
  '/meetings/asj/',
  '/meetings/asj/2027-03-09-sample-asj-spring-2027/',
  '/committee/',
  '/about/',
];
const VARIANTS = [
  { name: 'w1280-light', width: 1280, theme: 'light' },
  { name: 'w375-dark', width: 375, theme: 'dark' },
];
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const diffs = [];
for (const v of VARIANTS) {
  const context = await browser.newContext({ viewport: { width: v.width, height: 900 } });
  // 開催中ラベルなどが日によって変わらないよう、時計を固定する
  await context.clock.setFixedTime(new Date('2026-11-19T12:00:00+09:00'));
  await context.addInitScript((t) => localStorage.setItem('asj-edcom:theme', t), v.theme);
  const page = await context.newPage();
  for (const path of PAGES) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const file = `${v.name}${path.replace(/\//g, '_') || '_'}.png`;
    await page.screenshot({ path: join(outDir, file), fullPage: true });
    if (baseDir) {
      const diff = await page.evaluate(
        async ([a, b]) => {
          const load = (src) =>
            new Promise((res) => {
              const img = new Image();
              img.onload = () => res(img);
              img.src = src;
            });
          const [ia, ib] = await Promise.all([load(a), load(b)]);
          if (ia.width !== ib.width || ia.height !== ib.height)
            return `大きさが違う（${ia.width}×${ia.height} → ${ib.width}×${ib.height}）`;
          const c = document.createElement('canvas');
          c.width = ia.width;
          c.height = ia.height;
          const ctx = c.getContext('2d');
          ctx.drawImage(ia, 0, 0);
          const da = ctx.getImageData(0, 0, c.width, c.height).data;
          ctx.clearRect(0, 0, c.width, c.height);
          ctx.drawImage(ib, 0, 0);
          const db = ctx.getImageData(0, 0, c.width, c.height).data;
          let n = 0;
          for (let i = 0; i < da.length; i += 4) {
            if (
              Math.abs(da[i] - db[i]) +
                Math.abs(da[i + 1] - db[i + 1]) +
                Math.abs(da[i + 2] - db[i + 2]) >
              30
            )
              n++;
          }
          // 描画の揺らぎ（数画素）は無視する
          return n <= 50 ? '' : `${n} 画素が違う`;
        },
        [
          'data:image/png;base64,' + readFileSync(join(baseDir, file)).toString('base64'),
          'data:image/png;base64,' + readFileSync(join(outDir, file)).toString('base64'),
        ],
      );
      if (diff) diffs.push(`${file}: ${diff}`);
    }
  }
  await context.close();
}
await browser.close();
console.log(`${PAGES.length * VARIANTS.length} 枚を ${outDir} に保存しました。`);
if (baseDir) {
  console.log(diffs.length === 0 ? '比較元と同じです。' : diffs.join('\n'));
  if (diffs.length > 0) process.exit(1);
}
