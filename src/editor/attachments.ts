/**
 * 画像・添付ファイル（spec 2.8・6.4、D-44、T-19、T-20）。
 * - 名前は {ID}-{連番2桁}.{拡張子}（例：2026-11-19-site-renewal-01.jpg）
 * - 置き場所は public/files/{コレクション}/{ID}/、本文からは /files/{コレクション}/{ID}/{名前} で参照
 */

// T-19 既定案: 長辺 1600px に自動縮小、JPEG 品質 0.85、上限 1MB
export const IMAGE_MAX_EDGE = 1600;
export const JPEG_QUALITY = 0.85;
export const IMAGE_MAX_BYTES = 1024 * 1024;
// T-20 既定案: PDF などの添付にも対応（画像と同じ置き場所・同じ手順）。上限は GitHub の画面から
// アップロードしやすい大きさとして 10MB（spec に定めがないため。超えたら知らせる）
export const FILE_MAX_BYTES = 10 * 1024 * 1024;

/** 受け付ける種類（SVG はスクリプトを含められるため受け付けない） */
export const ACCEPT_TYPES: Record<string, { ext: string; image: boolean }> = {
  'image/jpeg': { ext: 'jpg', image: true },
  'image/png': { ext: 'png', image: true },
  'image/webp': { ext: 'webp', image: true },
  'image/gif': { ext: 'gif', image: true },
  'application/pdf': { ext: 'pdf', image: false },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    ext: 'docx',
    image: false,
  },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    ext: 'xlsx',
    image: false,
  },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    ext: 'pptx',
    image: false,
  },
};

export const ACCEPT_ATTR = Object.keys(ACCEPT_TYPES).join(',');

export function fileKind(mime: string): { ext: string; image: boolean } | undefined {
  return ACCEPT_TYPES[mime];
}

/** 付け替え後の名前 */
export function attachmentName(id: string, seq: number, ext: string): string {
  return `${id}-${String(seq).padStart(2, '0')}.${ext}`;
}

/** 本文から参照するパス */
export function attachmentUrl(collection: string, id: string, name: string): string {
  return `/files/${collection}/${id}/${name}`;
}

/** 縮小後の大きさ（長辺を max 以下に。縮小不要ならそのまま） */
export function fitWithin(
  width: number,
  height: number,
  max = IMAGE_MAX_EDGE,
): { width: number; height: number; scaled: boolean } {
  const edge = Math.max(width, height);
  if (edge <= max) return { width, height, scaled: false };
  const r = max / edge;
  return { width: Math.round(width * r), height: Math.round(height * r), scaled: true };
}

/** 次の連番（使われている最大＋1。削除しても番号を詰めない＝本文のパスがずれない） */
export function nextSeq(used: readonly number[]): number {
  return used.length === 0 ? 1 : Math.max(...used) + 1;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
