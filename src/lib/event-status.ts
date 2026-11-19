/**
 * 開催状態（spec 3.2・3.3・3.5・4.2）。
 * today はすべて日本時間の 'YYYY-MM-DD'（todayInTokyo）を渡す。
 */
import type { EventData } from '../schemas';
import { eventFiscalYear } from './fiscal-year';
import { compareEnded, compareUpcoming } from './sort';

/** 開催状態の判定に必要な最小限の形（CollectionEntry と編集画面の両方で使える） */
export interface EventLike {
  id: string;
  data: Pick<EventData, 'startDate' | 'endDate'>;
}

/** 終了基準日：終了日、なければ開始日 */
export function eventEndDate(event: EventLike): string {
  return event.data.endDate ?? event.data.startDate;
}

/** 終了したか。終了基準日の翌日0時（日本時間）に終了になる（D-25） */
export function isEnded(event: EventLike, today: string): boolean {
  return today > eventEndDate(event);
}

/** 開催予定か（開催中を含む） */
export function isUpcoming(event: EventLike, today: string): boolean {
  return !isEnded(event, today);
}

/** 開催中か（開始日〜終了基準日）。T-29 の「開催中」ラベルに使う */
export function isOngoing(event: EventLike, today: string): boolean {
  return event.data.startDate <= today && today <= eventEndDate(event);
}

/** 活動記録に載る記事か（spec 3.5） */
export function isListedInActivities(event: {
  data: Pick<EventData, 'kind' | 'listInActivities'>;
}): boolean {
  return event.data.kind === 'activity' || event.data.listInActivities === true;
}

export interface PartitionedEvents<T extends EventLike> {
  /** 開催予定（開始日の昇順） */
  upcoming: T[];
  /** 終了分を年度ごとに（各年度は開始日の降順） */
  endedByFiscalYear: Map<number, T[]>;
  /** 終了分がある年度（降順） */
  endedFiscalYears: number[];
}

/** ビルド時の振り分け（spec 3.3 の 1） */
export function partitionEvents<T extends EventLike>(
  events: readonly T[],
  today: string,
): PartitionedEvents<T> {
  const upcoming = events.filter((e) => isUpcoming(e, today)).sort(compareUpcoming);
  const endedByFiscalYear = new Map<number, T[]>();
  for (const e of [...events].filter((e) => isEnded(e, today)).sort(compareEnded)) {
    const fy = eventFiscalYear(e);
    const list = endedByFiscalYear.get(fy);
    if (list) list.push(e);
    else endedByFiscalYear.set(fy, [e]);
  }
  const endedFiscalYears = [...endedByFiscalYear.keys()].sort((a, b) => b - a);
  return { upcoming, endedByFiscalYear, endedFiscalYears };
}

/**
 * 一覧ページ（年度なし）に表示する終了分の年度（spec 4.2）。
 * 当年度に終了分があれば当年度、なければ終了分がある最新年度。終了分がなければ undefined。
 */
export function listingFiscalYear(
  endedFiscalYears: readonly number[],
  currentFiscalYear: number,
): number | undefined {
  if (endedFiscalYears.includes(currentFiscalYear)) return currentFiscalYear;
  return [...endedFiscalYears].sort((a, b) => b - a)[0];
}
