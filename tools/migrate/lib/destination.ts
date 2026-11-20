/** 移行先の表示名（棚卸し表・要確認リスト用） */
import type { Destination } from '../mapping.ts';

const EVENT_KIND_LABELS = {
  activity: '活動記録',
  asj: '研究発表会（音響学会）',
  cosponsored: '研究発表会（共催）',
  international: '国際会議',
} as const;

export function destinationLabel(d: Destination): string {
  switch (d.to) {
    case 'news':
      return 'お知らせ';
    case 'events':
      return EVENT_KIND_LABELS[d.kind];
    case 'committee':
      return '運営委員';
    case 'pages':
      return `その他のページ /${d.slug}/（${d.showInMenu ? 'メニューに出す' : 'メニューに出さない'}）`;
    case 'merge':
      return `統合：${d.into}`;
    case 'split':
      return '項目ごとに分割';
    case 'discard':
      return '破棄';
  }
}
