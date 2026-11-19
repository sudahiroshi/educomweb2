import { describe, expect, test } from 'vitest';
import { editUrl, newFileUrl, rawUrl, uploadUrl } from './github';

describe('GitHub の URL（owner/repo/branch は site.ts から）', () => {
  test('新規作成・アップロード・編集・raw', () => {
    const url = new URL(
      newFileUrl('src/content/news/2026-11-19-a.md', '---\ntitle: 日本語 & 記号\n---\n'),
    );
    expect(url.origin + url.pathname).toBe('https://github.com/sudahiroshi/educomweb2/new/main');
    expect(url.searchParams.get('filename')).toBe('src/content/news/2026-11-19-a.md');
    expect(url.searchParams.get('value')).toBe('---\ntitle: 日本語 & 記号\n---\n');
    expect(new URL(newFileUrl('a.md')).searchParams.has('value')).toBe(false);
    expect(uploadUrl('public/files/news/2026-11-19-a')).toBe(
      'https://github.com/sudahiroshi/educomweb2/upload/main/public/files/news/2026-11-19-a',
    );
    expect(editUrl('src/content/pages/about.md')).toBe(
      'https://github.com/sudahiroshi/educomweb2/edit/main/src/content/pages/about.md',
    );
    expect(rawUrl('src/content/committee/2026.md')).toBe(
      'https://raw.githubusercontent.com/sudahiroshi/educomweb2/main/src/content/committee/2026.md',
    );
  });
});
