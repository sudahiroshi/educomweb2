/**
 * 「記事をGitHubに追加」「画像をアップロード」（spec 6.6、D-43・D-44）。
 * 画像付き記事の手順を番号付きで表示する。
 */
import { useState } from 'preact/hooks';
import { planAddToGitHub } from './github-actions';
import { uploadUrl } from './github';
import { copyText, downloadBlob, type OutputFile } from './output';

export function GitHubActions({
  disabled,
  path,
  markdown,
  loadedPath,
  filesDir,
  images,
}: {
  disabled: boolean;
  path: string;
  markdown: string;
  loadedPath?: string;
  filesDir: string;
  images: readonly OutputFile[];
}) {
  const [status, setStatus] = useState('');
  const plan = path ? planAddToGitHub(path, markdown, loadedPath) : undefined;

  async function addArticle() {
    if (!plan) return;
    if (plan.mode === 'direct') {
      window.open(plan.url, '_blank', 'noopener');
      setStatus('GitHub の新規作成画面を開きました。画面下の「Commit changes」を押してください。');
      return;
    }
    const copied = await copyText(markdown);
    window.open(plan.url, '_blank', 'noopener');
    setStatus(
      plan.mode === 'edit'
        ? `${copied ? '記事の内容をコピーしました。' : ''}既存ファイルの編集画面を開きました。中身をすべて選んで消し、貼り付けてから「Commit changes」を押してください。`
        : `${copied ? '記事の内容をコピーしました。' : ''}記事が長いため、ファイル名だけを入れた新規作成画面を開きました。本文欄に貼り付けてから「Commit changes」を押してください。`,
    );
  }

  const addLabel = plan?.mode === 'edit' ? '既存の記事をGitHubで修正' : '記事をGitHubに追加';
  return (
    <div class="ed-github">
      {images.length > 0 && (
        <ol class="ed-steps">
          <li>
            「画像をダウンロード」で、名前を付け替えた画像を保存します。
            <button
              type="button"
              class="ed-button"
              disabled={disabled}
              onClick={() => {
                images.forEach((f, i) =>
                  setTimeout(
                    () => downloadBlob(f.path.split('/').pop() ?? 'file', f.data),
                    300 * i,
                  ),
                );
                setStatus(`画像・添付ファイル ${images.length} 件を保存しました。`);
              }}
            >
              画像をダウンロード
            </button>
          </li>
          <li>
            「画像をアップロード」で GitHub
            のアップロード画面を開き、保存した画像をドラッグ＆ドロップして「Commit
            changes」を押します。
            <button
              type="button"
              class="ed-button"
              disabled={disabled || !filesDir}
              onClick={() => {
                window.open(uploadUrl(filesDir), '_blank', 'noopener');
                setStatus('GitHub のアップロード画面を開きました。');
              }}
            >
              画像をアップロード
            </button>
          </li>
          <li>「{addLabel}」で記事を作成します（下のボタン）。</li>
        </ol>
      )}
      <div class="ed-actions">
        <button
          type="button"
          class="ed-button ed-button-primary"
          disabled={disabled || !plan}
          onClick={() => void addArticle()}
        >
          {addLabel}
        </button>
      </div>
      {plan?.mode === 'paste' && !disabled && (
        <p class="ed-hint">
          記事が長いため、内容をコピーしてから GitHub の画面に貼り付ける手順になります。
        </p>
      )}
      <p class="ed-status" role="status">
        {status}
      </p>
    </div>
  );
}
