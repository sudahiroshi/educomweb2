/**
 * 種類ごとの入力フォーム（spec 6.3）。2章の項目を入力欄として出す。
 */
import type { ContentIndex } from '../content-index';
import { Checkbox, TextArea, TextField } from '../fields';
import { isEventKind } from '../kinds';
import type { Draft } from '../model';
import { LinksEditor } from './LinksEditor';
import { MembersEditor } from './MembersEditor';
import { RelatedPicker } from './RelatedPicker';
import { SessionsEditor } from './SessionsEditor';

type Updater = (fn: (d: Draft) => Draft) => void;

export function KindForm({
  draft,
  update,
  index,
  onLoadPreviousMembers,
  previousMembersLabel,
}: {
  draft: Draft;
  update: Updater;
  index: ContentIndex | null;
  onLoadPreviousMembers?: () => void;
  previousMembersLabel?: string;
}) {
  const { kind } = draft;

  if (kind === 'news') {
    const n = draft.news;
    const set = (patch: Partial<Draft['news']>) =>
      update((d) => ({ ...d, news: { ...d.news, ...patch } }));
    return (
      <>
        <TextField
          path="title"
          label="タイトル"
          required
          value={n.title}
          onInput={(v) => set({ title: v })}
          hint="120文字以内"
        />
        <div class="ed-grid">
          <TextField
            path="published"
            label="掲載日"
            required
            type="date"
            value={n.published}
            onInput={(v) => set({ published: v })}
          />
          <TextField
            path="updated"
            label="更新日"
            type="date"
            value={n.updated}
            onInput={(v) => set({ updated: v })}
            hint="修正したときに入力"
          />
        </div>
        <RelatedPicker index={index} value={n.related} onChange={(related) => set({ related })} />
        <TextArea
          path="summary"
          label="概要"
          value={n.summary}
          onInput={(v) => set({ summary: v })}
          hint="一覧・RSS・SNS 用。空欄なら本文の冒頭から作ります"
          rows={2}
        />
      </>
    );
  }

  if (isEventKind(kind)) {
    const e = draft.event;
    const set = (patch: Partial<Draft['event']>) =>
      update((d) => ({ ...d, event: { ...d.event, ...patch } }));
    return (
      <>
        <TextField
          path="title"
          label="タイトル"
          required
          value={e.title}
          onInput={(v) => set({ title: v })}
        />
        <div class="ed-grid">
          <TextField
            path="startDate"
            label="開始日"
            required
            type="date"
            value={e.startDate}
            onInput={(v) => set({ startDate: v })}
          />
          <TextField
            path="endDate"
            label="終了日"
            type="date"
            value={e.endDate}
            onInput={(v) => set({ endDate: v })}
            hint="1日開催なら空欄"
          />
          <TextField
            path="published"
            label="掲載日"
            required
            type="date"
            value={e.published}
            onInput={(v) => set({ published: v })}
          />
          <TextField
            path="updated"
            label="更新日"
            type="date"
            value={e.updated}
            onInput={(v) => set({ updated: v })}
          />
        </div>
        <TextField
          path="venue"
          label="会場"
          value={e.venue}
          onInput={(v) => set({ venue: v })}
          hint="オンライン・ハイブリッドの場合もここに書きます"
        />
        {kind !== 'activity' && (
          <Checkbox
            path="listInActivities"
            label="活動記録に載せる"
            checked={e.listInActivities}
            onChange={(v) => set({ listInActivities: v })}
            hint="チェックすると「活動記録」の一覧にも表示します"
          />
        )}
        <LinksEditor value={e.links} onChange={(links) => set({ links })} />
        <SessionsEditor value={e.sessions} onChange={(sessions) => set({ sessions })} />
        <TextArea
          path="summary"
          label="概要"
          value={e.summary}
          onInput={(v) => set({ summary: v })}
          hint="空欄なら本文の冒頭から作ります"
          rows={2}
        />
      </>
    );
  }

  if (kind === 'committee') {
    const c = draft.committee;
    const set = (patch: Partial<Draft['committee']>) =>
      update((d) => ({ ...d, committee: { ...d.committee, ...patch } }));
    return (
      <>
        <div class="ed-grid">
          <TextField
            path="fiscalYear"
            label="年度（西暦）"
            required
            inputMode="numeric"
            value={c.fiscalYear}
            onInput={(v) => set({ fiscalYear: v })}
            hint="2026年度なら 2026"
          />
          <TextField
            path="published"
            label="掲載日"
            required
            type="date"
            value={c.published}
            onInput={(v) => set({ published: v })}
          />
          <TextField
            path="updated"
            label="更新日"
            type="date"
            value={c.updated}
            onInput={(v) => set({ updated: v })}
          />
        </div>
        <MembersEditor
          value={c.members}
          onChange={(members) => set({ members })}
          onLoadPrevious={onLoadPreviousMembers}
          previousLabel={previousMembersLabel}
        />
      </>
    );
  }

  const p = draft.page;
  const set = (patch: Partial<Draft['page']>) =>
    update((d) => ({ ...d, page: { ...d.page, ...patch } }));
  return (
    <>
      <TextField
        path="title"
        label="タイトル"
        required
        value={p.title}
        onInput={(v) => set({ title: v })}
      />
      <div class="ed-grid">
        <TextField
          path="menuLabel"
          label="メニュー表示名"
          value={p.menuLabel}
          onInput={(v) => set({ menuLabel: v })}
          hint="空欄ならタイトル"
        />
        <TextField
          path="menuOrder"
          label="メニュー順"
          inputMode="numeric"
          value={p.menuOrder}
          onInput={(v) => set({ menuOrder: v })}
          hint="小さいほど左。空欄なら 100"
        />
        <TextField
          path="updated"
          label="更新日"
          type="date"
          value={p.updated}
          onInput={(v) => set({ updated: v })}
        />
      </div>
      <Checkbox
        path="showInMenu"
        label="メニューに出す"
        checked={p.showInMenu}
        onChange={(v) => set({ showInMenu: v })}
      />
    </>
  );
}
