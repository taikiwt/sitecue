---
name: Architecture Rules
description: システム間連携の標準パターン、アーキテクチャ要件、およびネットワーク構成のルール
---

# Architecture & Integration Patterns

## ワンタイム・データリレー・アーキテクチャ

拡張機能からWeb側へ巨大なデータ（ページテキスト等）を渡す場合の標準パターンは以下の「ワンタイム・データリレー」方式とする。

1. **Storage (Extension ➔ DB)**: 拡張機能から Supabase の `sitecue_page_contents` テーブルに直接巨大なデータを `INSERT` し、返却された `context_id` (UUID) を取得する。
2. **Relay (Extension ➔ Web)**: 取得した `context_id` を URLパラメータ (例: `?context_id=...`) に付与して Webダッシュボードの特定のページを開く。
3. **Consume & Cleanup (Web ➔ API ➔ DB)**: Web側のAPI (Hono) でその `context_id` を用いてデータを `SELECT` した後、**直ちにそのレコードを `DELETE` し**、DBに一時データを恒久的なゴミとして残さないようにする。

## ローカル開発環境のネットワーク固定化

ローカル環境におけるAPI (Wrangler/Hono) と Web (Next.js) 間の通信トラブルや IPv4/IPv6 のすれ違いを防ぐため、以下のネットワークルールを厳守すること。

- **IPv4/IPv6のすれ違い防止**: API (Wrangler) と Web (Next.js) 間のローカル通信において `localhost` の使用は**禁止**する。必ず `127.0.0.1` を使用すること。
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

- **Webダッシュボード (Next.js)**: `app.sitecue.app` 等のサブドメインを使用する。
- **API (Hono)**: `api.sitecue.app` を使用し、Web側と明確に分離してCORSを厳格に管理する。
- **LP (将来追加)**: ネイキッドドメイン `sitecue.app` は、将来的にSEOや高速表示に特化したLP（または別システム）をデプロイするために予約・隔離しておく。
