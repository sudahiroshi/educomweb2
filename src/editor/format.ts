/**
 * Markdown の書式ボタン（spec 6.3、D-46）。選択範囲に記法を挿入し、新しい選択範囲を返す。
 */
export type FormatAction = 'h2' | 'h3' | 'bold' | 'link' | 'ul' | 'ol' | 'table' | 'image';

export interface FormatResult {
  text: string;
  selectionStart: number;
  selectionEnd: number;
}

export const FORMAT_BUTTONS: { action: FormatAction; label: string; text: string }[] = [
  { action: 'h2', label: '見出し2を挿入', text: '見出し2' },
  { action: 'h3', label: '見出し3を挿入', text: '見出し3' },
  { action: 'bold', label: '太字にする', text: '太字' },
  { action: 'link', label: 'リンクを挿入', text: 'リンク' },
  { action: 'ul', label: '箇条書きにする', text: '箇条書き' },
  { action: 'ol', label: '番号付きリストにする', text: '番号付き' },
  { action: 'table', label: '表を挿入', text: '表' },
  { action: 'image', label: '画像を挿入', text: '画像' },
];

/** 選択範囲を含む行全体の範囲 */
function lineRange(text: string, start: number, end: number): [number, number] {
  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
  const nl = text.indexOf('\n', end > start && text[end - 1] === '\n' ? end - 1 : end);
  return [lineStart, nl === -1 ? text.length : nl];
}

function replace(text: string, from: number, to: number, insert: string) {
  return text.slice(0, from) + insert + text.slice(to);
}

/** 挿入する塊（表・画像・添付ファイルのリンク）の前後に空行を入れて、段落から分ける */
export function blockInsert(
  text: string,
  start: number,
  end: number,
  block: string,
): { text: string; offset: number } {
  const before = text.slice(0, start);
  const after = text.slice(end);
  const pre = before === '' || before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n';
  const post =
    after === '' || after.startsWith('\n\n') ? '' : after.startsWith('\n') ? '\n' : '\n\n';
  return { text: before + pre + block + post + after, offset: start + pre.length };
}

export function applyFormat(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  action: FormatAction,
  options: { imagePath?: string; imageAlt?: string } = {},
): FormatResult {
  const selected = text.slice(selectionStart, selectionEnd);

  switch (action) {
    case 'h2':
    case 'h3': {
      const mark = action === 'h2' ? '## ' : '### ';
      const [ls, le] = lineRange(text, selectionStart, selectionEnd);
      const line = text.slice(ls, le).replace(/^#{1,6}\s+/, '');
      const content = line === '' ? (action === 'h2' ? '見出し' : '小見出し') : line;
      const next = replace(text, ls, le, mark + content);
      const start = ls + mark.length;
      return { text: next, selectionStart: start, selectionEnd: start + content.length };
    }
    case 'bold': {
      const content = selected === '' ? '太字' : selected;
      const next = replace(text, selectionStart, selectionEnd, `**${content}**`);
      return {
        text: next,
        selectionStart: selectionStart + 2,
        selectionEnd: selectionStart + 2 + content.length,
      };
    }
    case 'link': {
      const label = selected === '' ? 'リンクの文字' : selected;
      const url = 'https://';
      const next = replace(text, selectionStart, selectionEnd, `[${label}](${url})`);
      const urlStart = selectionStart + label.length + 3;
      return { text: next, selectionStart: urlStart, selectionEnd: urlStart + url.length };
    }
    case 'ul':
    case 'ol': {
      const [ls, le] = lineRange(text, selectionStart, selectionEnd);
      const lines = text.slice(ls, le).split('\n');
      const body = lines
        .map((l, i) => {
          const plain = l.replace(/^\s*([-*+]|\d+\.)\s+/, '');
          return (
            (action === 'ul' ? '- ' : `${i + 1}. `) +
            (plain === '' && lines.length === 1 ? '項目' : plain)
          );
        })
        .join('\n');
      const next = replace(text, ls, le, body);
      return { text: next, selectionStart: ls, selectionEnd: ls + body.length };
    }
    case 'table': {
      const block = '| 見出し1 | 見出し2 |\n| --- | --- |\n| 内容 | 内容 |';
      const r = blockInsert(text, selectionStart, selectionEnd, block);
      return {
        text: r.text,
        selectionStart: r.offset + 2,
        selectionEnd: r.offset + 2 + '見出し1'.length,
      };
    }
    case 'image': {
      const alt = options.imageAlt ?? (selected || '画像の説明');
      const path = options.imagePath ?? '/files/画像のパス.jpg';
      const block = `![${alt}](${path})`;
      const r = blockInsert(text, selectionStart, selectionEnd, block);
      return {
        text: r.text,
        selectionStart: r.offset + 2,
        selectionEnd: r.offset + 2 + alt.length,
      };
    }
  }
}
