/** 見出しレベルを数値で指定する（サイトは h1 から、編集画面のプレビューは h3 から始める） */
import type { ComponentChildren, HeadingHTMLAttributes } from 'preact';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export function nextLevel(level: HeadingLevel, by = 1): HeadingLevel {
  return Math.min(6, level + by) as HeadingLevel;
}

export function Heading({
  level,
  children,
  ...rest
}: {
  level: HeadingLevel;
  children: ComponentChildren;
} & HeadingHTMLAttributes<HTMLHeadingElement>) {
  const Tag = `h${level}` as 'h1';
  return <Tag {...rest}>{children}</Tag>;
}
