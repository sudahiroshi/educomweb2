// 開発用：OGP 画像（public/og-image.png、1200×630）を作る（spec 7章、T-21）
// T-21 既定案: サイト共通の画像1枚（波形マーク＋サイト名）。サイトと同じ書体・ライトの色で描く。
// 使い方: node tools/dev/make-og-image.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

const font = (w) =>
  pathToFileURL(resolve(`node_modules/@fontsource/zen-kaku-gothic-new/${w}.css`)).href;

// 波線（WaveDivider と同じ考え方の正弦波）
function wave(width, mid, cycles, amp, phase) {
  const pts = [];
  for (let i = 0; i <= 400; i++) {
    const x = (width * i) / 400;
    const y = mid - amp * Math.sin((2 * Math.PI * cycles * i) / 400 + phase);
    pts.push(`${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join('');
}

const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<link rel="stylesheet" href="${font(500)}"><link rel="stylesheet" href="${font(700)}">
<style>
  html,body{margin:0;width:1200px;height:630px;background:#FDFDFB;color:#0A0A0A;font-family:'Zen Kaku Gothic New',sans-serif}
  .wrap{position:relative;width:1200px;height:630px;box-sizing:border-box;padding:120px 96px}
  .logo{display:flex;align-items:center;gap:40px}
  .mark{width:170px;height:136px;fill:none;stroke:#0E6B66;stroke-width:2.4;stroke-linecap:round}
  .upper{font-size:44px;font-weight:500;color:#3A403E;letter-spacing:.04em}
  .lower{font-size:96px;font-weight:700;letter-spacing:.06em;line-height:1.2}
  .wave{position:absolute;left:0;bottom:60px;width:1200px;height:120px}
  .wave path{fill:none;stroke-linecap:round}
</style></head><body><div class="wrap">
  <div class="logo">
    <svg class="mark" viewBox="0 0 40 32"><path d="M0 16H4M36 16H40"/><path d="M8 12V20M13 6V26M18 2V30M23 9V23M28 4V28M33 11V21"/></svg>
    <div><div class="upper">日本音響学会</div><div class="lower">音響教育委員会</div></div>
  </div>
  <svg class="wave" viewBox="0 0 1200 120" preserveAspectRatio="none">
    <path d="${wave(1200, 60, 4.2, 22, Math.PI / 3)}" stroke="#9DCFC9" stroke-width="5"/>
    <path d="${wave(1200, 60, 6, 40, 0)}" stroke="#0E6B66" stroke-width="6"/>
  </svg>
</div></body></html>`;

const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--allow-file-access-from-files'],
});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
// 書体を file:// から読むため、HTML も一時ファイル（.astro/、git の対象外）にして開く
mkdirSync('.astro', { recursive: true });
const tmp = resolve('.astro/og-image.html');
writeFileSync(tmp, html);
await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const family = await page.evaluate(() =>
  document.fonts.check('700 96px "Zen Kaku Gothic New"', '音響教育委員会'),
);
await page.screenshot({ path: 'public/og-image.png' });
await browser.close();
console.log(`public/og-image.png を作りました（書体の読み込み: ${family ? 'OK' : '失敗'}）`);
