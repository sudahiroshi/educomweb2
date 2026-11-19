/**
 * 概要の自動生成（spec 2.4）。summary がないとき、本文（Markdown）の冒頭から作る。
 * 一覧・RSS・OGP の description に使う。
 */

/** Markdown の記法をおおまかに取り除いて、平文にする */
export function markdownToPlainText(markdown: string): string {
  return (
    markdown
      // コードブロック・HTML・脚注の定義・表の区切り行・画像を除く
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/^\[\^[^\]]+\]:.*$/gm, ' ')
      .replace(/^\s*\|?\s*:?-{3,}.*$/gm, ' ')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      // リンクは表示文字だけ残す
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[\^[^\]]+\]/g, '')
      // 行頭の記号（見出し・引用・リスト・タスク）
      .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+(\[[ xX]\]\s+)?/gm, '')
      // 強調・コード・表の縦線
      .replace(/(\*\*|__|~~|\*|_|`)/g, '')
      .replace(/\|/g, ' ')
      .replace(/^\s*(-{3,}|\*{3,})\s*$/gm, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/** 概要：summary があればそれ、なければ本文冒頭を max 文字まで（超えたら「…」） */
export function summarize(
  summary: string | undefined,
  body: string | undefined,
  max = 120,
): string {
  if (summary && summary.trim() !== '') return summary.trim();
  const text = markdownToPlainText(body ?? '');
  return text.length > max ? `${text.slice(0, max)}…` : text;
}
