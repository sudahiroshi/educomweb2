import { describe, expect, it } from 'vitest';
import { fiscalYearOfMonth, parseWarekiYearMonths } from './wareki.ts';

describe('parseWarekiYearMonths', () => {
  it('平成・令和（元年を含む）を西暦の年月にする', () => {
    expect(parseWarekiYearMonths('平成30年6月より令和2年3月まで')).toEqual([
      { year: 2018, month: 6 },
      { year: 2020, month: 3 },
    ]);
    expect(parseWarekiYearMonths('令和元年5月')).toEqual([{ year: 2019, month: 5 }]);
  });
});

describe('fiscalYearOfMonth', () => {
  it('4月始まりの年度', () => {
    expect(fiscalYearOfMonth({ year: 2020, month: 3 })).toBe(2019);
    expect(fiscalYearOfMonth({ year: 2020, month: 4 })).toBe(2020);
  });
});
