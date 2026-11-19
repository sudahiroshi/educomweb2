/** 本文（Markdown）の入力欄（spec 6.3、D-46）。書式ボタンは plan 8.4 で追加 */
import type { Ref } from 'preact';
import { fieldId, useIssue } from '../fields';

export function BodyEditor({
  value,
  onInput,
  required,
  textareaRef,
  toolbar,
}: {
  value: string;
  onInput: (v: string) => void;
  required: boolean;
  textareaRef?: Ref<HTMLTextAreaElement>;
  toolbar?: preact.ComponentChildren;
}) {
  const message = useIssue('body');
  const id = fieldId('body');
  return (
    <div class="ed-field ed-body">
      <label htmlFor={id}>
        本文（Markdown）{required && <span class="ed-required">（必須）</span>}
      </label>
      {toolbar}
      <textarea
        id={id}
        ref={textareaRef}
        rows={14}
        value={value}
        aria-invalid={message ? 'true' : undefined}
        aria-describedby={message ? `${id}-error` : undefined}
        onInput={(e) => onInput((e.target as HTMLTextAreaElement).value)}
      />
      {message && (
        <p class="ed-error" id={`${id}-error`}>
          {message}
        </p>
      )}
    </div>
  );
}
