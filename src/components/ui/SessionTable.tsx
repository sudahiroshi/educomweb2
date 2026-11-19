/**
 * セッション情報＋講演一覧の表（spec 5.6・3.7・8章、D-15〜D-17）。
 * 表には <caption>（セッション名）と <th scope> を付け、横スクロール枠に入れる。
 * 講演番号・所属は、どの講演にも入力がなければ列ごと出さない。
 */
import { formatSessionDateTime } from '../../lib/format-date';
import { textLang } from '../../lib/lang';
import { formatPresenter } from '../../lib/talk';
import type { Session } from '../../schemas';
import { Heading, type HeadingLevel } from './heading';

export function SessionTable({
  sessions,
  headingLevel = 3,
  idPrefix = 'session',
}: {
  sessions: readonly Session[];
  /** セッション名の見出しレベル */
  headingLevel?: HeadingLevel;
  /** 見出し・表の id の接頭辞（同じページに複数置くとき用） */
  idPrefix?: string;
}) {
  return (
    <>
      {sessions.map((session, i) => {
        const talks = session.talks ?? [];
        const hasNumber = talks.some((t) => t.number);
        const hasAffiliation = talks.some((t) => t.affiliation);
        const dateTime = formatSessionDateTime(session.date, session.startTime, session.endTime);
        const headingId = `${idPrefix}-${i + 1}`;
        return (
          <section key={headingId} class="session" aria-labelledby={headingId}>
            <Heading
              level={headingLevel}
              id={headingId}
              class="session__name"
              lang={textLang(session.name)}
            >
              {session.name}
            </Heading>
            {(dateTime || session.room || session.chair || session.viceChair) && (
              <dl class="session__info">
                {dateTime && (
                  <div>
                    <dt>日時</dt>
                    <dd>
                      {session.date ? <time dateTime={session.date}>{dateTime}</time> : dateTime}
                    </dd>
                  </div>
                )}
                {session.room && (
                  <div>
                    <dt>会場</dt>
                    <dd>{session.room}</dd>
                  </div>
                )}
                {session.chair && (
                  <div>
                    <dt>座長</dt>
                    <dd>{session.chair}</dd>
                  </div>
                )}
                {session.viceChair && (
                  <div>
                    <dt>副座長</dt>
                    <dd>{session.viceChair}</dd>
                  </div>
                )}
              </dl>
            )}
            {talks.length > 0 && (
              <div
                class="session__table-scroll"
                role="region"
                aria-labelledby={`${headingId}-caption`}
                tabIndex={0}
              >
                <table class="session__table">
                  <caption id={`${headingId}-caption`}>{session.name} の講演一覧</caption>
                  <thead>
                    <tr>
                      {hasNumber && <th scope="col">講演番号</th>}
                      <th scope="col">演題</th>
                      <th scope="col">発表者</th>
                      {hasAffiliation && <th scope="col">所属</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {talks.map((talk, j) => (
                      <tr key={j}>
                        {hasNumber && <td class="session__nowrap">{talk.number}</td>}
                        <td class="session__talk-title" lang={textLang(talk.title)}>
                          {talk.title}
                        </td>
                        <td class="session__nowrap">{formatPresenter(talk)}</td>
                        {hasAffiliation && <td>{talk.affiliation}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}
