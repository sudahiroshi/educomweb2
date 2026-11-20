import { describe, expect, it } from 'vitest';
import { parseOfficers } from './pages.ts';

describe('parseOfficers', () => {
  it('役職と氏名の組にする（氏名の中の空白は1つにそろえる）', () => {
    expect(parseOfficers('　　委員長　子安　勝 　　副委員長　東山三樹夫')).toEqual([
      { role: '委員長', name: '子安 勝' },
      { role: '副委員長', name: '東山三樹夫' },
    ]);
    expect(parseOfficers('幹事　　吉久光一 　　幹事　　　佐藤史明')).toEqual([
      { role: '幹事', name: '吉久光一' },
      { role: '幹事', name: '佐藤史明' },
    ]);
  });
});
