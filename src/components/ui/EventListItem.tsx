/**
 * 終了分の一覧行（spec 5.6、案B）：日付＋種類ラベル＋タイトル。
 * <ul> の中で使う（<li> を出力する）。閲覧時の判定のため data-end・data-fy を付ける。
 */
import { eventUrl } from '../../lib/event-kind';
import { eventEndDate } from '../../lib/event-status';
import { eventFiscalYear } from '../../lib/fiscal-year';
import { formatEventDate, formatYearMonth } from '../../lib/format-date';
import { textLang } from '../../lib/lang';
import type { EventData } from '../../schemas';
import { KindBadge } from './KindBadge';

export interface EventListItemProps {
  event: { id: string; data: Pick<EventData, 'kind' | 'title' | 'startDate' | 'endDate'> };
  /** 種類ラベルを出すか（種類ごとの一覧ページでは不要） */
  showKind?: boolean;
  /** 日付を年月だけで出す（トップの活動記録など）か、開催日で出すか */
  dateStyle?: 'month' | 'full';
  href?: string;
}

export function EventListItem({
  event,
  showKind = true,
  dateStyle = 'full',
  href = eventUrl(event),
}: EventListItemProps) {
  const { data } = event;
  return (
    <li
      class="event-item"
      data-end={eventEndDate(event)}
      data-fy={eventFiscalYear(event)}
      data-event-item=""
    >
      <p class="event-item__meta">
        <time dateTime={data.startDate}>
          {dateStyle === 'month'
            ? formatYearMonth(data.startDate)
            : formatEventDate(data.startDate, data.endDate)}
        </time>
        {showKind && <KindBadge kind={data.kind} />}
      </p>
      <a class="event-item__title" href={href} lang={textLang(data.title)}>
        {data.title}
      </a>
    </li>
  );
}
