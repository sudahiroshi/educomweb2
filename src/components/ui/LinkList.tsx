/** 外部リンク一覧（spec 5.6・8章）。外部のリンクにはアイコンと「（外部サイト）」を付ける */
import { isExternalUrl } from '../../lib/markdown/external';
import type { Link } from '../../schemas';
import { ExternalLink } from './ExternalLink';

export function LinkList({ links }: { links: readonly Link[] }) {
  if (links.length === 0) return null;
  return (
    <ul class="link-list">
      {links.map((link, i) => (
        <li key={i}>
          {isExternalUrl(link.url) ? (
            <ExternalLink href={link.url}>{link.label}</ExternalLink>
          ) : (
            <a href={link.url}>{link.label}</a>
          )}
        </li>
      ))}
    </ul>
  );
}
