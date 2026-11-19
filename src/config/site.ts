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
  /** 公開URL（末尾スラッシュなし）。astro.config.mjs の `site` と一致させる */
  url: 'https://asj-edcom.acoustics.jp',
  /** 表示・日付判定に使うタイムゾーン（spec 2.3） */
  timeZone: 'Asia/Tokyo',
  /** `<html lang>` */
  lang: 'ja',
  /** 記事を置く GitHub リポジトリ（D-54：管理者の個人アカウント、公開） */
  github: {
    owner: 'sudahiroshi',
    repo: 'educomweb2',
    branch: 'main',
  },
} as const;

export type SiteConfig = typeof site;
