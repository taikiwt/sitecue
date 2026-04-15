# AI駆動開発におけるRepomix活用ガイド

## 概要

本プロジェクト（SiteCue）は、モノレポ構成かつ複雑な依存関係を持つため、AI（特に Gemini Flash 等）に一度に全コードを渡すと、コンテキストの過負荷による推論精度の低下や「読み飛ばし」が発生します。これを防ぐため、情報を**「低解像度の地図（Skeleton）」**と**「高解像度の詳細コード」**に分けて管理する戦略を採用します。

## 1. 階層的コンテキスト戦略

AIとの対話は、以下の2ステップで行います。

### ステップ1：プロジェクト・スケルトンの提供

まず、プロジェクトの全体像を伝えるための軽量なファイル（`repomix-skeleton-output.md`）を渡します。
- **目的**: AIにディレクトリ構造、技術スタック、開発ルール（`.agent/`）、データ型を把握させる。
- **役割**: AIに「どのファイルを修正すべきか」を判断させるための「地図」として機能させる。

### ステップ2：ターゲットを絞った詳細コードの提供

ステップ1でAIが特定したファイルのみを、通常のRepomixコマンドで固めて渡します。
- **目的**: 具体的なロジックの実装やデバッグを行う。
- **メリット**: AIの注意力が特定のコードに集中し、バグの混入を防げる。

---

## 2. スケルトンファイルの作り方

専用の設定ファイル `repomix-skeleton.config.json` を使用して生成します。

### 設定のポイント

- **ルールと型の優先**: `.agent/**/*` と `**/*.d.ts` を含め、AIがプロジェクトの「掟」と「データ形状」を常に意識するようにします。
- **ルーティングの可視化**: `page.tsx` や `layout.tsx` のパスを含めることで、アプリの画面構成を伝えます。
- **ロジックの除外**: 具体的な実装（`index.ts` など）は、肥大化している場合はあえて除外し、AIには「入り口」だけを見せるように調整します。

### 推奨設定例 (`repomix-skeleton.config.json`)

```json
{
  "include": [
    ".agent/**/*",
    "package.json",
    "turbo.json",
    "**/package.json",
    "**/tsconfig.json",
    "**/README.md",
    "**/*.d.ts",
    "**/src/types/**/*.{ts,tsx}",
    "apps/app/src/app/**/page.tsx",
    "apps/app/src/app/**/layout.tsx",
    "apps/extension/src/entrypoints/**/index.tsx",
    "supabase/schema.sql"
  ],
  "output": {
    "filePath": "repomix-skeleton-output.md",
    "removeComments": true,
    "removeEmptyLines": true,
    "topHeader": "PROJECT SKELETON: This file contains structure, rules, and types. Use this as a map."
  }
}
```

---

## 2. スケルトンファイルの構成解説

現在使用している `repomix-skeleton.config.json` の各設定項目は、以下の意図で調整されています。

## include（含めるファイル）の役割

AIに「最低限これだけは知っておいてほしい情報」を定義します。

- **`.agent/**/*`**: プロジェクト固有の開発ルールやスキル。
- **`**/package.json` / `turbo.json`**: 依存ライブラリとモノレポのタスク構成。
- **`**/*.d.ts` / `**/src/types/**/*`**: プロジェクト全体の型定義（地図の凡例）。
- **`**/src/index.{ts,tsx}`**: 各モジュールやAPIのエントリーポイント（入り口）。
- **`apps/app/src/app/**/page.tsx`**: Next.jsのルーティング構造。
- **`supabase/schema.sql`**: データベースの最新構造。

### 3. 設定ファイルの調整ガイド（自分で行う場合）

プロジェクトの状況に合わせて、`include` 配列を以下のように調整できます。

#### A. 情報量をさらに減らしたい（さらに低解像度にする）

AIが混乱していると感じたら、実装に近いファイルを削ります。
- `**/src/index.{ts,tsx}` を削除する。
- `**/src/constants/**/*` を削除する。
これにより、AIは「パスと型」だけに集中するようになります。

#### B. 特定の領域の解像度を上げたい

例えば、現在はApp側の作業が多いですが、API側のリファクタリングを集中して行う場合は以下を追加します。
- `apps/api/src/routes/**/*.ts`（APIの各ルート定義を追加）
- `apps/api/src/services/**/*.ts`（ビジネスロジックを追加）

#### C. 出力形式の変更

`output` セクションでAIへの「接し方」を変えられます。
- **`topHeader`**: AIが最初に読むメッセージです。ここに「まずは〇〇を読んで」と書くことで、AIの挙動をコントロールできます。
- **`removeComments` / `removeEmptyLines`**: トークン節約のために `true` を推奨します。

---


## 4. 運用フローとプロンプト

### 除外ファイルの設定

Repomixはデフォルトで `.gitignore` の設定を反映するが、いくつかRepomix用に除外すべきファイルもあるので `.repomixignore` で設定する

```
# 1. 自動生成される型定義ファイル（Git管理下だがAIには不要なもの）
**/worker-configuration.d.ts

# 2. パッケージマネージャーのロックファイル（Git管理下だが文字数が膨大なため除外）
bun.lock
bun.lockb

# 3. メディアファイル（画像・アイコン等のバイナリ、Git管理下）
**/*.png
**/*.svg
**/*.ico
**/*.jpg
**/*.jpeg
**/*.webp
**/*.gif

# 4. 一時的なスクラッチパッド・不要ファイル（Git管理下だがコンテキスト不要）
supabase/snippets/

# 5. DBのマイグレーションファイル(履歴)
# ※AIにDB構造を伝えるなら最新の schema.sql だけで十分なため、過去の差分履歴は除外
supabase/migrations/

# 6. WXTの自動生成ファイル・ビルド出力
# ※.gitignoreにも記載しているが、AIのコンテキストを無駄に消費しないよう念押しで除外
.wxt/
.output/
```


### 生成コマンド

```bash
# 1. プロジェクト全体のスケルトン（地図）を生成する(設定ファイルを使って生成)
bun x repomix --config repomix-skeleton.config.json

# 2. プロジェクト全体を網羅して生成する( `repomix-output.xml` が作られる)
bun x repomix

# 3. 特定のアプリ（例: Extension）の全ファイルを固める
bun x repomix apps/extension

# 4. 特定の修正対象ファイルだけをピンポイントで固める（複数指定）
bun x repomix apps/app/src/app/notes/page.tsx apps/app/src/app/notes/_components/RightPaneDetail.tsx

# 5. 特定のディレクトリ配下をすべて含めつつ、出力ファイル名を指定する
bun x repomix apps/api --output api-detail.md

# 6. 設定ファイルを使わず、その場で特定の拡張子だけを抽出する
bun x repomix --include "**/*.ts,**/*.tsx" --ignore "**/node_modules/**,**/.next/**"
```

### AIへの指示テンプレート

> 「プロジェクトのスケルトン情報を渡します。
> 1. まず `.agent/` 内のルールを読み込み、最優先の制約として遵守してください。
> 2. 次に全体の構造を把握してください。
> 3. 具体的なコードの修正提案が必要な場合、いきなり推測で書かずに、必要なファイルパスを列挙して私に要求してください。」

---

## 4. メンテナンスのタイミング

以下の変更があった場合は、スケルトンファイルを再生成してください。
- 新しいパッケージや主要なディレクトリを追加したとき。
- `.agent/` 内のルールを更新したとき。
- データベースのスキーマ（`schema.sql`）を変更したとき。

