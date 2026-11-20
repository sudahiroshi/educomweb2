/** 要確認リスト docs/migration/review.md の本文を作る（plan 9.9） */
import type { ReviewItem } from './review.ts';

const GROUPS: readonly { prefix: string; title: string }[] = [
  { prefix: 'src/content/news/', title: 'お知らせ' },
  { prefix: 'src/content/events/', title: '活動記録・研究発表会・国際会議' },
  { prefix: 'src/content/committee/', title: '運営委員' },
  { prefix: 'src/content/pages/', title: 'その他のページ' },
];

/** 既存の review.md から、確認済み（[x]）の「ファイル＋指摘」を読む */
export function checkedItems(previous: string): Set<string> {
  const checked = new Set<string>();
  let target = '';
  for (const line of previous.split('\n')) {
    const head = /^### `(.+)`$/.exec(line);
    if (head?.[1]) target = head[1];
    const item = /^- \[x\] (.+)$/i.exec(line);
    if (item?.[1]) checked.add(`${target}\n${item[1]}`);
  }
  return checked;
}

/**
 * @param previous 前回の review.md（あれば、確認済みのチェックを引き継ぐ）
 */
export function reviewMarkdown(items: readonly ReviewItem[], previous = ''): string {
  const checked = checkedItems(previous);
  const byTarget = new Map<string, string[]>();
  for (const item of items) {
    const list = byTarget.get(item.target) ?? [];
    if (!list.includes(item.message)) list.push(item.message);
    byTarget.set(item.target, list);
  }
  const targets = [...byTarget.keys()].sort();
  const sections: string[] = [];
  const used = new Set<string>();
  for (const group of [...GROUPS, { prefix: '', title: 'そのほか' }]) {
    const inGroup = targets.filter((t) => !used.has(t) && t.startsWith(group.prefix));
    if (inGroup.length === 0) continue;
    inGroup.forEach((t) => used.add(t));
    const blocks = inGroup.map((t) => {
      const lines = (byTarget.get(t) ?? []).map(
        (m) => `- [${checked.has(`${t}\n${m}`) ? 'x' : ' '}] ${m}`,
      );
      return `### \`${t}\`\n\n${lines.join('\n')}`;
    });
    sections.push(`## ${group.title}\n\n${blocks.join('\n\n')}`);
  }
  const count = [...byTarget.values()].reduce((n, l) => n + l.length, 0);

  return `# 移行の要確認リスト

旧サイトから変換した記事のうち、人が確かめる必要がある点の一覧です（plan 9.9）。
\`node tools/migrate/convert.ts\` が変換のたびに作り直します（${count} 件、${targets.length} ファイル）。

## 確認のしかた

- 確かめたら \`[ ]\` を \`[x]\` にしてください（plan 9.10）。変換し直しても、同じ指摘のチェックは引き継ぎます。
- 直すときは \`src/content/\` の .md を直接編集するか、編集画面で読み込んで修正します。
- **直した後に変換スクリプトを再実行すると、直した内容が上書きされます。** 再実行が必要になったときは、先に \`tools/migrate/mapping.ts\` に修正を反映してください。
- 日付の「仮の値」は、旧サイトから日まで分からなかったものです。正しい日付が分かれば、ファイル名（\`{日付}-{スラッグ}.md\`）とフロントマターの両方を直します。
- リンクの扱いは T-31 の既定案（切れたリンクは外して文字だけ残す）によります。全件の調査結果は \`docs/migration/links.md\` にあります。

${sections.join('\n\n')}
`;
}
