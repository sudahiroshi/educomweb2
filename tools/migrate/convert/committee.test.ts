import { describe, expect, it } from 'vitest';
import type { Element } from 'hast';
import { findAll, parseHtml } from '../lib/html.ts';
import { Review } from '../lib/review.ts';
import { bodyNote, convertCommittee, periodsOf } from './committee.ts';

const table = (role: string, name: string, aff: string) =>
  `<div><table><thead><tr><th>役職</th></tr></thead><tbody><tr><td>${role}</td><td>${name}</td><td>${aff}</td><td><img alt="e-mail" src="a.png"></td></tr></tbody></table></div>`;

const HTML = `<body>
${table('委員長', '河原 一彦', '九州大学<br>大学院芸術工学研究院\n')}
<p>平成30年6月より令和2年3月まで
${table('委員長', '西村\u3000明', '東京情報大学')}
<p>平成27年5月より平成30年5月まで(平成28年5月より音響教育委員会へ組織変更)
${table('委員長', '西村 明', '東京情報大学')}
</body>`;

const bodyOf = (html: string): Element => {
  const body = findAll(parseHtml(html), 'body')[0];
  if (!body) throw new Error('body がない');
  return body;
};

describe('periodsOf', () => {
  it('表の直前の段落を期間とし、所属の改行は空白にする。メールアドレスは読まない', () => {
    const periods = periodsOf(bodyOf(HTML));
    expect(periods.map((p) => p.label)).toEqual([
      undefined,
      '平成30年6月より令和2年3月まで',
      '平成27年5月より平成30年5月まで(平成28年5月より音響教育委員会へ組織変更)',
    ]);
    expect(periods[0]?.members).toEqual([
      { role: '委員長', name: '河原 一彦', affiliation: '九州大学 大学院芸術工学研究院' },
    ]);
    expect(periods[1]?.members[0]?.name).toBe('西村 明');
  });
});

describe('bodyNote', () => {
  it('期間と補足を1文にする', () => {
    expect(bodyNote('平成30年6月より令和2年3月まで')).toBe(
      '平成30年6月より令和2年3月までの名簿です。',
    );
    expect(bodyNote('平成23年5月より平成27年4月まで(音響教育調査研究委員会)')).toBe(
      '平成23年5月より平成27年4月までの名簿です（音響教育調査研究委員会）。',
    );
  });
});

describe('convertCommittee', () => {
  it('期の各年度に名簿を書き、期の終わりの年度に次の期が始まるときは次の期にする', () => {
    const review = new Review();
    const files = convertCommittee(
      { review, read: () => parseHtml(HTML), rewriteLinks: (el) => el },
      2021,
    );
    const years = files.map((f) => f.path.replace(/^.*\/(\d+)\.md$/, '$1'));
    // 2015〜2017（2018 は次の期）、2018〜2019、先頭の名簿は 2020年4月〜今年度（2021）
    expect(years).toEqual(['2020', '2021', '2018', '2019', '2015', '2016', '2017']);
    expect(files.find((f) => f.path.endsWith('2018.md'))?.content).toContain(
      'published: 2018-06-01',
    );
    expect(files.find((f) => f.path.endsWith('2019.md'))?.content).toContain(
      'published: 2019-04-01',
    );
    expect(review.items.some((i) => i.target.endsWith('2020.md'))).toBe(true);
  });
});
