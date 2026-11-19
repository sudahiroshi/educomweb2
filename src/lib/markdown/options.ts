/**
 * Markdown 変換の設定。Astro（astro.config.mjs）と編集画面のプレビューで共有し、結果をそろえる。
 */
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeSite from './rehype-site';

/** remark-rehype の設定（脚注の文言を日本語に。ID の接頭辞は rehype-sanitize に任せる） */
export const remarkRehypeOptions = {
  clobberPrefix: '',
  footnoteLabel: '脚注',
  footnoteBackLabel: (referenceIndex: number) => `本文の参照 ${referenceIndex + 1} に戻る`,
};

/**
 * rehype プラグイン（生の HTML の解析 → 無害化 → 表・外部リンク・脚注リンクの調整の順）。
 * Astro は rehype-raw をユーザーのプラグインの後に実行するため、先に自分で実行しないと
 * 無害化の時点で生の HTML が未解析のまま残り、安全なもの（<details> など）まで捨てられる。
 */
export const rehypePlugins = [rehypeRaw, rehypeSanitize, rehypeSite];
