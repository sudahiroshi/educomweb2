/**
 * 運営委員の名簿：役職・氏名・所属の表（spec 6.3、D-19）。
 * タブ区切りの貼り付けと、前年度の名簿の読み込みに対応。
 */
import {
  CellInput,
  fieldId,
  moveItem,
  removeItem,
  RowButtons,
  updateItem,
  useIssue,
} from '../fields';
import { emptyMember, type MemberRow } from '../model';
import { membersFromTsv } from '../tsv';
import { TsvPaste } from './TsvPaste';

export function MembersEditor({
  value,
  onChange,
  onLoadPrevious,
  previousLabel,
}: {
  value: MemberRow[];
  onChange: (v: MemberRow[]) => void;
  /** 前年度の名簿を読み込む（読み込める名簿がなければ undefined） */
  onLoadPrevious?: () => void;
  previousLabel?: string;
}) {
  const membersError = useIssue('members');
  return (
    <fieldset class="ed-group">
      <legend>名簿（必須）</legend>
      {membersError && (
        <p class="ed-error" id={`${fieldId('members')}-error`}>
          {membersError}
        </p>
      )}
      <div class="ed-table-scroll" role="region" aria-label="名簿の表" tabIndex={0}>
        <table class="ed-table">
          <caption class="visually-hidden">運営委員の名簿</caption>
          <thead>
            <tr>
              <th scope="col">役職（必須）</th>
              <th scope="col">氏名（必須）</th>
              <th scope="col">所属</th>
              <th scope="col">
                <span class="visually-hidden">操作</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {value.map((m, i) => (
              <tr key={m.key}>
                <td>
                  <CellInput
                    path={`members.${i}.role`}
                    label={`${i + 1}行目の役職`}
                    size={10}
                    value={m.role}
                    onInput={(v) => onChange(updateItem(value, i, { role: v }))}
                  />
                </td>
                <td>
                  <CellInput
                    path={`members.${i}.name`}
                    label={`${i + 1}行目の氏名`}
                    size={12}
                    value={m.name}
                    onInput={(v) => onChange(updateItem(value, i, { name: v }))}
                  />
                </td>
                <td>
                  <CellInput
                    path={`members.${i}.affiliation`}
                    label={`${i + 1}行目の所属`}
                    value={m.affiliation}
                    onInput={(v) => onChange(updateItem(value, i, { affiliation: v }))}
                  />
                </td>
                <td>
                  <RowButtons
                    label={`${i + 1}行目`}
                    index={i}
                    count={value.length}
                    onMove={(f, t) => onChange(moveItem(value, f, t))}
                    onRemove={(idx) => onChange(removeItem(value, idx))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div class="ed-actions">
        <button type="button" class="ed-button" onClick={() => onChange([...value, emptyMember()])}>
          行を追加
        </button>
        {onLoadPrevious && (
          <button type="button" class="ed-button" onClick={onLoadPrevious}>
            {previousLabel ?? '前年度の名簿を読み込む'}
          </button>
        )}
      </div>
      <TsvPaste
        id="members-paste"
        label="表計算ソフトから名簿を貼り付ける"
        columns="役職、氏名、所属"
        onAdd={(text) => {
          const rows = membersFromTsv(text);
          // 空の1行目だけがある状態なら置き換える
          const base =
            value.length === 1 && !value[0]?.role && !value[0]?.name && !value[0]?.affiliation
              ? []
              : value;
          if (rows.length > 0) onChange([...base, ...rows]);
          return rows.length;
        }}
      />
    </fieldset>
  );
}
