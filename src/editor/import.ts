/**
 * 既存記事（.md）の読み込み（spec 6.7、D-47）。フロントマターと本文を解析して下書きにする。
 * フロントマターはサイトのビルドと同じ読み方（parseFrontmatter：日付は文字列のまま）で読む。
 */
import { parseFrontmatter } from '../lib/frontmatter';
import { EVENT_KINDS, type CollectionName } from '../schemas';
import type { EditorKind } from './kinds';
import { emptyDraft, newKey, type Draft } from './model';

const str = (v: unknown): string => (v === undefined || v === null ? '' : String(v));
const arr = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v)
    ? v.filter((x): x is Record<string, unknown> => typeof x === 'object' && x !== null)
    : [];

/** パス・ファイル名から、コレクションと ID を判定する */
export function detectFromPath(path: string): { collection?: CollectionName; id: string } {
  const normalized = path.replace(/\\/g, '/');
  const file = normalized.split('/').pop() ?? '';
  const id = file.replace(/\.md$/i, '');
  const m = /src\/content\/(news|events|committee|pages)\//.exec(normalized);
  if (m?.[1]) return { collection: m[1] as CollectionName, id };
  return { id };
}

/**
 * 種類の判定。パスで決まらないときはフロントマターから推定する（kind → events、fiscalYear → committee など）。
 * 判定できなければ undefined（種類を選んでもらう。spec 6.7）。
 */
export function detectKind(
  data: Record<string, unknown>,
  collection?: CollectionName,
): EditorKind | undefined {
  const kind = data.kind;
  const isKind = (EVENT_KINDS as readonly unknown[]).includes(kind);
  if (collection === 'events' || (collection === undefined && isKind)) {
    return isKind ? (kind as EditorKind) : undefined;
  }
  if (collection) return collection;
  if ('fiscalYear' in data && 'members' in data) return 'committee';
  if ('menuOrder' in data || 'showInMenu' in data || 'menuLabel' in data) return 'pages';
  if ('related' in data) return 'news';
  return undefined;
}

/** ID からスラッグを取り出す（news・events は先頭の日付を除く） */
function slugFromId(id: string, collection: CollectionName): string {
  if (collection === 'news' || collection === 'events')
    return id.replace(/^\d{4}-\d{2}-\d{2}-/, '');
  return collection === 'pages' ? id : '';
}

/** 解析済みのフロントマターと本文から下書きを作る */
export function draftFromData(
  kind: EditorKind,
  data: Record<string, unknown>,
  body: string,
  id: string,
  loadedPath?: string,
): Draft {
  const draft = emptyDraft(kind);
  const collection: CollectionName =
    kind === 'news' || kind === 'committee' || kind === 'pages' ? kind : 'events';
  draft.slug = slugFromId(id, collection);
  draft.body = body.replace(/^\n+/, '');
  if (loadedPath) draft.loadedPath = loadedPath;

  if (kind === 'news') {
    draft.news = {
      title: str(data.title),
      published: str(data.published),
      updated: str(data.updated),
      related: Array.isArray(data.related) ? data.related.map(str) : [],
      summary: str(data.summary),
    };
  } else if (kind === 'committee') {
    draft.committee = {
      fiscalYear: str(data.fiscalYear),
      published: str(data.published),
      updated: str(data.updated),
      members: arr(data.members).map((m) => ({
        key: newKey(),
        role: str(m.role),
        name: str(m.name),
        affiliation: str(m.affiliation),
      })),
    };
  } else if (kind === 'pages') {
    draft.page = {
      title: str(data.title),
      menuLabel: str(data.menuLabel),
      showInMenu: data.showInMenu !== false,
      menuOrder: str(data.menuOrder),
      updated: str(data.updated),
    };
  } else {
    draft.event = {
      title: str(data.title),
      published: str(data.published),
      updated: str(data.updated),
      startDate: str(data.startDate),
      endDate: str(data.endDate),
      venue: str(data.venue),
      links: arr(data.links).map((l) => ({ key: newKey(), label: str(l.label), url: str(l.url) })),
      listInActivities: data.listInActivities === true,
      summary: str(data.summary),
      sessions: arr(data.sessions).map((s) => ({
        key: newKey(),
        name: str(s.name),
        date: str(s.date),
        startTime: str(s.startTime),
        endTime: str(s.endTime),
        room: str(s.room),
        chair: str(s.chair),
        viceChair: str(s.viceChair),
        talks: arr(s.talks).map((t) => ({
          key: newKey(),
          number: str(t.number),
          title: str(t.title),
          presenter: str(t.presenter),
          hasCoauthors: t.hasCoauthors === true,
          affiliation: str(t.affiliation),
        })),
      })),
    };
  }
  return draft;
}

export type ImportResult =
  | { ok: true; draft: Draft }
  | { ok: false; reason: 'unknown-kind'; data: Record<string, unknown>; body: string; id: string }
  | { ok: false; reason: 'error'; message: string };

/** .md の内容とパス（またはファイル名）から下書きを作る。kindHint で種類を指定できる */
export function importMarkdown(text: string, path: string, kindHint?: EditorKind): ImportResult {
  let parsed;
  try {
    parsed = parseFrontmatter(text);
  } catch (e) {
    return { ok: false, reason: 'error', message: e instanceof Error ? e.message : String(e) };
  }
  const { collection, id } = detectFromPath(path);
  const kind = kindHint ?? detectKind(parsed.data, collection);
  if (!kind) return { ok: false, reason: 'unknown-kind', data: parsed.data, body: parsed.body, id };
  const loadedPath = collection ? `src/content/${collection}/${id}.md` : undefined;
  return { ok: true, draft: draftFromData(kind, parsed.data, parsed.body, id, loadedPath) };
}
