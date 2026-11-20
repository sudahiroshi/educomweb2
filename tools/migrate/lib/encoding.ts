/**
 * 旧サイトの HTML の文字コード判定と UTF-8 への変換（plan 9.1、spec 10章 2）。
 * 旧サイトは meta で ISO-2022-JP を宣言しているが、実際のバイト列と一致するとは限らないため、
 * 宣言ではなくバイト列から判定する。
 */

export type Encoding = 'utf-8' | 'iso-2022-jp' | 'shift_jis' | 'euc-jp';

/** meta で宣言された文字コード（小文字）。なければ undefined */
export function declaredCharset(bytes: Uint8Array): string | undefined {
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, 4096));
  const match = /charset\s*=\s*["']?([\w-]+)/i.exec(head);
  return match?.[1]?.toLowerCase();
}

/** ISO-2022-JP のエスケープシーケンス（ESC $ @、ESC $ B、ESC ( B、ESC ( J）を含むか */
function hasIso2022Escape(bytes: Uint8Array): boolean {
  for (let i = 0; i + 2 < bytes.length; i++) {
    if (bytes[i] !== 0x1b) continue;
    const a = bytes[i + 1];
    const b = bytes[i + 2];
    if ((a === 0x24 && (b === 0x40 || b === 0x42)) || (a === 0x28 && (b === 0x42 || b === 0x4a))) {
      return true;
    }
  }
  return false;
}

function tryDecode(bytes: Uint8Array, encoding: Encoding): string | undefined {
  try {
    return new TextDecoder(encoding, { fatal: true }).decode(bytes);
  } catch {
    return undefined;
  }
}

/** 半角カナと私用領域の文字数（誤った文字コードで読むと増える） */
function oddCharCount(text: string): number {
  return (text.match(/[\uFF61-\uFF9F\uE000-\uF8FF]/g) ?? []).length;
}

/**
 * バイト列から文字コードを判定する。
 * Shift_JIS と EUC-JP の両方で読めるときは、半角カナなどの少ない方を選び、同数なら宣言に従う。
 */
export function detectEncoding(bytes: Uint8Array): Encoding {
  if (hasIso2022Escape(bytes)) return 'iso-2022-jp';
  if (tryDecode(bytes, 'utf-8') !== undefined) return 'utf-8';
  const declared = declaredCharset(bytes);
  const order: Encoding[] =
    declared === 'euc-jp' ? ['euc-jp', 'shift_jis'] : ['shift_jis', 'euc-jp'];
  const scored = order
    .map((encoding) => ({ encoding, text: tryDecode(bytes, encoding) }))
    .filter((c): c is { encoding: Encoding; text: string } => c.text !== undefined)
    .map((c) => ({ encoding: c.encoding, odd: oddCharCount(c.text) }));
  scored.sort((a, b) => a.odd - b.odd);
  return scored[0]?.encoding ?? 'shift_jis';
}

/**
 * UTF-8 の文字列に変換する。改行は LF にそろえ、先頭の BOM を除き、
 * meta の charset 宣言を utf-8 に書き換える。
 */
export function toUtf8(bytes: Uint8Array): { text: string; encoding: Encoding } {
  const encoding = detectEncoding(bytes);
  const text = new TextDecoder(encoding)
    .decode(bytes)
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .replace(/(charset\s*=\s*["']?)[\w-]+/i, '$1utf-8');
  return { text, encoding };
}
