/**
 * 生成する .md の書き出し。編集画面の出力（src/editor/serialize.ts、spec 6.8）と同じ規則にそろえる。
 * - キーは渡した順（呼び出し側で spec 2章の表の順に並べる）。undefined・空配列は出力しない
 * - 時刻（HH:MM）は二重引用符で囲む。長い文字列も折り返さない
 * - 改行コード LF、末尾に改行を1つ
 */
import { Document, Scalar, visit } from 'yaml';

const TIME_RE = /^\d{1,2}:\d{2}$/;

function clean(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined || (Array.isArray(v) && v.length === 0)) continue;
      out[k] = clean(v);
    }
    return out;
  }
  return value;
}

export function toMarkdownFile(data: Record<string, unknown>, body = ''): string {
  const doc = new Document(clean(data));
  visit(doc, {
    Scalar(_key, node) {
      if (typeof node.value === 'string' && TIME_RE.test(node.value)) {
        node.type = Scalar.QUOTE_DOUBLE;
      }
    },
  });
  const yaml = doc.toString({ lineWidth: 0 });
  const text = body.replace(/\r\n?/g, '\n').trim();
  return text === '' ? `---\n${yaml}---\n` : `---\n${yaml}---\n\n${text}\n`;
}
