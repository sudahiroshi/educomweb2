/** 旧サイトのフレームのメニュー（menu.html）の解析（plan 9.2） */
import type { Element, Root } from 'hast';
import { attr, findFirst, resolveLink, textOf } from './html.ts';

export interface MenuItem {
  section: string;
  label: string;
  /** 書かれていたままのリンク先（リンクのない項目は undefined） */
  href: string | undefined;
  /** サイト内のリンクなら legacy/ からのパス */
  path: string | undefined;
  external: boolean;
}

const isElement = (node: unknown, tag: string): node is Element =>
  typeof node === 'object' && node !== null && (node as Element).tagName === tag;

/** .menubox の h2（区分）と、続く ul の li（項目）を読む */
export function parseMenu(tree: Root, menuPath = 'menu.html'): MenuItem[] {
  const box = findMenuBox(tree);
  if (!box) return [];
  const items: MenuItem[] = [];
  let section = '';
  for (const child of box.children) {
    if (isElement(child, 'h2')) section = textOf(child);
    if (!isElement(child, 'ul')) continue;
    for (const li of child.children) {
      if (!isElement(li, 'li')) continue;
      const a = findFirst(li, 'a');
      const href = a ? attr(a, 'href') : undefined;
      const resolved = href ? resolveLink(menuPath, href) : { path: undefined, external: false };
      items.push({ section, label: textOf(li), href, ...resolved });
    }
  }
  return items;
}

function findMenuBox(tree: Root): Element | undefined {
  let found: Element | undefined;
  const walk = (node: Root | Element) => {
    for (const child of node.children) {
      if (found) return;
      if (child.type !== 'element') continue;
      const cls = attr(child, 'className') ?? '';
      if (child.tagName === 'div' && cls.split(' ').includes('menubox')) found = child;
      else walk(child);
    }
  };
  walk(tree);
  return found;
}
