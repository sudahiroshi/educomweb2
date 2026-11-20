/** 外部リンクの死活確認（plan 9.3、spec 10章 7） */

export interface LinkStatus {
  url: string;
  /** HTTP の状態コード（接続できなければ undefined） */
  status: number | undefined;
  /** 転送後の URL（転送がなければ undefined） */
  redirectedTo: string | undefined;
  /** 接続できなかったときの理由 */
  error: string | undefined;
}

export type LinkVerdict = 'ok' | 'redirect' | 'to-top' | 'blocked' | 'broken';

const isTopPage = (url: string) => {
  try {
    return new URL(url).pathname === '/';
  } catch {
    return false;
  }
};

/**
 * - ok：2xx
 * - redirect：転送されて 2xx
 * - to-top：下の階層のページがサイトのトップへ転送された（ページが消えている。実質リンク切れ）
 * - blocked：401・403・429（自動の確認を拒否している可能性。ブラウザで要確認）
 * - broken：それ以外の 4xx・5xx、接続できない
 */
export function verdictOf(s: LinkStatus): LinkVerdict {
  if (s.status === undefined) return 'broken';
  if ([401, 403, 429].includes(s.status)) return 'blocked';
  if (s.status >= 400) return 'broken';
  if (!s.redirectedTo) return 'ok';
  return isTopPage(s.redirectedTo) && !isTopPage(s.url) ? 'to-top' : 'redirect';
}

const USER_AGENT = 'Mozilla/5.0 (compatible; link-checker)';

async function request(url: string, method: 'HEAD' | 'GET', timeoutMs: number) {
  const res = await fetch(url, {
    method,
    redirect: 'follow',
    headers: { 'user-agent': USER_AGENT },
    signal: AbortSignal.timeout(timeoutMs),
  });
  await res.body?.cancel();
  return res;
}

/** HEAD で調べ、HEAD を受け付けないサーバー（405 など）には GET で調べ直す */
export async function checkLink(url: string, timeoutMs = 15000): Promise<LinkStatus> {
  try {
    let res = await request(url, 'HEAD', timeoutMs);
    if (res.status >= 400) res = await request(url, 'GET', timeoutMs);
    const redirected = res.redirected && res.url !== url ? res.url : undefined;
    return { url, status: res.status, redirectedTo: redirected, error: undefined };
  } catch (e) {
    const cause = e instanceof Error && e.cause instanceof Error ? e.cause.message : undefined;
    const message = e instanceof Error ? e.message : String(e);
    return { url, status: undefined, redirectedTo: undefined, error: cause ?? message };
  }
}
