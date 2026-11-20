/** 移行スクリプトで使う場所（plan 9章） */
import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

/** 旧サイト一式（編集しない） */
export const LEGACY_DIR = 'legacy';
/** UTF-8 に変換した旧サイト（作業用。コミットしない） */
export const UTF8_DIR = '.migrate/utf8';
/** 棚卸し表などの出力先 */
export const MIGRATION_DOCS_DIR = 'docs/migration';
/** 外部リンクの死活の調査結果（plan 9.3 で作り、plan 9.7 の書き換えで読む） */
export const LINK_STATUS_FILE = 'docs/migration/link-status.json';
/** 旧サイトの添付ファイルの移し先（spec 2.8。旧サイトのフォルダ構成を保つ） */
export const LEGACY_FILES_DIR = 'public/files/legacy';

/** フォルダ以下のファイルを、フォルダからの相対パス（/ 区切り）で名前順に返す */
export function listFiles(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === '.DS_Store') continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else out.push(relative(root, full).split('\\').join('/'));
    }
  };
  walk(root);
  return out.sort();
}
