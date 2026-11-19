/** 出力（spec 6.6）：ダウンロード・コピー・予備の zip */
import { zipSync } from 'fflate';

export interface OutputFile {
  /** リポジトリ内のパス（例：src/content/news/…md、public/files/news/…/…jpg） */
  path: string;
  data: Blob | string;
}

/** ファイルを保存させる（ブラウザのダウンロード） */
export function downloadBlob(
  name: string,
  data: Blob | string,
  type = 'text/markdown;charset=utf-8',
): void {
  const blob = typeof data === 'string' ? new Blob([data], { type }) : data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** リポジトリと同じフォルダ構成の zip（GitHub を使わずに管理者へ渡すための予備。D-45） */
export async function makeZip(files: readonly OutputFile[]): Promise<Blob> {
  const entries: Record<string, Uint8Array> = {};
  for (const f of files) {
    entries[f.path] =
      typeof f.data === 'string'
        ? new TextEncoder().encode(f.data)
        : new Uint8Array(await f.data.arrayBuffer());
  }
  const zipped = zipSync(entries, { level: 6 });
  return new Blob([zipped.slice().buffer], { type: 'application/zip' });
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
