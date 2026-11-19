/**
 * 入力欄の部品（spec 6.3・8章）。ラベルと入力欄を結び、エラーは欄の下に表示して aria-describedby で結ぶ。
 */
import type { ComponentChildren } from 'preact';
import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import type { DraftIssue } from './model';

/** 入力欄の位置（path）→ エラーメッセージ */
export const IssuesContext = createContext<Map<string, string>>(new Map());

export function issuesMap(issues: readonly DraftIssue[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const i of issues) if (!map.has(i.path)) map.set(i.path, i.message);
  return map;
}

/** path から入力欄の id を作る（エラー一覧からのリンク先にも使う） */
export function fieldId(path: string): string {
  return `f-${path.replace(/[^a-zA-Z0-9]/g, '-')}`;
}

export function useIssue(path: string): string | undefined {
  return useContext(IssuesContext).get(path);
}

function ErrorText({ path, message }: { path: string; message?: string }) {
  return message ? (
    <p class="ed-error" id={`${fieldId(path)}-error`}>
      {message}
    </p>
  ) : null;
}

interface BaseProps {
  path: string;
  label: string;
  hint?: ComponentChildren;
  required?: boolean;
}

export function TextField({
  path,
  label,
  hint,
  required,
  value,
  onInput,
  type = 'text',
  inputMode,
  placeholder,
}: BaseProps & {
  value: string;
  onInput: (v: string) => void;
  type?: 'text' | 'date' | 'time' | 'url';
  inputMode?: 'numeric' | 'text' | 'url';
  placeholder?: string;
}) {
  const message = useIssue(path);
  const id = fieldId(path);
  const describedBy = [hint ? `${id}-hint` : '', message ? `${id}-error` : '']
    .filter(Boolean)
    .join(' ');
  return (
    <div class="ed-field">
      <label htmlFor={id}>
        {label}
        {required && <span class="ed-required">（必須）</span>}
      </label>
      {hint && (
        <p class="ed-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      <input
        id={id}
        // Preact 11 の型は type の値ごとに属性の組を分けているため、変数で渡すときは型を合わせる
        type={type as 'text'}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        aria-invalid={message ? 'true' : undefined}
        aria-describedby={describedBy || undefined}
        onInput={(e) => onInput((e.target as HTMLInputElement).value)}
      />
      <ErrorText path={path} message={message} />
    </div>
  );
}

export function TextArea({
  path,
  label,
  hint,
  required,
  value,
  onInput,
  rows = 3,
}: BaseProps & { value: string; onInput: (v: string) => void; rows?: number }) {
  const message = useIssue(path);
  const id = fieldId(path);
  const describedBy = [hint ? `${id}-hint` : '', message ? `${id}-error` : '']
    .filter(Boolean)
    .join(' ');
  return (
    <div class="ed-field">
      <label htmlFor={id}>
        {label}
        {required && <span class="ed-required">（必須）</span>}
      </label>
      {hint && (
        <p class="ed-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      <textarea
        id={id}
        rows={rows}
        value={value}
        aria-invalid={message ? 'true' : undefined}
        aria-describedby={describedBy || undefined}
        onInput={(e) => onInput((e.target as HTMLTextAreaElement).value)}
      />
      <ErrorText path={path} message={message} />
    </div>
  );
}

export function Checkbox({
  path,
  label,
  hint,
  checked,
  onChange,
}: BaseProps & { checked: boolean; onChange: (v: boolean) => void }) {
  const id = fieldId(path);
  return (
    <div class="ed-field ed-check">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(e) => onChange((e.target as HTMLInputElement).checked)}
      />
      <label htmlFor={id}>{label}</label>
      {hint && (
        <p class="ed-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
    </div>
  );
}

/** 表の中の入力欄（見出しの代わりに aria-label で名前を付ける） */
export function CellInput({
  path,
  label,
  value,
  onInput,
  type = 'text',
  size,
}: {
  path: string;
  label: string;
  value: string;
  onInput: (v: string) => void;
  type?: 'text' | 'url' | 'date' | 'time';
  size?: number;
}) {
  const message = useIssue(path);
  const id = fieldId(path);
  return (
    <>
      <input
        id={id}
        // Preact 11 の型は type の値ごとに属性の組を分けているため、変数で渡すときは型を合わせる
        type={type as 'text'}
        size={size}
        value={value}
        aria-label={label}
        aria-invalid={message ? 'true' : undefined}
        aria-describedby={message ? `${id}-error` : undefined}
        onInput={(e) => onInput((e.target as HTMLInputElement).value)}
      />
      <ErrorText path={path} message={message} />
    </>
  );
}

/** 行の並べ替え・削除ボタン */
export function RowButtons({
  label,
  index,
  count,
  onMove,
  onRemove,
}: {
  label: string;
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div class="ed-row-buttons">
      <button
        type="button"
        class="ed-icon-button"
        aria-label={`${label}を上へ`}
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
      >
        ↑
      </button>
      <button
        type="button"
        class="ed-icon-button"
        aria-label={`${label}を下へ`}
        disabled={index === count - 1}
        onClick={() => onMove(index, index + 1)}
      >
        ↓
      </button>
      <button
        type="button"
        class="ed-icon-button"
        aria-label={`${label}を削除`}
        onClick={() => onRemove(index)}
      >
        ×
      </button>
    </div>
  );
}

/** 配列の並べ替え・削除・更新 */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return [...list];
  const next = [...list];
  const [item] = next.splice(from, 1);
  if (item !== undefined) next.splice(to, 0, item);
  return next;
}
export function removeItem<T>(list: readonly T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}
export function updateItem<T>(list: readonly T[], index: number, patch: Partial<T>): T[] {
  return list.map((item, i) => (i === index ? { ...item, ...patch } : item));
}
