/**
 * 既存記事一覧（/editor/index.json）の型と作成（spec 3.8）。
 * 編集画面は、ID 重複の警告・関連記事の選択肢・既存記事の読み込み（GitHub の raw URL）に使う。
 */
import type { CollectionName, EventKind } from '../schemas';

export interface IndexEntry {
  collection: CollectionName;
  id: string;
  /** リポジトリ内のパス（例：src/content/news/2026-11-19-site-renewal.md） */
  path: string;
  title: string;
  kind?: EventKind;
  published?: string;
  startDate?: string;
  endDate?: string;
  fiscalYear?: number;
}

export interface ContentIndex {
  /** 出力した日時（ISO 8601） */
  generatedAt: string;
  entries: IndexEntry[];
}

export function contentPath(collection: CollectionName, id: string): string {
  return `src/content/${collection}/${id}.md`;
}
