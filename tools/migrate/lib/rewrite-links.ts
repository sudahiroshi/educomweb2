/**
 * 本文のリンクの書き換え（plan 9.7、spec 10章 6・7、D-34）。
 * - 外部リンク：正常ならそのまま、転送されるものは転送先に書き換える。切れているものはリンクを外す
 * - サイト内の添付ファイル：public/files/legacy/ に写し、/files/legacy/… に書き換える
 * - サイト内のページ：移行先の URL に書き換える。移行しない・ファイルがないものはリンクを外す
 * T-31 既定案: 切れたリンクは、リンクを外して文字だけ残す
 */
import type { Element, ElementContent } from 'hast';
import { attr, resolveLink, textOf } from './html.ts';
import { verdictOf, type LinkStatus } from './link-check.ts';
import type { Review } from './review.ts';

export interface RewriteOptions {
  /** 外部リンクの調査結果（URL → 結果） */
  statuses: ReadonlyMap<string, LinkStatus>;
  /** 旧サイトのページ（legacy/ からのパス）→ 新サイトの URL */
  pageUrls: ReadonlyMap<string, string>;
  /** 旧サイトにある添付ファイル（legacy/ からのパス）。見つかったものを写す */
  attachmentExists(path: string): boolean;
  /** 写した添付ファイル（legacy/ からのパス）を記録する */
  copyAttachment(path: string): void;
  review: Review;
}

export type ExternalDecision =
  { action: 'keep'; url: string; note?: string } | { action: 'unlink'; note: string };

/** 外部 URL の扱いを決める（本文のリンクとフロントマターの links で共通） */
export function decideExternal(
  url: string,
  statuses: ReadonlyMap<string, LinkStatus>,
): ExternalDecision {
  const status = statuses.get(url);
  if (!status) return { action: 'keep', url, note: `死活を調べていない：${url}` };
  switch (verdictOf(status)) {
    case 'ok':
      return { action: 'keep', url };
    case 'redirect':
      return {
        action: 'keep',
        url: status.redirectedTo ?? url,
        note: `転送先に書き換えた：${url} → ${status.redirectedTo ?? ''}`,
      };
    case 'blocked':
      return {
        action: 'keep',
        url,
        note: `自動の確認を拒否された（${status.status ?? ''}）。ブラウザで開けるか要確認：${url}`,
      };
    case 'to-top':
      return {
        action: 'unlink',
        note: `ページが消えている（サイトのトップへ転送）ためリンクを外した：${url}`,
      };
    case 'broken':
      return {
        action: 'unlink',
        note: `リンク切れ（${status.status ?? status.error ?? '接続不可'}）のためリンクを外した：${url}`,
      };
  }
}

export const legacyFileUrl = (path: string) => `/files/legacy/${path}`;

/**
 * 要素のリンクを書き換えた複製を返す。
 * @param page 要素がある旧サイトのページ（legacy/ からのパス）
 * @param target 要確認リストに載せるときの生成ファイル
 */
export function rewriteLinks(
  el: Element,
  page: string,
  target: string,
  options: RewriteOptions,
): Element {
  const copy = structuredClone(el);
  const note = (message: string) => options.review.add(target, message);

  const transform = (node: Element): ElementContent[] => {
    node.children = node.children.flatMap((child) =>
      child.type === 'element' ? transform(child) : [child],
    );
    if (node.tagName === 'img') {
      const src = attr(node, 'src');
      const resolved = src ? resolveLink(page, src) : undefined;
      if (resolved?.path && options.attachmentExists(resolved.path)) {
        options.copyAttachment(resolved.path);
        node.properties.src = legacyFileUrl(resolved.path);
        return [node];
      }
      note(`画像のファイルがないため外した：${src ?? '（src なし）'}`);
      return [];
    }
    if (node.tagName !== 'a') return [node];

    const href = attr(node, 'href');
    const label = textOf(node);
    const unlink = (message: string): ElementContent[] => {
      note(`「${label}」：${message}`);
      // リンクの文字の前後の空白は、リンクを外すと本文に残るので除く
      const children = node.children;
      const first = children[0];
      const last = children.at(-1);
      if (first?.type === 'text') first.value = first.value.replace(/^\s+/, '');
      if (last?.type === 'text') last.value = last.value.replace(/\s+$/, '');
      return children;
    };
    // 旧サイトの target 属性（別ウィンドウ）は引き継がない
    delete node.properties.target;
    if (!href) return node.children;

    const resolved = resolveLink(page, href);
    if (resolved.external) {
      const decision = decideExternal(href, options.statuses);
      if (decision.action === 'unlink') return unlink(decision.note);
      node.properties.href = decision.url;
      if (decision.note) note(`「${label}」：${decision.note}`);
      return [node];
    }
    if (!resolved.path) return [node];
    const pageUrl = options.pageUrls.get(resolved.path);
    if (pageUrl) {
      node.properties.href = pageUrl;
      return [node];
    }
    if (/\.html?$/i.test(resolved.path)) {
      return unlink(
        `リンク先のページ（${resolved.path}）は移行しない、またはファイルがないためリンクを外した`,
      );
    }
    if (options.attachmentExists(resolved.path)) {
      options.copyAttachment(resolved.path);
      node.properties.href = legacyFileUrl(resolved.path);
      return [node];
    }
    return unlink(`添付ファイル（${resolved.path}）がないためリンクを外した`);
  };

  const [result] = transform(copy);
  return result?.type === 'element'
    ? result
    : { type: 'element', tagName: 'span', properties: {}, children: result ? [result] : [] };
}
