---
name: Architecture Rules
description: システム間連携の標準パターン、アーキテクチャ要件、およびネットワーク構成のルール
---

# Architecture & Integration Patterns

## ワンタイム・データリレー・アーキテクチャ

拡張機能からApp Basecamp側へ巨大なデータ（ページテキスト等）を渡す場合の標準パターンは以下の「ワンタイム・データリレー」方式とする。

1. **Storage (Extension ➔ DB)**: 拡張機能から Supabase の `sitecue_page_contents` テーブルに直接巨大なデータを `INSERT` し、返却された `context_id` (UUID) を取得する。
2. **Relay (Extension ➔ App Basecamp)**: 取得した `context_id` を URLパラメータ (例: `?context_id=...`) に付与して App Basecampの特定のページを開く。
3. **Consume & Cleanup (App Basecamp ➔ API ➔ DB)**: App Basecamp側のAPI (Hono) でその `context_id` を用いてデータを `SELECT` した後、**直ちにそのレコードを `DELETE` し**、DBに一時データを恒久的なゴミとして残さないようにする。

## ローカル開発環境のネットワーク固定化

ローカル環境におけるAPI (Wrangler/Hono) と App Basecamp (Next.js) 間の通信トラブルや IPv4/IPv6 のすれ違いを防ぐため、以下のネットワークルールを厳守すること。

- **IPv4/IPv6のすれ違い防止**: API (Wrangler) と App Basecamp (Next.js) 間のローカル通信において `localhost` の使用は**禁止**する。必ず `127.0.0.1` を使用すること。
- **ポートの厳格な固定**: APIは常に `8787` で固定する。Wranglerが自動で `8788` 等にフォールバックして立ち上がるのを防ぐため、起動時は必ず `127.0.0.1:8787` (またはスマホ実機テスト時は `0.0.0.0:8787`) で明示的にバインドさせること。
- **Next.jsの CORS警告対応**: `next.config.ts` において、通信警告を抑制するための `allowedDevOrigins: ["127.0.0.1", "localhost"]` を設定する場合は、`experimental` ブロックの中ではなく、必ず**コンフィグのルートレベル**に記述すること。
- **Next.jsの `localhost` フォールバックの回避**: 次のフレームワーク（Turbopack等）の内部プロキシ仕様において、`request.url` が意図せず `localhost` に書き換わり、Supabase Auth等のコールバックURL不一致エラーを引き起こす。ミドルウェアやAPIルートでのリダイレクト先構築時は、必ずヘッダーの `x-forwarded-host` または `host` からURLを構築し、念の為 `hostname === "localhost"` の場合は強制的に `127.0.0.1` に置換する二重の防御策を敷くこと。クライアント側の `location.origin` も同様に置換して防御する。
- **Server Component (SSR) リダイレクト時のパラメータ消失防止**: `middleware.ts` がセッションをリフレッシュして最新のクッキーをセットしても、同リクエスト内で末端の Server Component（`page.tsx` 等）は古いクッキーしか読めず、`user=null` として独自の `redirect("/login")` を発火させるケース（仕様）がある。この際、せっかくミドルウェアが構築した `?next=` パラメータが消失してログイン後の画面復帰ができなくなるため、Server Component側でログアウト・未認証リダイレクトを投げる際は、必ず `searchParams` プロパティを受け取って手動で元のフルパスを再構築し、`redirect("/login?next=...")` に渡すこと。

## Cloudflare Workers & OpenNext 移行における絶対ルール (Strict Constraints)

当プロジェクトのNext.jsは、Cloudflare Pagesではなく **Cloudflare Workers (Node.js互換)** で稼働しています。AIエディタは過去の知識でコードを破壊しないよう、以下の掟を絶対厳守すること。

- **Adapterの制限**: `@opennextjs/cloudflare` を使用しています。古い `@cloudflare/next-on-pages` の使用やインストール提案は **絶対禁止** です。
- **Edgeランタイムの禁止**: コードベースのいかなる場所にも `export const runtime = "edge";` を記述してはいけません。OpenNextのNode.js標準動作が破壊されビルドが落ちます。
- **デプロイコマンド**: `wrangler pages deploy` は禁止です。正しくは `bun run deploy` (裏側は `wrangler deploy`) です。
- **環境変数の管理 (OpenNextの罠)**:
  - Wranglerプレビュー（ローカル）は `.env` を無視します。プレビュー用の変数は必ず `.dev.vars` に記述するようユーザーに案内してください（※`.dev.vars` は絶対にGitコミットしないこと）。
  - 本番用の公開変数（`NEXT_PUBLIC_`）は、**必ず `wrangler.toml` の `[vars]` セクションと `.env.production` の両方に記述**してください。
    - 理由: Next.jsの仕様上、ビルド時（`next build`）に静的ファイルへ変数をインライン化するために `.env.production` が必要であり、デプロイ後のWorkerランタイム時のために `wrangler.toml` が必要となるためです。
  - 機密キーを `wrangler.toml` に書く提案は厳禁です。必ず `bun x wrangler secret put <KEY_NAME>` を使うよう案内してください。

## ドメイン・アーキテクチャ戦略 (Domain Architecture)

将来的なマーケティング用LP（ランディングページ）とWebアプリケーションのライフサイクルを分離するため、以下のサブドメイン分割構成をベストプラクティスとして維持すること。

- **App Basecamp (Next.js)**: `app.sitecue.app` 等のサブドメインを使用する。
- **API (Hono)**: `api.sitecue.app` を使用し、App Basecamp側と明確に分離してCORSを厳格に管理する。
- **LP (将来追加)**: ネイキッドドメイン `sitecue.app` は、将来的にSEOや高速表示に特化したLP（または別システム）をデプロイするために予約・隔離しておく。

## 🏕️ Base Camp Architecture (App Basecamp)

SiteCueのApp Basecampは単なるメモ帳ではなく、情報を加工・発信する「活動拠点（Base Camp）」として機能する。今後の実装では以下の掟を絶対遵守すること。

1. **Note と Draft の厳格な分離 (The Separation of Concerns)**
   - `sitecue_notes` は拡張機能で収集する「素材（Read-Only寄り）」である。
   - `sitecue_drafts` はApp Basecampで練り上げる「成果物（Read/Write）」である。
   - AIはこれら2つのテーブル・型を絶対に混同してはならない。素材（Note）を直接編集して成果物（Draft）にするのではなく、素材を参照しながら成果物を錬成（Weave）する設計とする。
   - **UIにおける視覚的統合**: データベースおよび型定義において素材（Note）と成果物（Draft）は厳格に分離するが、App Basecampのナビゲーション（左ペイン等）においては、ユーザーが文脈をシームレスに横断できるよう、Notesのリスト構造に統合する形で Drafts カテゴリを提示すること。

2. **Target Platform 駆動設計 (Target-Driven UI/Logic)**
   - `sitecue_drafts` は必ず `target_platform` ('x' | 'zenn' | 'generic' 等) の属性を持つ。
   - UI（文字数カウンターの有無など）や、生成時のプロンプト、保存ロジックの分岐は、この `target_platform` を絶対の基準として型安全に実装すること。

3. **責務の分離 (Routing)**
   - Launchpad（ポータル）はルート (`/`) に、執筆・錬成アトリエは `/studio/` 配下に構築し、それぞれの責務を明確に分離すること。

## 通信経路とAPI連携の掟 (Communication Rules)

1. **DBのCRUD操作:** Extension・App Basecampともに、自社のDB（`sitecue_notes` 等）の読み書きは Hono API を経由せず、`supabase-js` を用いて直接通信すること（RLSによる保護を活用するため）。
2. **シークレットキーが必要な外部API（Gemini、天気予報等）:** APIキーの漏洩を防ぐため、フロントエンド（Extension/App Basecamp）から直接叩かず、必ず自社の Hono API (`apps/api/`) に専用エンドポイントを作り、JWT認証を経由してプロキシ（仲介）させること。
3. **シークレットキーが不要なパブリックAPI:** Extension・App Basecamp内で直接 `fetch` 等を用いて通信してよい。
4. **重い生成処理（Weave機能など）:** Extensionの小さなサイドパネル内で無理に完結させず、コンテキスト（URL等）をパラメータに付与してApp Basecamp（`/studio` 等）へリレー遷移させること。

## 認証・ルーティングにおけるBFCacheとキャッシュの掟

1. **OAuthログインのBFCache（ブラウザバック）トラップ回避**
   App BasecampにおけるOAuthログイン（Google, GitHub等）のトリガーボタンに、クライアントサイドのステート（`useState` による `isLoading` など）を用いてローディング状態を管理することは**絶対禁止**とする。
   外部ドメインへ遷移した後にユーザーがブラウザバックで戻ってきた際、BFCacheによって「ボタンが無効化された状態」が復元され、永久に操作不能になる致命的なバグを引き起こすため。
   認証トリガーは必ずピュアな HTML `<form>` と Next.js の **Server Actions (`"use server"`)** を用いて実装し、クライアントJSに依存しない堅牢なリダイレクト処理を構築すること。

2. **認証・セッション境界ページのキャッシュ無効化**
   `/login` などの認証を司るページでは、Next.jsの Router Cache によって古い状態（ログイン済みなのにログイン画面が出る等）が引き起こされるのを防ぐため、必ずページコンポーネントの最上部に `export const dynamic = "force-dynamic";` を記述し、静的キャッシュを無効化すること。

## AI機能と外部APIにおけるクオータ管理の掟 (Cost Protection Architecture)

生成AIやコストのかかる外部APIを呼び出す機能を実装する際は、ランニングコストの流出を防ぐため、必ず以下の「3段構えのガード」をアーキテクチャに組み込むこと。

1. **DBでの記録:** `sitecue_profiles` 等のテーブルで、ユーザーの月間利用回数 (`usage_count`) とリセット日時を厳密に管理する。
2. **API側の絶対的ガード:** フロントエンドの制御を信用せず、Hono API (`apps/api/`) 側で必ずDBの利用回数とプランの上限を確認し、上限到達時は外部APIを叩かずに即座に `403 Forbidden` を返すこと。
3. **UIのPaywall:** フロントエンド側では残回数をインジケーターとして表示し、上限到達時は処理をブロックして「Proプランへの課金導線（Paywallモーダル）」を表示すること。


## Hono API (apps/api) のレイヤーアーキテクチャ規約

APIの肥大化を防ぎ、関心の分離とテスト容易性を保つため、`apps/api/` 内の実装は以下の厳格なレイヤー構造に従うこと。単一の `index.ts` にロジックを集中させることは技術的負債となるため**絶対禁止**とする。

- **`index.ts` (Entry Point):**
  - アプリケーションの初期化、グローバルなミドルウェア（CORS等）の適用、および各ルート (`app.route()`) のマウントのみを担当する「薄い層」に保つこと。
- **`routes/` (Routing Layer):**
  - エンドポイントの定義（GET, POST等）と、リクエストの受け取り・レスポンスの返却のみを行う。
  - 複雑なビジネスロジックはここには書かず、必ず `services/` へ委譲すること。
- **`services/` (Service / Business Logic Layer):**
  - Geminiなどの外部API呼び出し、クオータ管理、複雑なDB操作など、純粋なビジネスロジックをカプセル化する。
  - リクエストやレスポンスのオブジェクト（Honoの `Context`）に直接依存せず、純粋な関数として実装しテスト可能にすること。
- **`middlewares/`:**
  - Supabase Authなどの認証や、特定ルートに挟む共通処理を配置する。
- **`types.ts`:**
  - Honoの `Bindings` (環境変数) や `Variables` (ユーザー情報等) を一元管理し、各レイヤーで安全に `import` して使用する。
