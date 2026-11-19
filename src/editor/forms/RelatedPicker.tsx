/** お知らせの関連記事：既存の events から検索して選ぶ（spec 6.3・3.8、D-20） */
import { useMemo, useState } from 'preact/hooks';
import type { ContentIndex } from '../content-index';
import { useIssue } from '../fields';

export function RelatedPicker({
  index,
  value,
  onChange,
}: {
  index: ContentIndex | null;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [query, setQuery] = useState('');
  const events = useMemo(
    () =>
      (index?.entries ?? [])
        .filter((e) => e.collection === 'events')
        .sort((a, b) => (a.id < b.id ? 1 : -1)),
    [index],
  );
  const titleOf = (id: string) => events.find((e) => e.id === id)?.title ?? id;
  const q = query.trim().toLowerCase();
  const candidates = events
    .filter((e) => !value.includes(e.id))
    .filter((e) => q === '' || e.title.toLowerCase().includes(q) || e.id.includes(q))
    .slice(0, 8);
  return (
    <fieldset class="ed-group">
      <legend>関連記事</legend>
      {value.length > 0 && (
        <ul class="ed-chips">
          {value.map((id, i) => (
            <RelatedChip
              key={id}
              index={i}
              label={titleOf(id)}
              onRemove={() => onChange(value.filter((v) => v !== id))}
            />
          ))}
        </ul>
      )}
      {index === null ? (
        <p class="ed-hint">既存記事の一覧を読み込めませんでした（/editor/index.json）。</p>
      ) : (
        <>
          <label htmlFor="related-search">研究発表会・活動記録などの記事を検索</label>
          <input
            id="related-search"
            type="search"
            value={query}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
          />
          <ul class="ed-candidates" aria-label="候補">
            {candidates.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  class="ed-link-button"
                  onClick={() => onChange([...value, e.id])}
                >
                  {e.title}
                  <span class="ed-muted">（{e.startDate ?? e.id.slice(0, 10)}）を追加</span>
                </button>
              </li>
            ))}
            {candidates.length === 0 && <li class="ed-muted">該当する記事がありません。</li>}
          </ul>
        </>
      )}
    </fieldset>
  );
}

function RelatedChip({
  index,
  label,
  onRemove,
}: {
  index: number;
  label: string;
  onRemove: () => void;
}) {
  const message = useIssue(`related.${index}`);
  return (
    <li class="ed-chip">
      <span>{label}</span>
      <button
        type="button"
        class="ed-icon-button"
        aria-label={`関連記事「${label}」を外す`}
        onClick={onRemove}
      >
        ×
      </button>
      {message && <span class="ed-error">{message}</span>}
    </li>
  );
}
