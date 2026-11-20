// 開発用：キーボードだけで操作できるかを点検する（plan 11.3、spec 8章）
// プレビューサーバー経由で、実際に Tab・Enter・Space・矢印・Esc を送って確かめる。
// 1. 全ページ：Tab で一巡し、見えている操作部品にすべて届くか、フォーカス枠（3px 以上の outline）が見えるか、
//    途中で抜け出せなくならないか（キーボードの罠）
// 2. 個別の操作：スキップリンク、サブメニュー（Enter で開き Esc で閉じる）、スマホのメニュー、
//    表示切替・文字サイズ、横スクロールの表、編集画面（種類の選択、セッション表の行の追加・並べ替え、タブ）
// 使い方: npm run build && npx astro preview --port 4329 を起動した状態で
//   node tools/dev/check-keyboard.mjs [ページのパス…]
import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { chromium } from 'playwright-core';

const BASE = process.env.BASE_URL ?? 'http://localhost:4329';

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

const problems = [];
const passed = [];
function check(ok, label) {
  (ok ? passed : problems).push(label);
}

/** いまフォーカスのある要素の情報（枠の太さ、見えているか、識別用の名前） */
function focusInfo() {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  // 外側の枠で示す部品（ファイル選択、カード全体に枠を出す開催予定のカード）
  const ring = el.closest('.ed-file-input, .event-card') ?? el;
  const style = getComputedStyle(ring);
  // Pagefind の検索欄は、フォーカス色の 3px の box-shadow で枠を出す
  const shadow = /(\d+(?:\.\d+)?)px\s*$/.exec(style.boxShadow);
  const shadowWidth = style.boxShadow !== 'none' && shadow ? parseFloat(shadow[1]) : 0;
  const r = el.getBoundingClientRect();
  const label =
    el.tagName.toLowerCase() +
    (el.id ? '#' + el.id : '') +
    (el.getAttribute('aria-label') ? `[${el.getAttribute('aria-label')}]` : '') +
    ` "${(el.textContent ?? '').trim().slice(0, 20)}"`;
  return {
    key: label + `@${Math.round(r.left)},${Math.round(r.top + window.scrollY)}`,
    label,
    outline: Math.max(
      style.outlineStyle === 'none' ? 0 : parseFloat(style.outlineWidth),
      shadowWidth,
    ),
    // 日付欄は Tab で年・月・日の欄を順に移る（同じ要素が続いても罠ではない）
    segments: el.matches('input[type="date"], input[type="time"]') ? 4 : 1,
    visible: r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight,
  };
}

/** Tab でたどれるはずの、見えている操作部品の数 */
function tabbableCount() {
  const selector =
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), summary';
  const radioGroups = new Set();
  let n = 0;
  for (const el of document.querySelectorAll(selector)) {
    if (el.tabIndex < 0) continue;
    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || el.closest('[hidden], [inert]')) continue;
    // 閉じた <details> の中身（summary 以外）は Tab の対象外
    const details = el.closest('details:not([open])');
    if (details && !(el.tagName === 'SUMMARY' && el.parentElement === details)) continue;
    const box = el.closest('.ed-file-input') ?? el;
    if (box.getClientRects().length === 0) continue;
    // ラジオボタンは同じ名前で1つの停止位置
    if (el.type === 'radio') {
      if (radioGroups.has(el.name)) continue;
      radioGroups.add(el.name);
    }
    n += 1;
  }
  return n;
}

/** Tab で一巡し、届いた部品・枠の見え方・罠を調べる */
async function tabCycle(page, label) {
  // Tab の起点をページの先頭に戻す（blur だけでは、ブラウザは直前の位置から Tab を続ける）
  await page.evaluate(() => {
    const start = document.createElement('span');
    start.tabIndex = -1;
    start.dataset.tabStart = '';
    document.body.prepend(start);
    start.focus();
    window.scrollTo(0, 0);
  });
  const expected = await page.evaluate(tabbableCount);
  const seen = new Set();
  let first = null;
  let repeats = 0;
  let previous = null;
  // 日付・時刻の欄は年・月・日などの欄ごとに Tab が止まるので、余裕を持たせる
  for (let i = 0; i < expected * 5 + 20; i += 1) {
    await page.keyboard.press('Tab');
    if (i === 0) await page.evaluate(() => document.querySelector('[data-tab-start]')?.remove());
    const info = await page.evaluate(focusInfo);
    if (!info) {
      if (seen.size > 0) break; // ページの末尾からブラウザの UI へ出た
      continue;
    }
    if (first && info.key === first) break; // 一巡した
    first ??= info.key;
    if (info.key === previous) {
      repeats += 1;
    } else {
      repeats = 0;
    }
    if (repeats > 0) {
      if (repeats >= info.segments + 2) {
        problems.push(`${label}: ${info.label} から Tab で抜け出せません`);
        return;
      }
    }
    previous = info.key;
    if (info.outline < 3) problems.push(`${label}: ${info.label} のフォーカス枠が見えません`);
    if (!info.visible) problems.push(`${label}: ${info.label} がフォーカス時に画面外です`);
    seen.add(info.key);
  }
  if (seen.size < expected) {
    problems.push(`${label}: Tab で届いた部品 ${seen.size} 個 ＜ 見えている部品 ${expected} 個`);
  } else {
    passed.push(`${label}: Tab で ${seen.size} 個の部品を一巡`);
  }
}

const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

// ---- 1. 全ページを Tab で一巡（幅 1280px と 375px） ----
for (const width of [1280, 375]) {
  await page.setViewportSize({ width, height: 900 });
  for (const path of paths) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await tabCycle(page, `幅${width} ${path}`);
  }
}
await page.setViewportSize({ width: 1280, height: 900 });

const focused = () => page.evaluate(() => document.activeElement?.textContent?.trim() ?? '');
const attr = (selector, name) => page.locator(selector).first().getAttribute(name);

// ---- 2. 個別の操作 ----
// スキップリンク：最初の Tab で出て、Enter で本文へ
await page.goto(BASE + '/news/', { waitUntil: 'networkidle' });
await page.keyboard.press('Tab');
check((await focused()).includes('本文へ'), 'スキップリンクが最初の Tab で出る');
await page.keyboard.press('Enter');
check(
  await page.evaluate(() => location.hash === '#main' && document.activeElement?.id === 'main'),
  'スキップリンクの Enter で本文（#main）へ移る',
);

// サブメニュー：Enter で開き、中のリンクへ Tab で進み、Esc で閉じてボタンに戻る
await page.goto(BASE + '/news/', { waitUntil: 'networkidle' });
const submenu = page.locator('[data-submenu-toggle]').first();
await submenu.focus();
await page.keyboard.press('Enter');
check((await submenu.getAttribute('aria-expanded')) === 'true', 'サブメニューが Enter で開く');
await page.keyboard.press('Tab');
check(
  await page.evaluate(() => !!document.activeElement?.closest('.submenu')),
  'サブメニューの中のリンクへ Tab で進める',
);
await page.keyboard.press('Escape');
check(
  (await submenu.getAttribute('aria-expanded')) === 'false' &&
    (await page.evaluate(() => document.activeElement?.hasAttribute('data-submenu-toggle'))),
  'サブメニューが Esc で閉じ、ボタンにフォーカスが戻る',
);
await submenu.focus();
await page.keyboard.press('Space');
check((await submenu.getAttribute('aria-expanded')) === 'true', 'サブメニューが Space でも開く');
await page.keyboard.press('Escape');

// スマホのメニュー：Enter で開き、Esc で閉じてボタンに戻る
await page.setViewportSize({ width: 375, height: 800 });
await page.goto(BASE + '/news/', { waitUntil: 'networkidle' });
const navToggle = page.locator('[data-nav-toggle]');
await navToggle.focus();
await page.keyboard.press('Enter');
check(
  (await navToggle.getAttribute('aria-expanded')) === 'true',
  'スマホのメニューが Enter で開く',
);
await page.keyboard.press('Tab');
check(
  await page.evaluate(() => !!document.activeElement?.closest('.nav-list')),
  'スマホのメニューの中へ Tab で進める',
);
await page.keyboard.press('Escape');
check(
  (await navToggle.getAttribute('aria-expanded')) === 'false' &&
    (await page.evaluate(() => document.activeElement?.hasAttribute('data-nav-toggle'))),
  'スマホのメニューが Esc で閉じ、ボタンにフォーカスが戻る',
);
await page.setViewportSize({ width: 1280, height: 900 });

// 表示切替・文字サイズ
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
const themeBefore = await page.evaluate(() => document.documentElement.dataset.theme);
await page.locator('[data-theme-toggle]').first().focus();
await page.keyboard.press('Enter');
const themeAfter = await page.evaluate(() => document.documentElement.dataset.theme);
check(themeBefore !== themeAfter, `表示切替が Enter で変わる（${themeBefore} → ${themeAfter}）`);
await page.keyboard.press('Space');
check(
  (await page.evaluate(() => document.documentElement.dataset.theme)) === themeBefore,
  '表示切替が Space でも戻る',
);
await page.locator('[data-font-size-value="xlarge"]').first().focus();
await page.keyboard.press('Enter');
check(
  (await page.evaluate(() => document.documentElement.dataset.fontSize)) === 'xlarge' &&
    (await attr('[data-font-size-value="xlarge"]', 'aria-pressed')) === 'true',
  '文字サイズ「特大」が Enter で選べる',
);
await page.locator('[data-font-size-value="normal"]').first().focus();
await page.keyboard.press('Space');
check(
  (await page.evaluate(() => document.documentElement.dataset.fontSize)) === 'normal',
  '文字サイズ「標準」に Space で戻せる',
);

// 横スクロールの表：幅の狭い画面で、Tab で枠に入り、矢印キーで横に動く
const tablePage = paths.find((p) => /\/meetings\/asj\/\d/.test(p));
if (tablePage) {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(BASE + tablePage, { waitUntil: 'networkidle' });
  const scroller = page.locator('.session__table-scroll').first();
  if ((await scroller.count()) > 0) {
    await scroller.focus();
    const canScroll = await scroller.evaluate((el) => el.scrollWidth > el.clientWidth);
    const before = await scroller.evaluate((el) => el.scrollLeft);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    const after = await scroller.evaluate((el) => el.scrollLeft);
    check(
      !canScroll || after > before,
      `セッション表の横スクロール枠に Tab で入り、矢印キーで動かせる（${tablePage}）`,
    );
  }
  await page.setViewportSize({ width: 1280, height: 900 });
}

// 編集画面
await page.goto(BASE + '/editor/', { waitUntil: 'networkidle' });
const kindRadio = page.locator('input[name="editor-kind"]').first();
await kindRadio.focus();
await page.keyboard.press('ArrowRight');
check(
  (await page.locator('input[name="editor-kind"]:checked').inputValue()) === 'activity',
  '編集画面：種類を矢印キーで選べる',
);
// 研究発表会を選び、セッション表を操作する
await page.locator('input[name="editor-kind"][value="asj"]').focus();
await page.keyboard.press('Space');
const addSession = page.getByRole('button', { name: 'セッションを追加', exact: true });
await addSession.focus();
await page.keyboard.press('Enter');
await addSession.focus();
await page.keyboard.press('Enter');
const sessionNames = page.getByRole('textbox', { name: /セッション名/ });
check((await sessionNames.count()) === 2, '編集画面：「セッションを追加」を Enter で押せる');
await sessionNames.nth(0).focus();
await page.keyboard.type('一つ目');
await sessionNames.nth(1).focus();
await page.keyboard.type('二つ目');
const moveUp = page.getByRole('button', { name: /を上へ$/ }).nth(1);
await moveUp.focus();
await page.keyboard.press('Enter');
check(
  (await sessionNames.nth(0).inputValue()) === '二つ目',
  '編集画面：セッションの並べ替え（上へ）を Enter で押せる',
);
check(
  await page.evaluate(() => document.activeElement !== document.body),
  '編集画面：並べ替えの後もフォーカスが失われない',
);
const addTalk = page.getByRole('button', { name: '講演を追加', exact: true }).first();
await addTalk.focus();
await page.keyboard.press('Enter');
const talkTitle = page.getByRole('textbox', { name: /演題/ }).first();
await talkTitle.focus();
await page.keyboard.type('演題の例');
check((await talkTitle.inputValue()) === '演題の例', '編集画面：講演の行を追加して入力できる');
await tabCycle(page, '編集画面（セッション表を入力した状態）');

// 「既存の記事を読み込んで修正する」：Enter で開き、中の部品へ Tab で進める
await page.goto(BASE + '/editor/', { waitUntil: 'networkidle' });
await page.locator('.ed-load summary').focus();
await page.keyboard.press('Enter');
check(
  await page.locator('.ed-load').evaluate((d) => d.open),
  '編集画面：「既存の記事を読み込んで修正する」を Enter で開ける',
);
await page.keyboard.press('Tab');
check(
  await page.evaluate(() => !!document.activeElement?.closest('.ed-load-body')),
  '編集画面：開いた読み込み欄の中へ Tab で進める',
);
await tabCycle(page, '編集画面（読み込み欄を開いた状態）');

// 狭い画面のタブ：矢印キーで切り替わる
await page.setViewportSize({ width: 600, height: 900 });
await page.goto(BASE + '/editor/', { waitUntil: 'networkidle' });
const firstTab = page.getByRole('tab').first();
if (await firstTab.isVisible()) {
  await firstTab.focus();
  await page.keyboard.press('ArrowRight');
  check(
    await page.evaluate(
      () =>
        document.activeElement?.getAttribute('role') === 'tab' &&
        document.activeElement.getAttribute('aria-selected') === 'true' &&
        document.activeElement !== document.querySelector('[role="tab"]'),
    ),
    '編集画面：狭い画面のタブを矢印キーで切り替えられる',
  );
}

await browser.close();

console.log(
  `${paths.length} ページ（幅 1280px・375px）と個別の操作 ${passed.length} 件を確認しました。`,
);
for (const p of passed.filter((x) => !x.includes('一巡'))) console.log('  ✓ ' + p);
if (problems.length > 0) {
  console.log('\n問題：');
  for (const p of problems) console.log('  ✗ ' + p);
  process.exitCode = 1;
} else {
  console.log('問題はありません。');
}
