/**
 * 旧サイト（legacy/）の HTML を UTF-8 に変換して .migrate/utf8/ に書き出す（plan 9.1）。
 * legacy/ は編集しない。HTML 以外のファイルはそのまま写す。
 *
 * 使い方：node tools/migrate/to-utf8.ts
 */
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { declaredCharset, toUtf8 } from './lib/encoding.ts';
import { LEGACY_DIR, UTF8_DIR, listFiles } from './lib/paths.ts';

rmSync(UTF8_DIR, { recursive: true, force: true });

const rows: string[] = [];
for (const path of listFiles(LEGACY_DIR)) {
  const src = join(LEGACY_DIR, path);
  const dest = join(UTF8_DIR, path);
  mkdirSync(dirname(dest), { recursive: true });
  if (!/\.html?$/i.test(path)) {
    copyFileSync(src, dest);
    continue;
  }
  const bytes = readFileSync(src);
  const { text, encoding } = toUtf8(bytes);
  writeFileSync(dest, text);
  rows.push(`${path}\t宣言: ${declaredCharset(bytes) ?? '（なし）'}\t実際: ${encoding}`);
}

console.log(rows.join('\n'));
console.log(`\n${rows.length} 件の HTML を ${UTF8_DIR}/ に書き出しました。`);
