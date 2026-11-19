import { describe, expect, test } from 'vitest';
import {
  attachmentName,
  attachmentUrl,
  fileKind,
  fitWithin,
  formatBytes,
  nextSeq,
} from './attachments';

describe('画像・添付ファイル', () => {
  test('名前の付け替えとパス（spec 2.8）', () => {
    expect(attachmentName('2026-11-19-site-renewal', 1, 'jpg')).toBe(
      '2026-11-19-site-renewal-01.jpg',
    );
    expect(attachmentName('2026', 12, 'pdf')).toBe('2026-12.pdf');
    expect(attachmentUrl('news', '2026-11-19-a', '2026-11-19-a-01.jpg')).toBe(
      '/files/news/2026-11-19-a/2026-11-19-a-01.jpg',
    );
  });

  test('受け付ける種類（SVG は不可）', () => {
    expect(fileKind('image/jpeg')).toEqual({ ext: 'jpg', image: true });
    expect(fileKind('application/pdf')).toEqual({ ext: 'pdf', image: false });
    expect(fileKind('image/svg+xml')).toBeUndefined();
  });

  test('長辺 1600px への縮小（T-19）', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 1600, height: 1200, scaled: true });
    expect(fitWithin(1000, 2400)).toEqual({ width: 667, height: 1600, scaled: true });
    expect(fitWithin(1600, 900)).toEqual({ width: 1600, height: 900, scaled: false });
  });

  test('連番は削除しても詰めない', () => {
    expect(nextSeq([])).toBe(1);
    expect(nextSeq([1, 3])).toBe(4);
  });

  test('大きさの表示', () => {
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });
});
