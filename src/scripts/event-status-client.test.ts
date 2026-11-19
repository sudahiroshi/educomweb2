// @vitest-environment happy-dom
import { beforeEach, describe, expect, test } from 'vitest';
import { applyEventStatus } from './event-status-client';

/** 開催予定の1項目（カード＋終了一覧用の template） */
function upcoming(id: string, start: string, end: string, fy: string, ongoing = false): string {
  return `<li>
    <article data-event-item data-start="${start}" data-end="${end}" data-fy="${fy}">
      <span data-ongoing ${ongoing ? '' : 'hidden'}>開催中</span><a href="/x/${id}/">${id}</a>
    </article>
    <template data-ended-template><li data-event-item data-end="${end}" data-fy="${fy}"><a href="/x/${id}/">${id}</a></li></template>
  </li>`;
}

function render(upcomingItems: string[], ended: { fy: string; ids: string[] } | null): void {
  document.body.innerHTML = `
    <section data-upcoming-section>
      <ul data-upcoming-list>${upcomingItems.join('')}</ul>
      <p data-upcoming-empty ${upcomingItems.length > 0 ? 'hidden' : ''}>現在予定されている開催はありません。</p>
    </section>
    ${
      ended
        ? `<section>
            <ul data-ended-list data-fy="${ended.fy}" ${ended.ids.length === 0 ? 'hidden' : ''}>
              ${ended.ids.map((id) => `<li><a href="/x/${id}/">${id}</a></li>`).join('')}
            </ul>
            <p data-ended-empty ${ended.ids.length > 0 ? 'hidden' : ''}>終了したものはまだありません。</p>
          </section>`
        : ''
    }`;
}

const upcomingIds = () =>
  [...document.querySelectorAll('[data-upcoming-list] article a')].map((a) => a.textContent);
const endedIds = () =>
  [...document.querySelectorAll('[data-ended-list] a')].map((a) => a.textContent);
const isHidden = (selector: string) =>
  (document.querySelector(selector) as HTMLElement | null)?.hidden;

describe('閲覧時の開催状態の判定', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('終了日当日は開催予定のまま、開催中ラベルを表示', () => {
    render([upcoming('asj', '2027-03-09', '2027-03-11', '2026')], { fy: '2026', ids: ['old'] });
    applyEventStatus(document, '2027-03-11');
    expect(upcomingIds()).toEqual(['asj']);
    expect(endedIds()).toEqual(['old']);
    expect(isHidden('[data-ongoing]')).toBe(false);
  });

  test('開催前は開催中ラベルを出さない（ビルド時に出ていても消す）', () => {
    render([upcoming('asj', '2027-03-09', '2027-03-11', '2026', true)], null);
    applyEventStatus(document, '2027-03-08');
    expect(isHidden('[data-ongoing]')).toBe(true);
  });

  test('終了日の翌日は終了リストの先頭へ移り、開催予定が0件なら案内を表示', () => {
    render([upcoming('asj', '2027-03-09', '2027-03-11', '2026')], { fy: '2026', ids: ['old'] });
    applyEventStatus(document, '2027-03-12');
    expect(upcomingIds()).toEqual([]);
    expect(endedIds()).toEqual(['asj', 'old']);
    expect(isHidden('[data-upcoming-list]')).toBe(true);
    expect(isHidden('[data-upcoming-empty]')).toBe(false);
  });

  test('複数が終了したときは新しいものが上', () => {
    render(
      [
        upcoming('a', '2027-01-10', '2027-01-10', '2026'),
        upcoming('b', '2027-02-10', '2027-02-11', '2026'),
        upcoming('c', '2027-05-01', '2027-05-01', '2027'),
      ],
      { fy: '2026', ids: ['old'] },
    );
    applyEventStatus(document, '2027-03-01');
    expect(upcomingIds()).toEqual(['c']);
    expect(endedIds()).toEqual(['b', 'a', 'old']);
    expect(isHidden('[data-upcoming-empty]')).toBe(true);
  });

  test('年度の変わり目：該当年度の終了リストがなければ非表示にするだけ', () => {
    render([upcoming('spring', '2027-03-30', '2027-04-02', '2026')], { fy: '2027', ids: [] });
    applyEventStatus(document, '2027-04-03');
    expect(upcomingIds()).toEqual([]);
    expect(endedIds()).toEqual([]);
    expect(isHidden('[data-ended-list]')).toBe(true);
    expect(isHidden('[data-upcoming-empty]')).toBe(false);
  });

  test('終了リストが空だったときは、移した項目を表示し「まだありません」を隠す', () => {
    render([upcoming('a', '2026-05-01', '2026-05-01', '2026')], { fy: '2026', ids: [] });
    applyEventStatus(document, '2026-05-02');
    expect(endedIds()).toEqual(['a']);
    expect(isHidden('[data-ended-list]')).toBe(false);
    expect(isHidden('[data-ended-empty]')).toBe(true);
  });

  test('終了リストのないページ（トップ）では非表示にするだけ', () => {
    render([upcoming('a', '2026-05-01', '2026-05-01', '2026')], null);
    applyEventStatus(document, '2026-05-02');
    expect(upcomingIds()).toEqual([]);
    expect(isHidden('[data-upcoming-empty]')).toBe(false);
  });
});
