/**
 * Markdown 変換の設定。Astro（astro.config.mjs）と編集画面のプレビューで共有し、結果をそろえる。
 */
import rehypeSanitize from 'rehype-sanitize';
import rehypeSite from './rehype-site';

/** remark-rehype の設定（脚注の文言を日本語に。ID の接頭辞は rehype-sanitize に任せる） */
export const remarkRehypeOptions = {
  clobberPrefix: '',
  footnoteLabel: '脚注',
  footnoteBackLabel: (referenceIndex: number) => `本文の参照 ${referenceIndex + 1} に戻る`,
};

/** rehype プラグイン（無害化 → 表・外部リンク・脚注リンクの調整の順） */
export const rehypePlugins = [rehypeSanitize, rehypeSite];
