/**
 * 旧サイトの添付ファイル・サイト内リンク・外部リンクの一覧と、リンク切れの調査（plan 9.3、spec 10章 7）。
 * 結果を docs/migration/links.md に書き出す。外部リンクは実際に接続して調べる。
 *
 * 使い方：node tools/migrate/links.ts [--offline]
 *   --offline  外部リンクに接続しない（一覧だけ作る）
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { LinkRef } from './lib/html.ts';
import { linksOf, readHtml } from './lib/html.ts';
import { checkLink, verdictOf, type LinkStatus } from './lib/link-check.ts';
import { markdownTable } from './lib/markdown-table.ts';
import { MIGRATION_DOCS_DIR, UTF8_DIR, listFiles } from './lib/paths.ts';

if (!existsSync(UTF8_DIR)) {
  console.error(
    `${UTF8_DIR}/ がありません。先に node tools/migrate/to-utf8.ts を実行してください。`,
  );
  process.exit(1);
}
const offline = process.argv.includes('--offline');

const files = listFiles(UTF8_DIR);
const pages = files.filter((f) => /\.html?$/i.test(f));
const all: (LinkRef & { page: string })[] = pages.flatMap((page) =>
  linksOf(readHtml(join(UTF8_DIR, page)), page).map((link) => ({ ...link, page })),
);

const isHtml = (path: string) => /\.html?$/i.test(path);
const code = (s: string) => `\`${s}\``;

// 添付ファイル（サイト内の HTML 以外へのリンクと画像）
const attachments = all.filter((l) => l.path !== undefined && !isHtml(l.path));
// サイト内の HTML へのリンク（フレームの外側 index.html は除く）
const internalPages = all.filter(
  (l) => l.path !== undefined && isHtml(l.path) && l.path !== 'index.html',
);
const external = all.filter((l) => l.external);

const uniqueUrls = [...new Set(external.map((l) => l.raw))];
const statuses = new Map<string, LinkStatus>();
if (!offline) {
  // 同じサーバーに負荷をかけないよう、少しずつ並べて調べる
  const queue = [...uniqueUrls];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      for (let url = queue.shift(); url; url = queue.shift()) {
        statuses.set(url, await checkLink(url));
        process.stdout.write('.');
      }
    }),
  );
  process.stdout.write('\n');
}

const VERDICT_LABELS = {
  ok: '正常',
  redirect: '転送',
  'to-top': '**切れ（トップへ転送）**',
  blocked: '要確認（拒否）',
  broken: '**切れ**',
} as const;

function statusCell(url: string): [string, string] {
  const s = statuses.get(url);
  if (!s) return ['未確認', ''];
  const detail = s.status !== undefined ? String(s.status) : (s.error ?? '接続不可');
  return [VERDICT_LABELS[verdictOf(s)], s.redirectedTo ? `${detail} → ${s.redirectedTo}` : detail];
}

const existsIn = (path: string) => (files.includes(path) ? 'あり' : '**なし**');

const attachmentRows = attachments.map((l) => [
  code(l.page),
  l.kind === 'img' ? '画像' : 'リンク',
  l.text,
  code(l.path ?? ''),
  existsIn(l.path ?? ''),
]);
const internalRows = internalPages.map((l) => [
  code(l.page),
  l.text,
  code(l.path ?? ''),
  existsIn(l.path ?? ''),
]);
const externalRows = external.map((l) => [code(l.page), l.text, l.raw, ...statusCell(l.raw)]);

const countBy = (verdict: string) =>
  uniqueUrls.filter((u) => {
    const s = statuses.get(u);
    return s !== undefined && verdictOf(s) === verdict;
  }).length;
const missingAttachments = attachments.filter((l) => !files.includes(l.path ?? ''));
const missingPages = internalPages.filter((l) => !files.includes(l.path ?? ''));
const checkedAt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' }).format(new Date());

const md = `# 添付ファイルとリンクの一覧

旧サイト（\`legacy/\`）の添付ファイル・サイト内リンク・外部リンクの一覧と、リンク切れの調査結果です（plan 9.3）。
\`node tools/migrate/links.ts\` で生成しています。${offline ? '外部リンクは未確認です（--offline）。' : `外部リンクは ${checkedAt} に接続して確かめました。`}
切れたリンクの扱いは T-31（既定案：リンクを外して文字だけ残す）で、plan 9.7 で処理します。

## まとめ

- 添付ファイル・画像へのリンク：${attachments.length} 件（うちファイルがないもの ${missingAttachments.length} 件）
- サイト内のページへのリンク：${internalPages.length} 件（うちファイルがないもの ${missingPages.length} 件）
- 外部リンク：${external.length} 件（URL は ${uniqueUrls.length} 種類）${
  offline
    ? ''
    : `。正常 ${countBy('ok')}、転送 ${countBy('redirect')}、切れ ${countBy('broken')}、切れ（トップへ転送）${countBy('to-top')}、要確認（拒否）${countBy('blocked')}`
}

\`legacy/\` には HTML しか含まれていないため、添付ファイル・画像はすべて「なし」になります。

## 添付ファイル・画像

${markdownTable(['ページ', '種類', '文字（画像は代替テキスト）', 'リンク先', 'ファイル'], attachmentRows)}

## サイト内のページへのリンク

フレームの外側（\`index.html\`、旧サイトのトップ）へのリンクは除いています。

${markdownTable(['ページ', '文字', 'リンク先', 'ファイル'], internalRows)}

## 外部リンク

- 「転送」は、転送先で正常に表示されたものです。移行時は転送先の URL に書き換えます（要確認リストに載せる）。
- 「切れ（トップへ転送）」は、個別のページがサイトのトップへ転送されたもので、ページは残っていません。
- 「要確認（拒否）」は、自動の確認を拒否された（401・403・429）もので、ブラウザで開いて確かめる必要があります。

${markdownTable(['ページ', '文字', 'URL', '結果', '詳細'], externalRows)}
`;

mkdirSync(MIGRATION_DOCS_DIR, { recursive: true });
writeFileSync(join(MIGRATION_DOCS_DIR, 'links.md'), md);
console.log(`${MIGRATION_DOCS_DIR}/links.md を書き出しました。`);
