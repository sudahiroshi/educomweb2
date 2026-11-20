/**
 * 旧サイトの各ページ・各項目の移行先（plan 9.2 の案、plan 9.4 で人が確定する）。
 * 棚卸し表（docs/migration/inventory.md）の「移行先（案）」と、変換スクリプト（plan 9.5〜9.8）の両方がこの表を読む。
 * T-01 既定案: 棚卸し結果をもとに判断する（この表が判断の材料）
 * T-32 既定案: どの分類にも当てはまらないものは、その他のページとして移行し、メニューには出さない
 */

export type Destination =
  | { to: 'news' }
  | { to: 'events'; kind: 'activity' | 'asj' | 'cosponsored' | 'international' }
  | { to: 'committee' }
  | { to: 'pages'; slug: string; showInMenu: boolean }
  | { to: 'merge'; into: string }
  | { to: 'split' }
  | { to: 'discard' };

export interface PagePlan {
  /** legacy/ からのパス */
  path: string;
  /** 種類の推定 */
  estimate: string;
  destination: Destination;
  note?: string;
}

/** ページ単位の移行先（案）。legacy/ にない、リンク先だけのページも含む */
export const PAGE_PLANS: readonly PagePlan[] = [
  {
    path: 'title.html',
    estimate: 'フレームのタイトル',
    destination: { to: 'discard' },
    note: '新サイトのヘッダーに置き換わる',
  },
  {
    path: 'menu.html',
    estimate: 'フレームのメニュー',
    destination: { to: 'discard' },
    note: '構成の解析に使う。新サイトのメニューに置き換わる',
  },
  {
    path: 'top.html',
    estimate: 'お知らせの一覧（項目ごとに日付あり）',
    destination: { to: 'split' },
    note: '項目ごとに分ける（下の「お知らせの項目」）',
  },
  {
    path: 'plan/seturitusyusi.html',
    estimate: '委員会紹介（設立趣旨）',
    destination: { to: 'merge', into: 'pages/about（委員会について）' },
    note: '「委員会について」の「設立趣旨」節にする',
  },
  {
    path: 'plan/kaisaikiroku.html',
    estimate: '委員会紹介（各期の役員と主な活動）',
    destination: { to: 'pages', slug: 'history', showInMenu: true },
    note: '第1期〜第7期の表。期ごとの見出しと箇条書きにする',
  },
  {
    path: 'plan/recent.html',
    estimate: '最近の活動（リンク先のみ、ファイルなし）',
    destination: { to: 'discard' },
    note: 'メニューと kaisaikiroku.html からのリンクは外す',
  },
  {
    path: 'state/members.html',
    estimate: '運営委員名簿（4期分）',
    destination: { to: 'committee' },
    note: '期ごとに年度へ割り当てる（plan 9.6、T-34）。メールアドレスの画像は移さない',
  },
  {
    path: 'meeting/kenkyuhapyoukai.html',
    estimate: '音響学会研究発表会の一覧（3件、詳細ページはファイルなし）',
    destination: { to: 'events', kind: 'asj' },
    note: '3件を研究発表会の記事にする。開催日は要確認',
  },
  {
    path: 'meeting/2002spring.html',
    estimate: '平成14年春季研究発表会（ファイルなし）',
    destination: { to: 'events', kind: 'asj' },
  },
  {
    path: 'meeting/2001spring.html',
    estimate: '平成13年春季研究発表会（ファイルなし）',
    destination: { to: 'events', kind: 'asj' },
  },
  {
    path: 'meeting/1998fall.html',
    estimate: '平成10年秋季研究発表会（ファイルなし）',
    destination: { to: 'events', kind: 'asj' },
  },
  {
    path: 'meeting/kokusaikaigi.html',
    estimate: '関連国際会議の一覧（4件）',
    destination: { to: 'events', kind: 'international' },
    note: '4件を国際会議の記事にする',
  },
  {
    path: 'meeting/prog20110106.html',
    estimate: '研究会の簡易プログラム（ファイルなし）',
    destination: { to: 'discard' },
  },
  {
    path: 'meeting/abst20110106.html',
    estimate: '研究会の概要つきプログラム（ファイルなし）',
    destination: { to: 'discard' },
  },
  {
    path: 'doc/q_and_a.html',
    estimate: '音響に関する質問と答え',
    destination: { to: 'pages', slug: 'q-and-a', showInMenu: false },
    note: '答えの PDF がない',
  },
  {
    path: 'doc/asj6708/praat.html',
    estimate: '学会誌解説記事との連携（ファイルなし）',
    destination: { to: 'discard' },
  },
  {
    path: 'demo/index.html',
    estimate: '音教材とその実演（3件、リンク先はファイルなし）',
    destination: { to: 'pages', slug: 'demo', showInMenu: false },
  },
  ...[
    'demo/arai/asj_demo_arai.htm',
    'demo/iwamiya/tech_listening.htm',
    'demo/kawai/smile2004.htm',
  ].map((path): PagePlan => ({
    path,
    estimate: '教材の紹介ページ（ファイルなし）',
    destination: { to: 'discard' },
    note: 'demo/index.html からのリンクは外し、題名と紹介者は残す',
  })),
  {
    path: 'demo/links.html',
    estimate: '音響教育の実践リンク',
    destination: { to: 'pages', slug: 'links', showInMenu: false },
  },
  {
    path: 'museum/article/index.html',
    estimate: '「音の博物館」連載記事へのリンク（17件）',
    destination: { to: 'pages', slug: 'museum-article', showInMenu: false },
  },
  {
    path: 'museum/science/index.html',
    estimate: 'サイエンススクエア（国立科学博物館）の展示資料（PDF 2件、ファイルなし）',
    destination: { to: 'pages', slug: 'science-square', showInMenu: false },
  },
];

export interface NewsItemPlan {
  /** top.html の項目の書き出し（照合用） */
  startsWith: string;
  estimate: string;
  destination: Destination;
  /** 掲載日・開催日の案（本文からの推定。要確認のものは note に書く） */
  date: string;
  /** 終了日（複数日の催しのみ） */
  endDate?: string;
  title: string;
  note?: string;
}

/** top.html の各項目の移行先（案） */
export const TOP_ITEM_PLANS: readonly NewsItemPlan[] = [
  {
    startsWith: 'YouTube に',
    estimate: 'お知らせ',
    destination: { to: 'news' },
    date: '',
    title: 'YouTube に「音響教育チャンネル」を開設しました',
    note: '開設日の記載なし。掲載日は要確認',
  },
  {
    startsWith: '第１回音響工作・教材コンテスト',
    estimate: '研究発表会（春季のスペシャルセッション）',
    destination: { to: 'events', kind: 'asj' },
    date: '2018-03-13',
    title: '第1回音響工作・教材コンテスト',
    note: '平成30年3月13日、日本工業大学',
  },
  {
    startsWith: 'Acoustical Science and Technology',
    estimate: 'お知らせ（特集号）',
    destination: { to: 'news' },
    date: '2016-07-01',
    title: 'Acoustical Science and Technology 37巻4号は音響教育特集号です',
    note: '発行月のみ（2016年7月）。日は1日とした',
  },
  {
    startsWith: '2016年5月より',
    estimate: 'お知らせ（組織変更）',
    destination: { to: 'news' },
    date: '2016-05-01',
    title: '音響教育委員会に組織変更しました',
    note: '月のみ（2016年5月）。日は1日とした',
  },
  {
    startsWith: '日本音響学会誌70巻5号',
    estimate: 'お知らせ（特集号）',
    destination: { to: 'news' },
    date: '2014-05-01',
    title: '日本音響学会誌70巻5号は音響教育特集号です',
    note: '発行月のみ（2014年5月）。日は1日とした',
  },
  {
    startsWith: '平成25年音響学会春季研究発表会',
    estimate: '研究発表会（春季のスペシャルセッション）',
    destination: { to: 'events', kind: 'asj' },
    date: '2013-03-13',
    title: 'スペシャルセッション「音響分野の発展を支える音響教育とその学術的価値」',
    note: '平成25年春季（東京工科大学、2013年3月13〜15日）。開催日は学会の記録から推定、要確認',
  },
  {
    startsWith: '「音を聴いて学ぶ教育プログラム」',
    estimate: '活動記録（研究会）',
    destination: { to: 'events', kind: 'activity' },
    date: '2011-01-06',
    title: '研究会「音を聴いて学ぶ教育プログラム」',
    note: '平成23年1月6日、東京藝術大学 千住キャンパス。資料販売の案内（終了済み）と連絡先メールは載せない',
  },
  {
    startsWith: '日本音響学会誌66巻9号',
    estimate: 'お知らせ（小特集）',
    destination: { to: 'news' },
    date: '2010-09-01',
    title: '日本音響学会誌66巻9号に小特集「誌上ビギナーズセミナー」が掲載されました',
    note: '発行月のみ（2010年9月）。日は1日とした',
  },
];
