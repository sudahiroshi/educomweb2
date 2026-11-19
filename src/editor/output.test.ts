import { unzipSync, strFromU8 } from 'fflate';
import { describe, expect, test } from 'vitest';
import { makeZip } from './output';

describe('予備の zip', () => {
  test('リポジトリと同じフォルダ構成で入る', async () => {
    const zip = await makeZip([
      { path: 'src/content/news/2026-11-19-a.md', data: '---\ntitle: あ\n---\n' },
      {
        path: 'public/files/news/2026-11-19-a/2026-11-19-a-01.jpg',
        data: new Blob([new Uint8Array([1, 2, 3])]),
      },
    ]);
    const files = unzipSync(new Uint8Array(await zip.arrayBuffer()));
    expect(Object.keys(files).sort()).toEqual([
      'public/files/news/2026-11-19-a/2026-11-19-a-01.jpg',
      'src/content/news/2026-11-19-a.md',
    ]);
    expect(strFromU8(files['src/content/news/2026-11-19-a.md'] ?? new Uint8Array())).toBe(
      '---\ntitle: あ\n---\n',
    );
    expect([...(files['public/files/news/2026-11-19-a/2026-11-19-a-01.jpg'] ?? [])]).toEqual([
      1, 2, 3,
    ]);
  });
});
