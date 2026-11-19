/**
 * セッション：セッション単位で追加・削除・並べ替え。各セッションに講演の表（講演番号・演題・発表者・他・所属）。
 * 表計算ソフトの表を貼り付けて講演を一括追加できる（spec 6.3、D-15〜D-17）。
 */
import {
  CellInput,
  fieldId,
  moveItem,
  removeItem,
  RowButtons,
  TextField,
  updateItem,
  useIssue,
} from '../fields';
import { emptySession, emptyTalk, type SessionRow, type TalkRow } from '../model';
import { talksFromTsv } from '../tsv';
import { TsvPaste } from './TsvPaste';

function TalksTable({
  sessionIndex,
  talks,
  onChange,
}: {
  sessionIndex: number;
  talks: TalkRow[];
  onChange: (v: TalkRow[]) => void;
}) {
  const base = `sessions.${sessionIndex}.talks`;
  const sessionNo = sessionIndex + 1;
  return (
    <div class="ed-talks">
      {talks.length > 0 && (
        <div
          class="ed-table-scroll"
          role="region"
          aria-label={`セッション${sessionNo}の講演の表`}
          tabIndex={0}
        >
          <table class="ed-table">
            <caption class="visually-hidden">セッション{sessionNo}の講演</caption>
            <thead>
              <tr>
                <th scope="col">講演番号</th>
                <th scope="col">演題（必須）</th>
                <th scope="col">発表者（必須）</th>
                <th scope="col">他</th>
                <th scope="col">所属</th>
                <th scope="col">
                  <span class="visually-hidden">操作</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {talks.map((t, i) => {
                const row = `セッション${sessionNo}の講演${i + 1}`;
                return (
                  <tr key={t.key}>
                    <td>
                      <CellInput
                        path={`${base}.${i}.number`}
                        label={`${row}の講演番号`}
                        size={8}
                        value={t.number}
                        onInput={(v) => onChange(updateItem(talks, i, { number: v }))}
                      />
                    </td>
                    <td>
                      <CellInput
                        path={`${base}.${i}.title`}
                        label={`${row}の演題`}
                        value={t.title}
                        onInput={(v) => onChange(updateItem(talks, i, { title: v }))}
                      />
                    </td>
                    <td>
                      <CellInput
                        path={`${base}.${i}.presenter`}
                        label={`${row}の発表者`}
                        size={12}
                        value={t.presenter}
                        onInput={(v) => onChange(updateItem(talks, i, { presenter: v }))}
                      />
                    </td>
                    <td class="ed-center">
                      <input
                        type="checkbox"
                        aria-label={`${row}：共著者あり（他）`}
                        checked={t.hasCoauthors}
                        onChange={(e) =>
                          onChange(
                            updateItem(talks, i, {
                              hasCoauthors: (e.target as HTMLInputElement).checked,
                            }),
                          )
                        }
                      />
                    </td>
                    <td>
                      <CellInput
                        path={`${base}.${i}.affiliation`}
                        label={`${row}の所属`}
                        size={12}
                        value={t.affiliation}
                        onInput={(v) => onChange(updateItem(talks, i, { affiliation: v }))}
                      />
                    </td>
                    <td>
                      <RowButtons
                        label={row}
                        index={i}
                        count={talks.length}
                        onMove={(f, to) => onChange(moveItem(talks, f, to))}
                        onRemove={(idx) => onChange(removeItem(talks, idx))}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div class="ed-actions">
        <button type="button" class="ed-button" onClick={() => onChange([...talks, emptyTalk()])}>
          講演を追加
        </button>
      </div>
      <TsvPaste
        id={`${fieldId(base)}-paste`}
        label="表計算ソフトから講演を貼り付ける"
        columns="講演番号、演題、発表者、所属、他の有無"
        onAdd={(text) => {
          const rows = talksFromTsv(text);
          if (rows.length > 0) onChange([...talks, ...rows]);
          return rows.length;
        }}
      />
    </div>
  );
}

export function SessionsEditor({
  value,
  onChange,
}: {
  value: SessionRow[];
  onChange: (v: SessionRow[]) => void;
}) {
  const set = (i: number, patch: Partial<SessionRow>) => onChange(updateItem(value, i, patch));
  const sessionsError = useIssue('sessions');
  return (
    <fieldset class="ed-group">
      <legend>セッション・講演一覧</legend>
      {sessionsError && <p class="ed-error">{sessionsError}</p>}
      {value.map((s, i) => {
        const p = `sessions.${i}`;
        return (
          <section key={s.key} class="ed-session" aria-label={`セッション${i + 1}`}>
            <div class="ed-session-head">
              <h3>セッション{i + 1}</h3>
              <RowButtons
                label={`セッション${i + 1}`}
                index={i}
                count={value.length}
                onMove={(f, t) => onChange(moveItem(value, f, t))}
                onRemove={(idx) => onChange(removeItem(value, idx))}
              />
            </div>
            <div class="ed-grid">
              <TextField
                path={`${p}.name`}
                label="セッション名"
                required
                value={s.name}
                onInput={(v) => set(i, { name: v })}
              />
              <TextField
                path={`${p}.date`}
                label="日付"
                type="date"
                value={s.date}
                onInput={(v) => set(i, { date: v })}
                hint="開催期間内。未定なら空欄"
              />
              <TextField
                path={`${p}.startTime`}
                label="開始時刻"
                type="time"
                value={s.startTime}
                onInput={(v) => set(i, { startTime: v })}
              />
              <TextField
                path={`${p}.endTime`}
                label="終了時刻"
                type="time"
                value={s.endTime}
                onInput={(v) => set(i, { endTime: v })}
              />
              <TextField
                path={`${p}.room`}
                label="会場（部屋）"
                value={s.room}
                onInput={(v) => set(i, { room: v })}
              />
              <TextField
                path={`${p}.chair`}
                label="座長"
                value={s.chair}
                onInput={(v) => set(i, { chair: v })}
              />
              <TextField
                path={`${p}.viceChair`}
                label="副座長"
                value={s.viceChair}
                onInput={(v) => set(i, { viceChair: v })}
              />
            </div>
            <TalksTable sessionIndex={i} talks={s.talks} onChange={(talks) => set(i, { talks })} />
          </section>
        );
      })}
      <button type="button" class="ed-button" onClick={() => onChange([...value, emptySession()])}>
        セッションを追加
      </button>
    </fieldset>
  );
}
