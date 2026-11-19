/**
 * 閲覧時の開催状態の判定（spec 3.3 の 2、D-24・D-25）。
 * ビルド後に終了した項目を、ページを開いた日（日本時間）で振り分け直す。
 * - 終了した項目は「開催予定」から外し、同じページに data-fy が一致する終了リストがあれば先頭へ移す
 *   （移すときは、項目に添えた <template data-ended-template> の一覧行を使う）。なければ非表示にする
 * - 開催予定が0件になったら「現在予定されている開催はありません」を表示する
 * - T-29 既定案: 開催期間中の項目に「開催中」ラベルを表示する
 * スクリプトが動かない環境では、ビルド時点の振り分けのまま表示される（spec 3.3 の 3）。
 */

function showEndedList(list: HTMLElement): void {
  list.hidden = false;
  const section = list.closest('section');
  section?.querySelectorAll<HTMLElement>('[data-ended-empty]').forEach((el) => {
    el.hidden = true;
  });
}

export function applyEventStatus(root: ParentNode, today: string): void {
  root.querySelectorAll<HTMLElement>('[data-upcoming-section]').forEach((section) => {
    const list = section.querySelector<HTMLElement>('[data-upcoming-list]');
    const empty = section.querySelector<HTMLElement>('[data-upcoming-empty]');
    if (!list) return;

    // 開催日の近い順（DOM の順）に処理し、終了リストの先頭へ順に差し込む → 新しいものが上になる
    for (const item of [...list.children] as HTMLElement[]) {
      const card = item.querySelector<HTMLElement>('[data-event-item]');
      const end = card?.dataset.end;
      if (!card || !end) continue;

      if (today > end) {
        const fy = card.dataset.fy;
        const template = item.querySelector<HTMLTemplateElement>('template[data-ended-template]');
        const endedList = fy
          ? root.querySelector<HTMLElement>(`[data-ended-list][data-fy="${fy}"]`)
          : null;
        if (endedList && template) {
          endedList.prepend(template.content.cloneNode(true));
          showEndedList(endedList);
        }
        item.remove();
        continue;
      }

      const start = card.dataset.start;
      const ongoing = start !== undefined && start <= today && today <= end;
      card.querySelectorAll<HTMLElement>('[data-ongoing]').forEach((label) => {
        label.hidden = !ongoing;
      });
    }

    if (list.children.length === 0) {
      list.hidden = true;
      if (empty) empty.hidden = false;
    }
  });
}
