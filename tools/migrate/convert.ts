/**
 * 旧サイトを src/content/ の .md に変換する（plan 9.5〜9.8）。
 * 先に node tools/migrate/to-utf8.ts で .migrate/utf8/ を作っておく。
 * 前回生成したファイルは .migrate/generated.json に記録し、次の実行で消してから作り直す。
 *
 * 使い方：node tools/migrate/convert.ts
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Element } from 'hast';
import { Review } from './lib/review.ts';
import { UTF8_DIR } from './lib/paths.ts';
import { readUtf8, type ConvertContext, type GeneratedFile } from './convert/context.ts';
import { convertCommittee } from './convert/committee.ts';
import { convertNewsAndEvents } from './convert/news-events.ts';

const MANIFEST = '.migrate/generated.json';

if (!existsSync(UTF8_DIR)) {
  console.error(
    `${UTF8_DIR}/ がありません。先に node tools/migrate/to-utf8.ts を実行してください。`,
  );
  process.exit(1);
}

const review = new Review();
const ctx: ConvertContext = {
  review,
  read: readUtf8,
  rewriteLinks: (el: Element) => structuredClone(el),
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
];

const previous: string[] = existsSync(MANIFEST)
  ? (JSON.parse(readFileSync(MANIFEST, 'utf8')) as string[])
  : [];
for (const path of previous) rmSync(path, { force: true });
for (const file of files) {
  mkdirSync(dirname(file.path), { recursive: true });
  writeFileSync(file.path, file.content);
}
writeFileSync(
  MANIFEST,
  JSON.stringify(
    files.map((f) => f.path),
    null,
    2,
  ),
);

console.log(files.map((f) => f.path).join('\n'));
console.log(`\n${files.length} 件を書き出しました。要確認 ${review.items.length} 件。`);
