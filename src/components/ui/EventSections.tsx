/**
 * 記事詳細（活動記録・研究発表会・国際会議）の本文より前の部分（spec 4.1）：
 * 開催日・会場、外部リンク、セッション表（プログラム）。サイトと編集画面のプレビューで共有する。
 */
import { eventDateLabel } from '../../lib/event-kind';
import { formatEventDate } from '../../lib/format-date';
import type { EventData } from '../../schemas';
import { Heading, type HeadingLevel, nextLevel } from './heading';
import { LinkList } from './LinkList';
import { SessionTable } from './SessionTable';

type Data = Pick<EventData, 'kind' | 'startDate' | 'endDate' | 'venue' | 'links' | 'sessions'>;

/** 開催日（メディア出演は掲載日・放送日）・会場 */
export function EventInfo({ data }: { data: Data }) {
  return (
    <dl class="event-info">
      <div>
        <dt>{eventDateLabel(data.kind)}</dt>
        <dd>
          <time dateTime={data.startDate}>{formatEventDate(data.startDate, data.endDate)}</time>
        </dd>
      </div>
      {data.venue && (
        <div>
          <dt>会場</dt>
          <dd>{data.venue}</dd>
        </div>
      )}
    </dl>
  );
}

/** 外部リンク（なければ出さない） */
export function EventLinks({
  data,
  headingLevel = 2,
  idPrefix = '',
}: {
  data: Data;
  headingLevel?: HeadingLevel;
  idPrefix?: string;
}) {
  if (!data.links || data.links.length === 0) return null;
  return (
    <section aria-labelledby={`${idPrefix}links-title`}>
      <Heading level={headingLevel} id={`${idPrefix}links-title`} class="section-title">
        関連リンク
      </Heading>
      <LinkList links={data.links} />
    </section>
  );
}

/** プログラム（セッション表。なければ出さない） */
export function EventProgram({
  data,
  headingLevel = 2,
  idPrefix = '',
}: {
  data: Data;
  headingLevel?: HeadingLevel;
  idPrefix?: string;
}) {
  if (!data.sessions || data.sessions.length === 0) return null;
  return (
    <section class="event-program" aria-labelledby={`${idPrefix}program-title`}>
      <Heading level={headingLevel} id={`${idPrefix}program-title`} class="section-title">
        プログラム
      </Heading>
      <SessionTable
        sessions={data.sessions}
        headingLevel={nextLevel(headingLevel)}
        idPrefix={`${idPrefix}session`}
      />
    </section>
  );
}
