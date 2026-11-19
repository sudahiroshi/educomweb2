/**
 * 外部リンクの判定と、外部であることを示すアイコン・読み上げ文言（spec 8章）。
 * Markdown 本文（rehype-site）と LinkList などのコンポーネントで共有する。
 */
import { site } from '../../config/site';

/** 読み上げ用の補足（視覚的には隠す） */
export const EXTERNAL_LABEL = '（外部サイト）';

/** 外部リンクのアイコン（矢印付きの四角）。24×24 の viewBox 用のパス */
export const EXTERNAL_ICON_PATHS = [
  'M14 4h6v6',
  'M20 4l-9 9',
  'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
];

/** http(s) で始まり、サイト自身のホスト以外を指すリンクか */
export function isExternalUrl(href: string): boolean {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return false; // 相対パス・ルート相対パスは内部
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  return url.host !== new URL(site.url).host;
}
