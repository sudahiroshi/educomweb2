/**
 * 編集画面の本体（spec 6.2）。種類の選択 → 入力フォーム／プレビュー → チェック結果・出力。
 */
import { useState } from 'preact/hooks';

export const EDITOR_KINDS = [
  { value: 'news', label: 'お知らせ' },
  { value: 'activity', label: '活動記録' },
  { value: 'asj', label: '音響学会研究発表会' },
  { value: 'cosponsored', label: '共催研究発表会' },
  { value: 'international', label: '国際会議' },
  { value: 'committee', label: '運営委員' },
  { value: 'pages', label: 'その他のページ' },
] as const;

export type EditorKind = (typeof EDITOR_KINDS)[number]['value'];

export default function EditorApp() {
  const [kind, setKind] = useState<EditorKind>('news');
  return (
    <div class="editor">
      <fieldset class="editor-kinds">
        <legend>種類</legend>
        {EDITOR_KINDS.map((k) => (
          <label key={k.value}>
            <input
              type="radio"
              name="editor-kind"
              value={k.value}
              checked={kind === k.value}
              onChange={() => setKind(k.value)}
            />
            {k.label}
          </label>
        ))}
      </fieldset>
    </div>
  );
}
