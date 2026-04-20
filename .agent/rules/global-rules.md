---
trigger: always_on
---

# Project: SiteCue

# 🚨 開発ルールの絶対遵守事項 (CRITICAL: PACKAGE MANAGER)

- 本プロジェクトのパッケージマネージャーは **Bun** です。
- **絶対に `npm`, `yarn`, `pnpm` を使用しないでください。**
- パッケージの追加、インストール、スクリプトの実行は、必ず `bun add`, `bun install`, `bun run` を使用してください。
- （AIエディタへ）自動コマンド提案で `npm install` や `npm run build` を提示することは固く禁じます。

## Overview

SiteCueは、Webで日々活動する人向けの「コンテキスト認識型メモアプリ」です。
現在開いているURLやドメインに紐付いたメモを瞬時に表示・記録する「Chrome拡張機能」と、蓄積したメモを俯瞰して本格的な執筆や情報整理を行うWebアプリケーション「App Basecamp」の両輪で動作します。

## Architecture Overview

- **Monorepo**: Turborepoを用いたモノレポ構成（`apps/` や `packages/` で管理）。
- **Extension**: React + WXT + Tailwind CSS (Chrome Extension Manifest V3) (Path: `apps/extension/`)
- **App Basecamp**: Next.js (App Router) powered by **OpenNext** on **Cloudflare Workers** (Path: `apps/app/`)
  - ※ 過去の `web/` ディレクトリは `apps/app/` に移行されました。
- **API**: Cloudflare Workers + Hono (Path: `apps/api/`)
- **Database**: Supabase (PostgreSQL)

## Development Methodology

- **AI-TDD (AI主導テスト駆動開発)**:
  フロントエンド（App Basecamp/Extension）のUIコンポーネントや複雑なロジックを実装する際は、実装コードを書く前に必ず `Vitest` と `React Testing Library` を用いたテストコードを先に作成し、そのテストをパスするように実装を行うこと。

## UI/UX Design Principles & Rules

- **UI/UXに関する絶対的なルール（引き算の美学、セマンティックカラー、英語化の原則、アイコンの統一など）は、すべて `.agent/rules/ui-rules.md` に集約されています。**
- AIエディタがUIコンポーネントを生成・修正する際は、必ず上記のファイルを参照し、プロジェクトのデザイン理念と完全に一致させてください。

## ⚠️ Type Definition Rules (型定義の絶対ルール)

- **自動生成ファイルの保護**: `types/supabase.ts` は `bun x supabase gen types` によって自動生成されるファイルです。**AIによる手動での直接編集は絶対に禁止**します（次回の生成時に上書きされ、型が破綻するため）。
- **型のラップ（Front-end Types）**: DBの `CHECK` 制約などで `supabase.ts` 上で単なる `string` になってしまう型（例：`sitecue_notes` の `scope` カラム）は、必ず `types/app.ts` などのフロントエンド用ファイルで厳密なユニオン型（例：`'exact' | 'domain' | 'inbox'`）として定義・ラップして使用してください。
- **コンポーネントからの参照**: UIコンポーネントやHooks（Extension/App Basecamp問わず）から型を `import` する際は、可能な限り `types/supabase.ts` を直接参照せず、`types/app.ts` で拡張・ラップされた型を使用してください。

## 🧹 Linting & Code Quality Rules (Biome 絶対遵守)

本プロジェクトは **Biome** を用いた非常に厳格なLintルールを敷いています。AIによるコード生成・修正時は、エラーを出さないために以下のルールを**必ず遵守**してください。

- **`any` 型の禁止**: `any` の使用は厳禁です。未知の型（`catch (e)` など）を受け取る場合は `unknown` を使用し、内部で適切に型アサーション（`const err = e as Error;`）を行ってください。
- **Non-Null Assertion (`!`) の禁止**: 変数末尾の `!` による無理な型強制は絶対にしないでください。`null` や `undefined` の可能性がある場合は、必ず Nullish Coalescing (`?? ""`) やオプショナルチェーン (`?.`) を用いて安全なフォールバックを実装してください。
- **React Hooks の依存配列（Exhaustive Deps）**: `useEffect`, `useCallback`, `useMemo` 内で使用している外部変数や関数は、**すべて漏れなく**依存配列（`[]`）に含めてください。無限ループや Stale Closure を防ぐための絶対条件です。
- **アクセシビリティ (a11y) の徹底**:
  - Reactで `<button>` を出力する際は、必ず `type` 属性 (`type="button"` または `type="submit"`) を明記してください。
  - アイコン等で使用する装飾用の `<svg>` 要素には、必ず `aria-hidden="true"` を付与してください。
- **未使用変数のプレフィックス**: `catch` ブロックのエラー変数やコールバックの引数など、宣言したものの意図的に使用しない変数は、必ず名前にアンダースコア `_` を付けてください（例: `_err`, `_nextPath`）。
- **型チェックとパス解決の徹底 (Type Checking)**:
  - Biomeは高速な反面、「`import` 先のファイルが存在するか」「型が一致しているか」をチェックしません。
  - コードの修正後は、Biomeによるチェックに加えて、必ず対象のワークスペース（例: `apps/extension/`）に移動し、`bunx tsc --noEmit` を実行して、モジュール解決エラーや型の不整合が発生していないか確認してください（`package.json` に typecheck スクリプトは登録されていません）。

## 🔗 URL & Data Handling Rules (データとURLの取り扱い)

- **URLパースの安全性 (Safety Parsing)**: データベースの `url_pattern` には、URLだけでなく `inbox` などの特殊な文字列が入る仕様になっています。そのため `new URL()` を使用する際は、`Invalid URL` エラーによるアプリのクラッシュを防ぐため、必ず `try-catch` を用いた安全なパース機構（例: `getSafeUrl` 等）を経由してください。
- **表記揺れの排除 (URL Normalization)**: URLを用いたデータのグルーピングやフィルタリングを行う際は、生の文字列をそのまま比較せず、必ず共通の正規化ユーティリティ（例: `normalizeUrlForGrouping`）を使用し、`www.` や末尾の `/` を除去して統一的に扱うこと。

- **URLコンテキスト（検索・絞り込み状態）の安全な引き継ぎ**:
  - **事象**: グローバル検索がアクティブな状態で、左サイドバーから別のドメインやページ（`exact`）をクリックした際、生成されたリンク（`href`）が現在の検索パラメータを含んでいなかったため、クリックと同時に検索状態が意図せずリセットされてしまうバグが発生した。
  - **ルール**: アプリケーション内でナビゲーションリンク（`href`）を構築する際、現在のURLにグローバルな状態（`q` や `tags` などの検索・フィルターパラメータ）が存在する場合は、それを意図的にリセットするアクションでない限り、新しいURLにもパラメータを必ず引き継ぐこと。適宜 `URLSearchParams` を用いて再構築するヘルパー関数などを使用し、コンテキストの欠落を防ぐこと。