# 移行の要確認リスト

旧サイトから変換した記事のうち、人が確かめる必要がある点の一覧です（plan 9.9）。
`node tools/migrate/convert.ts` が変換のたびに作り直します（52 件、21 ファイル）。

## 確認のしかた

- 確かめたら `[ ]` を `[x]` にしてください（plan 9.10）。変換し直しても、同じ指摘のチェックは引き継ぎます。
- 直すときは `src/content/` の .md を直接編集するか、編集画面で読み込んで修正します。
- **直した後に変換スクリプトを再実行すると、直した内容が上書きされます。** 再実行が必要になったときは、先に `tools/migrate/mapping.ts` に修正を反映してください。
- 日付の「仮の値」は、旧サイトから日まで分からなかったものです。正しい日付が分かれば、ファイル名（`{日付}-{スラッグ}.md`）とフロントマターの両方を直します。
- リンクの扱いは T-31 の既定案（切れたリンクは外して文字だけ残す）によります。全件の調査結果は `docs/migration/links.md` にあります。

## お知らせ

### `src/content/news/2010-09-01-jasj-66-9-beginners-seminar.md`

- [x] 掲載日：発行月（2010年9月）のみ分かる。日は1日とした

### `src/content/news/2014-05-01-jasj-70-5-special-issue.md`

- [x] 掲載日：発行月（2014年5月）のみ分かる。日は1日とした
- [x] 「音響学会サイト和文誌目次」：ページが消えている（サイトのトップへ転送）ためリンクを外した：http://www.asj.gr.jp/journal/04_contents/2014_05.html

### `src/content/news/2016-05-01-organization-change.md`

- [x] 掲載日：月（2016年5月）のみ分かる。日は1日とした

### `src/content/news/2016-07-01-ast-37-4-special-issue.md`

- [x] 掲載日：発行月（2016年7月）のみ分かる。日は1日とした

### `src/content/news/2020-05-02-youtube-channel.md`

- [x] 掲載日：旧サイトに日付の記載なし。チャンネルの最初の動画の公開日（2020-05-02）を掲載日とした

## 活動記録・研究発表会・国際会議

### `src/content/events/1998-09-01-asj-1998-autumn.md`

- [x] 開催日：「平成10年（1998年）秋季」のみ分かる。開催日は 1998年9月1日の仮の値

### `src/content/events/2001-03-01-asj-2001-spring.md`

- [x] 開催日：「平成13年（2001年）春季」のみ分かる。開催日は 2001年3月1日の仮の値

### `src/content/events/2002-01-01-forum-acusticum-2002.md`

- [x] 開催日：「2002年」のみ分かる。開催日は 2002年1月1日の仮の値。会場は plan/kaisaikiroku.html から

### `src/content/events/2002-03-01-asj-2002-spring.md`

- [x] 開催日：「平成14年（2002年）春季」のみ分かる。開催日は 2002年3月1日の仮の値

### `src/content/events/2011-01-06-workshop-listening-program.md`

- [x] 資料販売の案内（終了済み）と連絡先のメールアドレスは載せていない。「簡易プログラム」「概要つきプログラム」はリンク先がなく文字だけ残っている
- [x] 「簡易プログラム」：リンク先のページ（meeting/prog20110106.html）は移行しない、またはファイルがないためリンクを外した
- [x] 「概要つきプログラム」：リンク先のページ（meeting/abst20110106.html）は移行しない、またはファイルがないためリンクを外した

### `src/content/events/2013-03-01-special-session-2013-spring.md`

- [x] 開催日：「平成25年音響学会春季研究発表会」のみ分かる。開催日は 2013年3月1日の仮の値

### `src/content/events/2016-11-28-joint-meeting-5.md`

- [ ] 自動の確認を拒否された（403）。ブラウザで開けるか要確認：http://acousticalsociety.org/content/5th-joint-meeting

## 運営委員

### `src/content/committee/`

- [x] 掲載日は、期の最初の年度は期の始まりの月の1日、それ以外の年度は4月1日とした（旧サイトに記載なし）

### `src/content/committee/2020.md`

- [x] 旧サイトの先頭の名簿には期間の記載がない。1つ前の期の翌月（2020年4月）から 2026年度まで同じ名簿とした

## その他のページ

### `src/content/pages/about.md`

- [x] 旧サイトの「設立趣旨」（音響教育調査研究委員会の設置提案の文）だけを載せた。現在の委員会の紹介文は要追加

### `src/content/pages/demo.md`

- [x] 3件とも紹介ページ（arai/・iwamiya/・kawai/）がなく、題名と紹介者だけが残っている。現在の公開先があればリンクを追加
- [x] 「声道模型−音声生成の基礎を学べる音響教育教材−」：リンク先のページ（demo/arai/asj_demo_arai.htm）は移行しない、またはファイルがないためリンクを外した
- [x] 「聴能形成−音響設計技術者に求められる「音の感性」を養成する教育プログラム−」：リンク先のページ（demo/iwamiya/tech_listening.htm）は移行しない、またはファイルがないためリンクを外した
- [x] 「建築と環境のサウンドライブラリ SMILE2004 (Sound Material in Living Environment)」：リンク先のページ（demo/kawai/smile2004.htm）は移行しない、またはファイルがないためリンクを外した

### `src/content/pages/history.md`

- [x] 第5期の「最近の活動を御覧ください。」は、リンク先（最近の活動）がないため載せていない
- [x] 第3期は期間のみ（役員・活動の記載なし）。第7期以降の記載はない

### `src/content/pages/links.md`

- [x] 「声道模型」のリンク先のサーバー（www.splab.ee.sophia.ac.jp）がない。現在の URL があれば追加
- [x] 「声道模型」：リンク切れ（getaddrinfo ENOTFOUND www.splab.ee.sophia.ac.jp）のためリンクを外した：http://www.splab.ee.sophia.ac.jp/Vocal_Tract_Model/index-j.htm

### `src/content/pages/museum-article.md`

- [x] 記事の PDF が学会サイトから消えており、17件ともリンクを外した。前文の「記事へのリンクを公開しています」と食い違うので、文を直すか、ページごと破棄するかを判断
- [x] 「日本音響学会」：転送先に書き換えた：http://www.asj.gr.jp/ → https://acoustics.jp/
- [x] 「NHK 放送博物館」：ページが消えている（サイトのトップへ転送）ためリンクを外した：http://www.asj.gr.jp/journal/pdf/museum17.pdf
- [x] 「クラドニパターン」：ページが消えている（サイトのトップへ転送）ためリンクを外した：http://www.asj.gr.jp/journal/pdf/museum16.pdf
- [x] 「レイリー盤」：ページが消えている（サイトのトップへ転送）ためリンクを外した：http://www.asj.gr.jp/journal/pdf/museum15.pdf
- [x] 「蘇言機 −日本で最初に音を記録・再生した器械−」：ページが消えている（サイトのトップへ転送）ためリンクを外した：http://www.asj.gr.jp/journal/pdf/museum14.pdf
- [x] 「神戸市立青少年科学館」：ページが消えている（サイトのトップへ転送）ためリンクを外した：http://www.asj.gr.jp/journal/pdf/museum13.pdf
- [x] 「金沢工業大学ポピュラー・ミュージック・コレクション」：ページが消えている（サイトのトップへ転送）ためリンクを外した：http://www.asj.gr.jp/journal/pdf/museum12.pdf
- [x] 「浜松科学館」：ページが消えている（サイトのトップへ転送）ためリンクを外した：http://www.asj.gr.jp/journal/pdf/museum11.pdf
- [x] 「ストックホルムの音楽博物館」：ページが消えている（サイトのトップへ転送）ためリンクを外した：http://www.asj.gr.jp/journal/pdf/museum10.pdf
- [x] 「伝声管」：ページが消えている（サイトのトップへ転送）ためリンクを外した：http://www.asj.gr.jp/journal/pdf/museum09.pdf
- [x] 「Ringve 博物館」：ページが消えている（サイトのトップへ転送）ためリンクを外した：http://www.asj.gr.jp/journal/pdf/museum08.pdf
- [x] 「Ringve Museum」：ページが消えている（サイトのトップへ転送）ためリンクを外した：http://www.asj.gr.jp/journal/pdf/museum08eng.pdf
- [x] 「(財)小林理学研究所：音響科学博物館」：ページが消えている（サイトのトップへ転送）ためリンクを外した：http://www.asj.gr.jp/journal/pdf/museum07.pdf
- [x] 「音かおりの里」：ページが消えている（サイトのトップへ転送）ためリンクを外した：http://www.asj.gr.jp/journal/pdf/museum06.pdf
- [x] 「声道模型」：ページが消えている（サイトのトップへ転送）ためリンクを外した：http://www.asj.gr.jp/journal/pdf/museum05.pdf
- [x] 「パリ・音楽博物館」：ページが消えている（サイトのトップへ転送）ためリンクを外した：http://www.asj.gr.jp/journal/pdf/museum04.pdf
- [x] 「パラボラ集音器」：ページが消えている（サイトのトップへ転送）ためリンクを外した：http://www.asj.gr.jp/journal/pdf/museum03.pdf
- [x] 「クントの実験による定在波の可視化」：ページが消えている（サイトのトップへ転送）ためリンクを外した：http://www.asj.gr.jp/journal/pdf/museum02.pdf
- [x] 「連載企画「音の博物館」を始めるにあたって」：ページが消えている（サイトのトップへ転送）ためリンクを外した：http://www.asj.gr.jp/journal/pdf/museum01.pdf

### `src/content/pages/q-and-a.md`

- [x] 答えの PDF（loudspeaker.pdf）がなく、「上記2つの質問への答え」が文字だけ残っている。行を消すか、ページごと破棄するかを判断
- [x] 「上記2つの質問への答え」：添付ファイル（doc/loudspeaker.pdf）がないためリンクを外した

### `src/content/pages/science-square.md`

- [x] 資料の PDF 2件（girigari.pdf・ScienceSquare2011-voice.pdf）がない。前文の「資料を公開しています」と食い違うので、文を直すか、ページごと破棄するかを判断
- [x] 「サイエンススクエア」：転送先に書き換えた：http://www.kahaku.go.jp/event/2011/07science/index.html → https://www.kahaku.go.jp/plan/2011/07science/index.html
- [x] 「ギリギリガリガリ」：添付ファイル（museum/science/girigari.pdf）がないためリンクを外した
- [x] 「音や振動に親しもう」：添付ファイル（museum/science/ScienceSquare2011-voice.pdf）がないためリンクを外した
