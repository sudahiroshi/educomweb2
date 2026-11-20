/**
 * お知らせ・活動記録・研究発表会・国際会議の変換（plan 9.5）。
 * 旧サイトには講演一覧の表がないため、セッション・講演は作らない。
 */
import type { Element } from 'hast';
import { EVENT_PLANS, NEWS_PLANS, type EventPlan } from '../mapping.ts';
import { toMarkdownFile } from '../lib/frontmatter.ts';
import { attr, findAll, findFirst, textOf } from '../lib/html.ts';
import { elementToMarkdown } from '../lib/to-markdown.ts';
import { topItems } from '../lib/top-items.ts';
import type { ConvertContext, GeneratedFile } from './context.ts';

const newsPath = (published: string, slug: string) => `src/content/news/${published}-${slug}.md`;
const eventPath = (startDate: string, slug: string) => `src/content/events/${startDate}-${slug}.md`;

/** 直下の子要素のうち、指定のタグのもの */
const childElements = (el: Element, tag: string): Element[] =>
  el.children.filter((c): c is Element => c.type === 'element' && c.tagName === tag);

/**
 * 研究会の項目（top.html）から、資料販売の案内（終了済み）と連絡先のメールアドレスを除く。
 * 残すのは「概要」「開催日時」「場所」とプログラムへのリンク。
 */
function workshopBody(li: Element): Element {
  const ul = childElements(li, 'ul')[0];
  const kept = ul
    ? childElements(ul, 'li').filter((item) => {
        const text = textOf(item);
        return /^(概要|開催日時|場所)/.test(text) || findFirst(item, 'a') !== undefined;
      })
    : [];
  return {
    type: 'element',
    tagName: 'div',
    properties: {},
    children: [{ type: 'element', tagName: 'ul', properties: {}, children: kept }],
  };
}

function eventFile(ctx: ConvertContext, plan: EventPlan, item: Element | undefined): GeneratedFile {
  const path = eventPath(plan.startDate, plan.slug);
  const links =
    plan.linksFromItem && item
      ? findAll(item, 'a')
          .map((a) => ({ label: textOf(a), url: attr(a, 'href') ?? '' }))
          .filter((l) => /^https?:\/\//.test(l.url))
          .flatMap((l) => {
            const url = ctx.resolveUrl(l.url, path);
            return url ? [{ ...l, url }] : [];
          })
      : [];
  // 本文は top.html の項目からだけ作る。一覧の項目（国際会議など）は題名・日付・リンクだけなので本文にしない
  let body = plan.body ?? '';
  if (!plan.body && item && plan.source === 'top.html') {
    const isWorkshop = plan.slug === 'workshop-listening-program';
    const source = isWorkshop ? workshopBody(item) : item;
    if (isWorkshop) {
      ctx.review.add(
        path,
        '資料販売の案内（終了済み）と連絡先のメールアドレスは載せていない。「簡易プログラム」「概要つきプログラム」はリンク先がなく文字だけ残っている',
      );
    }
    body = elementToMarkdown(ctx.rewriteLinks(source, plan.source, path));
  }
  if (plan.dateNote) ctx.review.add(path, `開催日：${plan.dateNote}`);
  const data = {
    kind: plan.kind,
    title: plan.title,
    published: plan.startDate,
    startDate: plan.startDate,
    endDate: plan.endDate,
    venue: plan.venue,
    links,
  };
  return { path, content: toMarkdownFile(data, body) };
}

export function convertNewsAndEvents(ctx: ConvertContext): GeneratedFile[] {
  const out: GeneratedFile[] = [];
  const items = topItems(ctx.read('top.html'));
  const findItem = (match: string) => items.find((i) => i.text.startsWith(match))?.li;

  for (const plan of NEWS_PLANS) {
    const li = findItem(plan.match);
    const path = newsPath(plan.published, plan.slug);
    if (!li) {
      ctx.review.add('top.html', `「${plan.match}」の項目が見つからない`);
      continue;
    }
    if (plan.dateNote) ctx.review.add(path, `掲載日：${plan.dateNote}`);
    const body = elementToMarkdown(ctx.rewriteLinks(li, 'top.html', path));
    out.push({
      path,
      content: toMarkdownFile({ title: plan.title, published: plan.published }, body),
    });
  }

  const intlItems = (() => {
    const tree = ctx.read('meeting/kokusaikaigi.html');
    return findAll(tree, 'li').map((li) => ({ li, text: textOf(li) }));
  })();

  for (const plan of EVENT_PLANS) {
    let item: Element | undefined;
    if (plan.source === 'top.html') item = findItem(plan.match);
    else if (plan.source === 'meeting/kokusaikaigi.html') {
      item = intlItems.find((i) => i.text.startsWith(plan.match))?.li;
    }
    if (plan.source !== 'meeting/kenkyuhapyoukai.html' && !item) {
      ctx.review.add(plan.source, `「${plan.match}」の項目が見つからない`);
      continue;
    }
    out.push(eventFile(ctx, plan, item));
  }
  return out;
}
