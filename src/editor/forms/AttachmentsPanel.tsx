/**
 * 画像・添付ファイル（spec 6.3・6.4、D-44、T-19、T-20）。
 * 選ぶと規則的な名前に付け替え、画像は縮小してプレビューに表示する。
 */
import { ACCEPT_ATTR, attachmentName, formatBytes } from '../attachments';

export interface Attachment {
  key: string;
  seq: number;
  originalName: string;
  blob: Blob;
  ext: string;
  image: boolean;
  /** 表示用のローカル URL（URL.createObjectURL） */
  url: string;
  note?: string;
  error?: string;
}

export function AttachmentsPanel({
  id,
  dir,
  items,
  busy,
  onAdd,
  onRemove,
  onInsert,
}: {
  /** 記事の ID（未確定なら空） */
  id: string;
  /** 保存先フォルダ（public/files/...） */
  dir: string;
  items: readonly Attachment[];
  busy: boolean;
  onAdd: (files: File[]) => void;
  onRemove: (key: string) => void;
  onInsert: (item: Attachment) => void;
}) {
  return (
    <fieldset class="ed-group">
      <legend>画像・添付ファイル</legend>
      <p class="ed-hint">
        画像（JPEG・PNG・WebP・GIF）と PDF などを追加できます。画像は長辺 1600px に縮小します（1MB
        まで）。
        {dir ? (
          <>
            保存先：<code>{dir}/</code>
          </>
        ) : (
          '記事の ID が決まると、保存先と名前が決まります。'
        )}
      </p>
      <label class="ed-file-input">
        <span>ファイルを選ぶ</span>
        <input
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          onChange={(e) => {
            const input = e.target as HTMLInputElement;
            onAdd([...(input.files ?? [])]);
            input.value = '';
          }}
        />
      </label>
      <p class="ed-status" role="status">
        {busy ? '処理しています…' : ''}
      </p>
      {items.length > 0 && (
        <ul class="ed-attachments">
          {items.map((a) => {
            const name = id
              ? attachmentName(id, a.seq, a.ext)
              : `（ID 未確定）-${String(a.seq).padStart(2, '0')}.${a.ext}`;
            return (
              <li key={a.key} class="ed-attachment">
                {a.image ? (
                  <img src={a.url} alt="" class="ed-thumb" />
                ) : (
                  <span class="ed-thumb ed-thumb-file">{a.ext.toUpperCase()}</span>
                )}
                <div class="ed-attachment-body">
                  <p>
                    <code>{name}</code>
                  </p>
                  <p class="ed-muted">
                    元の名前：{a.originalName}（{formatBytes(a.blob.size)}）
                    {a.note ? `・${a.note}` : ''}
                  </p>
                  {a.error && <p class="ed-error">{a.error}</p>}
                  <div class="ed-actions">
                    <button
                      type="button"
                      class="ed-button"
                      disabled={!id || !!a.error}
                      onClick={() => onInsert(a)}
                    >
                      本文に挿入<span class="visually-hidden">（{name}）</span>
                    </button>
                    <button type="button" class="ed-button" onClick={() => onRemove(a.key)}>
                      削除<span class="visually-hidden">（{name}）</span>
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </fieldset>
  );
}
