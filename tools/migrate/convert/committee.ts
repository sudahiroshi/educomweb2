/**
 * 運営委員名簿（state/members.html）を年度ごとの .md にする（plan 9.6）。
 * 旧サイトの名簿は期ごと（「平成27年5月より平成30年5月まで」など）なので、期に含まれる各年度に同じ名簿を書く。
 * 期の終わりの年度に次の期が始まっているときは、その年度は次の期の名簿にする。
 * 先頭の名簿（期間の記載なし）は、1つ前の期の翌月から今年度までとする（plan 9.4 で確定）。
 * T-34 既定案: 旧サイトで公開済みの氏名・所属は引き続き公開する。メールアドレス（画像）は移さない。
 */
import type { Element, ElementContent } from 'hast';
import { toMarkdownFile } from '../lib/frontmatter.ts';
import { findAll, findFirst, normalizeText, textOf } from '../lib/html.ts';
import { fiscalYearOfMonth, parseWarekiYearMonths, type YearMonth } from '../lib/wareki.ts';
import type { ConvertContext, GeneratedFile } from './context.ts';

export interface Member {
  role: string;
  name: string;
  affiliation?: string;
}

interface Period {
  /** 期間の記載（先頭の名簿は undefined） */
  label: string | undefined;
  members: Member[];
}

const isElement = (n: ElementContent | undefined): n is Element => n?.type === 'element';

/** 所属のセルは <br> で行を分けているので、行ごとに整えて空白でつなぐ */
function cellLines(td: Element): string {
  const lines: ElementContent[][] = [[]];
  for (const child of td.children) {
    if (isElement(child) && child.tagName === 'br') lines.push([]);
    else lines.at(-1)?.push(child);
  }
  return lines
    .map((nodes) => textOf({ type: 'element', tagName: 'span', properties: {}, children: nodes }))
    .filter((s) => s !== '')
    .join(' ');
}

function membersOf(table: Element): Member[] {
  const tbody = findFirst(table, 'tbody') ?? table;
  return findAll(tbody, 'tr').flatMap((tr) => {
    const tds = findAll(tr, 'td');
    const [role, name, affiliation] = tds;
    if (!role || !name) return [];
    return [
      {
        role: normalizeText(textOf(role)),
        name: normalizeText(textOf(name)),
        affiliation: affiliation ? cellLines(affiliation) || undefined : undefined,
      },
    ];
  });
}

/** 本文の要素を順に見て、表の直前の段落を期間の記載とみなす */
export function periodsOf(body: Element): Period[] {
  const periods: Period[] = [];
  let label: string | undefined;
  const walk = (nodes: ElementContent[]) => {
    for (const node of nodes) {
      if (!isElement(node)) continue;
      if (node.tagName === 'p') {
        const text = textOf(node);
        if (parseWarekiYearMonths(text).length > 0) label = text;
        walk(node.children);
        continue;
      }
      if (node.tagName === 'table') {
        periods.push({ label, members: membersOf(node) });
        label = undefined;
        continue;
      }
      walk(node.children);
    }
  };
  walk(body.children);
  return periods;
}

const pad = (n: number) => String(n).padStart(2, '0');
const firstDay = (ym: YearMonth) => `${ym.year}-${pad(ym.month)}-01`;

export function convertCommittee(ctx: ConvertContext, currentFiscalYear: number): GeneratedFile[] {
  const page = 'state/members.html';
  const tree = ctx.read(page);
  const body = findAll(tree, 'body')[0];
  if (!body) return [];
  // 新しい期から順に並んでいる
  const periods = periodsOf(body);
  const out: GeneratedFile[] = [];

  let nextStartFy = currentFiscalYear + 1;
  periods.forEach((period, index) => {
    const [start, end] = period.label ? parseWarekiYearMonths(period.label) : [];
    let startYm: YearMonth | undefined = start;
    let inferred = false;
    if (!startYm) {
      // 期間の記載がない先頭の名簿：1つ前の期の終わりの翌月から
      const older = periods[index + 1]?.label;
      const olderEnd = older ? parseWarekiYearMonths(older)[1] : undefined;
      if (!olderEnd) {
        ctx.review.add(page, `${index + 1}番目の名簿の期間が分からないため変換していない`);
        return;
      }
      startYm =
        olderEnd.month === 12
          ? { year: olderEnd.year + 1, month: 1 }
          : { year: olderEnd.year, month: olderEnd.month + 1 };
      inferred = true;
    }
    const startFy = fiscalYearOfMonth(startYm);
    const endFy = Math.min(end ? fiscalYearOfMonth(end) : currentFiscalYear, nextStartFy - 1);

    for (let fy = startFy; fy <= endFy; fy++) {
      const path = `src/content/committee/${fy}.md`;
      const published = fy === startFy ? firstDay(startYm) : `${fy}-04-01`;
      const data = { fiscalYear: fy, published, members: period.members };
      out.push({ path, content: toMarkdownFile(data, period.label ? bodyNote(period.label) : '') });
      if (inferred && fy === startFy) {
        ctx.review.add(
          path,
          `旧サイトの先頭の名簿には期間の記載がない。1つ前の期の翌月（${startYm.year}年${startYm.month}月）から ${endFy}年度まで同じ名簿とした`,
        );
      }
    }
    nextStartFy = startFy;
  });

  ctx.review.add(
    'src/content/committee/',
    '掲載日は、期の最初の年度は期の始まりの月の1日、それ以外の年度は4月1日とした（旧サイトに記載なし）',
  );
  return out;
}

/** 期間の記載を本文の1文にする（例：「平成23年5月より平成27年4月までの名簿です（音響教育調査研究委員会）。」） */
export function bodyNote(label: string): string {
  const m = /^(.*?まで)\s*[（(]?([^）)]*)[）)]?\s*$/.exec(label.trim());
  if (!m) return label;
  const [, range, extra] = m;
  return extra ? `${range}の名簿です（${extra}）。` : `${range}の名簿です。`;
}
