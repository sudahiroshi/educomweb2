/**
 * 出力（spec 6.6、D-43〜D-45）。チェックに問題があるあいだは押せない（spec 6.5）。
 */
import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { copyText, downloadBlob, makeZip, type OutputFile } from './output';

export function OutputPanel({
  canOutput,
  fileName,
  markdown,
  files,
  children,
}: {
  canOutput: boolean;
  /** 記事のファイル名（例：2026-11-19-site-renewal.md） */
  fileName: string;
  markdown: string;
  /** 記事と画像（リポジトリ内のパス付き） */
  files: readonly OutputFile[];
  /** GitHub に追加するボタンなど（plan 8.9） */
  children?: ComponentChildren;
}) {
  const [status, setStatus] = useState('');
  const images = files.filter((f) => !f.path.endsWith('.md'));
  const disabled = !canOutput;

  return (
    <section class="ed-output" aria-labelledby="ed-output-title">
      <h2 id="ed-output-title">出力</h2>
      {disabled && <p class="ed-muted">チェック結果の問題を直すと、出力できるようになります。</p>}
      {children}
      <div class="ed-actions">
        <button
          type="button"
          class="ed-button"
          disabled={disabled}
          onClick={() => {
            downloadBlob(fileName, markdown);
            // 画像は1つずつ保存する（ブラウザが複数ファイルの保存の許可を求めることがある）
            images.forEach((f, i) => {
              setTimeout(
                () => downloadBlob(f.path.split('/').pop() ?? 'file', f.data),
                300 * (i + 1),
              );
            });
            setStatus(
              `${fileName}${images.length > 0 ? ` と画像・添付ファイル ${images.length} 件` : ''}を保存しました。`,
            );
          }}
        >
          ダウンロード
        </button>
        <button
          type="button"
          class="ed-button"
          disabled={disabled}
          onClick={async () => {
            setStatus(
              (await copyText(markdown))
                ? '記事の内容をコピーしました。'
                : 'コピーできませんでした。',
            );
          }}
        >
          コピー
        </button>
        <button
          type="button"
          class="ed-button"
          disabled={disabled}
          onClick={async () => {
            downloadBlob(fileName.replace(/\.md$/, '.zip'), await makeZip(files));
            setStatus('zip で保存しました（GitHub を使わずに管理者へ渡すとき用）。');
          }}
        >
          zip で保存（予備）
        </button>
      </div>
      <p class="ed-status" role="status">
        {status}
      </p>
      <details class="ed-paste">
        <summary>出力する内容を見る</summary>
        <pre class="ed-md">{markdown}</pre>
      </details>
    </section>
  );
}
