import { describe, expect, it } from 'vitest';
import { declaredCharset, detectEncoding, toUtf8 } from './encoding.ts';

const meta = (charset: string) =>
  `<meta http-equiv="Content-Type" content="text/html; charset=${charset}">`;

/** 「音響」を各文字コードで表したバイト列 */
const ONKYO = {
  'utf-8': [0xe9, 0x9f, 0xb3, 0xe9, 0x9f, 0xbf],
  'iso-2022-jp': [0x1b, 0x24, 0x42, 0x32, 0x3b, 0x36, 0x41, 0x1b, 0x28, 0x42],
  shift_jis: [0x89, 0xb9, 0x8b, 0xbf],
  'euc-jp': [0xb2, 0xbb, 0xb6, 0xc1],
} as const;

function html(charset: string, body: readonly number[], newline = '\n'): Uint8Array {
  const enc = new TextEncoder();
  return new Uint8Array([
    ...enc.encode(`<html>${newline}<head>${meta(charset)}</head>${newline}<p>`),
    ...body,
    ...enc.encode(`</p>${newline}</html>${newline}`),
  ]);
}

describe('文字コードの判定と変換', () => {
  it.each(Object.entries(ONKYO))('%s を判定して UTF-8 にする', (encoding, body) => {
    const bytes = html('iso-2022-jp', body);
    expect(detectEncoding(bytes)).toBe(encoding);
    expect(toUtf8(bytes).text).toContain('<p>音響</p>');
  });

  it('宣言が ISO-2022-JP でも、中身が UTF-8 なら UTF-8 と判定する', () => {
    const bytes = html('iso-2022-jp', ONKYO['utf-8']);
    expect(declaredCharset(bytes)).toBe('iso-2022-jp');
    expect(detectEncoding(bytes)).toBe('utf-8');
  });

  it('meta の宣言を utf-8 に書き換え、改行を LF にそろえる', () => {
    const { text } = toUtf8(html('Shift_JIS', ONKYO.shift_jis, '\r\n'));
    expect(text).toContain('charset=utf-8"');
    expect(text).not.toContain('\r');
  });
});
