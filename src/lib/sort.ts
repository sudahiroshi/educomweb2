/**
 * 並び順（spec 3.4）。
 * 同じ開始日の場合は終了日、次に ID で並べて順序を安定させる。
 */
import type { EventData, NewsData } from '../schemas';

interface EventSortable {
  id: string;
  data: Pick<EventData, 'startDate' | 'endDate'>;
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** 開催予定：開始日の昇順（近いものが上）（D-23） */
export function compareUpcoming(a: EventSortable, b: EventSortable): number {
  return (
    compareText(a.data.startDate, b.data.startDate) ||
    compareText(a.data.endDate ?? a.data.startDate, b.data.endDate ?? b.data.startDate) ||
    compareText(a.id, b.id)
  );
}

/** 終了分：開始日の降順（新しいものが上）（D-22） */
export function compareEnded(a: EventSortable, b: EventSortable): number {
  return -compareUpcoming(a, b);
}

/** お知らせ：掲載日の降順。同日は更新日（なければ掲載日）の降順、次に ID の降順 */
export function compareNews(
  a: { id: string; data: Pick<NewsData, 'published' | 'updated'> },
  b: { id: string; data: Pick<NewsData, 'published' | 'updated'> },
): number {
  return -(
    compareText(a.data.published, b.data.published) ||
    compareText(a.data.updated ?? a.data.published, b.data.updated ?? b.data.published) ||
    compareText(a.id, b.id)
  );
}

/** 年度の降順（運営委員の年度リンクなど） */
export function compareFiscalYearDesc(a: number, b: number): number {
  return b - a;
}
