/**
 * 表計算ソフトからコピーした表（タブ区切り）の読み取り（spec 6.3）。
 */
import { newKey, type MemberRow, type TalkRow } from './model';

/** タブ区切りの文字列を行・列に分ける（空行は除く。引用符で囲まれたセル内の改行・タブに対応） */
export function parseTsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const src = text.replace(/\r\n?/g, '\n');
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"' && cell === '') {
      quoted = true;
    } else if (ch === '\t') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  rows.push(row);
  return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some((c) => c !== ''));
}

const TRUTHY = new Set([
  '他',
  '有',
  'あり',
  '有り',
  '○',
  '〇',
  '◯',
  '✓',
  '✔',
  '1',
  'true',
  'yes',
  'y',
]);

/** 「他の有無」の列の値を真偽値にする */
export function isTruthyCell(value: string): boolean {
  return TRUTHY.has(value.trim().toLowerCase());
}

/** 見出し行（「演題」「発表者」「役職」などを含む行）なら true */
function isHeaderRow(row: string[], words: string[]): boolean {
  return row.some((c) => words.includes(c));
}

/** 講演の表：列順は 講演番号、演題、発表者、所属、他の有無（spec 6.3） */
export function talksFromTsv(text: string): TalkRow[] {
  return parseTsv(text)
    .filter((r) => !isHeaderRow(r, ['演題', '発表者', '講演番号']))
    .map((r) => ({
      key: newKey(),
      number: r[0] ?? '',
      title: r[1] ?? '',
      presenter: r[2] ?? '',
      affiliation: r[3] ?? '',
      hasCoauthors: isTruthyCell(r[4] ?? ''),
    }));
}

/** 運営委員の名簿：列順は 役職、氏名、所属 */
export function membersFromTsv(text: string): MemberRow[] {
  return parseTsv(text)
    .filter((r) => !isHeaderRow(r, ['役職', '氏名']))
    .map((r) => ({ key: newKey(), role: r[0] ?? '', name: r[1] ?? '', affiliation: r[2] ?? '' }));
}
