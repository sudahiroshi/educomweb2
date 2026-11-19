import { describe, expect, test } from 'vitest';
import { applyFormat } from './format';

/** 結果を「選択範囲を [ ] で示した文字列」にする */
function show(r: { text: string; selectionStart: number; selectionEnd: number }): string {
  return (
    r.text.slice(0, r.selectionStart) +
    '[' +
    r.text.slice(r.selectionStart, r.selectionEnd) +
    ']' +
    r.text.slice(r.selectionEnd)
  );
}

describe('書式ボタン', () => {
  test('見出し：行の先頭に付け、既存の見出し記号は置き換える', () => {
    expect(show(applyFormat('前\nタイトル\n後', 3, 3, 'h2'))).toBe('前\n## [タイトル]\n後');
    expect(show(applyFormat('## タイトル', 4, 4, 'h3'))).toBe('### [タイトル]');
    expect(show(applyFormat('', 0, 0, 'h2'))).toBe('## [見出し]');
  });

  test('太字：選択範囲を囲む／未選択なら見本を入れて選ぶ', () => {
    expect(show(applyFormat('これは重要です', 3, 5, 'bold'))).toBe('これは**[重要]**です');
    expect(show(applyFormat('ab', 1, 1, 'bold'))).toBe('a**[太字]**b');
  });

  test('リンク：URL 部分を選んだ状態にする', () => {
    expect(show(applyFormat('学会のサイト', 0, 6, 'link'))).toBe(
      '[学会のサイト]([https://])'.replace('[学会のサイト]', '[学会のサイト]'),
    );
  });

  test('箇条書き・番号付き：選んだ各行に付ける（既存の記号は置き換え）', () => {
    expect(applyFormat('a\nb\nc', 0, 3, 'ul').text).toBe('- a\n- b\nc');
    expect(applyFormat('- a\n- b', 0, 7, 'ol').text).toBe('1. a\n2. b');
    expect(applyFormat('', 0, 0, 'ul').text).toBe('- 項目');
  });

  test('表・画像：前後に空行を入れて挿入', () => {
    expect(applyFormat('段落', 2, 2, 'table').text).toBe(
      '段落\n\n| 見出し1 | 見出し2 |\n| --- | --- |\n| 内容 | 内容 |',
    );
    expect(
      show(applyFormat('前\n\n後', 2, 2, 'image', { imagePath: '/files/news/a/a-01.jpg' })),
    ).toBe('前\n\n![[画像の説明]](/files/news/a/a-01.jpg)\n\n後');
  });
});
