/**
 * 画像の縮小（T-19 既定案: 長辺 1600px、JPEG 品質 0.85、上限 1MB）。ブラウザで canvas を使う。
 * GIF はアニメーションが失われるため縮小しない。PDF などはそのまま。
 */
import { FILE_MAX_BYTES, fileKind, fitWithin, IMAGE_MAX_BYTES, JPEG_QUALITY } from './attachments';

export interface ProcessedFile {
  blob: Blob;
  mime: string;
  ext: string;
  image: boolean;
  width?: number;
  height?: number;
  /** 縮小・変換したときの説明 */
  note?: string;
  /** 出力できない理由（上限超えなど） */
  error?: string;
}

function toBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('画像を変換できませんでした'))),
      mime,
      quality,
    );
  });
}

export async function processFile(file: File): Promise<ProcessedFile> {
  const kind = fileKind(file.type);
  if (!kind) {
    return {
      blob: file,
      mime: file.type,
      ext: '',
      image: false,
      error: 'この種類のファイルは追加できません（画像・PDF・Word・Excel・PowerPoint）',
    };
  }
  if (!kind.image) {
    return {
      blob: file,
      mime: file.type,
      ext: kind.ext,
      image: false,
      error: file.size > FILE_MAX_BYTES ? '10MB を超えるファイルは追加できません' : undefined,
    };
  }

  const bitmap = await createImageBitmap(file);
  const { width: w, height: h } = bitmap;
  const fit = fitWithin(w, h);
  if (file.type === 'image/gif' || (!fit.scaled && file.size <= IMAGE_MAX_BYTES)) {
    bitmap.close();
    return {
      blob: file,
      mime: file.type,
      ext: kind.ext,
      image: true,
      width: w,
      height: h,
      error:
        file.size > IMAGE_MAX_BYTES
          ? '1MB を超えています。小さくしてから追加してください'
          : undefined,
    };
  }

  const canvas = document.createElement('canvas');
  canvas.width = fit.width;
  canvas.height = fit.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('画像を処理できませんでした');
  ctx.drawImage(bitmap, 0, 0, fit.width, fit.height);
  bitmap.close();

  // PNG は透過を保つため PNG のまま縮小し、まだ上限を超えるときだけ JPEG にする
  let mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  let blob = await toBlob(canvas, mime, mime === 'image/jpeg' ? JPEG_QUALITY : undefined);
  if (blob.size > IMAGE_MAX_BYTES && mime === 'image/png') {
    const flat = document.createElement('canvas');
    flat.width = fit.width;
    flat.height = fit.height;
    const fctx = flat.getContext('2d');
    if (fctx) {
      fctx.fillStyle = '#ffffff';
      fctx.fillRect(0, 0, flat.width, flat.height);
      fctx.drawImage(canvas, 0, 0);
      mime = 'image/jpeg';
      blob = await toBlob(flat, mime, JPEG_QUALITY);
    }
  }
  const ext = mime === 'image/png' ? 'png' : 'jpg';
  const note = fit.scaled
    ? `${w}×${h} → ${fit.width}×${fit.height} に縮小`
    : 'JPEG に変換して軽くしました';
  return {
    blob,
    mime,
    ext,
    image: true,
    width: fit.width,
    height: fit.height,
    note,
    error: blob.size > IMAGE_MAX_BYTES ? '縮小しても 1MB を超えています' : undefined,
  };
}
