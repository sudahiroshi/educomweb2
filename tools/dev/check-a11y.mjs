// 開発用：全ページのアクセシビリティを axe-core で自動点検する（plan 11.1、spec 8章）
// ビルド結果（dist/）の全ページを、プレビューサーバー経由でライト・ダークの両方で開いて調べる。
// 規則は WCAG 2.1 の A・AA（JIS X 8341-3:2016 の AA 相当）と、axe の推奨（best-practice）。
// 編集画面（/editor/）は、種類ごとに入力欄を出し、行を足した状態でも調べる（幅 1280px と、タブ表示になる 600px）。
// 使い方: npm run build && npx astro preview --port 4329 を起動した状態で
//   node tools/dev/check-a11y.mjs [--light-only] [ページのパス…]
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative } from 'node:path';
import { chromium } from 'playwright-core';

const BASE = process.env.BASE_URL ?? 'http://localhost:4329';
const AXE_SOURCE = readFileSync(createRequire(import.meta.url).resolve('axe-core'), 'utf8');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];

function* htmlFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(p);
    else if (entry.name.endsWith('.html')) yield p;
  }
}

const requested = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const paths =
  requested.length > 0
    ? requested
    : [...htmlFiles('dist')]
        .map((f) => '/' + relative('dist', f).replace(/index\.html$/, ''))
        .sort();
const themes = process.argv.includes('--light-only') ? ['light'] : ['light', 'dark'];

/** 編集画面の各状態を作る（種類を選び、セッション・講演・リンク・名簿の行を1つずつ足す） */
const EDITOR_ADD_BUTTONS = ['セッションを追加', '講演を追加', 'リンクを追加', '行を追加'];
async function* editorStates(page) {
  const kinds = await page.locator('input[name="editor-kind"]').all();
  for (const kind of kinds) {
    await kind.check();
    for (const name of EDITOR_ADD_BUTTONS) {
      const button = page.getByRole('button', { name, exact: true });
      if ((await button.count()) > 0) await button.first().click();
    }
    yield `種類=${await kind.inputValue()}`;
    // 狭い画面では入力とプレビューがタブになる
    for (const tab of await page.getByRole('tab').all()) {
      if (!(await tab.isVisible())) continue;
      await tab.click();
      yield `種類=${await kind.inputValue()} タブ=${await tab.textContent()}`;
    }
  }
}

async function runAxe(page) {
  if (!(await page.evaluate(() => 'axe' in window))) {
    await page.addScriptTag({ content: AXE_SOURCE });
  }
  return page.evaluate(
    (tags) => window.axe.run(document, { runOnly: { type: 'tag', values: tags } }),
    TAGS,
  );
}

const browser = await chromium.launch({ channel: 'chrome' });
/** 規則ごとに、違反したページと要素をまとめる */
const violations = new Map();
let checked = 0;

for (const theme of themes) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    colorScheme: theme === 'dark' ? 'dark' : 'light',
  });
  await context.addInitScript((t) => {
    try {
      localStorage.setItem('asj-edcom:theme', t);
    } catch {
      // 無視
    }
  }, theme);
  const page = await context.newPage();
  const record = (result, label) => {
    checked += 1;
    for (const v of result.violations) {
      const entry = violations.get(v.id) ?? { help: v.help, impact: v.impact, hits: [] };
      for (const node of v.nodes) {
        entry.hits.push(
          `${theme} ${label}  ${node.target.join(' ')}  ${node.failureSummary ?? ''}`,
        );
      }
      violations.set(v.id, entry);
    }
  };
  for (const path of paths) {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    record(await runAxe(page), path);
    if (path !== '/editor/') continue;
    for (const width of [1280, 600]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(BASE + path, { waitUntil: 'networkidle' });
      for await (const state of editorStates(page)) {
        record(await runAxe(page), `${path}（幅${width} ${state}）`);
      }
    }
  }
  await context.close();
}
await browser.close();

console.log(
  `${paths.length} ページ（編集画面は状態ごと）× ${themes.join('・')}（${checked} 回）を点検しました。`,
);
if (violations.size === 0) {
  console.log('違反はありません。');
} else {
  for (const [id, { help, impact, hits }] of violations) {
    console.log(`\n■ ${id}（${impact}）${help} — ${hits.length} 件`);
    for (const hit of hits.slice(0, 8)) console.log('  ' + hit.replace(/\n\s*/g, ' / '));
    if (hits.length > 8) console.log(`  …ほか ${hits.length - 8} 件`);
  }
  process.exitCode = 1;
}
