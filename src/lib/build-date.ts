/**
 * ビルド日（日本時間の今日）（spec 3.3 の 1）。
 * 確認用に、環境変数 ASJ_EDCOM_TODAY（YYYY-MM-DD）でビルド日を差し替えられる（plan 6.3・6.4）。
 * 本番のビルドでは設定しない。
 */
import { isValidDateString } from '../schemas/common';
import { todayInTokyo } from './date';

export const BUILD_TODAY_ENV = 'ASJ_EDCOM_TODAY';

/** これより前の日付になったら、ビルド環境の時計がおかしいとみなして止める（新サイトの公開は 2026 年） */
const EARLIEST_BUILD_DAY = '2026-01-01';

export function resolveBuildToday(override: string | undefined, now: Date = new Date()): string {
  if (override === undefined || override === '') {
    const today = todayInTokyo(now);
    // 全記事が「開催予定」に入るような誤った公開を防ぐ
    if (today < EARLIEST_BUILD_DAY) {
      throw new Error(`ビルド環境の日付が正しくありません（${today}）`);
    }
    return today;
  }
  if (!isValidDateString(override)) {
    throw new Error(
      `${BUILD_TODAY_ENV} は YYYY-MM-DD 形式の実在する日付にしてください（${override}）`,
    );
  }
  return override;
}
