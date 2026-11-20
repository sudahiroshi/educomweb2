/**
 * 旧サイトの HTML の一部を Markdown（GFM）にする（plan 9.5〜9.8）。
 * 和文の途中の改行と全角空白の字下げを詰めてから変換する。
 */
import type { Element, ElementContent, Root, Text } from 'hast';
import { toMdast } from 'hast-util-to-mdast';
import { gfmToMarkdown } from 'mdast-util-gfm';
import { toMarkdown } from 'mdast-util-to-markdown';
import { visit } from 'unist-util-visit';

/** ASCII の印字可能文字・空白以外（和文など） */
const WIDE = '[^\\u0020-\\u007E\\s]';
const WIDE_BREAK = new RegExp(`(${WIDE})([ \\t]*)\\u3000*\\n[\\s\\u3000]*(?=${WIDE})`, 'g');

/**
 * 和文どうしの間の改行（前後の字下げを含む）を詰め、改行の前後の全角空白を除く。
 * 改行の直前に半角空白があるときは、区切りとみなして空白1つを残す（「題名 ⏎ 著者」など）。
 */
export function joinWideLines(text: string): string {
  return text
    .replace(WIDE_BREAK, (_m, ch: string, space: string) => (space ? `${ch} ` : ch))
    .replace(/[ \t\u3000]*\n[ \t\u3000]*/g, '\n');
}

/** リンクの文字の前後の空白を除く（「[ JSTAGE](…)」にならないように） */
function trimLinkText(root: Root) {
  visit(root, 'element', (el: Element) => {
    if (el.tagName !== 'a') return;
    const first = el.children[0];
    const last = el.children.at(-1);
    if (first?.type === 'text') first.value = first.value.replace(/^\s+/, '');
    if (last?.type === 'text') last.value = last.value.replace(/\s+$/, '');
  });
}

function prepare(nodes: readonly ElementContent[]): Root {
  const root: Root = { type: 'root', children: structuredClone([...nodes]) };
  visit(root, 'text', (node: Text) => {
    node.value = joinWideLines(node.value);
  });
  trimLinkText(root);
  return root;
}

/** hast のノード列を Markdown にする（末尾の改行なし） */
export function nodesToMarkdown(nodes: readonly ElementContent[]): string {
  const mdast = toMdast(prepare(nodes));
  return toMarkdown(mdast, {
    bullet: '-',
    listItemIndent: 'one',
    rule: '-',
    emphasis: '_',
    fences: true,
    extensions: [gfmToMarkdown()],
  })
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function elementToMarkdown(el: Element): string {
  return nodesToMarkdown(el.children);
}
