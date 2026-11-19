/**
 * フロントマター付き Markdown の読み込み。
 * YAML は core スキーマで読み、日付（2026-11-19）を Date にせず文字列のまま返す。
 * Astro 既定の読み込みは日付を Date にするため、存在しない日付（2026-02-30）が
 * 翌月に繰り上がってスキーマ検査をすり抜ける。ビルド（src/content.config.ts）と
 * 編集画面の .md 読み込みの両方でこの関数を使い、読み方をそろえる。
 */
import { parseDocument } from 'yaml';

const FRONTMATTER_RE = /^\uFEFF?---\r?\n(?:([\s\S]*?)\r?\n)?---[ \t]*(?:\r?\n|$)/;

export interface ParsedMarkdown {
  data: Record<string, unknown>;
  body: string;
}

export class FrontmatterError extends Error {}

export function parseFrontmatter(text: string): ParsedMarkdown {
  const m = FRONTMATTER_RE.exec(text);
  if (!m) return { data: {}, body: text };
  const doc = parseDocument(m[1] ?? '', { schema: 'core' });
  const error = doc.errors[0];
  if (error) {
    throw new FrontmatterError(`フロントマターの書式に誤りがあります: ${error.message}`);
  }
  const data: unknown = doc.toJS();
  if (data !== null && data !== undefined && (typeof data !== 'object' || Array.isArray(data))) {
    throw new FrontmatterError('フロントマターは「項目名: 値」の形式で書いてください');
  }
  return { data: (data ?? {}) as Record<string, unknown>, body: text.slice(m[0].length) };
}
