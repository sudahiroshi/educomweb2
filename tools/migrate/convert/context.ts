/** 変換スクリプトで共有するもの（plan 9.5〜9.8） */
import { join } from 'node:path';
import type { Element, Root } from 'hast';
import { readHtml } from '../lib/html.ts';
import { UTF8_DIR } from '../lib/paths.ts';
import type { Review } from '../lib/review.ts';

export interface GeneratedFile {
  /** リポジトリのルートからのパス */
  path: string;
  content: string;
}

export interface ConvertContext {
  review: Review;
  /** .migrate/utf8/ の HTML を読む */
  read(page: string): Root;
  /**
   * 本文にする要素のリンクを書き換える（plan 9.7）。target は要確認リストに載せるときの生成ファイル。
   * 元の要素は変えず、書き換えた複製を返す。
   */
  rewriteLinks(el: Element, page: string, target: string): Element;
  /** フロントマターの links の外部 URL を確かめる。切れていれば undefined（plan 9.7） */
  resolveUrl(url: string, target: string): string | undefined;
}

export function readUtf8(page: string): Root {
  return readHtml(join(UTF8_DIR, page));
}
