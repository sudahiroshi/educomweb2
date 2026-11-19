/**
 * メインメニューの項目（spec 4.3、D-29〜D-31）。
 * 固定項目（お知らせ〜運営委員）の後ろに、その他のページを並べる。
 */
import type { PageData } from '../schemas';

export interface MenuLink {
  label: string;
  href: string;
}

export interface MenuGroup {
  label: string;
  /** サブメニューの範囲（現在地の判定に使う） */
  basePath: string;
  children: MenuLink[];
}

export type MenuItem = MenuLink | MenuGroup;

export function isMenuGroup(item: MenuItem): item is MenuGroup {
  return 'children' in item;
}

/** 研究発表会3種のサブメニュー（D-30） */
export const MEETING_MENU: MenuGroup = {
  label: '研究発表会・国際会議',
  basePath: '/meetings/',
  children: [
    { label: '音響学会研究発表会', href: '/meetings/asj/' },
    { label: '共催研究発表会', href: '/meetings/cosponsored/' },
    { label: '国際会議', href: '/meetings/international/' },
  ],
};

const FIXED_BEFORE: MenuLink[] = [
  { label: 'お知らせ', href: '/news/' },
  { label: '活動記録', href: '/activities/' },
];
const FIXED_AFTER: MenuLink[] = [{ label: '運営委員', href: '/committee/' }];

/** メニューに出すその他のページ */
export function pageMenuLinks(
  pages: readonly {
    id: string;
    data: Pick<PageData, 'title' | 'menuLabel' | 'showInMenu' | 'menuOrder'>;
  }[],
): MenuLink[] {
  // T-06 既定案: 固定項目の後ろに、menuOrder の昇順（同じ値は ID 順）で並べる
  return pages
    .filter((p) => p.data.showInMenu)
    .sort((a, b) => a.data.menuOrder - b.data.menuOrder || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((p) => ({ label: p.data.menuLabel ?? p.data.title, href: `/${p.id}/` }));
}

/** メインメニュー全体 */
export function buildMenu(pageLinks: readonly MenuLink[]): MenuItem[] {
  return [...FIXED_BEFORE, MEETING_MENU, ...FIXED_AFTER, ...pageLinks];
}

/** パスの末尾をスラッシュにそろえる */
function normalizePath(path: string): string {
  const p = path.split(/[?#]/)[0] ?? '/';
  return p.endsWith('/') ? p : `${p}/`;
}

/**
 * 現在地の判定。
 * - 'page'：そのページ自体を表示中（aria-current="page"）
 * - 'section'：その配下のページを表示中（aria-current="true"。見た目は同じ）
 * - undefined：該当しない
 */
export function currentState(href: string, currentPath: string): 'page' | 'section' | undefined {
  const target = normalizePath(href);
  const current = normalizePath(currentPath);
  if (current === target) return 'page';
  if (target !== '/' && current.startsWith(target)) return 'section';
  return undefined;
}

/** aria-current 属性の値 */
export function ariaCurrent(href: string, currentPath: string): 'page' | 'true' | undefined {
  const state = currentState(href, currentPath);
  return state === 'page' ? 'page' : state === 'section' ? 'true' : undefined;
}
