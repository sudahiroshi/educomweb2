// 開発用：ビルド結果（dist/）の全ページを点検する（spec 4.4・8章）
// - <title> が「{ページ名} | 日本音響学会 音響教育委員会」（トップはサイト名のみ）
// - h1 がちょうど1つ、見出しレベルを飛ばしていない
// - トップ以外にパンくずがある
// - <html lang="ja">
// 使い方: npm run build のあと node tools/dev/check-pages.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
const SITE = '日本音響学会 音響教育委員会';

function* htmlFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(p);
    else if (entry.name.endsWith('.html')) yield p;
  }
}

const problems = [];
let count = 0;
for (const file of htmlFiles(DIST)) {
  count++;
  const path = '/' + relative(DIST, file).replace(/index\.html$/, '');
  const html = readFileSync(file, 'utf8');
  const fail = (msg) => problems.push(`${path}: ${msg}`);

  const title = /<title>([^<]*)<\/title>/.exec(html)?.[1];
  if (path === '/') {
    if (title !== SITE) fail(`<title> がサイト名ではない（${title}）`);
  } else if (!title || !title.endsWith(` | ${SITE}`) || title === ` | ${SITE}`) {
    fail(`<title> の形式が違う（${title}）`);
  }

  if (!/<html lang="ja"/.test(html)) fail('<html lang="ja"> がない');

  const h1 = html.match(/<h1[\s>]/g)?.length ?? 0;
  if (h1 !== 1) fail(`h1 が ${h1} 個`);

  const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
  let prev = 0;
  for (const level of levels) {
    if (level > prev + 1) fail(`見出しレベルが飛んでいる（h${prev} → h${level}）`);
    prev = level;
  }

  const hasCrumbs = html.includes('aria-label="パンくずリスト"');
  if (path === '/' && hasCrumbs) fail('トップにパンくずがある');
  if (path !== '/' && !hasCrumbs) fail('パンくずがない');
}

console.log(`${count} ページを点検しました。`);
if (problems.length > 0) {
  console.log(problems.join('\n'));
  process.exit(1);
}
console.log('問題はありません。');
