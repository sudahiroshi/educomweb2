/**
 * events の種類ごとの表示名と URL（spec 4.1・5.6）。
 * T-07 既定案: kind: activity のラベルは「委員会活動」。
 * asj は、開催予定カードでは正式名「音響学会研究発表会」、一覧のラベルでは短い「研究発表会」（案Bのとおり）。
 */
import type { EventKind } from '../schemas';

export const KIND_LABELS: Record<EventKind, { full: string; short: string }> = {
  activity: { full: '委員会活動', short: '委員会活動' },
  asj: { full: '音響学会研究発表会', short: '研究発表会' },
  cosponsored: { full: '共催研究発表会', short: '共催研究発表会' },
  international: { full: '国際会議', short: '国際会議' },
};

/** 種類ごとの一覧ページの URL（活動記録は /activities/、ほかは /meetings/{kind}/） */
export function kindListUrl(kind: EventKind): string {
  return kind === 'activity' ? '/activities/' : `/meetings/${kind}/`;
}

/** 種類ごとの一覧ページの名前 */
export function kindListTitle(kind: EventKind): string {
  return kind === 'activity' ? '活動記録' : KIND_LABELS[kind].full;
}

/** 記事詳細の URL（spec 4.1） */
export function eventUrl(event: { id: string; data: { kind: EventKind } }): string {
  return `${kindListUrl(event.data.kind)}${event.id}/`;
}

/** 年度別ページの URL */
export function kindFiscalYearUrl(kind: EventKind, fiscalYear: number): string {
  return `${kindListUrl(kind)}fy/${fiscalYear}/`;
}
