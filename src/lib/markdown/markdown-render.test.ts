/**
 * Markdown の変換結果を固定して確かめる（astro.config.mjs と同じ設定を使う）。
 * - 結果全体は __snapshots__/sample.html と比較する。将来、変換方式（unified → Sätteri など）や
 *   パッケージを更新したときに、表示が変わっていないかをここで確かめる。
 * - 安全性など、必ず守る性質は個別の expect でも確かめる（スナップショットを更新しても見逃さないように）。
 * 意図して結果を変えたときは `npx vitest run -u` でスナップショットを更新し、差分を確認してからコミットする。
 */
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, test } from 'vitest';
import { markdownConfig } from './config';

let html = '';

beforeAll(async () => {
  const renderer = await markdownConfig.processor.createRenderer({
    syntaxHighlight: markdownConfig.syntaxHighlight,
  });
  const source = readFileSync(new URL('./fixtures/sample.md', import.meta.url), 'utf8');
  html = (await renderer.render(source)).code;
});

describe('Markdown の変換', () => {
  test('結果全体が固定した内容と一致する', async () => {
    await expect(html).toMatchFileSnapshot('./__snapshots__/sample.html');
  });

  test('危険な HTML は無害化される（spec 6.4）', () => {
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/<iframe/i);
    expect(html).not.toMatch(/javascript:/i);
    expect(html).not.toMatch(/\son[a-z]+=/i);
    expect(html).not.toMatch(/\sstyle=/i);
  });

  test('安全な HTML は残す（属性は無害化の規則に従って落とす）', () => {
    expect(html).toContain('<p>属性付きのHTML</p>');
    expect(html).toContain('<details><summary>折りたたみ</summary>中身</details>');
    expect(html).toContain('alt="危険な画像"');
  });

  test('GFM：表・タスクリスト・取り消し線・自動リンク・脚注', () => {
    expect(html).toContain('<table>');
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('<del>取り消し線</del>');
    expect(html).toContain('href="https://example.org/"');
    expect(html).toContain('<h2 class="sr-only" id="user-content-footnote-label">脚注</h2>');
  });

  test('表は横スクロール枠で囲まれ、見出しセルに scope が付く', () => {
    expect(html).toMatch(
      /<div class="table-scroll" role="region" aria-label="[^"]+" tabindex="0"><table>/,
    );
    expect(html).toContain('<th scope="col">役職</th>');
  });

  test('外部リンクだけにアイコンと「（外部サイト）」が付く', () => {
    expect(html).toContain('<a href="https://acoustics.jp/" class="external-link">外部リンク');
    expect(html).toContain('<a href="/news/">内部リンク</a>');
    expect(html).toContain(
      '<a href="https://asj-edcom.acoustics.jp/committee/">同じサイトの絶対URL</a>',
    );
    expect(html.match(/（外部サイト）/g)).toHaveLength(2); // acoustics.jp と自動リンクの example.org
  });

  test('脚注のリンク先と ID が一致する', () => {
    const refs = [...html.matchAll(/href="#(user-content-fn(?:ref)?-1)"/g)].map((m) => m[1]);
    expect(refs).toEqual(expect.arrayContaining(['user-content-fn-1', 'user-content-fnref-1']));
    for (const id of refs) expect(html).toContain(`id="${id}"`);
  });

  test('引用符などは自動変換しない（smartypants 無効）', () => {
    expect(html).toContain('"引用符" と -- ダッシュ');
  });

  test('画像は /files/ の絶対パスのまま（Astro の画像最適化は使わない。spec 2.8）', () => {
    expect(html).toContain(
      'src="/files/news/2026-11-19-site-renewal/2026-11-19-site-renewal-01.jpg"',
    );
  });
});
