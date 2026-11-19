/**
 * 日付の基本処理（spec 2.3・3.3）。
 * 日付は YYYY-MM-DD の文字列のまま扱い、Date に変換して時差でずれる処理はしない。
 * 曜日の計算だけは UTC の Date を使う（タイムゾーンに左右されない）。
 * ブラウザ（閲覧時スクリプト・編集画面）でも動くよう、Node の機能は使わない。
 */
import { site } from '../config/site';

export interface Ymd {
  year: number;
  month: number;
  day: number;
}

/** 'YYYY-MM-DD' を数値に分解する。形式が違えば例外（スキーマ検査済みの値に使う前提） */
export function parseYmd(value: string): Ymd {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) throw new Error(`日付の形式が正しくありません: ${value}`);
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

const tokyoDateFormat = new Intl.DateTimeFormat('sv-SE', {
  timeZone: site.timeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** 日本時間の今日を 'YYYY-MM-DD' で返す（spec 3.3 の 4）。テスト用に時刻を渡せる */
export function todayInTokyo(now: Date = new Date()): string {
  return tokyoDateFormat.format(now);
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const;

/** 曜日（日〜土の1文字） */
export function weekdayOf(value: string): string {
  const { year, month, day } = parseYmd(value);
  return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()] ?? '';
}
