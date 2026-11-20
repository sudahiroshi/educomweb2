/** 旧サイトの HTML の読み取り（plan 9.2〜9.8） */
import { readFileSync } from 'node:fs';
import { posix } from 'node:path';
import type { Element, Root } from 'hast';
import { fromHtml } from 'hast-util-from-html';
import { toText } from 'hast-util-to-text';
import { visit } from 'unist-util-visit';

export function parseHtml(text: string): Root {
  return fromHtml(text);
}

export function readHtml(path: string): Root {
  return parseHtml(readFileSync(path, 'utf8'));
}

/** 和文の途中の改行・字下げを詰め、連続する空白を1つにする */
export function normalizeText(text: string): string {
  return text
    .replace(/([^\u0020-\u007E\s])[ \t]*\n\s*(?=[^\u0020-\u007E\s])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function textOf(node: Root | Element): string {
  return normalizeText(toText(node, { whitespace: 'pre' }));
}

export function findAll(tree: Root | Element, tagName: string): Element[] {
  const found: Element[] = [];
  visit(tree, 'element', (el: Element) => {
    if (el.tagName === tagName) found.push(el);
  });
  return found;
}

export function findFirst(tree: Root | Element, tagName: string): Element | undefined {
  return findAll(tree, tagName)[0];
}

export function attr(el: Element, name: string): string | undefined {
  const value = el.properties[name];
  if (value === undefined || value === null) return undefined;
  return (Array.isArray(value) ? value.join(' ') : String(value)).trim();
}

export interface PageInfo {
  /** <title> */
  title: string;
  /** h1 が1つならその文字、複数あれば <title>、なければ undefined */
  heading: string | undefined;
}

export function pageInfo(tree: Root): PageInfo {
  const title = findFirst(tree, 'title');
  const text = title ? textOf(title) : '';
  const h1s = findAll(tree, 'h1');
  const [first] = h1s;
  return { title: text, heading: h1s.length > 1 ? text : first ? textOf(first) : undefined };
}

export interface LinkRef {
  /** a（href）か img（src） */
  kind: 'a' | 'img';
  /** 書かれていたままの URL（前後の空白・改行は除く） */
  raw: string;
  /** リンクの文字（img は alt） */
  text: string;
  /** サイト内のリンクなら、legacy/ からの相対パス。外部なら undefined */
  path: string | undefined;
  /** 外部リンク（http・https） */
  external: boolean;
}

/** URL がサイト内か外部かを判定し、サイト内なら legacy/ からのパスにする */
export function resolveLink(fromPage: string, raw: string): Pick<LinkRef, 'path' | 'external'> {
  if (/^https?:\/\//i.test(raw)) return { path: undefined, external: true };
  if (/^(mailto|javascript):/i.test(raw) || raw.startsWith('#')) {
    return { path: undefined, external: false };
  }
  const withoutHash = raw.replace(/[#?].*$/, '');
  const path = posix.normalize(posix.join(posix.dirname(fromPage), withoutHash));
  return { path, external: false };
}

/** ページ内のリンク（a と img）を出現順に返す */
export function linksOf(tree: Root, fromPage: string): LinkRef[] {
  const out: LinkRef[] = [];
  visit(tree, 'element', (el: Element) => {
    const isA = el.tagName === 'a';
    const isImg = el.tagName === 'img';
    if (!isA && !isImg) return;
    const raw = attr(el, isA ? 'href' : 'src');
    if (!raw) return;
    out.push({
      kind: isA ? 'a' : 'img',
      raw,
      text: isA ? textOf(el) : normalizeText(attr(el, 'alt') ?? ''),
      ...resolveLink(fromPage, raw),
    });
  });
  return out;
}
