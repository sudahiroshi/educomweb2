/** 表計算ソフトからコピーした表（タブ区切り）の貼り付け欄（spec 6.3） */
import { useState } from 'preact/hooks';

export function TsvPaste({
  id,
  label,
  columns,
  onAdd,
}: {
  id: string;
  label: string;
  /** 列順の説明 */
  columns: string;
  onAdd: (text: string) => number;
}) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  return (
    <details class="ed-paste">
      <summary>{label}</summary>
      <label htmlFor={id}>
        表計算ソフトでセルを選んでコピーし、ここに貼り付けてください（列順：{columns}）
      </label>
      <textarea
        id={id}
        rows={4}
        value={text}
        onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
      />
      <button
        type="button"
        class="ed-button"
        onClick={() => {
          const n = onAdd(text);
          setStatus(n > 0 ? `${n} 行を追加しました。` : '追加できる行がありませんでした。');
          if (n > 0) setText('');
        }}
      >
        貼り付けた表を追加
      </button>
      <p class="ed-status" role="status">
        {status}
      </p>
    </details>
  );
}
