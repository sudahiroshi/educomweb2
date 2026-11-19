/** 日付の表示形式（spec 3.6） */
import { parseYmd, weekdayOf } from './date';

/** 掲載日・更新日：2026年11月19日 */
export function formatDate(value: string): string {
  const { year, month, day } = parseYmd(value);
  return `${year}年${month}月${day}日`;
}

/** 年月：2026年9月（活動記録の一覧などに使う） */
export function formatYearMonth(value: string): string {
  const { year, month } = parseYmd(value);
  return `${year}年${month}月`;
}

/** 曜日付きの月日：3月10日（水） */
export function formatMonthDayWeekday(value: string): string {
  const { month, day } = parseYmd(value);
  return `${month}月${day}日（${weekdayOf(value)}）`;
}

/**
 * 開催日。
 * - 1日：2027年3月9日（火）
 * - 同月内：2027年3月9日（火）〜11日（木）
 * - 月またぎ：2027年3月30日（火）〜4月2日（金）
 * - 年またぎ：2026年12月28日（月）〜2027年1月5日（火）
 */
export function formatEventDate(startDate: string, endDate?: string): string {
  const s = parseYmd(startDate);
  const head = `${s.year}年${s.month}月${s.day}日（${weekdayOf(startDate)}）`;
  if (endDate === undefined || endDate === startDate) return head;
  const e = parseYmd(endDate);
  const w = `（${weekdayOf(endDate)}）`;
  if (e.year !== s.year) return `${head}〜${e.year}年${e.month}月${e.day}日${w}`;
  if (e.month !== s.month) return `${head}〜${e.month}月${e.day}日${w}`;
  return `${head}〜${e.day}日${w}`;
}

/**
 * セッション日時：3月10日（水） 13:00〜15:00。
 * 日付・時刻は任意（T-16）のため、あるものだけを並べる。何もなければ空文字。
 */
export function formatSessionDateTime(date?: string, startTime?: string, endTime?: string): string {
  const time =
    startTime !== undefined && endTime !== undefined
      ? `${startTime}〜${endTime}`
      : startTime !== undefined
        ? `${startTime}〜`
        : endTime !== undefined
          ? `〜${endTime}`
          : '';
  const day = date !== undefined ? formatMonthDayWeekday(date) : '';
  return [day, time].filter((p) => p !== '').join(' ');
}

export interface DateBlock {
  /** 例：2027 */
  year: string;
  /** 例：3月 */
  month: string;
  /** 例：9日、9日〜11日、30日〜4月2日、28日〜1月5日 */
  day: string;
}

/**
 * 一覧カードの日付ブロック（案B）。年／月／日（範囲）の3段。
 * 月・年をまたぐ場合は、日の段に終了側の月を添える（年は <time datetime> で補う）。
 */
export function dateBlock(startDate: string, endDate?: string): DateBlock {
  const s = parseYmd(startDate);
  const block: DateBlock = { year: String(s.year), month: `${s.month}月`, day: `${s.day}日` };
  if (endDate === undefined || endDate === startDate) return block;
  const e = parseYmd(endDate);
  const endPart =
    e.year === s.year && e.month === s.month ? `${e.day}日` : `${e.month}月${e.day}日`;
  return { ...block, day: `${s.day}日〜${endPart}` };
}
