/**
 * コンテンツコレクションの定義（spec 2章）。
 * スキーマ本体は src/schemas/ にあり、編集画面と共有する。ここではビルド時だけの検査を加える。
 */
import { readdirSync } from 'node:fs';
import { defineCollection, reference } from 'astro:content';
import { glob, type Loader } from 'astro/loaders';
import {
  BODY_REQUIRED,
  checkCommitteeYear,
  checkEntryId,
  committeeSchema,
  createNewsSchema,
  eventSchema,
  pageSchema,
  type CollectionName,
} from './schemas';

/** コレクションのフォルダにある記事の ID（拡張子を除いたファイル名）の一覧 */
function listEntryIds(collection: CollectionName): Set<string> {
  const files = readdirSync(`./src/content/${collection}`, { recursive: true, encoding: 'utf8' });
  return new Set(
    files.filter((f) => f.endsWith('.md')).map((f) => f.replaceAll('\\', '/').replace(/\.md$/, '')),
  );
}

/**
 * news の related が存在する events を指しているか。
 * Astro は reference() の参照切れをログに出すだけでビルドを止めないため、ここで検査する（spec 2.4）。
 * 読み込み順に左右されないよう、events のフォルダを直接見る。
 */
function checkRelated(related: unknown): string[] {
  if (!Array.isArray(related) || related.length === 0) return [];
  const eventIds = listEntryIds('events');
  return related
    .map((r: unknown) =>
      typeof r === 'object' && r !== null && 'id' in r ? String(r.id) : String(r),
    )
    .filter((id) => !eventIds.has(id))
    .map((id) => `関連記事（related）の「${id}」が src/content/events/ にありません`);
}

/**
 * src/content/{collection}/ の .md を読むローダー。
 * - ID は拡張子を除いたファイル名そのもの（spec 2.2。Astro 既定のスラッグ化や `slug` 項目は使わない）
 * - 保存の直前（スキーマ検査の後）に、ID の形式・本文の必須・運営委員の年度を検査し、
 *   news は related の参照切れも検査する。問題があればビルドを失敗させる（D-41）
 */
function contentLoader(collection: CollectionName): Loader {
  const inner = glob({
    pattern: '**/*.md',
    base: `./src/content/${collection}`,
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  });
  return {
    name: `asj-edcom-${collection}`,
    load: (context) =>
      inner.load({
        ...context,
        store: {
          ...context.store,
          set: (entry) => {
            const errors = checkEntryId(collection, entry.id);
            if (BODY_REQUIRED[collection] && !entry.body?.trim()) {
              errors.push('本文を入力してください');
            }
            if (collection === 'news') {
              errors.push(...checkRelated(entry.data.related));
            }
            if (collection === 'committee') {
              const yearError = checkCommitteeYear(entry.id, Number(entry.data.fiscalYear));
              if (yearError) errors.push(yearError);
            }
            if (errors.length > 0) {
              const file = entry.filePath ?? `src/content/${collection}/${entry.id}.md`;
              throw new Error(`${file} に問題があります:\n- ${errors.join('\n- ')}`);
            }
            return context.store.set(entry);
          },
        },
      }),
  };
}

const news = defineCollection({
  loader: contentLoader('news'),
  // related は存在しない events の ID ならビルドを失敗させる（spec 2.4）
  schema: createNewsSchema(reference('events')),
});

const events = defineCollection({
  loader: contentLoader('events'),
  schema: eventSchema,
});

const committee = defineCollection({
  loader: contentLoader('committee'),
  schema: committeeSchema,
});

const pages = defineCollection({
  loader: contentLoader('pages'),
  schema: pageSchema,
});

export const collections = { news, events, committee, pages };
