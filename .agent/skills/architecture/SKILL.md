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
