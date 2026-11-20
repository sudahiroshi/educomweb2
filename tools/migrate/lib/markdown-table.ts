/** 棚卸し表などの Markdown の表を作る */

function cell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ') || ' ';
}

export function markdownTable(
  head: readonly string[],
  rows: readonly (readonly string[])[],
): string {
  const line = (cells: readonly string[]) => `| ${cells.map(cell).join(' | ')} |`;
  return [line(head), line(head.map(() => '---')), ...rows.map(line)].join('\n');
}
