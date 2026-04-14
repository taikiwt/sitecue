---
name: UI & Design Rules
description: sitecueのテーマ、セマンティックカラーの運用、環境ごとのUI実装ルール
---

# UI & Design Rules (sitecue Theme)

## 1. Core Design Philosophy
- **Subtraction Aesthetics (引き算の美学)**: 不要なボーダー、過剰なシャドウ、多すぎる色数を徹底的に排除する。コンテンツ（タスクとメモ）自体が主役となるUIを構築する。
- **Implementation Priority**: 抽象的なデザイン理念と、堅牢で業界標準（Industry-standard）な実装手法が競合した場合は、**常に「堅牢で業界標準な実装」を優先**する。見た目のシンプルさのためにアクセシビリティ（a11y）やセマンティックなHTMLを犠牲にしてはならない。

## 2. Visual Language & Color Strict Rules (Tailwind CSS)

### 2.1. Semantic Color Usage (絶対ルール)
AIエディタがUIコンポーネントを生成・修正する際は、`tailwind.config.ts` に定義されたセマンティックカラーを**必ず**使用すること。
Tailwindのデフォルトカラースケール（例: `bg-blue-500`, `text-red-400`, `bg-gray-800` など）を直接ハードコードすることは**厳重に禁止**する。

- **Backgrounds & Borders**:
  - `bg-base-bg` (メイン背景) と `bg-base-surface` (少し浮いた要素) を使い分け、極力ボーダー（`border-base-border`）に頼らず空間で要素を区切る。
- **Action Buttons**:
  - 画面上下などの主要なアクション要素には `bg-action hover:bg-action-hover text-action-text` を使用する。
- **Note Markers (機能的カラー)**:
  - ノートの種類を表すUI（アイコンやバッジ）には以下の色を厳格に割り当てる。装飾目的で他の要素にこれらの色を使用してはならない。
    - **Info**: `text-note-info` または `bg-note-info` (青系)
    - **Alert**: `text-note-alert` または `bg-note-alert` (赤系)
    - **Idea**: `text-note-idea` または `bg-note-idea` (黄系)

## 3. Environment Specific Rules (環境ごとのスタイリング境界)

### 3.1. Markdown & Content Area Styling
環境のコンテキストに応じて、マークダウン内の有彩色の扱いを明確に分ける。

- **Extension (`apps/extension/`)**:
  - ノートの一覧表示が主役であるため、視覚的ノイズを抑え、ノートマークの3色を際立たせるための**徹底したモノクローム**を維持する。
  - リンクテキスト等に青色などを使わないこと（黒文字＋下線などを使用）。
  - 画面内で有彩色が許されるのは、原則として3種類のノートマークとシステム通知（エラー等）のみとする。
- **App Basecamp (`apps/app/`)**:
  - Markdownドキュメントの執筆・閲覧が主役であるため、**ドキュメントの可読性を高めるための機能的な色使いは許可**する。
  - リンクテキストの青色やコードブロックのハイライト等は、Tailwind Typography (`prose`) のトーンやセマンティックカラーの範囲内で適切に適用すること。

### 3.2. Button Components & Interactive Feedback
- **App Basecamp (`apps/app/`)**:
  - 生の `<button>` タグの使用は原則禁止。必ず共通の `<Button>` コンポーネントを使用し、`variant` (default, outline, ghost, link等) を指定してセマンティックカラーと振る舞いを一元管理すること。
- **Extension (`apps/extension/`)**:
  - 共通Buttonコンポーネントが未導入のため、生の `<button>` タグを使用してよい。
  - その場合も、クラス名には必ずセマンティックカラー（例: `bg-action hover:bg-action-hover`）を使用し、心地よいトランジション（`transition-colors duration-200 cursor-pointer`）を付与すること。

## 4. Typography & Icons
- UIテキストはすべて英語とする。
- テキストサイズは `text-sm` を標準とし、過剰に大きな見出し（`text-4xl`など）は避ける。
- アイコンは必ず `lucide-react` を使用し、サイズは原則 `w-4 h-4` または `w-5 h-5` に統一して視覚的ノイズを減らす。
