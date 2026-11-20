/**
 * 旧サイトの各ページ・各項目の移行先（plan 9.2 の案を、plan 9.4 でユーザーが「案のとおり」と確定。2026-11-20）。
 * 日付などが旧サイトから分からないものは、分かる情報だけを書き、仮の値は要確認リストに載せる。
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
  /** 変換後に人が確かめること（要確認リストに載せる） */
  reviewNote?: string;
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
    note: '3件を研究発表会の記事にする。会場と内容は kaisaikiroku.html の記述から。開催日は月までの仮の値（要確認）',
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
    reviewNote:
      '答えの PDF（loudspeaker.pdf）がなく、「上記2つの質問への答え」が文字だけ残っている。行を消すか、ページごと破棄するかを判断',
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
    reviewNote:
      '3件とも紹介ページ（arai/・iwamiya/・kawai/）がなく、題名と紹介者だけが残っている。現在の公開先があればリンクを追加',
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
    reviewNote:
      '「声道模型」のリンク先のサーバー（www.splab.ee.sophia.ac.jp）がない。現在の URL があれば追加',
  },
  {
    path: 'museum/article/index.html',
    estimate: '「音の博物館」連載記事へのリンク（17件）',
    destination: { to: 'pages', slug: 'museum-article', showInMenu: false },
    reviewNote:
      '記事の PDF が学会サイトから消えており、17件ともリンクを外した。前文の「記事へのリンクを公開しています」と食い違うので、文を直すか、ページごと破棄するかを判断',
  },
  {
    path: 'museum/science/index.html',
    estimate: 'サイエンススクエア（国立科学博物館）の展示資料（PDF 2件、ファイルなし）',
    destination: { to: 'pages', slug: 'science-square', showInMenu: false },
    reviewNote:
      '資料の PDF 2件（girigari.pdf・ScienceSquare2011-voice.pdf）がない。前文の「資料を公開しています」と食い違うので、文を直すか、ページごと破棄するかを判断',
  },
];

/** 研究発表会・国際会議の記事の内容（旧サイトから分かる範囲） */
export interface EventPlan {
  /** 照合用：旧サイトの項目の書き出し（top.html・kokusaikaigi.html）、またはリンク先のパス（kenkyuhapyoukai.html） */
  match: string;
  /** 出典（legacy/ からのパス） */
  source: string;
  kind: 'activity' | 'asj' | 'cosponsored' | 'international';
  slug: string;
  title: string;
  startDate: string;
  endDate?: string;
  venue?: string;
  /** 日付が旧サイトから日まで分からず、仮の値にしたときの説明（要確認リストに載せる） */
  dateNote?: string;
  /** 本文を項目から作らず、この文にする（旧サイトの別ページの記述から） */
  body?: string;
  /** 外部リンクを links に移す（本文の項目にリンクだけがあるもの） */
  linksFromItem?: boolean;
}

export interface NewsPlan {
  match: string;
  slug: string;
  title: string;
  published: string;
  dateNote?: string;
}

/** top.html の項目のうち、お知らせにするもの */
export const NEWS_PLANS: readonly NewsPlan[] = [
  {
    match: 'YouTube に',
    slug: 'youtube-channel',
    title: 'YouTube に「音響教育チャンネル」を開設しました',
    published: '2020-05-02',
    dateNote:
      '旧サイトに日付の記載なし。チャンネルの最初の動画の公開日（2020-05-02）を掲載日とした',
  },
  {
    match: 'Acoustical Science and Technology',
    slug: 'ast-37-4-special-issue',
    title: 'Acoustical Science and Technology 37巻4号は音響教育特集号です',
    published: '2016-07-01',
    dateNote: '発行月（2016年7月）のみ分かる。日は1日とした',
  },
  {
    match: '2016年5月より',
    slug: 'organization-change',
    title: '音響教育委員会に組織変更しました',
    published: '2016-05-01',
    dateNote: '月（2016年5月）のみ分かる。日は1日とした',
  },
  {
    match: '日本音響学会誌70巻5号',
    slug: 'jasj-70-5-special-issue',
    title: '日本音響学会誌70巻5号は音響教育特集号です',
    published: '2014-05-01',
    dateNote: '発行月（2014年5月）のみ分かる。日は1日とした',
  },
  {
    match: '日本音響学会誌66巻9号',
    slug: 'jasj-66-9-beginners-seminar',
    title: '日本音響学会誌66巻9号に小特集「誌上ビギナーズセミナー」が掲載されました',
    published: '2010-09-01',
    dateNote: '発行月（2010年9月）のみ分かる。日は1日とした',
  },
];

/** 研究発表会・国際会議・活動記録にするもの */
export const EVENT_PLANS: readonly EventPlan[] = [
  // top.html
  {
    match: '第１回音響工作・教材コンテスト',
    source: 'top.html',
    kind: 'asj',
    slug: 'kousaku-contest-1',
    title: '第1回音響工作・教材コンテスト',
    startDate: '2018-03-13',
    venue: '日本工業大学',
  },
  {
    match: '平成25年音響学会春季研究発表会',
    source: 'top.html',
    kind: 'asj',
    slug: 'special-session-2013-spring',
    title: 'スペシャルセッション「音響分野の発展を支える音響教育とその学術的価値」',
    startDate: '2013-03-01',
    dateNote: '「平成25年音響学会春季研究発表会」のみ分かる。開催日は 2013年3月1日の仮の値',
  },
  {
    match: '「音を聴いて学ぶ教育プログラム」',
    source: 'top.html',
    kind: 'activity',
    slug: 'workshop-listening-program',
    title: '研究会「音を聴いて学ぶ教育プログラム」',
    startDate: '2011-01-06',
    venue: '東京藝術大学 千住キャンパス',
  },
  // meeting/kenkyuhapyoukai.html（詳細ページはファイルなし。会場と内容は plan/kaisaikiroku.html から）
  {
    match: 'meeting/2002spring.html',
    source: 'meeting/kenkyuhapyoukai.html',
    kind: 'asj',
    slug: 'asj-2002-spring',
    title: '平成14年春季研究発表会',
    startDate: '2002-03-01',
    venue: '神奈川大学',
    dateNote: '「平成14年（2002年）春季」のみ分かる。開催日は 2002年3月1日の仮の値',
    body: '音響教育スペシャルセッション「明日の音響教育を考える」を開催しました。',
  },
  {
    match: 'meeting/2001spring.html',
    source: 'meeting/kenkyuhapyoukai.html',
    kind: 'asj',
    slug: 'asj-2001-spring',
    title: '平成13年春季研究発表会',
    startDate: '2001-03-01',
    venue: '筑波大学',
    dateNote: '「平成13年（2001年）春季」のみ分かる。開催日は 2001年3月1日の仮の値',
    body: '「音響教育ツールデモンストレーション」を開催しました。',
  },
  {
    match: 'meeting/1998fall.html',
    source: 'meeting/kenkyuhapyoukai.html',
    kind: 'asj',
    slug: 'asj-1998-autumn',
    title: '平成10年秋季研究発表会',
    startDate: '1998-09-01',
    venue: '山形大学',
    dateNote: '「平成10年（1998年）秋季」のみ分かる。開催日は 1998年9月1日の仮の値',
    body: '音響教育シンポジウム「音響教育ツールを考える」を開催し、学会誌55巻3号に報告しました。',
  },
  // meeting/kokusaikaigi.html
  {
    match: '第5回日米ジョイントミーティング',
    source: 'meeting/kokusaikaigi.html',
    kind: 'international',
    slug: 'joint-meeting-5',
    title: '第5回日米ジョイントミーティング',
    startDate: '2016-11-28',
    endDate: '2016-12-02',
    linksFromItem: true,
  },
  {
    match: '第21回 国際音響学会議',
    source: 'meeting/kokusaikaigi.html',
    kind: 'international',
    slug: 'ica2013',
    title: '第21回 国際音響学会議（ICA2013）',
    startDate: '2013-06-02',
    endDate: '2013-06-07',
    linksFromItem: true,
    body: 'Learning by Listening: Education in Acoustics Based on Listening セッションを開催しました。',
  },
  {
    match: '第4回日米ジョイントミーティング',
    source: 'meeting/kokusaikaigi.html',
    kind: 'international',
    slug: 'joint-meeting-4',
    title: '第4回日米ジョイントミーティング',
    startDate: '2006-11-28',
    endDate: '2006-12-02',
  },
  {
    match: 'FORUM ACUSTICUM SEVILLA 2002',
    source: 'meeting/kokusaikaigi.html',
    kind: 'international',
    slug: 'forum-acusticum-2002',
    title: 'FORUM ACUSTICUM SEVILLA 2002',
    startDate: '2002-01-01',
    venue: 'セビリア',
    dateNote:
      '「2002年」のみ分かる。開催日は 2002年1月1日の仮の値。会場は plan/kaisaikiroku.html から',
    body: '音響教育セッション（ASJ-EAA Joint Meeting）をオーガナイズしました。',
  },
];
