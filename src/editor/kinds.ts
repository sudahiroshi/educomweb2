/** 編集画面の種類（spec 6.2）と、コレクション・events の kind との対応 */
import type { CollectionName, EventKind } from '../schemas';

export const EDITOR_KINDS = [
  { value: 'news', label: 'お知らせ' },
  { value: 'activity', label: '活動記録' },
  { value: 'asj', label: '音響学会研究発表会' },
  { value: 'cosponsored', label: '共催研究発表会' },
  { value: 'international', label: '国際会議' },
  { value: 'committee', label: '運営委員' },
  { value: 'pages', label: 'その他のページ' },
] as const;

export type EditorKind = (typeof EDITOR_KINDS)[number]['value'];

export function isEventKind(kind: EditorKind): kind is EventKind {
  return (
    kind === 'activity' || kind === 'asj' || kind === 'cosponsored' || kind === 'international'
  );
}

export function collectionOf(kind: EditorKind): CollectionName {
  return isEventKind(kind) ? 'events' : kind;
}

export function kindLabel(kind: EditorKind): string {
  return EDITOR_KINDS.find((k) => k.value === kind)?.label ?? kind;
}
