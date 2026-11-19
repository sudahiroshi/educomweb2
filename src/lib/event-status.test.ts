import { describe, expect, test } from 'vitest';
import {
  eventEndDate,
  isEnded,
  isListedInActivities,
  isOngoing,
  isUpcoming,
  listingFiscalYear,
  partitionEvents,
} from './event-status';
import { todayInTokyo } from './date';

const ev = (id: string, startDate: string, endDate?: string) => ({
  id,
  data: endDate === undefined ? { startDate } : { startDate, endDate },
});

describe('開催状態', () => {
  const multi = ev('a', '2027-03-09', '2027-03-11');
  const single = ev('b', '2027-03-09');

  test('終了基準日', () => {
    expect(eventEndDate(multi)).toBe('2027-03-11');
    expect(eventEndDate(single)).toBe('2027-03-09');
  });

  test('終了日当日は開催予定、翌日は終了', () => {
    expect(isUpcoming(multi, '2027-03-11')).toBe(true);
    expect(isEnded(multi, '2027-03-11')).toBe(false);
    expect(isEnded(multi, '2027-03-12')).toBe(true);
  });

  test('1日開催は開始日の翌日に終了', () => {
    expect(isEnded(single, '2027-03-09')).toBe(false);
    expect(isEnded(single, '2027-03-10')).toBe(true);
  });

  test('翌日0時（日本時間）の切り替え', () => {
    expect(isEnded(single, todayInTokyo(new Date('2027-03-09T14:59:59Z')))).toBe(false);
    expect(isEnded(single, todayInTokyo(new Date('2027-03-09T15:00:00Z')))).toBe(true);
  });

  test('月またぎ・年またぎの開催', () => {
    const month = ev('m', '2027-03-30', '2027-04-02');
    expect(isEnded(month, '2027-04-01')).toBe(false);
    expect(isEnded(month, '2027-04-03')).toBe(true);
    const year = ev('y', '2026-12-28', '2027-01-05');
    expect(isEnded(year, '2027-01-05')).toBe(false);
    expect(isEnded(year, '2027-01-06')).toBe(true);
  });

  test('開催中', () => {
    expect(isOngoing(multi, '2027-03-08')).toBe(false);
    expect(isOngoing(multi, '2027-03-09')).toBe(true);
    expect(isOngoing(multi, '2027-03-11')).toBe(true);
    expect(isOngoing(multi, '2027-03-12')).toBe(false);
  });
});

describe('活動記録に載る記事', () => {
  test('activity は常に、ほかは listInActivities のとき', () => {
    expect(isListedInActivities({ data: { kind: 'activity', listInActivities: false } })).toBe(
      true,
    );
    expect(isListedInActivities({ data: { kind: 'asj', listInActivities: true } })).toBe(true);
    expect(isListedInActivities({ data: { kind: 'asj', listInActivities: false } })).toBe(false);
  });
});

describe('ビルド時の振り分け', () => {
  const events = [
    ev('2025-05-10-old', '2025-05-10'),
    ev('2026-09-01-autumn', '2026-09-01', '2026-09-03'),
    ev('2027-03-30-spring', '2027-03-30', '2027-04-02'),
    ev('2027-03-09-asj', '2027-03-09', '2027-03-11'),
    ev('2026-07-01-july', '2026-07-01'),
    ev('2027-03-09-other', '2027-03-09'),
  ];

  test('開催予定は開始日の昇順、同日は終了日→ID', () => {
    const { upcoming } = partitionEvents(events, '2027-03-09');
    expect(upcoming.map((e) => e.id)).toEqual([
      '2027-03-09-other',
      '2027-03-09-asj',
      '2027-03-30-spring',
    ]);
  });

  test('終了分は年度ごと・開始日の降順、年度は降順', () => {
    const { endedByFiscalYear, endedFiscalYears } = partitionEvents(events, '2027-03-09');
    expect(endedFiscalYears).toEqual([2026, 2025]);
    expect(endedByFiscalYear.get(2026)?.map((e) => e.id)).toEqual([
      '2026-09-01-autumn',
      '2026-07-01-july',
    ]);
    expect(endedByFiscalYear.get(2025)?.map((e) => e.id)).toEqual(['2025-05-10-old']);
  });

  test('開催予定が0件', () => {
    const { upcoming, endedFiscalYears } = partitionEvents(events, '2027-04-03');
    expect(upcoming).toEqual([]);
    // 2027-03-30 開始の記事は、終了が 4月でも 2026年度に入る
    expect(endedFiscalYears).toEqual([2026, 2025]);
  });

  test('元の配列を変更しない', () => {
    const copy = [...events];
    partitionEvents(events, '2027-03-09');
    expect(events).toEqual(copy);
  });
});

describe('一覧ページに表示する年度', () => {
  test('当年度に終了分があれば当年度', () => {
    expect(listingFiscalYear([2026, 2025], 2026)).toBe(2026);
  });

  test('当年度に終了分がなければ最新の年度（年度の変わり目）', () => {
    expect(listingFiscalYear([2026, 2025], 2027)).toBe(2026);
  });

  test('終了分がなければ undefined', () => {
    expect(listingFiscalYear([], 2026)).toBeUndefined();
  });
});
