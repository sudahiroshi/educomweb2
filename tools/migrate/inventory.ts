/**
 * 旧サイトの棚卸し表 docs/migration/inventory.md を作る（plan 9.2、spec 10章 3）。
 * 先に node tools/migrate/to-utf8.ts で .migrate/utf8/ を作っておく。
 *
 * 使い方：node tools/migrate/inventory.ts
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PAGE_PLANS, TOP_ITEM_PLANS } from './mapping.ts';
import { destinationLabel } from './lib/destination.ts';
import { linksOf, pageInfo, readHtml } from './lib/html.ts';
import { markdownTable } from './lib/markdown-table.ts';
import { parseMenu } from './lib/menu.ts';
import { MIGRATION_DOCS_DIR, UTF8_DIR, listFiles } from './lib/paths.ts';
import { topItems } from './lib/top-items.ts';

if (!existsSync(UTF8_DIR)) {
  console.error(
    `${UTF8_DIR}/ がありません。先に node tools/migrate/to-utf8.ts を実行してください。`,
  );
  process.exit(1);
}

const files = listFiles(UTF8_DIR);
const htmlFiles = files.filter((f) => /\.html?$/i.test(f));
const otherFiles = files.filter((f) => !/\.html?$/i.test(f));
const exists = (path: string) => files.includes(path);

const menu = parseMenu(readHtml(join(UTF8_DIR, 'menu.html')));
const menuLabel = new Map<string, string>();
for (const item of menu) {
  if (item.path) menuLabel.set(item.path, `${item.section} ＞ ${item.label}`);
}

// 旧サイト内のリンク先になっている HTML（ファイルがないものも含む）
const linkedHtml = new Set<string>();
for (const page of htmlFiles) {
  for (const link of linksOf(readHtml(join(UTF8_DIR, page)), page)) {
    if (link.kind === 'a' && link.path && /\.html?$/i.test(link.path)) linkedHtml.add(link.path);
  }
}
// フレームの外側（index.html）は旧サイトのトップだが、ファイルがない
linkedHtml.delete('index.html');

const planned = new Set(PAGE_PLANS.map((p) => p.path));
const unplanned = [...new Set([...htmlFiles, ...linkedHtml])].filter((p) => !planned.has(p)).sort();

const pageRows = PAGE_PLANS.map((plan) => {
  const has = exists(plan.path);
  const info = has ? pageInfo(readHtml(join(UTF8_DIR, plan.path))) : undefined;
  return [
    `\`${plan.path}\``,
    info ? (info.heading ?? info.title) : '—',
    menuLabel.get(plan.path) ?? '',
    has ? 'あり' : '**なし**',
    plan.estimate,
    destinationLabel(plan.destination),
    plan.note ?? '',
  ];
});

const items = topItems(readHtml(join(UTF8_DIR, 'top.html')));
const itemRows = items.map((item, i) => {
  const plan = TOP_ITEM_PLANS.find((p) => item.text.startsWith(p.startsWith));
  return [
    String(i + 1),
    item.box,
    item.text.length > 60 ? `${item.text.slice(0, 60)}…` : item.text,
    plan?.estimate ?? '**未分類**',
    plan ? destinationLabel(plan.destination) : '',
    plan ? [plan.date || '要確認', plan.endDate].filter(Boolean).join('〜') : '',
    plan?.title ?? '',
    plan?.note ?? '',
  ];
});

const menuRows = menu.map((item) => [
  item.section,
  item.label,
  item.href ? `\`${item.href}\`` : '（リンクなし）',
  item.external ? '外部' : item.path ? (exists(item.path) ? 'あり' : '**なし**') : '—',
]);

const missingLinked = [...linkedHtml].filter((p) => !exists(p)).length;

const countEvents = (kind: string) =>
  PAGE_PLANS.filter(
    (p) => p.destination.to === 'events' && p.destination.kind === kind && !exists(p.path),
  ).length +
  TOP_ITEM_PLANS.filter((p) => p.destination.to === 'events' && p.destination.kind === kind).length;

const md = `# 旧サイト棚卸し表

旧サイト（\`legacy/\`）の全ページと、移行先の案です（plan 9.2）。
\`node tools/migrate/inventory.ts\` で生成しています。移行先の案は \`tools/migrate/mapping.ts\` に書いてあり、plan 9.4 で人が確定します（T-01、T-32）。

## 概要

- HTML ${htmlFiles.length} ファイル、それ以外のファイル ${otherFiles.length} 件（添付ファイル・画像・CSS は \`legacy/\` に含まれていない）。
- 文字コード：すべてのファイルが ISO-2022-JP と宣言しているが、中身は UTF-8 だった（plan 9.1）。
- フレーム構成：外側の \`index.html\`（フレームセット）はファイルがない。\`menu.html\` の \`<base target="mainFrame">\` と各ページの「Index」リンクから、上に \`title.html\`、左に \`menu.html\`、右（mainFrame）に各ページを表示する3分割と推定した。
- リンク先になっている HTML のうち、ファイルがないもの：${missingLinked} 件（下の表の「ファイル：なし」）。

## メニューの構成（menu.html）

${markdownTable(['区分', '項目', 'リンク先', 'ファイル'], menuRows)}

## ページ一覧

${markdownTable(['パス', '見出し', 'メニューの位置', 'ファイル', '種類の推定', '移行先（案）', '備考'], pageRows)}
${unplanned.length > 0 ? `\n**移行先の案がないページ：** ${unplanned.map((p) => `\`${p}\``).join('、')}\n` : ''}
## お知らせ（top.html）の項目

${markdownTable(['#', '囲み', '内容（冒頭）', '種類の推定', '移行先（案）', '日付（案）', 'タイトル（案）', '備考'], itemRows)}

## 移行先の案のまとめ

- お知らせ：${TOP_ITEM_PLANS.filter((p) => p.destination.to === 'news').length} 件（top.html の項目）
- 活動記録：${countEvents('activity')} 件（top.html の研究会）
- 研究発表会（音響学会）：${countEvents('asj')} 件（top.html のスペシャルセッションなど、kenkyuhapyoukai.html の一覧）
- 国際会議：4 件（kokusaikaigi.html の一覧）
- 運営委員：members.html の 4期分（年度への割り当ては plan 9.6）
- その他のページ：${PAGE_PLANS.filter((p) => p.destination.to === 'pages').length} ページ（うちメニューに出すもの ${PAGE_PLANS.filter((p) => p.destination.to === 'pages' && p.destination.showInMenu).length}）、設立趣旨は「委員会について」に統合
- 破棄：${PAGE_PLANS.filter((p) => p.destination.to === 'discard').length} ページ（フレーム部品と、ファイルのないリンク先）
`;

mkdirSync(MIGRATION_DOCS_DIR, { recursive: true });
writeFileSync(join(MIGRATION_DOCS_DIR, 'inventory.md'), md);
console.log(`${MIGRATION_DOCS_DIR}/inventory.md を書き出しました。`);
if (unplanned.length > 0) console.warn(`移行先の案がないページ：${unplanned.join(', ')}`);
