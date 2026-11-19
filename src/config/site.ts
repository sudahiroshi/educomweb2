/**
 * サイト全体の設定（spec 1.3、4.4、6.6）。
 * GitHub の owner / repo / branch はここからだけ読み、他のファイルに直書きしない。
 */
export const site = {
  /** サイト名（`<title>` の後半、OGP などに使う） */
  name: '日本音響学会 音響教育委員会',
  /** ロゴの上段・下段 */
  logo: {
    upper: '日本音響学会',
    lower: '音響教育委員会',
  },
  /** 説明文（description の既定値。ページごとの説明がないとき） */
  description:
    '日本音響学会 音響教育委員会のWebサイトです。音響教育に関する研究発表会・国際会議・委員会活動の情報をお知らせします。',
  // T-21 既定案: OGP 画像はサイト共通の1枚（波形マーク＋サイト名。tools/dev/make-og-image.mjs で生成）
  ogImage: { path: '/og-image.png', width: 1200, height: 630, alt: '日本音響学会 音響教育委員会' },
  /** 公開URL（末尾スラッシュなし）。astro.config.mjs の `site` と一致させる */
  url: 'https://asj-edcom.acoustics.jp',
  /** 表示・日付判定に使うタイムゾーン（spec 2.3） */
  timeZone: 'Asia/Tokyo',
  /** `<html lang>` */
  lang: 'ja',
  // T-28 既定案: 著作権表示の文言
  copyright: '© 一般社団法人 日本音響学会 音響教育委員会',
  /** 日本音響学会のサイト（フッターのリンク） */
  asjUrl: 'https://acoustics.jp/',
  /** 記事を置く GitHub リポジトリ（D-54：管理者の個人アカウント、公開） */
  github: {
    owner: 'sudahiroshi',
    repo: 'educomweb2',
    branch: 'main',
  },
} as const;

export type SiteConfig = typeof site;
