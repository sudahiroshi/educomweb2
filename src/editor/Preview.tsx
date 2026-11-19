/**
 * プレビュー（spec 6.4）。サイトと同じ表示部品（src/components/ui）・同じ CSS・同じ Markdown 変換で描く。
 * - 入力停止後 300ms で更新
 * - 記事詳細と、一覧・トップでの見え方（カード・一覧行）を表示
 * - ライト／ダーク・文字サイズをプレビューの中だけで切り替える
 * - プレビュー内のリンクは押しても移動しない（入力中の内容を失わないため）
 */
import { useEffect, useMemo, useState } from 'preact/hooks';
import { EventCard } from '../components/ui/EventCard';
import { EventListItem } from '../components/ui/EventListItem';
import { EventInfo, EventLinks, EventProgram } from '../components/ui/EventSections';
import { KindBadge } from '../components/ui/KindBadge';
import { MemberTable } from '../components/ui/MemberTable';
import { NewsListItem } from '../components/ui/NewsListItem';
import { PublishedDates } from '../components/ui/PublishedDates';
import { RelatedEvents } from '../components/ui/RelatedEvents';
import { formatFiscalYear } from '../lib/fiscal-year';
import { textLang } from '../lib/lang';
import { renderMarkdown } from '../lib/markdown/render';
import type { ContentIndex } from './content-index';
import { isEventKind } from './kinds';
import type { Draft } from './model';
import { previewDate, previewEvent, previewRelated, previewText } from './preview-data';

type Theme = 'light' | 'dark';
type Size = 'normal' | 'large' | 'xlarge';
const ZOOM: Record<Size, number> = { normal: 1, large: 1.25, xlarge: 1.5 };
const SIZE_LABELS: Record<Size, string> = { normal: 'ノーマル', large: '大', xlarge: '特大' };

function useDebounced<T>(value: T, delay: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

function Toggle<T extends string>({
  label,
  groupLabel,
  options,
  value,
  onChange,
}: {
  /** 画面に出す短い見出し */
  label: string;
  /** 読み上げ用のグループ名（ヘッダーの文字サイズ切替などと区別する） */
  groupLabel: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div class="ed-segment" role="group" aria-label={groupLabel}>
      <span class="ed-segment-label" aria-hidden="true">
        {label}
      </span>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Preview({
  draft: liveDraft,
  index,
  today,
  /** 画像のパス → 表示用の URL（選んだローカルファイル。plan 8.6） */
  imageUrls,
}: {
  draft: Draft;
  index: ContentIndex | null;
  today: string;
  imageUrls?: ReadonlyMap<string, string>;
}) {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  );
  const [size, setSize] = useState<Size>('normal');
  const draft = useDebounced(liveDraft, 300);

  const bodyHtml = useMemo(() => {
    let html: string;
    try {
      html = renderMarkdown(draft.body);
    } catch {
      return '<p>本文を表示できませんでした。</p>';
    }
    if (!imageUrls || imageUrls.size === 0) return html;
    // 選んだ画像は、付け替え後のパスで書かれていても表示できるようにする（spec 6.4）
    return html.replace(/(<img[^>]*\ssrc=")([^"]+)(")/g, (m, a: string, src: string, b: string) => {
      const url = imageUrls.get(src);
      return url ? a + url + b : m;
    });
  }, [draft.body, imageUrls]);

  const { kind } = draft;
  const prose = bodyHtml.trim() !== '' && (
    <div class="prose" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
  );

  let detail: preact.ComponentChildren;
  let list: preact.ComponentChildren = null;
  if (kind === 'news') {
    const n = draft.news;
    const title = previewText(n.title) ?? '（タイトル）';
    const published = previewDate(n.published);
    detail = (
      <>
        <div class="ed-preview-head">
          <h3 class="page-title" lang={textLang(title)}>
            {title}
          </h3>
          <PublishedDates published={published} updated={previewDate(n.updated)} />
        </div>
        {prose}
        <RelatedEvents events={previewRelated(draft, index)} headingLevel={4} idPrefix="pv-" />
      </>
    );
    list = published && (
      <ul class="ed-preview-list">
        <NewsListItem news={{ id: 'preview', data: { title, published } }} href="#" />
      </ul>
    );
  } else if (isEventKind(kind)) {
    const { startDate, data } = previewEvent(draft);
    const event = { id: 'preview', data };
    detail = (
      <>
        <div class="ed-preview-head">
          <KindBadge kind={data.kind} variant="text" />
          <h3 class="page-title" lang={textLang(data.title)}>
            {data.title}
          </h3>
        </div>
        {startDate ? (
          <EventInfo data={data} />
        ) : (
          <p class="ed-muted">開始日を入力すると、開催日が表示されます。</p>
        )}
        <EventLinks data={data} headingLevel={4} idPrefix="pv-" />
        <EventProgram data={data} headingLevel={4} idPrefix="pv-" />
        {prose}
        <PublishedDates published={data.published} updated={data.updated} />
      </>
    );
    list = startDate && (
      <>
        <EventCard event={event} today={today} headingLevel={4} href="#" />
        <ul class="ed-preview-list">
          <EventListItem event={event} href="#" />
        </ul>
      </>
    );
  } else if (kind === 'committee') {
    const c = draft.committee;
    const fy = Number(c.fiscalYear);
    const label = Number.isInteger(fy) && fy > 0 ? formatFiscalYear(fy) : '（年度）';
    const members = c.members
      .filter((m) => m.role.trim() || m.name.trim() || m.affiliation.trim())
      .map((m) => ({
        role: m.role.trim(),
        name: m.name.trim(),
        affiliation: m.affiliation.trim() || undefined,
      }));
    detail = (
      <>
        <div class="ed-preview-head">
          <h3 class="page-title">運営委員 {label}</h3>
        </div>
        <MemberTable members={members} caption={`${label} 運営委員名簿`} />
        {prose}
        <PublishedDates published={previewDate(c.published)} updated={previewDate(c.updated)} />
      </>
    );
  } else {
    const p = draft.page;
    const title = previewText(p.title) ?? '（タイトル）';
    detail = (
      <>
        <div class="ed-preview-head">
          <h3 class="page-title" lang={textLang(title)}>
            {title}
          </h3>
        </div>
        {prose}
        <PublishedDates updated={previewDate(p.updated)} />
        <p class="ed-muted">
          メニューでの表示：
          {p.showInMenu
            ? `「${previewText(p.menuLabel) ?? title}」（メニュー順 ${previewText(p.menuOrder) ?? '100'}）`
            : '出さない'}
        </p>
      </>
    );
  }

  return (
    <div class="ed-preview-inner">
      <div class="ed-preview-controls">
        <Toggle
          label="表示"
          groupLabel="プレビューの表示色"
          options={[
            { value: 'light', label: 'ライト' },
            { value: 'dark', label: 'ダーク' },
          ]}
          value={theme}
          onChange={setTheme}
        />
        <Toggle
          label="文字"
          groupLabel="プレビューの文字サイズ"
          options={(['normal', 'large', 'xlarge'] as const).map((s) => ({
            value: s,
            label: SIZE_LABELS[s],
          }))}
          value={size}
          onChange={setSize}
        />
      </div>
      {/* プレビュー内のリンクは移動しない（クリックを止めるだけで、キーボード操作は妨げない） */}
      {/* eslint-disable-next-line jsx-a11y-x/click-events-have-key-events, jsx-a11y-x/no-static-element-interactions */}
      <div
        class="ed-preview-canvas"
        data-theme={theme}
        style={{ zoom: ZOOM[size] }}
        onClick={(e) => {
          if (e.target instanceof Element && e.target.closest('a')) e.preventDefault();
        }}
      >
        <section class="ed-preview-section" aria-label="記事詳細の表示">
          <p class="ed-preview-caption">記事詳細</p>
          {detail}
        </section>
        {list && (
          <section class="ed-preview-section" aria-label="一覧・トップでの表示">
            <p class="ed-preview-caption">一覧・トップでの表示</p>
            {list}
          </section>
        )}
      </div>
    </div>
  );
}
