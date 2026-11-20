/**
 * 表示設定（テーマ・文字サイズ）（spec 5.4・5.5、D-48・D-49）。
 * 保存キーと値の定義はここだけに置き、描画前のインラインスクリプトと切替ボタンの両方で使う。
 * localStorage は使えない環境があるため、読み書きはすべて try/catch で囲む。
 */

export const THEME_KEY = 'asj-edcom:theme';
export const FONT_SIZE_KEY = 'asj-edcom:font-size';

export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

export const FONT_SIZES = ['normal', 'large', 'xlarge'] as const;
export type FontSize = (typeof FONT_SIZES)[number];

export const FONT_SIZE_LABELS: Record<FontSize, string> = {
  normal: 'ノーマル',
  large: '大',
  xlarge: '特大',
};

export function isTheme(value: unknown): value is Theme {
  return (THEMES as readonly unknown[]).includes(value);
}

export function isFontSize(value: unknown): value is FontSize {
  return (FONT_SIZES as readonly unknown[]).includes(value);
}

export function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // 保存できない環境（プライベートモードなど）では、そのページの表示だけ切り替える
  }
}

/**
 * <head> に入れる描画前のスクリプト（spec 5.1）。ちらつきを防ぐため、CSS より前に同期で実行する。
 * 保存値があればそれ、なければ OS の設定（prefers-color-scheme）に従う。
 * あわせて <html data-js> を付け、スクリプトで動かす部品（メニューの開閉・表示設定のボタン）を最初から
 * その形で描く（後から切り替えると本文がずれる。plan 11.5 の Lighthouse で CLS 0.48 だった）。
 */
export const INIT_SCRIPT = `(function(){var d=document.documentElement,t=null,f=null;try{t=localStorage.getItem(${JSON.stringify(
  THEME_KEY,
)});f=localStorage.getItem(${JSON.stringify(FONT_SIZE_KEY)})}catch(e){}if(t!=="light"&&t!=="dark"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}d.dataset.theme=t;d.dataset.fontSize=f==="large"||f==="xlarge"?f:"normal";d.dataset.js=""})();`;
