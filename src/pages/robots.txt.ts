/** robots.txt（spec 7章）。サイトマップの場所を示す。編集画面は各ページの noindex で除外する */
import { site } from '../config/site';

export function GET() {
  const body = ['User-agent: *', 'Allow: /', '', `Sitemap: ${site.url}/sitemap-index.xml`, ''].join(
    '\n',
  );
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
