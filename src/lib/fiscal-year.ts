/** 年度（spec 3.1、D-26）：4月始まり */
import { parseYmd } from './date';

/** 日付（YYYY-MM-DD）の年度。2027-03-31 → 2026、2027-04-01 → 2027 */
export function fiscalYearOf(value: string): number {
  const { year, month } = parseYmd(value);
  return month >= 4 ? year : year - 1;
}

/** events の年度は開始日で決める */
export function eventFiscalYear(event: { data: { startDate: string } }): number {
  return fiscalYearOf(event.data.startDate);
}

/** 年度の表示（例：2026年度） */
export function formatFiscalYear(fiscalYear: number): string {
  return `${fiscalYear}年度`;
}
