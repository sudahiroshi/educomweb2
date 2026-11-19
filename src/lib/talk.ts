/** 講演の表示（spec 3.7、D-17） */
import type { Talk } from '../schemas';

/** 発表者：共著者ありなら「氏名 他」 */
export function formatPresenter(talk: Pick<Talk, 'presenter' | 'hasCoauthors'>): string {
  return talk.hasCoauthors ? `${talk.presenter} 他` : talk.presenter;
}
