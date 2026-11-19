/** お知らせの関連記事（spec 4.1、D-20）。サイトと編集画面のプレビューで共有する */
import type { EventData } from '../../schemas';
import { EventListItem } from './EventListItem';
import { Heading, type HeadingLevel } from './heading';

export function RelatedEvents({
  events,
  headingLevel = 2,
  idPrefix = '',
}: {
  events: readonly {
    id: string;
    data: Pick<EventData, 'kind' | 'title' | 'startDate' | 'endDate'>;
  }[];
  headingLevel?: HeadingLevel;
  idPrefix?: string;
}) {
  if (events.length === 0) return null;
  return (
    <section class="related-events" aria-labelledby={`${idPrefix}related-title`}>
      <Heading level={headingLevel} id={`${idPrefix}related-title`}>
        関連記事
      </Heading>
      <ul>
        {events.map((e) => (
          <EventListItem key={e.id} event={e} />
        ))}
      </ul>
    </section>
  );
}
