/**
 * RSS の項目（spec 7章、D-52）。
 * T-17 既定案: お知らせ＋events の全記事を、掲載日の新しい順に並べる。
 */
import type { EventData, NewsData } from '../schemas';
import { eventUrl } from './event-kind';
import { summarize } from './summary';

export interface FeedItem {
  title: string;
  link: string;
  /** 掲載日（YYYY-MM-DD） */
  published: string;
  description: string;
}

/** 掲載日（日本時間 0時）を RSS 用の日時にする。時差でずれないよう +09:00 を明示する */
export function feedDate(published: string): Date {
  return new Date(`${published}T00:00:00+09:00`);
}

export function buildFeedItems(
  news: readonly {
    id: string;
    body?: string;
    data: Pick<NewsData, 'title' | 'published' | 'summary'>;
  }[],
  events: readonly {
    id: string;
    body?: string;
    data: Pick<EventData, 'kind' | 'title' | 'published' | 'summary'>;
  }[],
  limit = 50,
): FeedItem[] {
  const items = [
    ...news.map((n) => ({
      id: n.id,
      title: n.data.title,
      link: `/news/${n.id}/`,
      published: n.data.published,
      description: summarize(n.data.summary, n.body),
    })),
    ...events.map((e) => ({
      id: e.id,
      title: e.data.title,
      link: eventUrl(e),
      published: e.data.published,
      description: summarize(e.data.summary, e.body),
    })),
  ];
  return items
    .sort((a, b) =>
      a.published === b.published ? (a.id < b.id ? 1 : -1) : a.published < b.published ? 1 : -1,
    )
    .slice(0, limit)
    .map(({ title, link, published, description }) => ({ title, link, published, description }));
}
