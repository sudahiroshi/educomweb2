/** 幅の狭い画面の「入力」「プレビュー」切り替えタブ（spec 6.2）。WAI-ARIA のタブの作法に従う */
import { useEffect, useState } from 'preact/hooks';

const NARROW = '(max-width: 63.98rem)';

export function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(() => window.matchMedia(NARROW).matches);
  useEffect(() => {
    const mq = window.matchMedia(NARROW);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return narrow;
}

type Pane = 'form' | 'preview';
const TABS: { value: Pane; label: string }[] = [
  { value: 'form', label: '入力' },
  { value: 'preview', label: 'プレビュー' },
];

export function PaneTabs({ value, onChange }: { value: Pane; onChange: (v: Pane) => void }) {
  function onKeyDown(e: KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End')
      return;
    e.preventDefault();
    const i = TABS.findIndex((t) => t.value === value);
    const next =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? TABS.length - 1
          : (i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length;
    const tab = TABS[next];
    if (!tab) return;
    onChange(tab.value);
    document.getElementById(`ed-tab-${tab.value}`)?.focus();
  }
  return (
    <div class="ed-tabs" role="tablist" aria-label="表示の切り替え">
      {TABS.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          id={`ed-tab-${t.value}`}
          aria-selected={value === t.value}
          aria-controls={`ed-pane-${t.value}`}
          tabIndex={value === t.value ? 0 : -1}
          onClick={() => onChange(t.value)}
          onKeyDown={onKeyDown}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
