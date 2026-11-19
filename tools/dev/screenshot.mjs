// 開発用：ページの画面を撮る（手元の Google Chrome を使う。ブラウザのダウンロードは不要）
// 使い方: node tools/dev/screenshot.mjs <URL> <出力PNG> [幅=1280] [高さ=900] [light|dark] [normal|large|xlarge] [--full]
import { chromium } from 'playwright-core';

const [url, out, width = '1280', height = '900', theme = 'light', fontSize = 'normal'] =
  process.argv.slice(2);
const fullPage = process.argv.includes('--full');
if (!url || !out) {
  console.error(
    '使い方: node tools/dev/screenshot.mjs <URL> <出力PNG> [幅] [高さ] [テーマ] [文字サイズ] [--full]',
  );
  process.exit(1);
}

const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({
  viewport: { width: Number(width), height: Number(height) },
  colorScheme: theme === 'dark' ? 'dark' : 'light',
});
// 表示設定（spec 5.4・5.5）の保存値を先に入れておく
await context.addInitScript(
  ([t, f]) => {
    try {
      localStorage.setItem('asj-edcom:theme', t);
      localStorage.setItem('asj-edcom:font-size', f);
    } catch {
      // 使えない環境では無視
    }
    document.documentElement.dataset.theme = t;
    document.documentElement.dataset.fontSize = f;
  },
  [theme, fontSize],
);
const page = await context.newPage();
await page.goto(url, { waitUntil: 'networkidle' });
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
);
await page.screenshot({ path: out, fullPage });
console.log(`saved ${out}（横はみ出し: ${overflow}px）`);
await browser.close();
