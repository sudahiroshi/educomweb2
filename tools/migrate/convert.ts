/**
 * 旧サイトを src/content/ の .md に変換する（plan 9.5〜9.8）。
 * 先に node tools/migrate/to-utf8.ts で .migrate/utf8/ を作っておく。
 * 前回生成したファイルは .migrate/generated.json に記録し、次の実行で消してから作り直す。
 *
 * 使い方：node tools/migrate/convert.ts
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Review } from './lib/review.ts';
import type { LinkStatus } from './lib/link-check.ts';
import { LEGACY_DIR, LEGACY_FILES_DIR, LINK_STATUS_FILE, UTF8_DIR } from './lib/paths.ts';
import { decideExternal, rewriteLinks, type RewriteOptions } from './lib/rewrite-links.ts';
import { PAGE_PLANS } from './mapping.ts';
import { readUtf8, type ConvertContext, type GeneratedFile } from './convert/context.ts';
import { convertCommittee } from './convert/committee.ts';
import { convertNewsAndEvents } from './convert/news-events.ts';
import { convertPages } from './convert/pages.ts';

const MANIFEST = '.migrate/generated.json';

if (!existsSync(UTF8_DIR)) {
  console.error(
    `${UTF8_DIR}/ がありません。先に node tools/migrate/to-utf8.ts を実行してください。`,
  );
  process.exit(1);
}

if (!existsSync(LINK_STATUS_FILE)) {
  console.error(
    `${LINK_STATUS_FILE} がありません。先に node tools/migrate/links.ts を実行してください。`,
  );
  process.exit(1);
}

const review = new Review();
const statuses = new Map(
  Object.entries(JSON.parse(readFileSync(LINK_STATUS_FILE, 'utf8')) as Record<string, LinkStatus>),
);

/** 旧サイトのページ → 新サイトの URL（移行するページだけ） */
const pageUrls = new Map<string, string>([
  ['top.html', '/news/'],
  ['meeting/kenkyuhapyoukai.html', '/meetings/asj/'],
  ['meeting/kokusaikaigi.html', '/meetings/international/'],
  ['state/members.html', '/committee/'],
  ['plan/seturitusyusi.html', '/about/'],
]);
for (const plan of PAGE_PLANS) {
  if (plan.destination.to === 'pages') pageUrls.set(plan.path, `/${plan.destination.slug}/`);
}

const copiedAttachments = new Set<string>();
const rewriteOptions: RewriteOptions = {
  statuses,
  pageUrls,
  attachmentExists: (path) => existsSync(join(LEGACY_DIR, path)),
  copyAttachment: (path) => copiedAttachments.add(path),
  review,
};

const ctx: ConvertContext = {
  review,
  read: readUtf8,
  rewriteLinks: (el, page, target) => rewriteLinks(el, page, target, rewriteOptions),
  resolveUrl: (url, target) => {
    const decision = decideExternal(url, statuses);
    if (decision.note) review.add(target, decision.note);
    return decision.action === 'keep' ? decision.url : undefined;
  },
};

/** 日本時間の今日の年度（現在の名簿をどの年度まで書くか） */
function currentFiscalYear(): number {
  const [y, m] = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo' })
    .format(new Date())
    .split('-')
    .map(Number);
  return (m ?? 1) >= 4 ? (y ?? 0) : (y ?? 0) - 1;
}

const files: GeneratedFile[] = [
  ...convertNewsAndEvents(ctx),
  ...convertCommittee(ctx, currentFiscalYear()),
  ...convertPages(ctx),
];

const previous: string[] = existsSync(MANIFEST)
  ? (JSON.parse(readFileSync(MANIFEST, 'utf8')) as string[])
  : [];
for (const path of previous) rmSync(path, { force: true });
for (const file of files) {
  mkdirSync(dirname(file.path), { recursive: true });
  writeFileSync(file.path, file.content);
}
// 本文から参照されている添付ファイルを public/files/legacy/ に写す（旧サイトのフォルダ構成を保つ）
const copied = [...copiedAttachments].sort().map((path) => {
  const dest = join(LEGACY_FILES_DIR, path);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(join(LEGACY_DIR, path), dest);
  return dest;
});
writeFileSync(MANIFEST, JSON.stringify([...files.map((f) => f.path), ...copied], null, 2));

console.log(files.map((f) => f.path).join('\n'));
console.log(
  `\n${files.length} 件を書き出し、添付ファイル ${copied.length} 件を写しました。要確認 ${review.items.length} 件。`,
);
