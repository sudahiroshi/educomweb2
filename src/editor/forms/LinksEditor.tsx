/** 外部リンク：行の追加・削除・並べ替え（表示名＋URL）（spec 6.3、D-18） */
import { CellInput, moveItem, removeItem, RowButtons, updateItem } from '../fields';
import { emptyLink, type LinkRow } from '../model';

export function LinksEditor({
  value,
  onChange,
}: {
  value: LinkRow[];
  onChange: (v: LinkRow[]) => void;
}) {
  return (
    <fieldset class="ed-group">
      <legend>外部リンク</legend>
      {value.length > 0 && (
        <div class="ed-table-scroll" role="region" aria-label="外部リンクの表" tabIndex={0}>
          <table class="ed-table">
            <thead>
              <tr>
                <th scope="col">表示名</th>
                <th scope="col">URL</th>
                <th scope="col">
                  <span class="visually-hidden">操作</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {value.map((link, i) => (
                <tr key={link.key}>
                  <td>
                    <CellInput
                      path={`links.${i}.label`}
                      label={`リンク${i + 1}の表示名`}
                      value={link.label}
                      onInput={(v) => onChange(updateItem(value, i, { label: v }))}
                    />
                  </td>
                  <td>
                    <CellInput
                      path={`links.${i}.url`}
                      label={`リンク${i + 1}のURL`}
                      type="url"
                      value={link.url}
                      onInput={(v) => onChange(updateItem(value, i, { url: v }))}
                    />
                  </td>
                  <td>
                    <RowButtons
                      label={`リンク${i + 1}`}
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
      )}
      <button type="button" class="ed-button" onClick={() => onChange([...value, emptyLink()])}>
        リンクを追加
      </button>
    </fieldset>
  );
}
