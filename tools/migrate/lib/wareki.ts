/** 和暦の年月の読み取り（plan 9.6） */

const ERA_START = { 平成: 1988, 令和: 2018 } as const;

export interface YearMonth {
  year: number;
  month: number;
}

/** 文中の「平成30年6月」「令和元年5月」などを、出てくる順に西暦の年月にする */
export function parseWarekiYearMonths(text: string): YearMonth[] {
  const out: YearMonth[] = [];
  for (const m of text.matchAll(/(平成|令和)\s*(元|\d+)\s*年\s*(\d+)\s*月/g)) {
    const era = m[1] as keyof typeof ERA_START;
    const n = m[2] === '元' ? 1 : Number(m[2]);
    out.push({ year: ERA_START[era] + n, month: Number(m[3]) });
  }
  return out;
}

/** 年月の年度（4月始まり、spec 3.1） */
export function fiscalYearOfMonth({ year, month }: YearMonth): number {
  return month >= 4 ? year : year - 1;
}
