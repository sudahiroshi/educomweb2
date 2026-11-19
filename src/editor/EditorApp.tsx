/**
 * 編集画面の本体（spec 6.2）。
 * 種類の選択 → 入力フォーム／プレビュー → チェック結果・出力。
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { todayInTokyo } from '../lib/date';
import type { ContentIndex } from './content-index';
import { fieldId, IssuesContext, issuesMap, TextField } from './fields';
import { BodyEditor } from './forms/BodyEditor';
import { KindForm } from './forms/KindForm';
import { rawUrl } from './github';
import { importMarkdown } from './import';
import { collectionOf, EDITOR_KINDS, kindLabel, type EditorKind } from './kinds';
import { draftId, draftPath, emptyDraft, validateDraft, type Draft } from './model';
import { BODY_REQUIRED } from '../schemas';
import './editor.css';

export default function EditorApp() {
  const [draft, setDraft] = useState<Draft>(() => emptyDraft('news', todayInTokyo()));
  const [index, setIndex] = useState<ContentIndex | null>(null);
  const [message, setMessage] = useState('');
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // 既存記事一覧（spec 3.8）
  useEffect(() => {
    fetch('/editor/index.json')
      .then((r) => (r.ok ? (r.json() as Promise<ContentIndex>) : null))
      .then(setIndex)
      .catch(() => setIndex(null));
  }, []);

  const update = (fn: (d: Draft) => Draft) => setDraft((d) => fn(d));
  const issues = useMemo(() => validateDraft(draft, index ?? undefined), [draft, index]);
  const collection = collectionOf(draft.kind);
  const path = draftPath(draft);
  const id = draftId(draft);

  // 前年度（なければ直近）の名簿
  const previousCommittee = useMemo(() => {
    if (draft.kind !== 'committee' || !index) return undefined;
    const year = Number(draft.committee.fiscalYear) || Infinity;
    return index.entries
      .filter((e) => e.collection === 'committee' && (e.fiscalYear ?? 0) < year)
      .sort((a, b) => (b.fiscalYear ?? 0) - (a.fiscalYear ?? 0))[0];
  }, [draft.kind, draft.committee.fiscalYear, index]);

  async function loadPreviousMembers() {
    if (!previousCommittee) return;
    try {
      const res = await fetch(rawUrl(previousCommittee.path));
      if (!res.ok) throw new Error(String(res.status));
      const result = importMarkdown(await res.text(), previousCommittee.path, 'committee');
      if (!result.ok) throw new Error('読み込めませんでした');
      const members = result.draft.committee.members;
      update((d) => ({ ...d, committee: { ...d.committee, members } }));
      setMessage(`${previousCommittee.title}（${members.length}名）を読み込みました。`);
    } catch {
      setMessage('前年度の名簿を GitHub から読み込めませんでした。');
    }
  }

  function changeKind(kind: EditorKind) {
    update((d) => ({ ...d, kind }));
  }

  return (
    <IssuesContext.Provider value={issuesMap(issues)}>
      <div class="editor">
        <fieldset class="ed-kinds">
          <legend>種類</legend>
          <div class="ed-kind-options">
            {EDITOR_KINDS.map((k) => (
              <label key={k.value} class="ed-kind">
                <input
                  type="radio"
                  name="editor-kind"
                  value={k.value}
                  checked={draft.kind === k.value}
                  onChange={() => changeKind(k.value)}
                />
                {k.label}
              </label>
            ))}
          </div>
        </fieldset>

        <p class="ed-status" role="status">
          {message}
        </p>

        <div class="ed-columns">
          <section class="ed-form" aria-labelledby="ed-form-title">
            <h2 id="ed-form-title">入力（{kindLabel(draft.kind)}）</h2>
            {collection !== 'committee' && (
              <TextField
                path="slug"
                label="スラッグ（URL に使う英字の名前）"
                required
                value={draft.slug}
                onInput={(v) => update((d) => ({ ...d, slug: v }))}
                hint="半角英小文字・数字・ハイフン、3〜60文字（例：asj-spring-2027）"
              />
            )}
            <dl class="ed-file">
              <div>
                <dt>ID</dt>
                <dd>{id || '（未確定）'}</dd>
              </div>
              <div>
                <dt>保存先</dt>
                <dd>
                  <code>{path || '（未確定）'}</code>
                </dd>
              </div>
            </dl>
            <KindForm
              draft={draft}
              update={update}
              index={index}
              onLoadPreviousMembers={
                previousCommittee ? () => void loadPreviousMembers() : undefined
              }
              previousMembersLabel={
                previousCommittee ? `${previousCommittee.title}を読み込む` : undefined
              }
            />
            <BodyEditor
              value={draft.body}
              required={BODY_REQUIRED[collection]}
              textareaRef={bodyRef}
              onInput={(v) => update((d) => ({ ...d, body: v }))}
            />
          </section>
          <section class="ed-preview" aria-labelledby="ed-preview-title">
            <h2 id="ed-preview-title">プレビュー</h2>
            <p class="ed-muted">（plan 8.5 で追加）</p>
          </section>
        </div>

        <section class="ed-issues" aria-labelledby="ed-issues-title">
          <h2 id="ed-issues-title">チェック結果</h2>
          {issues.length === 0 ? (
            <p class="ed-ok">問題はありません。</p>
          ) : (
            <>
              <p class="ed-error">{issues.length} 件の問題があります。直すまで出力できません。</p>
              <ul>
                {issues.map((i, n) => (
                  <li key={`${i.path}-${n}`}>
                    <a href={`#${fieldId(i.path)}`}>{i.message}</a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </IssuesContext.Provider>
  );
}
