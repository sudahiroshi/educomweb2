/**
 * ファイル名（＝記事ID）と本文の検査（spec 2.2・2.4・2.6・2.7）。
 * スキーマはフロントマターしか見られないため、ID・本文に関わる検査をここにまとめる。
 * src/content.config.ts（ビルド時）と編集画面の両方から使う。
 */
import { isValidDateString, SLUG_RE } from './common';
import { isReservedPageSlug } from './pages';
import type { CollectionName } from './index';

const DATED_ID_RE = /^(\d{4}-\d{2}-\d{2})-(.+)$/;

function checkSlug(slug: string): string | undefined {
  if (slug.length < 3 || slug.length > 60) return 'スラッグは3〜60文字にしてください';
  if (!SLUG_RE.test(slug)) {
    return 'スラッグは半角英小文字・数字・ハイフンのみ（先頭・末尾・連続のハイフンは不可）にしてください';
  }
  return undefined;
}

/** `{日付}-{スラッグ}` 形式の ID を分解する。形式が違えば undefined */
export function splitDatedId(id: string): { date: string; slug: string } | undefined {
  const m = DATED_ID_RE.exec(id);
  if (!m || m[1] === undefined || m[2] === undefined) return undefined;
  return { date: m[1], slug: m[2] };
}

/**
 * ID（拡張子を除くファイル名）の形式を検査し、問題があればメッセージの配列を返す。
 * news・events は先頭の日付の形式のみを見る（掲載日・開始日との一致までは求めない）。
 */
export function checkEntryId(collection: CollectionName, id: string): string[] {
  const errors: string[] = [];
  if (id.includes('/')) {
    return [`フォルダを作らず src/content/${collection}/ の直下に置いてください`];
  }
  switch (collection) {
    case 'news':
    case 'events': {
      const label = collection === 'news' ? '掲載日' : '開始日';
      const parts = splitDatedId(id);
      if (!parts) {
        errors.push(`ファイル名は「{${label}}-{スラッグ}.md」の形式にしてください`);
        break;
      }
      if (!isValidDateString(parts.date)) {
        errors.push(`ファイル名の先頭の${label}（${parts.date}）が存在しない日付です`);
      }
      const slugError = checkSlug(parts.slug);
      if (slugError) errors.push(slugError);
      break;
    }
    case 'committee':
      if (!/^\d{4}$/.test(id))
        errors.push('ファイル名は「{年度}.md」（例：2026.md）にしてください');
      break;
    case 'pages': {
      const slugError = checkSlug(id);
      if (slugError) errors.push(slugError);
      if (isReservedPageSlug(id)) {
        errors.push(`「${id}」はサイトが使うパスのため、その他のページのスラッグに使えません`);
      }
      break;
    }
  }
  return errors;
}

/** 運営委員：ファイル名の年度とフロントマターの fiscalYear の一致 */
export function checkCommitteeYear(id: string, fiscalYear: number): string | undefined {
  return String(fiscalYear) === id
    ? undefined
    : `年度（fiscalYear: ${fiscalYear}）とファイル名（${id}.md）が一致しません`;
}
