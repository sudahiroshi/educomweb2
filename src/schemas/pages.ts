/** その他のページ（spec 2.7）。キーの順序は spec の表の順 */
import { z } from 'astro/zod';
import { dateSchema, optionalText, requiredText } from './common';

/**
 * システムが使うパス。その他のページのスラッグに使えない（spec 2.7、ビルド時と編集画面で検査）。
 * spec の列挙に加え、Pagefind の出力先（pagefind）・404・サイトマップも含める。
 */
export const RESERVED_PAGE_SLUGS = [
  'news',
  'activities',
  'media',
  'meetings',
  'committee',
  'search',
  'editor',
  'files',
  'rss.xml',
  'pagefind',
  '404',
  'sitemap-index.xml',
  'sitemap-0.xml',
] as const;

export function isReservedPageSlug(slug: string): boolean {
  return (RESERVED_PAGE_SLUGS as readonly string[]).includes(slug);
}

export const pageSchema = z.object({
  title: requiredText('タイトル'),
  menuLabel: optionalText,
  showInMenu: z.boolean().default(true),
  // T-06 既定案: 固定項目の後ろに menuOrder の昇順で並べる
  menuOrder: z.number({ error: 'メニュー順は数字で入力してください' }).default(100),
  updated: dateSchema.optional(),
});

export type PageData = z.infer<typeof pageSchema>;
