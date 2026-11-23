/**
 * コンテンツの読み込み（ページから使う）。astro:content に依存するため、ビルド時専用。
 * 並び順・年度の振り分けなどの判定は、テストのある src/lib の関数に任せる。
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import type { MeetingKind } from './event-kind';
import { BUILD_TODAY_ENV, resolveBuildToday } from './build-date';
import { isListedInActivities, partitionEvents } from './event-status';
import { groupByFiscalYear } from './group';
import { compareNews } from './sort';

export type NewsEntry = CollectionEntry<'news'>;
export type EventEntry = CollectionEntry<'events'>;

/** ビルド日（日本時間）。開催予定・終了の振り分けの基準（spec 3.3）。確認用に環境変数で差し替え可 */
export const buildToday = resolveBuildToday(process.env[BUILD_TODAY_ENV]);

/** お知らせ（掲載日の降順）と年度ごとの振り分け（T-04 既定案: 年度別ページ） */
export async function loadNews() {
  const news = (await getCollection('news')).sort(compareNews);
  return { news, ...groupByFiscalYear(news, (n) => n.data.published) };
}

/** 一覧の対象：'activities'（活動記録に載る記事）または種類 */
export type EventListTarget = 'activities' | MeetingKind | 'media';

export async function loadEvents(target: EventListTarget) {
  const all = await getCollection('events');
  const events =
    target === 'activities'
      ? all.filter(isListedInActivities)
      : all.filter((e) => e.data.kind === target);
  return partitionEvents(events, buildToday);
}

/** 運営委員名簿（年度の降順）（D-28） */
export async function loadCommittee() {
  const entries = (await getCollection('committee')).sort(
    (a, b) => b.data.fiscalYear - a.data.fiscalYear,
  );
  return { entries, fiscalYears: entries.map((e) => e.data.fiscalYear) };
}
