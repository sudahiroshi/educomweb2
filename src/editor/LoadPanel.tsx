/**
 * 既存記事の読み込み（spec 6.7、D-47）。
 * - 手元の .md を選ぶ（またはドラッグ＆ドロップ）と、フロントマターと本文を解析してフォームに反映する
 * - 既存記事一覧（/editor/index.json）から選んで、GitHub の raw URL から直接読み込む（公開リポジトリ。D-54）
 * - 種類を判定できないときは、種類を選んでもらう
 */
import { useMemo, useState } from 'preact/hooks';
import type { ContentIndex, IndexEntry } from './content-index';
import { rawUrl } from './github';
import { importMarkdown } from './import';
import { EDITOR_KINDS, type EditorKind } from './kinds';
import type { Draft } from './model';

const COLLECTION_LABELS: Record<IndexEntry['collection'], string> = {
  news: 'お知らせ',
  events: '活動記録・研究発表会',
  committee: '運営委員',
  pages: 'その他のページ',
};

export function LoadPanel({
  index,
  onLoad,
}: {
  index: ContentIndex | null;
  /** 読み込んだ下書きを反映する（入力中の内容を消してよいかの確認は呼び出し側） */
  onLoad: (draft: Draft, source: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('');
  const [status, setStatus] = useState('');
  const [pending, setPending] = useState<{ text: string; name: string } | null>(null);
  const [pendingKind, setPendingKind] = useState<EditorKind>('news');
  const [dragging, setDragging] = useState(false);

  const entries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (index?.entries ?? []).filter(
      (e) => q === '' || e.title.toLowerCase().includes(q) || e.id.includes(q),
    );
  }, [index, query]);

  function load(text: string, name: string, kind?: EditorKind) {
    const r = importMarkdown(text, name, kind);
    if (r.ok) {
      setPending(null);
      onLoad(r.draft, name);
      setStatus(`${name} を読み込みました。`);
    } else if (r.reason === 'unknown-kind') {
      setPending({ text, name });
      setStatus(`${name} の種類を判定できませんでした。種類を選んでください。`);
    } else {
      setStatus(`${name} を読み込めませんでした：${r.message}`);
    }
  }

  async function loadFile(file: File | undefined) {
    if (!file) return;
    if (!/\.md$/i.test(file.name)) {
      setStatus('.md ファイルを選んでください。');
      return;
    }
    load(await file.text(), file.name);
  }

  async function loadFromGitHub() {
    const entry = index?.entries.find((e) => e.path === selected);
    if (!entry) return;
    setStatus('GitHub から読み込んでいます…');
    try {
      const res = await fetch(rawUrl(entry.path));
      if (!res.ok) throw new Error(String(res.status));
      load(await res.text(), entry.path);
    } catch {
      setStatus(
        'GitHub から読み込めませんでした。時間をおいて試すか、.md ファイルを選んでください。',
      );
    }
  }

  return (
    <details class="ed-load">
      <summary>既存の記事を読み込んで修正する</summary>
      <div class="ed-load-body">
        {/* ドラッグ＆ドロップ欄（中のファイル選択ボタンでもキーボードで同じ操作ができる） */}
        {/* eslint-disable-next-line jsx-a11y-x/no-static-element-interactions */}
        <div
          class={`ed-drop${dragging ? ' ed-drop-active' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void loadFile(e.dataTransfer?.files[0]);
          }}
        >
          <p>手元の .md ファイルをここにドラッグ＆ドロップするか、選んでください。</p>
          <label class="ed-file-input">
            <span>.md ファイルを選ぶ</span>
            <input
              type="file"
              accept=".md,text/markdown"
              onChange={(e) => {
                const input = e.target as HTMLInputElement;
                void loadFile(input.files?.[0]);
                input.value = '';
              }}
            />
          </label>
        </div>

        {pending && (
          <fieldset class="ed-group">
            <legend>{pending.name} の種類</legend>
            <div class="ed-kind-options">
              {EDITOR_KINDS.map((k) => (
                <label key={k.value} class="ed-kind">
                  <input
                    type="radio"
                    name="load-kind"
                    checked={pendingKind === k.value}
                    onChange={() => setPendingKind(k.value)}
                  />
                  {k.label}
                </label>
              ))}
            </div>
            <button
              type="button"
              class="ed-button"
              onClick={() => load(pending.text, pending.name, pendingKind)}
            >
              この種類で読み込む
            </button>
          </fieldset>
        )}

        <div class="ed-group">
          <p class="ed-strong">サイトにある記事から選ぶ（GitHub から読み込みます）</p>
          {index === null ? (
            <p class="ed-hint">既存記事の一覧を読み込めませんでした。</p>
          ) : (
            <>
              <label htmlFor="load-search">絞り込み（タイトル・ID）</label>
              <input
                id="load-search"
                type="search"
                value={query}
                onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
              />
              <label htmlFor="load-select">記事</label>
              <select
                id="load-select"
                value={selected}
                onChange={(e) => setSelected((e.target as HTMLSelectElement).value)}
              >
                <option value="">（選んでください）</option>
                {(['news', 'events', 'committee', 'pages'] as const).map((c) => (
                  <optgroup key={c} label={COLLECTION_LABELS[c]}>
                    {entries
                      .filter((e) => e.collection === c)
                      .map((e) => (
                        <option key={e.path} value={e.path}>
                          {e.title}（{e.id}）
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
              <button
                type="button"
                class="ed-button"
                disabled={!selected}
                onClick={() => void loadFromGitHub()}
              >
                読み込む
              </button>
            </>
          )}
        </div>
        <p class="ed-hint">
          修正した記事を出力すると、GitHub
          の「既存ファイルの編集画面」を開きます（同じ名前の新しいファイルは作れないため）。
        </p>
        <p class="ed-status" role="status">
          {status}
        </p>
      </div>
    </details>
  );
}
