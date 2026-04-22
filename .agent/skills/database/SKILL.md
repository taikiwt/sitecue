---
name: Database Rules
description: Supabase、RLS、マイグレーション、およびデータ操作に関する絶対ルール
---

# Database Operations & Rules

## 1. SSOT (Single Source of Truth) の原則
- **スキーマと型の参照**: データベースの構造、テーブル名、カラム名、および `scope` や `note_type` などの Enum値（列挙値）について、このドキュメントや他のMarkdownファイルに具体的な値をハードコードしてはならない。
- **行動規範**: データの構造や型を確認する必要がある場合は、必ず `types/supabase.ts` および `types/app.ts` を絶対的な正として直接読みに行くこと。

## 2. データ操作の実装方針
- **リストの並び替え (Fractional Indexing)**:
  - ユーザーが手動で並び替えるリスト（`sitecue_notes.sort_order` 等）において、整数の再割り当てによる配列の一括更新は行わないこと。
  - 少数（`double precision`）を用いた Fractional Indexing を標準とし、単一レコードの `update` のみで並び替えを完結させる。
- **一括更新における `upsert` の回避**:
  - PostgreSQLの制約上、`upsert` は部分的なデータのみを渡すとNOT NULL制約でエラーになる。
  - そのため、部分的なカラムの更新には必ず個別の `update` を使用すること。

## 3. 開発・マイグレーション・ワークフロー
- **マイグレーション絶対主義**: 本番のダッシュボードで直接テーブルを変更することは厳禁。変更は必ずローカルでテストし、`supabase/migrations` 内にSQLファイルを作成すること。
- **ローカルDBのリセット (`db reset`)**:
  - マイグレーションのテストとして `bunx supabase db reset` を実行すると、`auth.users`（ログインユーザー情報）も初期化される。
  - そのため、リセット後の動作確認で「外部キー制約エラー」が発生した場合は、フロントエンド（拡張機能等）側で一度ログアウトし、再ログインしてユーザーを再作成すること。
- **推測によるマイグレーションの禁止**: テーブルの追加やカラムの拡張が必要だと判断した場合でも、「おそらくこうなっているだろう」という推測でマイグレーションSQLを作成してはならない。
  - 既存の `schema.sql` や Supabaseのダッシュボード情報、あるいは既存のコードから正確なスキーマ状態を必ずユーザーに確認・要求すること。（すでに必要なカラムが存在している車輪の再発明や、既存の構造を破壊するリスクを排除するため）。
  - どうしてもスキーマが不明な状態でSQLを書く必要がある場合は、必ず `IF NOT EXISTS` などを多用した防御的SQL（Defensive SQL）を記述すること。

## 4. セキュリティ (RLS)
- すべてのテーブルにおいて RLS (Row Level Security) の有効化を必須とする。
- 原則として `user_id` カラムを設け、アクセスしてきたユーザー自身のデータのみを操作可能にするポリシーを記述すること。

## 5. 型定義 (`types/supabase.ts`) の自動生成と保護
- AIがTypeScriptのエラーを解消するために `types/supabase.ts` を直接手作業で書き換えることは**絶対に禁止**します。
- カラムやテーブルを追加した場合は、必ずマイグレーションファイルを作成し、ローカルDBに適用 (`bunx supabase db reset` 等) した上で、`bunx supabase gen types typescript --local > [該当パス]/types/supabase.ts` を実行して自動生成してください。

## 6. スキーマ見取り図 (`schema.sql`) の同期
- DBのマイグレーションを行った後は、プロジェクトのコンテキストを最新に保つため、必ず `bunx supabase db dump --local > schema.sql` を実行し、ファイルを上書きしてください。

## 7. PostgRESTのクエリ脆弱性対策
- URLやユーザー入力を条件とする場合、Supabaseの `.or('column.eq."${value}"')` のような文字列連結によるクエリ構築は、カンマ(`,`)やクォーテーション(`"`)によるパースエラー（406 Not Acceptable）やSQLインジェクションのリスクがあるため**使用禁止**です。
- 複雑なOR条件や安全なエスケープが必要な場合は、必ずDB側に RPC（PostgreSQL関数）を作成し、`.rpc('function_name', { args })` を用いてパラメータとして渡してください。
