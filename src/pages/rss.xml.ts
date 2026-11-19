/** RSS（spec 7章、D-52）。T-17 既定案: お知らせ＋events の全記事（掲載日順） */
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '../config/site';
import { buildFeedItems, feedDate } from '../lib/feed';

export async function GET(context: APIContext) {
  const items = buildFeedItems(await getCollection('news'), await getCollection('events'));
  return rss({
    title: site.name,
    description: `${site.name}からのお知らせと活動の記録`,
    site: context.site ?? site.url,
    items: items.map((item) => ({
      title: item.title,
      link: item.link,
      pubDate: feedDate(item.published),
      description: item.description,
    })),
    customData: '<language>ja</language>',
  });
}
