/**
 * 種類ラベル（spec 5.6、T-07）。
 * - variant="badge"：一覧行のラベル（短い名前、淡いアクセントの背景）
 * - variant="text"：開催予定カード・記事詳細の種類表示（正式名、アクセント色の文字）
 */
import { KIND_LABELS } from '../../lib/event-kind';
import type { EventKind } from '../../schemas';

export function KindBadge({
  kind,
  variant = 'badge',
}: {
  kind: EventKind;
  variant?: 'badge' | 'text';
}) {
  const label = variant === 'badge' ? KIND_LABELS[kind].short : KIND_LABELS[kind].full;
  return <span class={`kind kind--${variant}`}>{label}</span>;
}
