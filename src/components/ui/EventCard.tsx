/**
 * 開催予定カード（spec 5.6、案B）：日付ブロック＋種類＋タイトル＋会場。
 * 閲覧時の判定（spec 3.3）のため、data-start・data-end（終了基準日）・data-fy（年度）を付ける。
 * カード全体が押せる（タイトルのリンクをカード全体に広げる）。
 */
import { eventUrl } from '../../lib/event-kind';
import { eventEndDate, isOngoing } from '../../lib/event-status';
import { eventFiscalYear } from '../../lib/fiscal-year';
import { dateBlock, formatEventDate } from '../../lib/format-date';
import { textLang } from '../../lib/lang';
import type { EventData } from '../../schemas';
import { Heading, type HeadingLevel } from './heading';
import { KindBadge } from './KindBadge';

export interface EventCardProps {
  event: {
    id: string;
    data: Pick<EventData, 'kind' | 'title' | 'startDate' | 'endDate' | 'venue'>;
  };
  /** 開催中ラベルの判定に使う今日（日本時間の YYYY-MM-DD） */
  today: string;
  /** タイトルの見出しレベル（ページの見出し構造に合わせる） */
  headingLevel?: HeadingLevel;
  /** リンク先（編集画面のプレビューなどで差し替える） */
  href?: string;
}

export function EventCard({
  event,
  today,
  headingLevel = 3,
  href = eventUrl(event),
}: EventCardProps) {
  const { data } = event;
  const block = dateBlock(data.startDate, data.endDate);
  return (
    <article
      class="event-card"
      data-start={data.startDate}
      data-end={eventEndDate(event)}
      data-fy={eventFiscalYear(event)}
      data-event-item=""
    >
      <div class="event-card__date" aria-hidden="true">
        <span class="event-card__date-year">{block.year}</span>
        <span class="event-card__date-month">{block.month}</span>
        <span class="event-card__date-day">{block.day}</span>
      </div>
      <div class="event-card__body">
        <p class="event-card__labels">
          <KindBadge kind={data.kind} variant="text" />
          {/* T-29 既定案: 開催期間中は「開催中」を付ける（ビルド時に判定し、閲覧時のスクリプトで更新） */}
          <span class="event-card__ongoing" data-ongoing="" hidden={!isOngoing(event, today)}>
            開催中
          </span>
        </p>
        <Heading level={headingLevel} class="event-card__title">
          <a href={href} lang={textLang(data.title)}>
            {data.title}
          </a>
        </Heading>
        <p class="event-card__meta">
          <time dateTime={data.startDate}>{formatEventDate(data.startDate, data.endDate)}</time>
        </p>
        {data.venue && <p class="event-card__meta">会場：{data.venue}</p>}
      </div>
    </article>
  );
}
