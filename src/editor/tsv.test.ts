import { describe, expect, test } from 'vitest';
import { isTruthyCell, membersFromTsv, parseTsv, talksFromTsv } from './tsv';

describe('タブ区切りの読み取り', () => {
  test('行・列に分け、空行を除く（CRLF・引用符付きセル）', () => {
    expect(parseTsv('a\tb\r\n\r\nc\t"d\te"\n')).toEqual([
      ['a', 'b'],
      ['c', 'd\te'],
    ]);
    expect(parseTsv('"改行\nあり"\tx')).toEqual([['改行\nあり', 'x']]);
  });

  test('他の有無', () => {
    for (const v of ['他', '○', 'あり', '1', 'TRUE']) expect(isTruthyCell(v)).toBe(true);
    for (const v of ['', 'なし', '0', '×']) expect(isTruthyCell(v)).toBe(false);
  });

  test('講演：列順は 講演番号、演題、発表者、所属、他の有無。見出し行は除く', () => {
    const talks = talksFromTsv(
      '講演番号\t演題\t発表者\t所属\t他\n2-3-1\t演題A\t氏名A\t所属A\t○\n\t演題B\t氏名B',
    );
    expect(talks.map(({ key: _key, ...t }) => t)).toEqual([
      {
        number: '2-3-1',
        title: '演題A',
        presenter: '氏名A',
        affiliation: '所属A',
        hasCoauthors: true,
      },
      { number: '', title: '演題B', presenter: '氏名B', affiliation: '', hasCoauthors: false },
    ]);
  });

  test('名簿：列順は 役職、氏名、所属', () => {
    const members = membersFromTsv('役職\t氏名\t所属\n委員長\t氏名1\t所属1\n委員\t氏名2');
    expect(members.map(({ key: _key, ...m }) => m)).toEqual([
      { role: '委員長', name: '氏名1', affiliation: '所属1' },
      { role: '委員', name: '氏名2', affiliation: '' },
    ]);
  });
});
