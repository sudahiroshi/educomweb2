// 開発用：サンプル記事（tools/dev/sample-content/）を src/content/ に一時的に置いてコマンドを実行し、終わったら取り除く。
// 閲覧時の開催状態の点検（check:events）や見た目の比較（visual-snapshot）は、開催予定の記事を含むサンプルで確かめる。
// 使い方: node tools/dev/with-samples.mjs "<コマンド>"
//   例: node tools/dev/with-samples.mjs "ASJ_EDCOM_TODAY=2026-11-19 npm run build"（npm run build:samples）
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const SAMPLE_DIR = 'tools/dev/sample-content';
const CONTENT_DIR = 'src/content';
const command = process.argv.slice(2).join(' ');
if (!command) {
  console.error('使い方: node tools/dev/with-samples.mjs "<コマンド>"');
  process.exit(2);
}

const placed = [];
function cleanup() {
  for (const path of placed.splice(0)) rmSync(path, { force: true });
}
process.on('SIGINT', () => {
  cleanup();
  process.exit(130);
});

let status = 1;
try {
  for (const collection of readdirSync(SAMPLE_DIR)) {
    for (const name of readdirSync(join(SAMPLE_DIR, collection))) {
      const dest = join(CONTENT_DIR, collection, name);
      if (existsSync(dest)) throw new Error(`${dest} がすでにあります`);
      copyFileSync(join(SAMPLE_DIR, collection, name), dest);
      placed.push(dest);
    }
  }
  console.log(`サンプル記事 ${placed.length} 件を ${CONTENT_DIR}/ に置きました。`);
  status = spawnSync(command, { shell: true, stdio: 'inherit' }).status ?? 1;
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
} finally {
  cleanup();
  console.log('サンプル記事を取り除きました。');
}
process.exit(status);
