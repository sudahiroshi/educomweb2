# 添付ファイルとリンクの一覧

旧サイト（`legacy/`）の添付ファイル・サイト内リンク・外部リンクの一覧と、リンク切れの調査結果です（plan 9.3）。
`node tools/migrate/links.ts` で生成しています。外部リンクは 2026-11-20 に接続して確かめました。
切れたリンクの扱いは T-31（既定案：リンクを外して文字だけ残す）で、plan 9.7 で処理します。

## まとめ

- 添付ファイル・画像へのリンク：21 件（うちファイルがないもの 21 件）
- サイト内のページへのリンク：28 件（うちファイルがないもの 11 件）
- 外部リンク：31 件（URL は 30 種類）。正常 7、転送 2、切れ 1、切れ（トップへ転送）19、要確認（拒否）1

`legacy/` には HTML しか含まれていないため、添付ファイル・画像はすべて「なし」になります。

## 添付ファイル・画像

| ページ | 種類 | 文字（画像は代替テキスト） | リンク先 | ファイル |
| --- | --- | --- | --- | --- |
| `doc/q_and_a.html` | リンク | 上記2つの質問への答え | `doc/loudspeaker.pdf` | **なし** |
| `meeting/kokusaikaigi.html` | リンク | FORUM ACUSTICUM SEVILLA 2002 | `meeting/FAS2002.pdf` | **なし** |
| `menu.html` | リンク | はじめてのインパルス応答計測 | `jasj6704/try_ir_meas.zip` | **なし** |
| `museum/science/index.html` | リンク | ギリギリガリガリ | `museum/science/girigari.pdf` | **なし** |
| `museum/science/index.html` | リンク | 音や振動に親しもう | `museum/science/ScienceSquare2011-voice.pdf` | **なし** |
| `state/members.html` | 画像 | e-mail アドレス | `images/MailAddress/kawahara_addr.png` | **なし** |
| `state/members.html` | 画像 | e-mail アドレス | `images/MailAddress/suda_addr.png` | **なし** |
| `state/members.html` | 画像 | e-mail アドレス | `images/MailAddress/takahashi_addr.png` | **なし** |
| `state/members.html` | 画像 | e-mail アドレス | `images/MailAddress/toyomasu.gif` | **なし** |
| `state/members.html` | 画像 | e-mail アドレス | `images/MailAddress/nishimuraaddr.gif` | **なし** |
| `state/members.html` | 画像 | e-mail アドレス | `images/MailAddress/kawahara_addr.png` | **なし** |
| `state/members.html` | 画像 | e-mail アドレス | `images/MailAddress/suda_addr.png` | **なし** |
| `state/members.html` | 画像 | e-mail アドレス | `images/MailAddress/takahashi_addr.png` | **なし** |
| `state/members.html` | 画像 | e-mail アドレス | `images/MailAddress/nishimuraaddr.gif` | **なし** |
| `state/members.html` | 画像 | e-mail アドレス | `images/MailAddress/yokoyamaaddr.gif` | **なし** |
| `state/members.html` | 画像 | e-mail アドレス | `images/MailAddress/kawahara_addr.png` | **なし** |
| `state/members.html` | 画像 | e-mail アドレス | `images/MailAddress/suda_addr.png` | **なし** |
| `state/members.html` | 画像 | e-mail アドレス | `images/MailAddress/satohaddr.gif` | **なし** |
| `state/members.html` | 画像 | e-mail アドレス | `images/MailAddress/nishimuraaddr.gif` | **なし** |
| `state/members.html` | 画像 | e-mail アドレス | `images/MailAddress/yokoyamaaddr.gif` | **なし** |
| `state/members.html` | 画像 | e-mail アドレス | `images/MailAddress/aminoaddr.png` | **なし** |

## サイト内のページへのリンク

フレームの外側（`index.html`、旧サイトのトップ）へのリンクは除いています。

| ページ | 文字 | リンク先 | ファイル |
| --- | --- | --- | --- |
| `demo/index.html` | 声道模型−音声生成の基礎を学べる音響教育教材− | `demo/arai/asj_demo_arai.htm` | **なし** |
| `demo/index.html` | 聴能形成−音響設計技術者に求められる「音の感性」を養成する教育プログラム− | `demo/iwamiya/tech_listening.htm` | **なし** |
| `demo/index.html` | 建築と環境のサウンドライブラリ SMILE2004 (Sound Material in Living Environment) | `demo/kawai/smile2004.htm` | **なし** |
| `demo/index.html` | トップ | `top.html` | あり |
| `meeting/kenkyuhapyoukai.html` | 平成14年春季研究発表会 | `meeting/2002spring.html` | **なし** |
| `meeting/kenkyuhapyoukai.html` | 平成13年春季研究発表会 | `meeting/2001spring.html` | **なし** |
| `meeting/kenkyuhapyoukai.html` | 平成10年秋季研究発表会 | `meeting/1998fall.html` | **なし** |
| `meeting/kenkyuhapyoukai.html` | トップ | `top.html` | あり |
| `meeting/kokusaikaigi.html` | トップ | `top.html` | あり |
| `menu.html` | お知らせ | `top.html` | あり |
| `menu.html` | 設立趣旨 | `plan/seturitusyusi.html` | あり |
| `menu.html` | 最近の活動 | `plan/recent.html` | **なし** |
| `menu.html` | 過去の主な活動 | `plan/kaisaikiroku.html` | あり |
| `menu.html` | 運営委員 | `state/members.html` | あり |
| `menu.html` | 音響学会研究発表会 | `meeting/kenkyuhapyoukai.html` | あり |
| `menu.html` | 国際会議 | `meeting/kokusaikaigi.html` | あり |
| `menu.html` | 音声分析ソフトウェアPraatを用いた聴取実験 | `doc/asj6708/praat.html` | **なし** |
| `menu.html` | 音響に関する質問と答え | `doc/q_and_a.html` | あり |
| `menu.html` | 音教材とその実演 | `demo/index.html` | あり |
| `menu.html` | リンク | `demo/links.html` | あり |
| `menu.html` | 「音の博物館」連載 | `museum/article/index.html` | あり |
| `menu.html` | サイエンススクエア(国立科学博物館) | `museum/science/index.html` | あり |
| `plan/kaisaikiroku.html` | 最近の活動 | `plan/recent.html` | **なし** |
| `plan/kaisaikiroku.html` | トップ | `top.html` | あり |
| `plan/seturitusyusi.html` | トップ | `top.html` | あり |
| `state/members.html` | トップ | `top.html` | あり |
| `top.html` | 簡易プログラム | `meeting/prog20110106.html` | **なし** |
| `top.html` | 概要つきプログラム | `meeting/abst20110106.html` | **なし** |

## 外部リンク

- 「転送」は、転送先で正常に表示されたものです。移行時は転送先の URL に書き換えます（要確認リストに載せる）。
- 「切れ（トップへ転送）」は、個別のページがサイトのトップへ転送されたもので、ページは残っていません。
- 「要確認（拒否）」は、自動の確認を拒否された（401・403・429）もので、ブラウザで開いて確かめる必要があります。

| ページ | 文字 | URL | 結果 | 詳細 |
| --- | --- | --- | --- | --- |
| `demo/links.html` | 声道模型 | http://www.splab.ee.sophia.ac.jp/Vocal_Tract_Model/index-j.htm | **切れ** | getaddrinfo ENOTFOUND www.splab.ee.sophia.ac.jp |
| `meeting/kokusaikaigi.html` | 第5回日米ジョイントミーティング | http://acousticalsociety.org/content/5th-joint-meeting | 要確認（拒否） | 403 → https://acousticalsociety.org/content/5th-joint-meeting |
| `meeting/kokusaikaigi.html` | ICA2013 | http://www.ica2013montreal.org/technical.html | 正常 | 200 |
| `menu.html` | 日本音響学会 | http://www.asj.gr.jp/ | 転送 | 200 → https://acoustics.jp/ |
| `museum/article/index.html` | 日本音響学会 | http://www.asj.gr.jp/ | 転送 | 200 → https://acoustics.jp/ |
| `museum/article/index.html` | NHK 放送博物館 | http://www.asj.gr.jp/journal/pdf/museum17.pdf | **切れ（トップへ転送）** | 200 → https://acoustics.jp/ |
| `museum/article/index.html` | クラドニパターン | http://www.asj.gr.jp/journal/pdf/museum16.pdf | **切れ（トップへ転送）** | 200 → https://acoustics.jp/ |
| `museum/article/index.html` | レイリー盤 | http://www.asj.gr.jp/journal/pdf/museum15.pdf | **切れ（トップへ転送）** | 200 → https://acoustics.jp/ |
| `museum/article/index.html` | 蘇言機 −日本で最初に音を記録・再生した器械− | http://www.asj.gr.jp/journal/pdf/museum14.pdf | **切れ（トップへ転送）** | 200 → https://acoustics.jp/ |
| `museum/article/index.html` | 神戸市立青少年科学館 | http://www.asj.gr.jp/journal/pdf/museum13.pdf | **切れ（トップへ転送）** | 200 → https://acoustics.jp/ |
| `museum/article/index.html` | 金沢工業大学ポピュラー・ミュージック・コレクション | http://www.asj.gr.jp/journal/pdf/museum12.pdf | **切れ（トップへ転送）** | 200 → https://acoustics.jp/ |
| `museum/article/index.html` | 浜松科学館 | http://www.asj.gr.jp/journal/pdf/museum11.pdf | **切れ（トップへ転送）** | 200 → https://acoustics.jp/ |
| `museum/article/index.html` | ストックホルムの音楽博物館 | http://www.asj.gr.jp/journal/pdf/museum10.pdf | **切れ（トップへ転送）** | 200 → https://acoustics.jp/ |
| `museum/article/index.html` | 伝声管 | http://www.asj.gr.jp/journal/pdf/museum09.pdf | **切れ（トップへ転送）** | 200 → https://acoustics.jp/ |
| `museum/article/index.html` | Ringve 博物館 | http://www.asj.gr.jp/journal/pdf/museum08.pdf | **切れ（トップへ転送）** | 200 → https://acoustics.jp/ |
| `museum/article/index.html` | Ringve Museum | http://www.asj.gr.jp/journal/pdf/museum08eng.pdf | **切れ（トップへ転送）** | 200 → https://acoustics.jp/ |
| `museum/article/index.html` | (財)小林理学研究所：音響科学博物館 | http://www.asj.gr.jp/journal/pdf/museum07.pdf | **切れ（トップへ転送）** | 200 → https://acoustics.jp/ |
| `museum/article/index.html` | 音かおりの里 | http://www.asj.gr.jp/journal/pdf/museum06.pdf | **切れ（トップへ転送）** | 200 → https://acoustics.jp/ |
| `museum/article/index.html` | 声道模型 | http://www.asj.gr.jp/journal/pdf/museum05.pdf | **切れ（トップへ転送）** | 200 → https://acoustics.jp/ |
| `museum/article/index.html` | パリ・音楽博物館 | http://www.asj.gr.jp/journal/pdf/museum04.pdf | **切れ（トップへ転送）** | 200 → https://acoustics.jp/ |
| `museum/article/index.html` | パラボラ集音器 | http://www.asj.gr.jp/journal/pdf/museum03.pdf | **切れ（トップへ転送）** | 200 → https://acoustics.jp/ |
| `museum/article/index.html` | クントの実験による定在波の可視化 | http://www.asj.gr.jp/journal/pdf/museum02.pdf | **切れ（トップへ転送）** | 200 → https://acoustics.jp/ |
| `museum/article/index.html` | 連載企画「音の博物館」を始めるにあたって | http://www.asj.gr.jp/journal/pdf/museum01.pdf | **切れ（トップへ転送）** | 200 → https://acoustics.jp/ |
| `museum/science/index.html` | サイエンススクエア | http://www.kahaku.go.jp/event/2011/07science/index.html | 転送 | 200 → https://www.kahaku.go.jp/plan/2011/07science/index.html |
| `top.html` | 音響教育チャンネル | https://www.youtube.com/watch?v=E54oDZGAap0 | 正常 | 200 |
| `top.html` | JSTAGE | https://www.jstage.jst.go.jp/browse/ast/37/4/_contents | 正常 | 200 |
| `top.html` | 音響学会サイト和文誌目次 | http://www.asj.gr.jp/journal/04_contents/2014_05.html | **切れ（トップへ転送）** | 200 → https://acoustics.jp/ |
| `top.html` | その1 | http://adlib.rsch.tuis.ac.jp/~akira/edu/meeting/00000.wmv | 正常 | 200 |
| `top.html` | その2 | http://adlib.rsch.tuis.ac.jp/~akira/edu/meeting/00001.wmv | 正常 | 200 |
| `top.html` | その3 | http://adlib.rsch.tuis.ac.jp/~akira/edu/meeting/00002.wmv | 正常 | 200 |
| `top.html` | その4 | http://adlib.rsch.tuis.ac.jp/~akira/edu/meeting/00003.wmv | 正常 | 200 |
