/**
 * Markdown 本文の HTML を整える rehype プラグイン。
 * Astro（astro.config.mjs）と編集画面のプレビューの両方で使い、結果をそろえる。
 * rehype-sanitize（生の HTML の無害化）の後に実行すること。
 *
 * - 表：横スクロール枠（キーボードで操作できる領域）で囲み、見出しセルに scope="col" を付ける（spec 5.5・8章）
 * - 外部リンク：アイコンと読み上げ用の「（外部サイト）」を付ける（spec 8章）
 * - 脚注のリンク：rehype-sanitize が ID に付ける接頭辞（user-content-）をリンク先にも付ける
 */
import type { Element, ElementContent, Root, RootContent } from 'hast';
import { EXTERNAL_ICON_PATHS, EXTERNAL_LABEL, isExternalUrl } from './external';

type Parent = Root | Element;

/** rehype-sanitize の既定の接頭辞（hast-util-sanitize の defaultSchema.clobberPrefix） */
const CLOBBER_PREFIX = 'user-content-';

function externalIcon(): Element {
  return {
    type: 'element',
    tagName: 'svg',
    properties: {
      className: ['external-icon'],
      viewBox: '0 0 24 24',
      width: '1em',
      height: '1em',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      ariaHidden: 'true',
      focusable: 'false',
    },
    children: EXTERNAL_ICON_PATHS.map((d): Element => ({
      type: 'element',
      tagName: 'path',
      properties: { d },
      children: [],
    })),
  };
}

function visuallyHidden(text: string): Element {
  return {
    type: 'element',
    tagName: 'span',
    properties: { className: ['visually-hidden'] },
    children: [{ type: 'text', value: text }],
  };
}

function addClass(el: Element, name: string): void {
  const current = el.properties.className;
  const list = Array.isArray(current) ? current.map(String) : current ? [String(current)] : [];
  el.properties.className = [...list, name];
}

function markHeaderCells(el: Element, inHead: boolean): void {
  for (const child of el.children) {
    if (child.type !== 'element') continue;
    const head = inHead || child.tagName === 'thead';
    if (child.tagName === 'th' && head && child.properties.scope === undefined) {
      child.properties.scope = 'col';
    }
    markHeaderCells(child, head);
  }
}

function wrapTable(table: Element): Element {
  markHeaderCells(table, false);
  return {
    type: 'element',
    tagName: 'div',
    properties: {
      className: ['table-scroll'],
      role: 'region',
      ariaLabel: '表（横にスクロールできます）',
      tabIndex: 0,
    },
    children: [table],
  };
}

function transform(parent: Parent): void {
  parent.children = parent.children.map((child: RootContent | ElementContent) => {
    if (child.type !== 'element') return child;
    if (child.tagName === 'table') {
      return wrapTable(child);
    }
    if (child.tagName === 'a' && typeof child.properties.href === 'string') {
      const href = child.properties.href;
      const isFootnoteLink =
        child.properties.dataFootnoteRef !== undefined ||
        child.properties.dataFootnoteBackref !== undefined;
      if (isFootnoteLink && href.startsWith('#') && !href.startsWith(`#${CLOBBER_PREFIX}`)) {
        child.properties.href = `#${CLOBBER_PREFIX}${href.slice(1)}`;
      }
      if (isExternalUrl(href)) {
        addClass(child, 'external-link');
        child.children.push(externalIcon(), visuallyHidden(EXTERNAL_LABEL));
      }
    }
    transform(child);
    return child;
  }) as typeof parent.children;
}

export default function rehypeSite() {
  return (tree: Root): void => {
    transform(tree);
  };
}
