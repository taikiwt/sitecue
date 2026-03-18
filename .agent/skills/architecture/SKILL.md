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
- **Next.jsのCORS警告対応**: `next.config.ts` において、通信警告を抑制するための `allowedDevOrigins: ["127.0.0.1", "localhost"]` を設定する場合は、`experimental` ブロックの中ではなく、必ず**コンフィグのルートレベル**に記述すること。
