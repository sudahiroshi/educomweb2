/**
 * 編集画面の入力内容（下書き）と、フロントマター・ID・保存先への変換（spec 2章・6.3・6.5）。
 * 入力欄の値はすべて文字列（日付・時刻・数値も）で持ち、出力・検査の直前に変換する。
 */
import type { z } from 'astro/zod';
import {
  BODY_REQUIRED,
  checkCommitteeYear,
  checkEntryId,
  committeeSchema,
  eventSchema,
  newsSchema,
  pageSchema,
  slugSchema,
} from '../schemas';
import type { ContentIndex } from './content-index';
import { collectionOf, isEventKind, type EditorKind } from './kinds';

/** 行の並べ替え・削除で入力欄がずれないよう、各行に画面用の key を持たせる（出力しない） */
export interface Row {
  key: string;
}
export interface LinkRow extends Row {
  label: string;
  url: string;
}
export interface TalkRow extends Row {
  number: string;
  title: string;
  presenter: string;
  hasCoauthors: boolean;
  affiliation: string;
}
export interface SessionRow extends Row {
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  chair: string;
  viceChair: string;
  talks: TalkRow[];
}
export interface MemberRow extends Row {
  role: string;
  name: string;
  affiliation: string;
}

export interface Draft {
  kind: EditorKind;
  /** スラッグ（news・events・pages） */
  slug: string;
  /** 本文（Markdown） */
  body: string;
  news: { title: string; published: string; updated: string; related: string[]; summary: string };
  event: {
    title: string;
    published: string;
    updated: string;
    startDate: string;
    endDate: string;
    venue: string;
    links: LinkRow[];
    listInActivities: boolean;
    summary: string;
    sessions: SessionRow[];
  };
  committee: { fiscalYear: string; published: string; updated: string; members: MemberRow[] };
  page: {
    title: string;
    menuLabel: string;
    showInMenu: boolean;
    menuOrder: string;
    updated: string;
  };
  /** 既存記事を読み込んで修正している場合、そのパス（spec 6.6：既存ファイルの編集画面を開く） */
  loadedPath?: string;
}

let keySeq = 0;
export function newKey(): string {
  keySeq += 1;
  return `k${Date.now().toString(36)}${keySeq}`;
}

export const emptyLink = (): LinkRow => ({ key: newKey(), label: '', url: '' });
export const emptyTalk = (): TalkRow => ({
  key: newKey(),
  number: '',
  title: '',
  presenter: '',
  hasCoauthors: false,
  affiliation: '',
});
export const emptySession = (): SessionRow => ({
  key: newKey(),
  name: '',
  date: '',
  startTime: '',
  endTime: '',
  room: '',
  chair: '',
  viceChair: '',
  talks: [],
});
export const emptyMember = (): MemberRow => ({
  key: newKey(),
  role: '',
  name: '',
  affiliation: '',
});

export function emptyDraft(kind: EditorKind = 'news', today = ''): Draft {
  return {
    kind,
    slug: '',
    body: '',
    news: { title: '', published: today, updated: '', related: [], summary: '' },
    event: {
      title: '',
      published: today,
      updated: '',
      startDate: '',
      endDate: '',
      venue: '',
      links: [],
      listInActivities: false,
      summary: '',
      sessions: [],
    },
    committee: { fiscalYear: '', published: today, updated: '', members: [emptyMember()] },
    page: { title: '', menuLabel: '', showInMenu: true, menuOrder: '', updated: '' },
  };
}

/** 空文字・空配列・undefined の項目を落とす（spec 6.8：空の任意項目は出力しない） */
function compact(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === '') continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

const trim = (s: string) => s.trim();

/** 数値の入力欄：数字として読めなければ文字列のまま渡し、スキーマ検査でエラーにする */
function numberOrText(s: string): number | string | undefined {
  const t = s.trim();
  if (t === '') return undefined;
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : t;
}

/**
 * フロントマターのオブジェクト（キーの順序は spec 2章の表の順。spec 6.8）。
 * 既定値と同じ真偽値（listInActivities: false、hasCoauthors: false、showInMenu: true）は出力しない。
 */
export function toFrontmatter(draft: Draft): Record<string, unknown> {
  const { kind } = draft;
  if (kind === 'news') {
    const n = draft.news;
    return compact({
      title: trim(n.title),
      published: n.published,
      updated: n.updated,
      related: n.related,
      summary: trim(n.summary),
    });
  }
  if (isEventKind(kind)) {
    const e = draft.event;
    return compact({
      kind,
      title: trim(e.title),
      published: e.published,
      updated: e.updated,
      startDate: e.startDate,
      endDate: e.endDate,
      venue: trim(e.venue),
      links: e.links
        .filter((l) => l.label.trim() || l.url.trim())
        .map((l) => compact({ label: trim(l.label), url: trim(l.url) })),
      // kind: activity では無視される（常に掲載。D-21）ため出力しない
      listInActivities: kind !== 'activity' && e.listInActivities ? true : undefined,
      summary: trim(e.summary),
      sessions: e.sessions.map((s) =>
        compact({
          name: trim(s.name),
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          room: trim(s.room),
          chair: trim(s.chair),
          viceChair: trim(s.viceChair),
          talks: s.talks
            .filter(
              (t) =>
                t.number.trim() || t.title.trim() || t.presenter.trim() || t.affiliation.trim(),
            )
            .map((t) =>
              compact({
                number: trim(t.number),
                title: trim(t.title),
                presenter: trim(t.presenter),
                hasCoauthors: t.hasCoauthors ? true : undefined,
                affiliation: trim(t.affiliation),
              }),
            ),
        }),
      ),
    });
  }
  if (kind === 'committee') {
    const c = draft.committee;
    return compact({
      fiscalYear: numberOrText(c.fiscalYear),
      published: c.published,
      updated: c.updated,
      members: c.members
        .filter((m) => m.role.trim() || m.name.trim() || m.affiliation.trim())
        .map((m) =>
          compact({ role: trim(m.role), name: trim(m.name), affiliation: trim(m.affiliation) }),
        ),
    });
  }
  const p = draft.page;
  return compact({
    title: trim(p.title),
    menuLabel: trim(p.menuLabel),
    showInMenu: p.showInMenu ? undefined : false,
    menuOrder: numberOrText(p.menuOrder),
    updated: p.updated,
  });
}

/** 記事の ID（拡張子を除いたファイル名、spec 2.2）。必要な項目が未入力なら空文字 */
export function draftId(draft: Draft): string {
  const slug = draft.slug.trim();
  switch (collectionOf(draft.kind)) {
    case 'news':
      return draft.news.published && slug ? `${draft.news.published}-${slug}` : '';
    case 'events':
      return draft.event.startDate && slug ? `${draft.event.startDate}-${slug}` : '';
    case 'committee':
      return draft.committee.fiscalYear.trim();
    case 'pages':
      return slug;
  }
}

/** リポジトリ内の保存先パス */
export function draftPath(draft: Draft): string {
  const id = draftId(draft);
  return id ? `src/content/${collectionOf(draft.kind)}/${id}.md` : '';
}

/** 画像・添付ファイルの保存先フォルダ（spec 2.8） */
export function draftFilesDir(draft: Draft): string {
  const id = draftId(draft);
  return id ? `public/files/${collectionOf(draft.kind)}/${id}` : '';
}

export interface DraftIssue {
  /** 入力欄の位置（例：title、sessions.0.talks.1.presenter、slug、body） */
  path: string;
  message: string;
}

function schemaFor(draft: Draft): z.ZodType {
  const c = collectionOf(draft.kind);
  return c === 'news'
    ? newsSchema
    : c === 'events'
      ? eventSchema
      : c === 'committee'
        ? committeeSchema
        : pageSchema;
}

/**
 * サイトと同じスキーマ・ID の規則で検査する（spec 6.5、D-41）。
 * index を渡すと、ID の重複と関連記事の存在も確かめる。
 */
export function validateDraft(draft: Draft, index?: ContentIndex): DraftIssue[] {
  const issues: DraftIssue[] = [];
  const collection = collectionOf(draft.kind);
  const data = toFrontmatter(draft);

  const result = schemaFor(draft).safeParse(data);
  if (!result.success) {
    for (const issue of result.error.issues) {
      issues.push({ path: issue.path.map(String).join('.') || 'title', message: issue.message });
    }
  }

  // スラッグ・ID
  if (collection !== 'committee') {
    const slug = draft.slug.trim();
    if (slug === '') {
      issues.push({ path: 'slug', message: 'スラッグを入力してください' });
    } else {
      const slugResult = slugSchema.safeParse(slug);
      if (!slugResult.success) {
        issues.push({
          path: 'slug',
          message: slugResult.error.issues[0]?.message ?? 'スラッグの形式が正しくありません',
        });
      }
    }
  }
  const id = draftId(draft);
  if (id) {
    const slugChecked = issues.some((i) => i.path === 'slug');
    for (const message of checkEntryId(collection, id)) {
      // スラッグの形式はすでに上で知らせているので、予約語などの残りだけを足す
      if (slugChecked && message.startsWith('スラッグは')) continue;
      issues.push({ path: collection === 'committee' ? 'fiscalYear' : 'slug', message });
    }
    if (collection === 'committee' && typeof data.fiscalYear === 'number') {
      const yearError = checkCommitteeYear(id, data.fiscalYear);
      if (yearError) issues.push({ path: 'fiscalYear', message: yearError });
    }
    // ID の重複（既存の記事を読み込んで修正している場合は、そのファイル自身を除く）
    if (index && index.entries.some((e) => e.collection === collection && e.id === id)) {
      if (draft.loadedPath !== draftPath(draft)) {
        issues.push({
          path: collection === 'committee' ? 'fiscalYear' : 'slug',
          message: `同じ ID（${id}）の記事がすでにあります。修正する場合は既存の記事を読み込んでください`,
        });
      }
    }
  }

  // 本文
  if (BODY_REQUIRED[collection] && draft.body.trim() === '') {
    issues.push({ path: 'body', message: '本文を入力してください' });
  }

  // 関連記事の存在
  if (index && draft.kind === 'news') {
    const eventIds = new Set(
      index.entries.filter((e) => e.collection === 'events').map((e) => e.id),
    );
    draft.news.related.forEach((rid, i) => {
      if (!eventIds.has(rid)) {
        issues.push({ path: `related.${i}`, message: `関連記事「${rid}」が見つかりません` });
      }
    });
  }
  return issues;
}
