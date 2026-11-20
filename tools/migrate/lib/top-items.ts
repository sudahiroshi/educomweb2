/** 旧サイトのお知らせ（top.html）の項目の取り出し（plan 9.2、9.5） */
import type { Element, Root } from 'hast';
import { attr, findAll, textOf } from './html.ts';

export interface TopItem {
  /** 囲みの見出し（「今後の予定」「お知らせ」） */
  box: string;
  /** 項目の li 要素 */
  li: Element;
  text: string;
}

const isElement = (node: unknown, tag?: string): node is Element =>
  typeof node === 'object' &&
  node !== null &&
  (node as Element).type === 'element' &&
  (tag === undefined || (node as Element).tagName === tag);

/** .contentsbox01 の直下の ul にある li を、出現順に返す */
export function topItems(tree: Root): TopItem[] {
  const items: TopItem[] = [];
  for (const div of findAll(tree, 'div')) {
    if (!(attr(div, 'className') ?? '').split(' ').includes('contentsbox01')) continue;
    const h1 = div.children.find((c) => isElement(c, 'h1'));
    const box = h1 && isElement(h1) ? textOf(h1) : '';
    for (const ul of div.children) {
      if (!isElement(ul, 'ul')) continue;
      for (const li of ul.children) {
        if (isElement(li, 'li')) items.push({ box, li, text: textOf(li) });
      }
    }
  }
  return items;
}
