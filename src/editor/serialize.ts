/**
 * .md の書き出し（spec 6.8）。
 * - フロントマターのキー順は spec 2章の表の順（toFrontmatter が保証）
 * - 空の任意項目は出力しない
 * - 文字列は必要なときだけ引用符で囲む（yaml パッケージの既定）。長い文字列も折り返さない
 * - 時刻（HH:MM）は二重引用符で囲む（YAML 1.1 の読み方では 60進数の数値になるため。spec 2.5 の例と同じ）
 * - 改行コード LF、末尾に改行を1つ
 */

const TIME_RE = /^\d{1,2}:\d{2}$/;

function toYaml(data: Record<string, unknown>): string {
  const doc = new Document(data);
  visit(doc, {
    Scalar(_key, node) {
      if (typeof node.value === 'string' && TIME_RE.test(node.value))
        node.type = Scalar.QUOTE_DOUBLE;
    },
  });
  return doc.toString({ lineWidth: 0 });
}
import { Document, Scalar, visit } from 'yaml';
import { toFrontmatter, type Draft } from './model';

export function toMarkdown(draft: Draft): string {
  const yaml = toYaml(toFrontmatter(draft));
  const body = draft.body.replace(/\r\n?/g, '\n').replace(/^\n+/, '').replace(/\s+$/, '');
  return body === '' ? `---\n${yaml}---\n` : `---\n${yaml}---\n\n${body}\n`;
}
