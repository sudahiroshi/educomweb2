import { describe, expect, it } from 'vitest';
import { verdictOf } from './link-check.ts';

const base = { url: 'http://example.com/', redirectedTo: undefined, error: undefined };

describe('verdictOf', () => {
  it('2xx は正常、転送後に 2xx なら転送', () => {
    expect(verdictOf({ ...base, status: 200 })).toBe('ok');
    expect(verdictOf({ ...base, status: 200, redirectedTo: 'https://example.com/' })).toBe(
      'redirect',
    );
  });
  it('下の階層のページがトップへ転送されたら、ページが消えているとみなす', () => {
    const toTop = { status: 200, redirectedTo: 'https://acoustics.jp/' };
    expect(verdictOf({ ...base, url: 'http://www.asj.gr.jp/journal/pdf/a.pdf', ...toTop })).toBe(
      'to-top',
    );
    expect(verdictOf({ ...base, url: 'http://www.asj.gr.jp/', ...toTop })).toBe('redirect');
  });
  it('401・403・429 は自動の確認を拒否している可能性があるので区別する', () => {
    expect(verdictOf({ ...base, status: 403 })).toBe('blocked');
  });
  it('4xx・5xx・接続できないものは切れている', () => {
    expect(verdictOf({ ...base, status: 404 })).toBe('broken');
    expect(verdictOf({ ...base, status: 503 })).toBe('broken');
    expect(verdictOf({ ...base, status: undefined, error: 'ENOTFOUND' })).toBe('broken');
  });
});
