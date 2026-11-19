/**
 * GitHub の画面・ファイルの URL（spec 6.6・6.7）。owner / repo / branch は src/config/site.ts から読む。
 */
import { site } from '../config/site';

const { owner, repo, branch } = site.github;
const base = `https://github.com/${owner}/${repo}`;

/** パスの各部分を URL 用に符号化する（/ は残す） */
function encodePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/');
}

/** 新規ファイル作成画面（ファイル名と内容を入れた状態）。value を省くとファイル名だけ */
export function newFileUrl(path: string, value?: string): string {
  const params = new URLSearchParams({ filename: path });
  if (value !== undefined) params.set('value', value);
  return `${base}/new/${branch}?${params.toString()}`;
}

/** フォルダのアップロード画面 */
export function uploadUrl(dir: string): string {
  return `${base}/upload/${branch}/${encodePath(dir)}`;
}

/** 既存ファイルの編集画面 */
export function editUrl(path: string): string {
  return `${base}/edit/${branch}/${encodePath(path)}`;
}

/** 生のファイル（公開リポジトリから直接読み込む。D-54） */
export function rawUrl(path: string): string {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${encodePath(path)}`;
}

/** リポジトリ上のファイルの表示画面 */
export function blobUrl(path: string): string {
  return `${base}/blob/${branch}/${encodePath(path)}`;
}
