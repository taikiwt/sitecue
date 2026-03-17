# Project: SiteCue

# 🚨 開発ルールの絶対遵守事項 (CRITICAL: PACKAGE MANAGER)

- 本プロジェクトのパッケージマネージャーは **Bun** です。
- **絶対に `npm`, `yarn`, `pnpm` を使用しないでください。**
- パッケージの追加、インストール、スクリプトの実行は、必ず `bun add`, `bun install`, `bun run` を使用してください。
- （AIエディタへ）自動コマンド提案で `npm install` や `npm run build` を提示することは固く禁じます。

## Overview

SiteCueは、開発者向けの「コンテキスト認識型メモアプリ」です。
Chrome拡張機能として動作し、現在開いているURLやドメインに紐付いたメモを表示します。将来的な収益化を見据え、無料ユーザーには一定の制限を設けています。

## Architecture Overview

- **Extension**: React + Vite + Tailwind CSS (Chrome Extension Manifest V3) (Path: `extension/`)
- **Web**: Next.js (App Router) (Path: `web/`)
- **Database**: Supabase (PostgreSQL)

## Development Methodology

- **AI-TDD (AI主導テスト駆動開発)**:
  フロントエンド（Web/Extension）のUIコンポーネントや複雑なロジックを実装する際は、実装コードを書く前に必ず `Vitest` と `React Testing Library` を用いたテストコードを先に作成し、そのテストをパスするように実装を行うこと。

## UI/UX Design Principles (引き算の美学)

- **ノイズ除去**: 不要な情報や余白は徹底的に排除する（例：Domain Settingsが未設定の場合は、不自然な空白を作らず左詰めにし、不要なDOMはレンダリングしない）。
- **ユーザーコントロール**: 設定した項目は、常に「解除（設定しない）」状態に戻せるようにする。
- **通知UIの最適化 (Feedback & Noise Reduction)**:
  - ユーザーの操作結果が、画面UIの変化（リストへのアイテム追加など）で明白に伝わる場合、トースト通知などの視覚的ノイズは追加しない。
  - 現在の画面に変化が現れない操作（例: Inboxなど別コンテキストへのバックグラウンド保存）の場合のみ、控えめな成功通知を表示する。
  - エラー発生時は確実にトースト通知等でフィードバックを行い、ユーザーが入力中のデータは絶対に破棄・クリアしないこと。

## ⚠️ Type Definition Rules (型定義の絶対ルール)

- **自動生成ファイルの保護**: `types/supabase.ts` は `bun x supabase gen types` によって自動生成されるファイルです。**AIによる手動での直接編集は絶対に禁止**します（次回の生成時に上書きされ、型が破綻するため）。
- **型のラップ（Front-end Types）**: DBの `CHECK` 制約などで `supabase.ts` 上で単なる `string` になってしまう型（例：`sitecue_notes` の `scope` カラム）は、必ず `types/app.ts` などのフロントエンド用ファイルで厳密なユニオン型（例：`'exact' | 'domain' | 'inbox'`）として定義・ラップして使用してください。
- **コンポーネントからの参照**: UIコンポーネントやHooks（Extension/Web問わず）から型を `import` する際は、可能な限り `types/supabase.ts` を直接参照せず、`types/app.ts` で拡張・ラップされた型を使用してください。

## 🧹 Linting & Code Quality Rules (Biome 絶対遵守)

本プロジェクトは **Biome** を用いた非常に厳格なLintルールを敷いています。AIによるコード生成・修正時は、エラーを出さないために以下のルールを**必ず遵守**してください。

- **`any` 型の禁止**: `any` の使用は厳禁です。未知の型（`catch (e)` など）を受け取る場合は `unknown` を使用し、内部で適切に型アサーション（`const err = e as Error;`）を行ってください。
- **Non-Null Assertion (`!`) の禁止**: 変数末尾の `!` による無理な型強制は絶対にしないでください。`null` や `undefined` の可能性がある場合は、必ず Nullish Coalescing (`?? ""`) やオプショナルチェーン (`?.`) を用いて安全なフォールバックを実装してください。
- **React Hooks の依存配列（Exhaustive Deps）**: `useEffect`, `useCallback`, `useMemo` 内で使用している外部変数や関数は、**すべて漏れなく**依存配列（`[]`）に含めてください。無限ループや Stale Closure を防ぐための絶対条件です。
- **アクセシビリティ (a11y) の徹底**:
  - Reactで `<button>` を出力する際は、必ず `type` 属性 (`type="button"` または `type="submit"`) を明記してください。
  - アイコン等で使用する装飾用の `<svg>` 要素には、必ず `aria-hidden="true"` を付与してください。
- **未使用変数のプレフィックス**: `catch` ブロックのエラー変数やコールバックの引数など、宣言したものの意図的に使用しない変数は、必ず名前にアンダースコア `_` を付けてください（例: `_err`, `_nextPath`）。
