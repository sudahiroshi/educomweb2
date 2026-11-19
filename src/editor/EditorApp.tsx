/**
 * 編集画面の本体（spec 6.2）。
 * 種類の選択 → 入力フォーム／プレビュー → チェック結果・出力。
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { todayInTokyo } from '../lib/date';
import type { ContentIndex } from './content-index';
import { fieldId, IssuesContext, issuesMap, TextField } from './fields';
import { BodyEditor } from './forms/BodyEditor';
import { FormatToolbar } from './forms/FormatToolbar';
import { AttachmentsPanel, type Attachment } from './forms/AttachmentsPanel';
import { attachmentName, attachmentUrl, nextSeq } from './attachments';
import { applyFormat, blockInsert } from './format';
import { processFile } from './image-process';
import { KindForm } from './forms/KindForm';
import { rawUrl } from './github';
import { importMarkdown } from './import';
import { collectionOf, EDITOR_KINDS, kindLabel, type EditorKind } from './kinds';
import {
  draftFilesDir,
  draftId,
  draftPath,
  emptyDraft,
  newKey,
  validateDraft,
  type Draft,
} from './model';
import { Preview } from './Preview';
import { useNarrow, PaneTabs } from './PaneTabs';
import { BODY_REQUIRED } from '../schemas';
import './editor.css';

export default function EditorApp() {
  const [draft, setDraft] = useState<Draft>(() => emptyDraft('news', todayInTokyo()));
  const [index, setIndex] = useState<ContentIndex | null>(null);
  const [message, setMessage] = useState('');
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [today] = useState(() => todayInTokyo());
  // 幅の狭い画面では「入力」「プレビュー」をタブで切り替える（spec 6.2）
  const narrow = useNarrow();
  const [pane, setPane] = useState<'form' | 'preview'>('form');
  // 画像・添付ファイル（ブラウザ内だけに持つ。下書きの自動保存には含めない）
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [processing, setProcessing] = useState(false);

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
  const filesDir = draftFilesDir(draft);

  // 付け替え後のパス → 表示用の URL（プレビューで選んだ画像を表示する）
  const imageUrls = useMemo(() => {
    const map = new Map<string, string>();
    if (!id) return map;
    for (const a of attachments)
      map.set(attachmentUrl(collection, id, attachmentName(id, a.seq, a.ext)), a.url);
    return map;
  }, [attachments, collection, id]);

  async function addFiles(files: File[]) {
    if (files.length === 0) return;
    setProcessing(true);
    const added: Attachment[] = [];
    let seq = nextSeq(attachments.map((a) => a.seq));
    for (const file of files) {
      try {
        const r = await processFile(file);
        if (!r.ext) {
          // 受け付けない種類は一覧に入れず、理由だけ知らせる
          setMessage(`${file.name}：${r.error ?? '追加できません'}`);
          continue;
        }
        added.push({
          key: newKey(),
          seq: seq++,
          originalName: file.name,
          blob: r.blob,
          ext: r.ext,
          image: r.image,
          url: URL.createObjectURL(r.blob),
          note: r.note,
          error: r.error,
        });
      } catch {
        setMessage(`${file.name} を読み込めませんでした。`);
      }
    }
    setAttachments((list) => [...list, ...added]);
    setProcessing(false);
  }

  function removeAttachment(key: string) {
    setAttachments((list) => {
      const target = list.find((a) => a.key === key);
      if (target) URL.revokeObjectURL(target.url);
      return list.filter((a) => a.key !== key);
    });
  }

  /** 添付ファイルを本文のカーソル位置に挿入する（画像は ![説明](パス)、それ以外はリンク） */
  function insertAttachment(a: Attachment) {
    if (!id) return;
    const url = attachmentUrl(collection, id, attachmentName(id, a.seq, a.ext));
    const el = bodyRef.current;
    const start = el?.selectionStart ?? draft.body.length;
    const end = el?.selectionEnd ?? draft.body.length;
    const text = a.image
      ? applyFormat(draft.body, start, end, 'image', { imagePath: url }).text
      : blockInsert(
          draft.body,
          start,
          end,
          `[${a.originalName.replace(/[[\]]/g, '')}（${a.ext.toUpperCase()}）](${url})`,
        ).text;
    update((d) => ({ ...d, body: text }));
    setMessage(`本文に ${a.image ? '画像' : 'ファイルへのリンク'} を挿入しました。`);
  }

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

        {narrow && <PaneTabs value={pane} onChange={setPane} />}
        <div class="ed-columns">
          <section
            class="ed-form"
            aria-labelledby="ed-form-title"
            id="ed-pane-form"
            role={narrow ? 'tabpanel' : undefined}
            hidden={narrow && pane !== 'form'}
          >
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
              toolbar={
                <FormatToolbar
                  textareaRef={bodyRef}
                  value={draft.body}
                  onChange={(v) => update((d) => ({ ...d, body: v }))}
                />
              }
            />
            <AttachmentsPanel
              id={id}
              dir={filesDir}
              items={attachments}
              busy={processing}
              onAdd={(files) => void addFiles(files)}
              onRemove={removeAttachment}
              onInsert={insertAttachment}
            />
          </section>
          <section
            class="ed-preview"
            aria-labelledby="ed-preview-title"
            id="ed-pane-preview"
            role={narrow ? 'tabpanel' : undefined}
            hidden={narrow && pane !== 'preview'}
          >
            <h2 id="ed-preview-title">プレビュー</h2>
            <Preview draft={draft} index={index} today={today} imageUrls={imageUrls} />
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
