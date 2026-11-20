// 開発用：閲覧時の開催状態の判定を、ブラウザの時計を固定して確かめる（plan 6.3・6.4）
// ビルド日 2026-11-19 のサンプル記事（tools/dev/sample-content/）で作った dist/ を、プレビューサーバー経由で開く。
// 使い方: npm run build:samples && npx astro preview --port 4329 を起動した状態で
//   node tools/dev/check-event-status.mjs
import { chromium } from 'playwright-core';

const BASE = process.env.BASE_URL ?? 'http://localhost:4329';
const browser = await chromium.launch({ channel: 'chrome' });
let failed = 0;

function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failed++;
  console.log(
    `${ok ? 'OK  ' : 'NG  '}${label}${ok ? '' : `\n      期待: ${JSON.stringify(expected)}\n      実際: ${JSON.stringify(actual)}`}`,
  );
}

/** 時計を日本時間の指定時刻に固定してページを開き、状態を読む */
async function open(path, jst, { javaScriptEnabled = true } = {}) {
  const context = await browser.newContext({ javaScriptEnabled });
  if (javaScriptEnabled) await context.clock.setFixedTime(new Date(`${jst}+09:00`));
  const page = await context.newPage();
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  const state = await page.evaluate(() => {
    const ids = (sel) =>
      [...document.querySelectorAll(sel)].map((a) =>
        a.getAttribute('href').split('/').filter(Boolean).pop(),
      );
    const visible = (el) => !!el && !el.closest('[hidden]');
    return {
      upcoming: ids(
        '[data-upcoming-list] [data-event-item] h3 a, [data-upcoming-list] [data-event-item] h2 a',
      ),
      ended: ids('[data-ended-list] > li > a'),
      emptyShown: visible(document.querySelector('[data-upcoming-empty]')),
      ongoing: [...document.querySelectorAll('[data-upcoming-list] [data-event-item]')]
        .filter((card) => visible(card.querySelector('[data-ongoing]')))
        .map((card) =>
          card.querySelector('a').getAttribute('href').split('/').filter(Boolean).pop(),
        ),
    };
  });
  await context.close();
  return state;
}

const SPRING = '2027-03-09-sample-asj-spring-2027';
const AUTUMN = '2026-09-01-sample-asj-autumn-2026';
const INTL = '2027-03-30-sample-international-2027';
const COSP27 = '2027-01-23-sample-cosponsored-2027';
const COSP26 = '2026-07-11-sample-cosponsored-2026';

console.log('■ 閲覧時の判定（スクリプト有効）');
let s = await open('/meetings/asj/', '2027-03-08T12:00:00');
check('開始日の前日：開催予定・開催中なし', [s.upcoming, s.ongoing], [[SPRING], []]);
s = await open('/meetings/asj/', '2027-03-11T23:59:00');
check(
  '終了日当日 23:59：開催予定のまま・開催中',
  [s.upcoming, s.ongoing, s.ended],
  [[SPRING], [SPRING], [AUTUMN]],
);
s = await open('/meetings/asj/', '2027-03-12T00:00:30');
check('翌日 0:00：終了リストの先頭へ移る', [s.upcoming, s.ended], [[], [SPRING, AUTUMN]]);
check('翌日 0:00：開催予定0件の案内を表示', s.emptyShown, true);
s = await open('/meetings/cosponsored/', '2027-01-24T09:00:00');
check('1日開催の翌日：終了リストの先頭へ', [s.upcoming, s.ended], [[], [COSP27, COSP26]]);
s = await open('/activities/', '2027-04-03T09:00:00');
check(
  '年度の変わり目（2027-04-03）：2026年度開始の項目は2026年度の一覧の先頭へ（新しい順）',
  [s.upcoming, s.ended.slice(0, 3)],
  [[], [INTL, SPRING, AUTUMN]],
);
check('年度の変わり目：開催予定0件の案内', s.emptyShown, true);
s = await open('/', '2027-04-03T09:00:00');
check('トップ：開催予定0件の案内', [s.upcoming, s.emptyShown], [[], true]);
s = await open('/', '2027-03-10T09:00:00');
check('トップ：開催中ラベル', s.ongoing, [SPRING]);

console.log('■ スクリプト無効（ビルド時点の表示、plan 6.4）');
s = await open('/meetings/asj/', '', { javaScriptEnabled: false });
check('ビルド日 2026-11-19 の振り分けのまま', [s.upcoming, s.ended], [[SPRING], [AUTUMN]]);
s = await open('/', '', { javaScriptEnabled: false });
check('トップ：ビルド時点の開催予定', s.upcoming, [COSP27, SPRING, INTL]);

await browser.close();
if (failed > 0) {
  console.log(`${failed} 件が期待と違います。`);
  process.exit(1);
}
console.log('すべて期待どおりです。');
