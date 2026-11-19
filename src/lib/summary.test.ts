import { describe, expect, test } from 'vitest';
import { markdownToPlainText, summarize } from './summary';

describe('概要の自動生成', () => {
  test('summary があればそれを使う', () => {
    expect(summarize(' 概要です ', '本文')).toBe('概要です');
  });

  test('Markdown の記法を取り除く', () => {
    const md = [
      '## 見出し',
      '',
      '**太字**と[リンク](/news/)と`コード`。',
      '',
      '- 項目1',
      '- [ ] タスク',
      '',
      '| a | b |',
      '| --- | --- |',
      '| 1 | 2 |',
      '',
      '![画像](/files/a.jpg)',
      '<details>x</details>',
    ].join('\n');
    expect(markdownToPlainText(md)).toBe('見出し 太字とリンクとコード。 項目1 タスク a b 1 2 x');
  });

  test('長い本文は切り詰める', () => {
    const body = 'あ'.repeat(130);
    expect(summarize(undefined, body)).toBe(`${'あ'.repeat(120)}…`);
    expect(summarize(undefined, 'い'.repeat(120))).toBe('い'.repeat(120));
    expect(summarize(undefined, undefined)).toBe('');
  });
});
