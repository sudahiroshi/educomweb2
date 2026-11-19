/** お知らせ（spec 2.4）。キーの順序は spec の表の順（編集画面の出力順に使う。spec 6.8） */
// T-13 既定案: 下書き・予約公開の項目（draft など）は持たない。下書きは編集画面のブラウザ内保存のみ
import { z } from 'astro/zod';
import { ALWAYS_REFINE, dateSchema, isDateValue, optionalText, requiredText } from './common';

/**
 * `related` の要素の型を差し替えられるようにする。
 * - 編集画面：ID 文字列（存在確認は /editor/index.json で行う）
 * - サイト：`reference('events')`（src/content.config.ts で渡す。存在しないIDはビルド失敗）
 */
export function createNewsSchema<T extends z.ZodType>(relatedItem: T) {
  return z
    .object({
      title: requiredText('タイトル', 120),
      published: dateSchema,
      updated: dateSchema.optional(),
      related: z.array(relatedItem).optional(),
      summary: optionalText,
    })
    .superRefine((data, ctx) => {
      if (
        isDateValue(data.updated) &&
        isDateValue(data.published) &&
        data.updated < data.published
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['updated'],
          message: '更新日は掲載日以降にしてください',
        });
      }
    }, ALWAYS_REFINE);
}

/** 編集画面用（related は events の ID 文字列） */
export const newsSchema = createNewsSchema(z.string().min(1));

export type NewsData = z.infer<typeof newsSchema>;
