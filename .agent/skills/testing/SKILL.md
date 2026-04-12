---
name: Testing Rules
description: AI-TDDにおけるテストスタック、MSWのモック、およびモノレポ環境特有の罠に関するルール
---

# Testing & AI-TDD Rules

## 1. Test Stack (テストスタックの厳守)

- **API (`apps/api/`)**: `bun test` を使用（Honoの標準テスト）。
- **Extension (`apps/extension/`)**: `Vitest` + `React Testing Library` + `happy-dom`。Chrome APIは `vi.mock()` で適切にモック化すること。
  - ※Web(Next.js)環境ではReact 19を使用しているため、`happy-dom` ではなく必ず `jsdom` を `environment` に指定すること。
- **E2E (`apps/app/e2e/`)**: `Playwright`
  - テスト起動前の `next dev` 起動漏れを防ぐため、`playwright.config.ts` には必ず `webServer` ブロックを記述すること。

**【テストファイルの配置と命名規則（厳守）】**
- **配置**: 新たなテストファイルを作成する場合は、対象となるコンポーネントや関数ファイルと**必ず同じ階層（コロケーション）**に配置すること。勝手に `__tests__` などの専用ディレクトリを作成しないこと。
- **命名**: ファイル名は `[対象ファイル名].test.ts` または `[対象ファイル名].test.tsx` とすること（例: `RightPaneDetail.tsx` のテストは `RightPaneDetail.test.tsx`）。

## 2. Mocking & Async Assertions (MSWの罠)

- Web側のUIコンポーネントテストにおいて、外部API通信は必ず `MSW (Mock Service Worker)` を用いてネットワークレベルで傍受・モック化すること。
- **ローディング状態の検証禁止**: MSWは0秒でレスポンスを返すため、ボタン押下直後の「一瞬のローディング表示（`isLoading === true`）」を `getByText` 等で検証しようとするとテストが落ちる。ローディングの検証は省き、`await screen.findByText(...)` を用いて最終的なモックデータの描画結果のみを検証すること。

## 3. Monorepo React Version Trap (依存関係のルール)

- **Reactバージョンの完全統一**: `apps/app/` と `apps/extension/` の `package.json` における `react` と `react-dom` のバージョンは、常にキャレット（`^`）を含めて完全に一致させること（例: `^19.2.0`）。わずかでもズレると二重インストールが発生し `Invalid hook call` エラーでテストが崩壊する。
- パッケージを追加・更新した後は、必ずルートディレクトリで依存関係を再構築すること。

## 4. E2E Auth Mocking / Supabase SSR Cookie Injection

Playwright等のE2Eテスト環境において、ローカルのSupabase認証状態をモック（ブラウザコンテキストへ直接Cookie注入）する際は以下のルールを厳守すること。

- **`@supabase/ssr` のCookieフォーマット**:
  - クッキーの名前は `sb-[project_id]-auth-token.[chunk_index]`（ローカルの IP `127.0.0.1` 接続時は通常 `sb-127-auth-token.0` などの形式）となる。
  - クッキーの値は、**必ずプレフィックス `"base64-"`** を付けた後に、JSON文字列をUTF-8で **Base64URLエンコード** した文字列を使用しなければならない（`encodeURIComponent` 単体ではNext.jsへ渡ったときにTypeErrorでクラッシュする）。
  - NG例: `encodeURIComponent(JSON.stringify(session))`
  - OK例: `"base64-" + Buffer.from(JSON.stringify(session), "utf-8").toString("base64url")`
- **Session オブジェクトの完全性**:
  - クッキーに注入するセッション情報（JSON化する元データ）は、`access_token` と `refresh_token` 等の一部だけを抽出してはならない。
  - Supabaseクライアント（`supabase.auth.getUser()` 等）がセッション有効期限を正しく判定できるよう、`/signup` 等のレスポンス（`expires_at`, `expires_in`, `user` を含む完全なSessionオブジェクト形式）を**そのまま欠損なく** `JSON.stringify` に渡すこと。
