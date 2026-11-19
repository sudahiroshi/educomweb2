/**
 * ビルド日（日本時間の今日）（spec 3.3 の 1）。
 * 確認用に、環境変数 ASJ_EDCOM_TODAY（YYYY-MM-DD）でビルド日を差し替えられる（plan 6.3・6.4）。
 * 本番のビルドでは設定しない。
 */
import { isValidDateString } from '../schemas/common';
import { todayInTokyo } from './date';

export const BUILD_TODAY_ENV = 'ASJ_EDCOM_TODAY';

export function resolveBuildToday(override: string | undefined, now: Date = new Date()): string {
  if (override === undefined || override === '') return todayInTokyo(now);
  if (!isValidDateString(override)) {
    throw new Error(
      `${BUILD_TODAY_ENV} は YYYY-MM-DD 形式の実在する日付にしてください（${override}）`,
    );
  }
  return override;
}
