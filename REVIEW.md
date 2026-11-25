# AVDB サイトレビュー報告書

対象: `C:\Users\ichiba\Desktop\React\av` (Next.js アダルトビデオデータベースサイト)
レビュー日: 2026-10-17

---

## 1. 概要

- **構成**: Next.js 16.3.4 (App Router) + React 19.2.8 + TypeScript (strict) + Tailwind CSS v4
- **データ/バックエンド**: Supabase (@supabase/ssr サーバーサイド, @supabase/supabase-js クライアントサイド)
- **サイトコンセプト**: AV作品・女優・ジャンル・メーカーの検索データベース。DMM/FANZA アフィリエイト連携あり。
- **言語**: 日本語 (`lang="ja"`)
- **エントリ**: `/` が年齢確認ゲート, `/home` が作品一覧, `/actropolis` 系で女優/ジャンル/作品詳細へ遷移

---

## 2. ディレクトリ構成

```
av/
├── app/
│   ├── page.tsx                  # 年齢確認ゲート (ルート)
│   ├── layout.tsx                # ルートレイアウト (Header + BackToTop)
│   ├── globals.css               # Tailwind import + スクロールバー非表示等
│   ├── robots.ts                 # robots.xml 生成
│   ├── sitemap.ts                # sitemap.xml 生成 (動的ルート含む)
│   ├── home/page.tsx             # 作品一覧 (SSR + クライアント側フィルタ)
│   ├── actress/search/page.tsx   # 女優検索 (詳細フィルタ)
│   ├── actress/cup/[cup]/        # カップ別女優一覧
│   ├── actress/[id]/             # 女優詳細 + 出演作品
│   ├── genre/search/page.tsx     # ジャンル一覧・検索
│   ├── genre/[id]/               # ジャンル詳細 + 作品
│   ├── video/[id]/               # 作品詳細 (FANZAアフィリエイトリンク, サンプル画像)
│   └── favicon.ico
├── components/                   # 共通コンポーネント (8ファイル)
├── hooks/                        # カスタムフック (4ファイル)
├── lib/                          # Supabaseクライアント, 型, ユーティリティ (7ファイル)
├── scripts/                      # データ同期/メンテナンススクリプト (gitignoreで除外)
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── postcss.config.mjs
├── .env.local (gitignore済み)
└── REVIEW.md (本ファイル)
```

---

## 3. 主な機能

| 機能 | 実装場所 | 概要 |
|------|----------|------|
| 年齢確認 | `app/page.tsx` | Cookie (`avdb_age_verified`) で18歳以上かを判定。クライアント側のみ |
| 作品一覧 | `app/home/page.tsx`, `components/HomeClient.tsx` | SSR初期表示 + インクリメンタルロード ("もっと見る")、VR/ソロ/ベスト除外フィルタ |
| 女優検索 | `app/actress/search/page.tsx` | 名前/カップ/都道府県/誕生日/スリーサイズ/身長など高度フィルタ |
| カップ別一覧 | `app/actress/cup/[cup]/` | A〜Kカップの女優一覧 |
| 女優詳細 | `app/actress/[id]/` | 女優プロフィール + 出演作品一覧 |
| ジャンル一覧/詳細 | `app/genre/*` | ジャンル検索・ジャンル別作品 |
| 作品詳細 | `app/video/[id]/` | タイトル/発売日/メーカー/シリーズ/女優/ジャンル + FANZAリンク + サンプル画像 |
| SEO | `robots.ts`, `sitemap.ts` | 動的サイトマップ (女優/作品/ジャンル個別URL) |
| データ同期 | `scripts/*.ts` | DMM/FANZAから作品・女優・ジャンル・メーカーを同期。Wikipedia/Gravurefitで誕生日・プロフィール更新 |
| キャッシュ | `lib/search-cache.ts` | メモリ内キャッシュ (200エントリ, 30分TTL) |
| ナビリセット | `lib/nav-reset.ts` | カスタムイベントによるヘッダー遷移時のスクロールリセット |

---

## 4. 良い点

1. **モダンスタック**: Next.js 16 / React 19 / Tailwind v4 / TypeScript strict で構成されており、最新のWeb開発プラクティスを追従している。
2. **SEO対応**: `sitemap.ts`/`robots.ts` により検索エンジン向けに動的URLを露出。各詳細ページで `generateMetadata` によるタイトル設定あり。
3. **サーバーサイドレンダリング**: `home/page.tsx` 等が `async` サーバーコンポーネントとして初期データを取得し、初回表示が高速。
4. **ユーザビリティ**: "もっと見る" インクリメンタルロード、スケルトンUI (`SkeletonGrid.tsx`)、トップへ戻るボタン、フィルタチップ、キーワードAND/除外検索など、実用的なUIが揃っている。
5. **型安全性**: `db-common.ts` で DB Row とフロント型のマッピング (`toProduct` 等) を集中管理し、TypeScript strict で型安全。
6. **アフィリエイト収益化**: `getAffiliateUrl` で DMM/FANZA リンクを自動生成。`contentIdToProductNumber` で品番表示も整形。
7. **運用スクリプト充実**: `scripts/` にデータ同期・マージ・誕生日更新など、実運用に必要なメンテナンススクリプトが多数揃っている。

---

## 5. 課題・懸念点

### 5.1 セキュリティ (重要)

- **`.env.local` に本番のSupabase匿名キーとアフィリエイトIDが記載されている**
  - `.gitignore` に `.env*` があるため現状は未コミットだが、誤ってコミットされるとキーが漏洩する。Supabase匿名キーはブラウザに露出する設計上 unavoidable ではあるが、本番値をリポジトリに置かない運用を徹底すべき。
- **年齢確認がクライアントサイドのみで実施されている**
  - `app/layout.tsx` やミドルウェアでCookieをチェックしておらず、`/home`, `/video/*` などに直接アクセスすれば年齢ゲートを迂回できる。アダルトコンテンツサイトとしてはサーバーサイド (ミドルウェア or レイアウトサーバーコンポーネント) でアクセス制御を入れるか、少なくとも動作方針を文書化すべき。
- **外部画像への直リンク**
  - `pics.dmm.co.jp` の画像を直接参照。`next.config.ts` に `remotePatterns` は設定済みだが、DMM側の仕様変更や画像削除に依存するリスクがある。

### 5.2 パフォーマンス

- **`sitemap.ts` で全作品をページネーションしながら全取得**
  - 作品数が増えるとサイトマップ生成が重くなり、ビルド/デプロイ時間に影響する。ISRやキャッシュ、製品URLの制限を検討すべき。
- **`getAllActresses` / `getAllGenres` で全件取得してからクライアント側スライス**
  - `genre/search/page.tsx` は全ジャンルを取得して `slice` している。データ増大に伴い無駄な通信が増える。
- **`enrichProducts` で作品ごとに女優情報を個別取得**
  - 複数作品の女優情報をまとめて取得する設計にはなっているが、ページ遷移ごとにDBクエリが発生し続ける。

### 5.3 保守性・堅牢性

- **エラー/ローディングUIの不統一**
  - `loading.tsx` / `error.tsx` が存在せず、ページごとに `try/catch` とスケルトンで個別に対応している。Next.jsのファイルベースエラー処理を活用すると統一的に扱える。
- **フック間の整合性がやや不明確**
  - `useProductList` と `useProductSearch` で似た機能 (検索, ロードモア, フィルタ) が重複。`useProductList.loadMore` は `keyword` を渡すが女優/ジャンル側の `fetchPage` では未使用など、クライアント側フィルタとの整合性に注意が必要。
- **使用されていない/仮実装の関数**
  - `lib/supabase.ts` の `getActressIdsForProduct` は `[actressId]` をそのまま返すのみ (マージ処理のプレースホルダ)。
  - `searchActresses` (非advanced) は定義されていても `searchActressesAdvanced` が使われている。
- **外部ライブラリ依存が少ない分、自前実装が多い**
  - ナビリセットイベント (`nav-reset.ts`) やキャッシュ (`search-cache.ts`) は自前実装。テストコードがないため、リグレッション検出が困難。

### 5.4 潜在的なバグ / 留意点

- `video-view.tsx:38` の `const merged` がインデントずれ（機能的にはtryブロック内だが可読性に難あり）。
- `sitemap.ts:33` `new Date(a.createdAt || Date.now())` — `createdAt` が `undefined` の場合 `Date.now()` にフォールバック。
- `useProductSearch.runSearch` の `replace` モードでは `enrichProducts` 完了前に未エンリッチの `data` を一度ステートにセットしてから上書きしている（一瞬、女優名なしの状態が表示される可能性）。
- `AgeGatePage` で `document.cookie` に `max-age=31536000` (1年) を設定。ゲート有効期限が長い。

### 5.5 機能・UI改善点

#### 機能面
- **年齢確認のサーバーサイド強制**: `/home`, `/video/*`, `/actress/*` などに直接アクセスするとクライアントサイドの年齢ゲートを迂回できる（`app/page.tsx`）。ミドルウェアまたはルートレイアウトでCookieチェックを入れる。
- **フィルタ状態のURL非反映**: `app/actress/[id]/actress-view.tsx`, `app/genre/[id]/genre-view.tsx` の `VideoGrid` フィルタ（VR/単体/ベスト除外）がURLパラメータ化されておらず、ブラウザバックやURL共有で状態が復元されない。
- **ソート機能の欠如**: 作品一覧が発売日降順固定。人気順・タイトル順などの選択肢がない。
- **0件時のリカバリー導線なし**: `VideoGrid`/`ActressResultsGrid` で0件時に単なるテキストのみ。フィルタ外しボタンや人気作品へのリンクがない。
- **`notFound()` 未活用**: 存在しない作品・女優・ジャンル・カップIDへのアクセス時にプレーンテキスト表示のみ（`next/navigation` の `notFound` 未使用）。
- **「もっと見る」のJSボタン依存**: `app/home/page.tsx` 等でリンクではなくボタン＋JS実装。SEO・アクセシビリティに不利。
- **作品詳細の関連導線なし**: `app/video/[id]/video-view.tsx` で同じシリーズ・メーカー・女優の他作品へのリンクがない。
- **サンプル画像のギャラリー化なし**: 拡大表示・スワイプ対応がない。
- **お気に入り・視聴履歴機能なし**: リピート訪問の導線が弱い。
- **品番検索の曖昧一致不備**: `lib/db-common.ts` でハイフナ有無（`123-456` / `123456`）で検索ヒットが分かれる可能性。

#### UI面
- **ローディング/エラーUIの不統一**: `loading.tsx` / `error.tsx` 未導入。ページごとに `try/catch` と「読み込み中…」テキストがバラバラ。
- **エラー時のリトライ導線なし**: エラー表示に「再試行」ボタンがない。
- **空状態（Empty State）の工夫不足**: 0件時にフィルタリセットボタンやおすすめリンクがない。
- **画像フォールバック未処理**: `Image` に `onError` なし。DMM画像削除時にBroken画像が表示されたまま。
- **フィルタチップUIの不統一**: VR/単体はチップボタン、ベスト除外はスイッチで見た目が異なる（`components/FilterToggle.tsx`）。
- **フィルタ適用後のスクロール位置**: フィルタ変更時にページトップに戻らない。
- **モバイルでの高度フィルタ圧迫**: `app/actress/search/page.tsx` で誕生日/スリーサイズ/身長フィルタが画面を圧迫。
- **アクセシビリティ**: 色のみでの状態伝達、`sr-only` ラベル依存。
- **作品タイトルの省略表示**: `components/VideoGrid.tsx` で `line-clamp-2` により長いタイトルの続きが見えない。
- **バッジ過多**: `components/VideoGrid.tsx` で11種類のバッジが重なるとカードがゴチャつく。
- **女優カードのプレースホルダー**: `components/ActressResultsGrid.tsx` で「画像なし」テキストのみ。
- **ジャンル一覧の情報不足**: `app/genre/search/page.tsx` で作品数・代表女優が未表示。
- **検索サジェスト・履歴なし**: `components/KeywordSearchBar.tsx` で過去検索履歴やサジェストがない。
- **ダークモード未対応**: 白ベース固定。

---
## 6. 推奨アクション (優先順)

1. **セキュリティ**: `.env.local` を絶対コミットしない運用を徹底し、必要なら `.env.example` (ダミー値) をリポジトリに置く。年齢ゲートのサーバーサイド強制を検討（ミドルウェア or layout）。
2. **SEO/パフォーマンス**: `sitemap.ts` の全作品取得を制限 or キャッシュ化。`updated_at` 等があれば `lastModified` に反映。
3. **エラー処理**: `loading.tsx` / `error.tsx` を導入し、ページごとの `try/catch` を整理。
4. **テスト追加**: Vitest/Jest + React Testing Library でフックとページのユニットテストを追加（現状テストなし）。
5. **コード整理**: `useProductList` / `useProductSearch` の責任分担を明確化。`video-view.tsx` のインデント修正。
6. **画像戦略**: DMM画像のホットリンク依存を見直し、必要に応じてプロキシ化や代替画像のフォールバックを検討。
7. **機能・UI改善**: フィルタ状態のURL反映、`loading.tsx`/`error.tsx` の導入、ソート機能追加、0件時リカバリー導線、アクセシビリティ改善、ダークモード検討。

---

## 8. ファイル別メモ (主要ファイル)

- `app/page.tsx`: 年齢ゲート。クッキー設定のみでサーバー側検証なし。
- `app/layout.tsx`: ヘッダー/戻るボタン共通レイアウト。Geistフォント採用。
- `app/sitemap.ts`: 動的サイトマップ。女優・作品・ジャンルをDBから取得。全件走査のコストに注意。
- `lib/supabase.ts`: ブラウザ向けSupabaseクライアントと、各種取得API (`getProducts`, `searchProducts`, `searchActressesAdvanced` 等)。
- `lib/supabase-server.ts`: サーバーコンポーネント向けクライアント (`createServerClient` + `cookies()`)。
- `lib/db-common.ts`: DBテーブルのRow型・フロント型・変換関数・DMM画像/アフィリエイトURL生成・ベスト作品判定ロジック。
- `lib/products.ts`: `enrichProducts` — 作品ごとに女優名を解決して付与。
- `hooks/useProductSearch.ts`: ホーム用検索フック。インメモリキャッシュ利用。
- `hooks/useProductList.ts`: 女優/ジャンル詳細用フック。オフセットベースのページング。
- `hooks/useActressSearch.ts`: 女優検索フック。キャッシュ + マージ女優表示解決。
- `components/VideoGrid.tsx`: 作品カードグリッド。バッジ (本日発売/ベスト/VR/熟女等) 表示。
- `components/ActressResultsGrid.tsx`: 女優カードグリッド。年齢計算・誕生日フォーマット含む。
- `scripts/`: DMM/FANZAデータ同期、Wikipedia/Gravurefitプロフィール更新、女優マージ等。gitignoreで除外済み。

---

## 9. 総評

AVDBは、Next.js + Supabase + Tailwind を適切に組み合わせた、実用的なアダルトビデオデータベースサイト。SSRによるSEO対応、インクリメンタルロード、高度な女優検索、DMMアフィリエイト連携など、エンドユーザー向け機能は十分に実装されている。

主な改善余地は **年齢確認のサーバーサイド強化**、**サイトマップ生成コストの抑制**、**エラーローディングUIの統一**、**テストコードの不足**、および **`.env.local` 含む機密情報の取り扱い** の5点。これらを対応すれば、より堅牢で運用しやすいサイトになる。
