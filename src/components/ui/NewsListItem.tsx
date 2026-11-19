/** お知らせの一覧行（spec 5.6、案B）：掲載日＋タイトル。<ul> の中で使う */
import { formatDate } from '../../lib/format-date';
import { textLang } from '../../lib/lang';
import type { NewsData } from '../../schemas';

export function NewsListItem({
  news,
  href = `/news/${news.id}/`,
}: {
  news: { id: string; data: Pick<NewsData, 'title' | 'published'> };
  href?: string;
}) {
  return (
    <li class="news-item">
      <p class="news-item__meta">
        <time dateTime={news.data.published}>{formatDate(news.data.published)}</time>
      </p>
      <a class="news-item__title" href={href} lang={textLang(news.data.title)}>
        {news.data.title}
      </a>
    </li>
  );
}
