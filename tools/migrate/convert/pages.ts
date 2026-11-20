/**
 * その他のページの変換（plan 9.8）。
 * - plan/seturitusyusi.html → 「委員会について」（about.md）の「設立趣旨」節
 * - plan/kaisaikiroku.html → /history/（期ごとの見出し・役員・主な活動）
 * - そのほか mapping.ts で pages にしたページ → 本文をそのまま変換（メニューに出さない。T-32 既定案）
 */
import type { Element, ElementContent } from 'hast';
import { PAGE_PLANS } from '../mapping.ts';
import { toMarkdownFile } from '../lib/frontmatter.ts';
import { attr, findAll, findFirst, normalizeText, textOf } from '../lib/html.ts';
import { nodesToMarkdown } from '../lib/to-markdown.ts';
import type { ConvertContext, GeneratedFile } from './context.ts';

const pagePath = (slug: string) => `src/content/pages/${slug}.md`;

const isElement = (n: ElementContent | undefined): n is Element => n?.type === 'element';
const hasClass = (el: Element, name: string) =>
  (attr(el, 'className') ?? '').split(' ').includes(name);

/** 本文の要素（見出し h1・h1 だけの囲み・フッター（contentsbox03）・script を除く） */
function contentNodes(body: Element): ElementContent[] {
  return body.children.filter((node) => {
    if (!isElement(node)) return node.type === 'text';
    if (node.tagName === 'h1' || node.tagName === 'script') return false;
    if (node.tagName === 'div' && hasClass(node, 'contentsbox03')) return false;
    const onlyH1 =
      node.tagName === 'div' && node.children.filter(isElement).every((c) => c.tagName === 'h1');
    return !onlyH1;
  });
}

const wrap = (children: ElementContent[]): Element => ({
  type: 'element',
  tagName: 'div',
  properties: {},
  children,
});

function bodyOf(ctx: ConvertContext, page: string): Element | undefined {
  return findAll(ctx.read(page), 'body')[0];
}

function headingOf(ctx: ConvertContext, page: string): string {
  const h1 = findFirst(ctx.read(page), 'h1');
  return h1 ? textOf(h1) : page;
}

/** 「委員会について」：設立趣旨の本文を節にする */
function aboutPage(ctx: ConvertContext): GeneratedFile {
  const page = 'plan/seturitusyusi.html';
  const path = pagePath('about');
  const body = bodyOf(ctx, page);
  const p = body ? findFirst(body, 'p') : undefined;
  const text = p ? nodesToMarkdown(ctx.rewriteLinks(p, page, path).children) : '';
  const md = `## 設立趣旨\n\n${text.replace(/^\s+/, '')}`;
  ctx.review.add(
    path,
    '旧サイトの「設立趣旨」（音響教育調査研究委員会の設置提案の文）だけを載せた。現在の委員会の紹介文は要追加',
  );
  return { path, content: toMarkdownFile({ title: '委員会について', menuOrder: 10 }, md) };
}

const ROLE_RE = /(副委員長|委員長|幹事)/;

/** 「委員長 子安 勝 副委員長 東山三樹夫」を役職と氏名の組にする */
export function parseOfficers(text: string): { role: string; name: string }[] {
  const parts = normalizeText(text)
    .split(ROLE_RE)
    .map((s) => s.trim());
  const out: { role: string; name: string }[] = [];
  for (let i = 1; i < parts.length; i += 2) {
    const role = parts[i] ?? '';
    const name = (parts[i + 1] ?? '').replace(/\s+/g, ' ').trim();
    if (name) out.push({ role, name });
  }
  return out;
}

/** 「過去の主な活動」：期ごとの表を、見出し・期間・役員・主な活動にする */
function historyPage(ctx: ConvertContext, slug: string): GeneratedFile {
  const page = 'plan/kaisaikiroku.html';
  const path = pagePath(slug);
  const body = bodyOf(ctx, page);
  const sections: string[] = [];
  let current: { head: string; period: string; officers: string[]; acts: string[] } | undefined;
  const flush = () => {
    if (!current) return;
    const lines = [`## ${current.head}`, '', `期間：${current.period}`];
    if (current.officers.length > 0) lines.push('', ...current.officers);
    if (current.acts.length > 0) lines.push('', '主な活動：', '', ...current.acts);
    sections.push(lines.join('\n'));
  };

  for (const tr of body ? findAll(body, 'tr') : []) {
    const [first, second] = findAll(tr, 'td');
    if (!second) continue;
    const head = first ? textOf(first) : '';
    const text = textOf(second);
    if (head) {
      flush();
      current = { head, period: text, officers: [], acts: [] };
      continue;
    }
    if (!current) continue;
    const act = /^(\d+)）\s*(.*)$/.exec(text);
    if (act) {
      current.acts.push(`${act[1]}. ${act[2]}`);
    } else if (ROLE_RE.test(text)) {
      current.officers.push(...parseOfficers(text).map((o) => `- ${o.role}：${o.name}`));
    } else if (findFirst(second, 'a')) {
      // 「最近の活動を御覧ください」（リンク先のページがない）は載せない
      ctx.review.add(
        path,
        `${current.head}の「${text}」は、リンク先（最近の活動）がないため載せていない`,
      );
    }
  }
  flush();
  ctx.review.add(path, '第3期は期間のみ（役員・活動の記載なし）。第7期以降の記載はない');
  const title = headingOf(ctx, page);
  return {
    path,
    content: toMarkdownFile(
      { title, menuLabel: '過去の主な活動', menuOrder: 20 },
      sections.join('\n\n'),
    ),
  };
}

function plainPage(
  ctx: ConvertContext,
  page: string,
  slug: string,
  showInMenu: boolean,
): GeneratedFile {
  const path = pagePath(slug);
  const body = bodyOf(ctx, page);
  const md = body
    ? nodesToMarkdown(ctx.rewriteLinks(wrap(contentNodes(body)), page, path).children)
    : '';
  return {
    path,
    content: toMarkdownFile(
      { title: headingOf(ctx, page), showInMenu: showInMenu ? undefined : false },
      md,
    ),
  };
}

export function convertPages(ctx: ConvertContext): GeneratedFile[] {
  const out: GeneratedFile[] = [aboutPage(ctx)];
  for (const plan of PAGE_PLANS) {
    if (plan.destination.to !== 'pages') continue;
    const { slug, showInMenu } = plan.destination;
    out.push(
      plan.path === 'plan/kaisaikiroku.html'
        ? historyPage(ctx, slug)
        : plainPage(ctx, plan.path, slug, showInMenu),
    );
  }
  return out;
}
