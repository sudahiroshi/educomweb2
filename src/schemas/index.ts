/**
 * コンテンツのスキーマ（spec 2章）。
 * src/content.config.ts と編集画面の両方からここを読み込む（定義を二重に書かない）。
 */
export * from './common';
export * from './news';
export * from './events';
export * from './committee';
export * from './pages';

/** コレクション名（spec 2.1） */
export const COLLECTIONS = ['news', 'events', 'committee', 'pages'] as const;
export type CollectionName = (typeof COLLECTIONS)[number];

/** 本文が必須のコレクション（spec 2.4・2.7）。スキーマはフロントマターのみを見るため別に持つ */
export const BODY_REQUIRED: Record<CollectionName, boolean> = {
  news: true,
  events: false,
  committee: false,
  pages: true,
};
