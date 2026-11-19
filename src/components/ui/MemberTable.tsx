/** 運営委員名簿の表（spec 5.6・8章、D-19）：役職・氏名・所属。<caption> と <th scope> を付ける */
import type { Member } from '../../schemas';

export function MemberTable({ members, caption }: { members: readonly Member[]; caption: string }) {
  return (
    <div class="member-table" role="region" aria-labelledby="member-caption" tabIndex={0}>
      <table>
        <caption id="member-caption">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">役職</th>
            <th scope="col">氏名</th>
            <th scope="col">所属</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m, i) => (
            <tr key={i}>
              <td class="member-table__nowrap">{m.role}</td>
              <td class="member-table__nowrap">{m.name}</td>
              <td>{m.affiliation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
