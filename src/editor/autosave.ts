/**
 * 入力途中の内容のブラウザ内保存（spec 6.1、plan 8.12、T-13 既定案：下書きは編集画面のブラウザ内保存のみ）。
 * 端末（ブラウザ）ごとに保存される。画像・添付ファイルは大きいため保存しない。
 * localStorage は使えない環境があるため、読み書きはすべて try/catch で囲む。
 */
import { EDITOR_KINDS } from './kinds';
import type { Draft } from './model';

export const DRAFT_KEY = 'asj-edcom:editor-draft';

export interface SavedDraft {
  savedAt: string;
  draft: Draft;
}

function isDraft(v: unknown): v is Draft {
  if (typeof v !== 'object' || v === null) return false;
  const d = v as Record<string, unknown>;
  return (
    EDITOR_KINDS.some((k) => k.value === d.kind) &&
    typeof d.slug === 'string' &&
    typeof d.body === 'string' &&
    typeof d.news === 'object' &&
    typeof d.event === 'object' &&
    typeof d.committee === 'object' &&
    typeof d.page === 'object'
  );
}

export function saveDraft(
  draft: Draft,
  now: Date = new Date(),
  storage: Storage | undefined = globalThis.localStorage,
): boolean {
  try {
    storage?.setItem(DRAFT_KEY, JSON.stringify({ version: 1, savedAt: now.toISOString(), draft }));
    return true;
  } catch {
    return false;
  }
}

export function loadDraft(
  storage: Storage | undefined = globalThis.localStorage,
): SavedDraft | null {
  try {
    const raw = storage?.getItem(DRAFT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { savedAt?: unknown; draft?: unknown };
    if (typeof data.savedAt !== 'string' || !isDraft(data.draft)) return null;
    return { savedAt: data.savedAt, draft: data.draft };
  } catch {
    return null;
  }
}

export function clearDraft(storage: Storage | undefined = globalThis.localStorage): void {
  try {
    storage?.removeItem(DRAFT_KEY);
  } catch {
    // 使えない環境では何もしない
  }
}

/** 保存日時の表示（日本時間） */
export function formatSavedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}
