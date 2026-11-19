/**
 * プレビュー用の表示データ（spec 6.4）。入力途中でも表示が壊れないよう、形式の正しい値だけを渡す。
 * （表示部品は日付を YYYY-MM-DD として解析するため、未入力・入力途中の日付は渡さない）
 */
import { isDateValue, isTimeValue } from '../schemas';
import type { ContentIndex } from './content-index';
import type { Draft } from './model';

const date = (v: string) => (isDateValue(v) ? v : undefined);
const time = (v: string) => (isTimeValue(v) ? v : undefined);
const text = (v: string) => (v.trim() === '' ? undefined : v.trim());

export function previewEvent(draft: Draft) {
  const e = draft.event;
  const startDate = date(e.startDate);
  const endDate = startDate && date(e.endDate) && e.endDate >= startDate ? e.endDate : undefined;
  return {
    startDate,
    data: {
      kind:
        draft.kind === 'activity' ||
        draft.kind === 'asj' ||
        draft.kind === 'cosponsored' ||
        draft.kind === 'international'
          ? draft.kind
          : 'activity',
      title: text(e.title) ?? '（タイトル）',
      startDate: startDate ?? '',
      endDate,
      venue: text(e.venue),
      links: e.links
        .filter((l) => l.label.trim() && l.url.trim())
        .map((l) => ({ label: l.label.trim(), url: l.url.trim() })),
      sessions: e.sessions.map((s) => ({
        name: text(s.name) ?? '（セッション名）',
        date: date(s.date),
        startTime: time(s.startTime),
        endTime: time(s.endTime),
        room: text(s.room),
        chair: text(s.chair),
        viceChair: text(s.viceChair),
        talks: s.talks
          .filter((t) => t.title.trim() || t.presenter.trim())
          .map((t) => ({
            number: text(t.number),
            title: text(t.title) ?? '（演題）',
            presenter: text(t.presenter) ?? '（発表者）',
            hasCoauthors: t.hasCoauthors,
            affiliation: text(t.affiliation),
          })),
      })),
      published: date(e.published),
      updated: date(e.updated),
    } as const,
  };
}

/** お知らせの関連記事（既存記事一覧の情報で表示する） */
export function previewRelated(draft: Draft, index: ContentIndex | null) {
  if (!index) return [];
  return draft.news.related.flatMap((id) => {
    const e = index.entries.find((x) => x.collection === 'events' && x.id === id);
    if (!e || !e.kind || !isDateValue(e.startDate)) return [];
    return [
      {
        id: e.id,
        data: { kind: e.kind, title: e.title, startDate: e.startDate, endDate: e.endDate },
      },
    ];
  });
}

export { date as previewDate, text as previewText };
