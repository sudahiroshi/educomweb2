/**
 * 「記事をGitHubに追加」の URL の組み立て（spec 6.6、plan 8.9）。
 */
import { editUrl, newFileUrl } from './github';

/**
 * 内容入りの新規作成画面を開ける URL の長さの上限（URL 全体の文字数）。
 * 2026-11-19 にログインしていない状態で実測：約 6,600 文字までは正常（ログイン画面へ転送）、
 * 約 7,000 文字から GitHub がエラー（500）、約 10,000 文字以上で 414。余裕を見て 6,000 文字とする。
 * 日本語は 1 文字が URL 上で 9 文字（%E3%81%82 など）になるため、本文が長いと代わりの手順になる。
 */
export const GITHUB_URL_MAX = 6000;

export type AddPlan =
  /** 内容を入れた新規作成画面をそのまま開く */
  | { mode: 'direct'; url: string }
  /** 長すぎるため、内容をコピーしてからファイル名だけの新規作成画面を開き、貼り付けてもらう */
  | { mode: 'paste'; url: string; length: number }
  /** 既存記事を読み込んで修正した場合：既存ファイルの編集画面を開き、全文を差し替えてもらう */
  | { mode: 'edit'; url: string };

export function planAddToGitHub(path: string, markdown: string, loadedPath?: string): AddPlan {
  if (loadedPath && loadedPath === path) return { mode: 'edit', url: editUrl(path) };
  const url = newFileUrl(path, markdown);
  if (url.length <= GITHUB_URL_MAX) return { mode: 'direct', url };
  return { mode: 'paste', url: newFileUrl(path), length: url.length };
}
