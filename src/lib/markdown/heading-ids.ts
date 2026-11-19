/**
 * 見出しに ID を付ける rehype プラグイン（編集画面のプレビュー用）。
 * Astro の rehypeHeadingIds と同じ規則（見出し内の文字を github-slugger で ID にする。既にある ID は保つ）。
 */
import Slugger from 'github-slugger';
import type { Element, Root, RootContent } from 'hast';
import { toString } from 'hast-util-to-string';

export default function rehypeHeadingIds() {
  return (tree: Root): void => {
    const slugger = new Slugger();
    const walk = (nodes: RootContent[]) => {
      for (const node of nodes) {
        if (node.type !== 'element') continue;
        const el = node as Element;
        if (/^h[1-6]$/.test(el.tagName) && typeof el.properties.id !== 'string') {
          el.properties.id = slugger.slug(toString(el));
        }
        walk(el.children as RootContent[]);
      }
    };
    walk(tree.children);
  };
}
