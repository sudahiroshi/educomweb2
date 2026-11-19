/**
 * 共通の型（spec 2.3）。
 * サイト（src/content.config.ts）と編集画面の両方から読み込むため、
 * `astro:content` には依存しない（ブラウザでも動く `astro/zod` のみを使う）。
 */
import { z } from 'astro/zod';

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** 実在する日付か（うるう年を含む）。Date を使わず計算で判定する */
export function isValidDateString(value: string): boolean {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1) return false;
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= (days[month - 1] ?? 0);
}

/**
 * Astro はフロントマターを `yaml` の timestamp タグ付きで読むため、
 * 引用符なしの `2026-11-19` は UTC 0時の Date になる。
 * UTC の年月日から元の文字列に戻す（時差によるずれは起きない）。
 */
function dateToYmd(value: unknown): unknown {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = String(value.getUTCFullYear()).padStart(4, '0');
    const m = String(value.getUTCMonth() + 1).padStart(2, '0');
    const d = String(value.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return value;
}

/** 日付：YYYY-MM-DD 形式の文字列（タイムゾーンを持たない日付） */
export const dateSchema = z.preprocess(
  dateToYmd,
  z
    .string({ error: '日付を YYYY-MM-DD 形式で入力してください' })
    .regex(DATE_RE, { error: '日付は YYYY-MM-DD 形式で入力してください' })
    .refine(isValidDateString, { error: '存在しない日付です' }),
);

/** 時刻：HH:MM（24時間制） */
export const timeSchema = z
  .string({ error: '時刻を HH:MM 形式で入力してください' })
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: '時刻は HH:MM（24時間制）で入力してください' });

/** 必須の文字列（空白のみは不可） */
export function requiredText(label: string, max?: number) {
  const base = z
    .string({ error: `${label}を入力してください` })
    .trim()
    .min(1, { error: `${label}を入力してください` });
  return max === undefined
    ? base
    : base.max(max, { error: `${label}は${max}文字以内で入力してください` });
}

/** 任意の文字列（空白のみは未入力と同じ扱いにはしない。空項目は編集画面が出力しない） */
export const optionalText = z.string().trim().optional();

/**
 * URL。
 * 現在は http:// と https:// の両方を許可する（ユーザー指示、2026-11-19）。
 * https:// のみに絞る場合は protocol を /^https$/ にする（既存記事の http リンクを先に直すこと）。
 */
export const urlSchema = z.url({
  protocol: /^https?$/,
  error: 'URL は http:// または https:// で始まる形式で入力してください',
});

/** 外部リンク（D-18） */
export const linkSchema = z.object({
  label: requiredText('リンクの表示名'),
  url: urlSchema,
});

/** スラッグ：半角英小文字・数字・ハイフン、3〜60文字（spec 2.2） */
export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const slugSchema = z
  .string()
  .min(3, { error: 'スラッグは3文字以上にしてください' })
  .max(60, { error: 'スラッグは60文字以内にしてください' })
  .regex(SLUG_RE, {
    error:
      'スラッグは半角英小文字・数字・ハイフンのみ（先頭・末尾・連続のハイフンは不可）にしてください',
  });

/**
 * 項目どうしを比べる検査（終了日≧開始日など）を、ほかの項目にエラーがあっても実行する設定。
 * 編集画面で、エラーを一度にまとめて表示するため（spec 6.5）。比べる前に値の形式を確かめること。
 */
export const ALWAYS_REFINE = { when: () => true };

/** 実在する YYYY-MM-DD の文字列か（項目どうしの比較の前に使う） */
export function isDateValue(v: unknown): v is string {
  return typeof v === 'string' && isValidDateString(v);
}

/** HH:MM の文字列か */
export function isTimeValue(v: unknown): v is string {
  return typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
}

export type Link = z.infer<typeof linkSchema>;
