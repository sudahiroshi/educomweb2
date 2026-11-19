/** Markdown の書式ボタン（spec 6.3、D-46）。本文欄の選択範囲に記法を挿入する */
import type { RefObject } from 'preact';
import { applyFormat, FORMAT_BUTTONS, type FormatAction } from '../format';

export function FormatToolbar({
  textareaRef,
  value,
  onChange,
  onImage,
}: {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (v: string) => void;
  /** 画像ボタン：選んだ画像のパスを返す（なければ見本のパスを入れる） */
  onImage?: () => { path: string; alt?: string } | undefined;
}) {
  function run(action: FormatAction) {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const image = action === 'image' ? onImage?.() : undefined;
    const r = applyFormat(
      value,
      start,
      end,
      action,
      image ? { imagePath: image.path, imageAlt: image.alt } : {},
    );
    onChange(r.text);
    // 入力欄に戻り、書き換えてほしい部分を選んだ状態にする
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.setSelectionRange(r.selectionStart, r.selectionEnd);
    });
  }
  return (
    <div class="ed-toolbar" role="group" aria-label="書式">
      {FORMAT_BUTTONS.map((b) => (
        <button
          key={b.action}
          type="button"
          class="ed-button ed-toolbar-button"
          aria-label={b.label}
          onClick={() => run(b.action)}
        >
          {b.text}
        </button>
      ))}
    </div>
  );
}
