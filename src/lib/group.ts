/** 年度ごとの振り分け（お知らせの年度別ページなど。T-04） */
import { fiscalYearOf } from './fiscal-year';

export interface FiscalYearGroups<T> {
  byFiscalYear: Map<number, T[]>;
  /** 項目がある年度（降順） */
  fiscalYears: number[];
}

/** 項目を日付の年度で振り分ける。各年度の中の順序は入力の順を保つ */
export function groupByFiscalYear<T>(
  items: readonly T[],
  dateOf: (item: T) => string,
): FiscalYearGroups<T> {
  const byFiscalYear = new Map<number, T[]>();
  for (const item of items) {
    const fy = fiscalYearOf(dateOf(item));
    const list = byFiscalYear.get(fy);
    if (list) list.push(item);
    else byFiscalYear.set(fy, [item]);
  }
  return { byFiscalYear, fiscalYears: [...byFiscalYear.keys()].sort((a, b) => b - a) };
}
