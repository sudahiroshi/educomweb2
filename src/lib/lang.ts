/**
 * 英語の文字列の判定（spec 7章）。
 * T-26 既定案: 英語版ページは作らない。英語のタイトルはそのまま書き、lang="en" を付ける。
 * 日本語の文字（ひらがな・カタカナ・漢字・全角記号）を含まず、ラテン文字を含むものを英語とみなす。
 */
const JAPANESE_RE = /[\u3000-\u30ff\u3400-\u9fff\uf900-\ufaff\uff00-\uffef]/;
const LATIN_RE = /[A-Za-z]/;

/** 英語なら 'en'、それ以外は undefined（lang 属性にそのまま渡せる） */
export function textLang(text: string): 'en' | undefined {
  return !JAPANESE_RE.test(text) && LATIN_RE.test(text) ? 'en' : undefined;
}
