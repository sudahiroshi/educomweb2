import { describe, expect, test } from 'vitest';
import { FrontmatterError, parseFrontmatter } from './frontmatter';

describe('parseFrontmatter', () => {
  test('日付・時刻は文字列のまま', () => {
    const { data, body } = parseFrontmatter(
      '---\npublished: 2026-02-30\nstartTime: 13:00\nnumber: 2-3-1\nflag: true\n---\n本文\n',
    );
    expect(data).toEqual({
      published: '2026-02-30',
      startTime: '13:00',
      number: '2-3-1',
      flag: true,
    });
    expect(body).toBe('本文\n');
  });

  test('CRLF・BOM', () => {
    const { data, body } = parseFrontmatter('\uFEFF---\r\ntitle: t\r\n---\r\n本文');
    expect(data).toEqual({ title: 't' });
    expect(body).toBe('本文');
  });

  test('フロントマターなし・空', () => {
    expect(parseFrontmatter('本文')).toEqual({ data: {}, body: '本文' });
    expect(parseFrontmatter('---\n---\n本文').data).toEqual({});
  });

  test('閉じの --- は行頭のみ', () => {
    const { data, body } = parseFrontmatter('---\ntitle: foo---\nx: 1\n---\n本文');
    expect(data).toEqual({ title: 'foo---', x: 1 });
    expect(body).toBe('本文');
  });

  test('書式エラー', () => {
    expect(() => parseFrontmatter('---\ntitle: [t\n---\n')).toThrow(FrontmatterError);
    expect(() => parseFrontmatter('---\n- a\n- b\n---\n')).toThrow(FrontmatterError);
  });
});
