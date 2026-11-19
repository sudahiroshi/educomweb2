/** 既存記事一覧（spec 3.8）。全コレクションの ID・タイトル・種類・日付 */
import { getCollection } from 'astro:content';
import { contentPath, type ContentIndex, type IndexEntry } from '../../editor/content-index';

export async function GET() {
  const entries: IndexEntry[] = [
    ...(await getCollection('news')).map((e) => ({
      collection: 'news' as const,
      id: e.id,
      path: contentPath('news', e.id),
      title: e.data.title,
      published: e.data.published,
    })),
    ...(await getCollection('events')).map((e) => ({
      collection: 'events' as const,
      id: e.id,
      path: contentPath('events', e.id),
      title: e.data.title,
      kind: e.data.kind,
      published: e.data.published,
      startDate: e.data.startDate,
      ...(e.data.endDate ? { endDate: e.data.endDate } : {}),
    })),
    ...(await getCollection('committee')).map((e) => ({
      collection: 'committee' as const,
      id: e.id,
      path: contentPath('committee', e.id),
      title: `${e.data.fiscalYear}年度 運営委員名簿`,
      published: e.data.published,
      fiscalYear: e.data.fiscalYear,
    })),
    ...(await getCollection('pages')).map((e) => ({
      collection: 'pages' as const,
      id: e.id,
      path: contentPath('pages', e.id),
      title: e.data.title,
    })),
  ];
  entries.sort((a, b) =>
    a.collection === b.collection ? (a.id < b.id ? 1 : -1) : a.collection < b.collection ? -1 : 1,
  );
  const body: ContentIndex = { generatedAt: new Date().toISOString(), entries };
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
