---
name: Testing Rules
description: AI-TDDにおけるテストスタック、MSWのモック、およびモノレポ環境特有の罠に関するルール
---

# Testing & AI-TDD Rules

## 1. Test Stack (テストスタックの厳守)

- **API (`api/`)**: `bun test` を使用（Honoの標準テスト）。
- **Extension (`extension/`)**: `Vitest` + `React Testing Library` + `happy-dom`。Chrome APIは `vi.mock()` で適切にモック化すること。
- **Web (`web/`)**: `Vitest` + `React Testing Library` + `jsdom` + `MSW`。
  - ※Web(Next.js)環境ではReact 19を使用しているため、`happy-dom` ではなく必ず `jsdom` を `environment` に指定すること。

## 2. Mocking & Async Assertions (MSWの罠)

- Web側のUIコンポーネントテストにおいて、外部API通信は必ず `MSW (Mock Service Worker)` を用いてネットワークレベルで傍受・モック化すること。
- **ローディング状態の検証禁止**: MSWは0秒でレスポンスを返すため、ボタン押下直後の「一瞬のローディング表示（`isLoading === true`）」を `getByText` 等で検証しようとするとテストが落ちる。ローディングの検証は省き、`await screen.findByText(...)` を用いて最終的なモックデータの描画結果のみを検証すること。

## 3. Monorepo React Version Trap (依存関係のルール)

- **Reactバージョンの完全統一**: `web/` と `extension/` の `package.json` における `react` と `react-dom` のバージョンは、常にキャレット（`^`）を含めて完全に一致させること（例: `^19.2.0`）。わずかでもズレると二重インストールが発生し `Invalid hook call` エラーでテストが崩壊する。
- パッケージを追加・更新した後は、必ずルートディレクトリで依存関係を再構築すること。
