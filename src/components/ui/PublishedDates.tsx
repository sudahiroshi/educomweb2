/** 掲載日・更新日（spec 3.6）。更新日は掲載日と違うときだけ表示する */
import { formatDate } from '../../lib/format-date';

export function PublishedDates({ published, updated }: { published?: string; updated?: string }) {
  const showUpdated = updated !== undefined && updated !== published;
  if (!published && !showUpdated) return null;
  return (
    <p class="published-dates">
      {published && (
        <span>
          掲載日：<time dateTime={published}>{formatDate(published)}</time>
        </span>
      )}
      {showUpdated && updated && (
        <span>
          更新日：<time dateTime={updated}>{formatDate(updated)}</time>
        </span>
      )}
    </p>
  );
}
