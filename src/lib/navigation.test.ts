import { describe, expect, test } from 'vitest';
import { ariaCurrent, buildMenu, currentState, isMenuGroup, pageMenuLinks } from './navigation';

const page = (
  id: string,
  title: string,
  menuOrder = 100,
  showInMenu = true,
  menuLabel?: string,
) => ({
  id,
  data:
    menuLabel === undefined
      ? { title, menuOrder, showInMenu }
      : { title, menuOrder, showInMenu, menuLabel },
});

describe('メニュー項目', () => {
  test('固定項目の後ろにその他のページを menuOrder 順で並べる', () => {
    const links = pageMenuLinks([
      page('links', 'リンク集', 20),
      page('hidden', '非表示', 1, false),
      page('about', '委員会について', 10),
      page('b-page', 'B', 100),
      page('a-page', 'A', 100, true, 'A短縮'),
    ]);
    expect(links).toEqual([
      { label: '委員会について', href: '/about/' },
      { label: 'リンク集', href: '/links/' },
      { label: 'A短縮', href: '/a-page/' },
      { label: 'B', href: '/b-page/' },
    ]);
    const menu = buildMenu(links);
    expect(menu.map((m) => m.label)).toEqual([
      'お知らせ',
      '活動記録',
      'メディア出演',
      '研究発表会・国際会議',
      '運営委員',
      '委員会について',
      'リンク集',
      'A短縮',
      'B',
    ]);
    const group = menu[3];
    expect(group && isMenuGroup(group) && group.children.map((c) => c.href)).toEqual([
      '/meetings/asj/',
      '/meetings/cosponsored/',
      '/meetings/international/',
    ]);
  });
});

describe('現在地', () => {
  test('そのページ・配下・該当なし', () => {
    expect(currentState('/news/', '/news/')).toBe('page');
    expect(currentState('/news/', '/news')).toBe('page');
    expect(currentState('/news/', '/news/2026-11-19-a/')).toBe('section');
    expect(currentState('/news/', '/newsletter/')).toBeUndefined();
    expect(currentState('/meetings/', '/meetings/asj/fy/2025/')).toBe('section');
    expect(currentState('/', '/news/')).toBeUndefined();
  });

  test('aria-current の値', () => {
    expect(ariaCurrent('/committee/', '/committee/')).toBe('page');
    expect(ariaCurrent('/committee/', '/committee/2025/')).toBe('true');
    expect(ariaCurrent('/committee/', '/news/')).toBeUndefined();
  });
});
