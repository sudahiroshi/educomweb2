# 日本音響学会 音響教育委員会 Web サイト

`asj-edcom.acoustics.jp` のソースです。[Astro](https://astro.build/) で作る静的サイトと、ブラウザだけで動く記事の編集画面（`/editor/`）からなります。

- 記事は `src/content/` の Markdown（フロントマター付き）です。委員会のメンバーは編集画面で書き、GitHub に登録します（手順は [docs/manual.md](docs/manual.md)）。
- `main` に push すると、自動でビルドされて公開されます。

| 文書                                 | 内容                                                                  |
| ------------------------------------ | --------------------------------------------------------------------- |
| [docs/spec.md](docs/spec.md)         | 仕様書（項目名・URL・色・文言の正）                                   |
| [docs/decision.md](docs/decision.md) | 決定事項（D-xx）                                                      |
| [docs/plan.md](docs/plan.md)         | 実装計画                                                              |
| [docs/todo.md](docs/todo.md)         | 未決事項（T-xx）と既定案                                              |
| [docs/manual.md](docs/manual.md)     | メンバー向けの手引き                                                  |
| [docs/migration/](docs/migration/)   | 旧サイトからの移行の記録                                              |
| [CLAUDE.md](CLAUDE.md)               | 作業ルール・コーディング規約・コマンド一覧（AI 向けだが、人にも有用） |

---

## ローカルでの起動

### 必要なもの

- Node.js 24.22.1（`.nvmrc` で固定。Cloudflare と GitHub Actions も同じ版を使う）
  - `nvm use` や `fnm use` で切り替えられます。`package.json` の `engines` は 22.23.4 以上です。
- npm（Node.js に付属）
- 点検ツール（`check:*`・`screenshot`）を使う場合は Google Chrome（手元の Chrome を使うので、ブラウザのダウンロードは不要）

### 手順

```sh
npm ci            # 依存パッケージを入れる
npm run dev       # 開発サーバー（http://localhost:4321/）
```

- 編集画面は <http://localhost:4321/editor/> です。
- サイト内検索は、ビルド後に作る索引（Pagefind）を使うので、開発サーバーでは動きません。確かめるときは次のようにします。

```sh
npm run build     # dist/ に出力（astro build のあと pagefind で検索索引を作る）
npm run preview   # http://localhost:4321/ でビルド結果を表示
```

### よく使うコマンド

| コマンド                                | 内容                                                                                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run verify`                        | lint・整形の確認・型チェック・テストをまとめて実行（**コミット前に必ず通す**）                                                              |
| `npm test`                              | Vitest（`src/**/*.test.ts`・`tools/**/*.test.ts`）                                                                                          |
| `npm run build` → `npm run check:pages` | ビルドし、全ページの `<title>`・h1・見出しレベル・パンくずを点検                                                                            |
| `npm run build:samples`                 | サンプル記事（`tools/dev/sample-content/`）を一時的に入れ、ビルド日を 2026-11-19 に固定してビルド（開催予定の記事がある状態を確かめるとき） |
| `npm run check:a11y`                    | 全ページ（編集画面は状態ごと）を axe-core で点検。ライト・ダーク                                                                            |
| `npm run check:keyboard`                | キーボードだけで操作できるかを点検                                                                                                          |
| `npm run check:overflow -- 320 xlarge`  | 幅 320px・文字サイズ特大で横はみ出しを点検                                                                                                  |
| `npm run check:events`                  | 閲覧時の開催状態の切り替えを、ブラウザの時計を固定して点検（`build:samples` の後）                                                          |

`check:*` は、別のターミナルで `npx astro preview --port 4329` を起動しておいてから実行します。ほかのコマンドは [CLAUDE.md の「コマンド」](CLAUDE.md#コマンド) を見てください。

- ビルド日は環境変数 `ASJ_EDCOM_TODAY=YYYY-MM-DD` で差し替えられます（確認用。本番では設定しない）。

---

## ディレクトリ構成

```
├─ src/
│  ├─ content/            記事（news・events・committee・pages の .md）
│  ├─ content.config.ts   コレクションの定義。スキーマは src/schemas/ を使い、ビルド時だけの検査（ID・参照切れ）を加える
│  ├─ schemas/            Zod スキーマ（サイトと編集画面で共有）
│  ├─ lib/                日付・年度・開催状態・並び順・メニュー・Markdown 変換などの関数（Vitest でテスト）
│  │  └─ markdown/        Markdown の変換設定（unified）。結果は __snapshots__/sample.html で固定
│  ├─ components/         Astro のコンポーネント（ヘッダー・メニュー・一覧など）
│  │  └─ ui/              表示部品（Preact）。サイト（ビルド時に静的 HTML）と編集画面のプレビューで共有
│  ├─ layouts/            BaseLayout（<head>・ヘッダー・フッター）、PageLayout（パンくず＋h1）
│  ├─ pages/              URL ごとのページ（spec 4.1）。editor/ は編集画面、editor/index.json.ts は既存記事一覧
│  ├─ editor/             編集画面（Preact）。forms/ は種類ごとの入力欄
│  ├─ scripts/            表示設定（テーマ・文字サイズ）・開催状態の閲覧時スクリプト
│  ├─ styles/             tokens.css（色・寸法の CSS 変数）、global.css、components.css
│  └─ config/site.ts      サイト名・公開 URL・GitHub の owner/repo/branch
├─ public/
│  └─ files/              画像・添付ファイル（{コレクション}/{記事のID}/ に置く。legacy/ は旧サイトの添付）
├─ tools/
│  ├─ dev/                点検・撮影の道具、サンプル記事
│  └─ migrate/            旧サイトの移行スクリプト（plan 9章）
├─ legacy/                旧サイトの HTML（移行の入力。編集しない。ビルド対象外）
├─ docs/                  仕様・計画・手引き・デザイン案・移行の記録
├─ .github/workflows/     build.yml（push ごとのビルド確認）、scheduled-build.yml（毎日の定期ビルド）
└─ .nvmrc                 Node.js の版
```

### 大事な決まり

- **日付は `YYYY-MM-DD` の文字列のまま扱います。** `Date` に変換すると時差でずれるためです。比較・表示は日本時間です（`src/lib/date.ts`）。
- **色は `src/styles/tokens.css` の `--color-*` だけを使います。** ダークは `[data-theme="dark"]` で上書きします。文字サイズは `rem` で指定します。
- **表示部品は `src/components/ui/*.tsx` に置きます。** サイトと編集画面のプレビューで共有するので、片方だけ直すと見た目がずれます。Astro のスコープ付きスタイルは Preact の部品の中には効かないので、スタイルは `src/styles/components.css` に書きます。
- **Markdown は unified で変換します**（Astro 7 の既定の変換ではありません）。設定は `src/lib/markdown/config.ts` で、サイトと編集画面のプレビューが同じ設定を使います。変換結果を意図して変えたときは、`npx vitest run -u` でスナップショットを更新し、差分を確かめてからコミットします。
- GitHub の owner / repo / branch は `src/config/site.ts` だけに書きます。
- TypeScript は 6.0 系に固定しています（`typescript-eslint` と `@astrojs/check` が 7 系に未対応のため）。

---

## スキーマの変更方法

記事の項目（フロントマター）を足す・変える・消すときの手順です。項目の定義は **サイトと編集画面で共有** しているので、片方だけ直すことはできません。

例として、`events` に任意の項目「主催（`organizer`）」を足す場合：

1. **仕様を先に決める**
   `docs/spec.md` の 2章の表に、キー名・型・必須かどうか・表の中での位置を書きます。spec の変更は、管理者の了承を得てから行ってください。
2. **スキーマ**：`src/schemas/events.ts`
   - spec の表の順の位置に項目を足します（例：`organizer: optionalText,`）。文字列は `common.ts` の `requiredText()`・`optionalText`、日付は `dateSchema` など共通の部品を使います。
   - エラーメッセージは日本語にします（編集画面にそのまま出ます）。
   - `src/schemas/schemas.test.ts` にテストを足します。
3. **編集画面**：`src/editor/`
   - `model.ts`：`Draft` の型、`emptyDraft()` の初期値、`toFrontmatter()` に足します。**`toFrontmatter()` の順がそのまま出力される .md のキーの順** なので、spec の表の順に入れます。
   - `import.ts`：読み込んだ .md からフォームの値に戻す処理に足します。
   - `forms/KindForm.tsx`：入力欄を足します（`fields.tsx` の `TextField` などを使い、`path` にキー名を入れると、エラーがその欄の下に出ます）。
   - `preview-data.ts`：プレビューに渡す値に足します。
   - `serialize.test.ts`・`import.test.ts`・`model.test.ts` にテストを足します（書き出し→読み込みで元に戻ることを確かめる）。
4. **表示**：`src/components/ui/`（例：`EventSections.tsx`）
   表示部品に足せば、サイトと編集画面のプレビューの両方に出ます。新しい部品を足したときは、ページ（`src/pages/`・`src/components/*.astro`）と `src/editor/Preview.tsx` の両方から使います。
5. **既存の記事**
   必須の項目を足したときや、キー名を変えたときは、`src/content/` の該当する .md をすべて直します（直さないとビルドが失敗します）。移行で作った記事を作り直すことがあるなら、`tools/migrate/` 側も合わせます。
6. **ビルド時だけの検査** が必要なとき（ほかの記事との照合など）は `src/content.config.ts` に足します。編集画面での同じ検査は `src/editor/model.ts` の `validateDraft()` です。
7. **確認**
   ```sh
   npm run verify
   npm run build && npm run check:pages
   ```
   編集画面で、新しい欄を入れて出力した .md を読み込み直し、同じ内容に戻ることも確かめます。

種類（`kind`）を足すときは、ほかに `src/schemas/events.ts` の `EVENT_KINDS`、`src/lib/event-kind.ts`（表示名・一覧の URL）、`src/editor/kinds.ts`、メニュー（`src/lib/navigation.ts`）、一覧ページ（`src/pages/`）も直します。

---

## 公開の仕組み

- `main` に push すると、Cloudflare が `npm run build` でビルドして公開します。ビルドが失敗したときは公開されず、前の版が残ります。
  - 今は、テスト用の公開先として Cloudflare Pages（<https://educomweb2.pages.dev/>）を使っています。本番の公開先は別に決めます（plan 13章）。
  - Pages の設定（Cloudflare の画面）：本番ブランチ `main`、ビルドコマンド `npm run build`、出力ディレクトリ `dist`、環境変数 `NODE_VERSION`（`.nvmrc` と同じ版）。404 ページ（`dist/404.html`）と末尾のスラッシュは Pages が自動で扱うので、設定ファイルは置いていません。
- GitHub Actions：
  - `build.yml`：push ごとに、ビルドと全ページの点検（`check:pages`）をします。`main` で失敗すると「【ビルド失敗】」の Issue を作って管理者に割り当て、次に成功すると閉じます。
  - `scheduled-build.yml`：毎日 0:10（日本時間）に、ビルドできることを確かめてから、Secrets の `CLOUDFLARE_DEPLOY_HOOK_URL` を呼んで本番をビルドし直します（開催予定から終了への切り替えと、年度別ページの更新のため）。60日間リポジトリに変更がないと GitHub が止めるので、そのときは Actions の画面で再開します。
- 秘密情報（デプロイフックの URL、トークン、`.env`）はコミットしないでください。
