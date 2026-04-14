# App Basecamp (Next.js) Implementation Rules

SiteCueの活動拠点となるApp Basecamp（`apps/app/`）側の実装において、AIエディタが遵守すべきUI/UXおよびNext.js固有の実装ルールを定義する。

## エディタ（Markdown）の実装方針
1. **WYSIWYGの禁止とCodeMirrorの採用:**
   NotionライクなブロックベースのWYSIWYGエディタ（TipTap等）は、DOMの肥大化や入力コントロールの喪失（意図しない自動変換）を招くため採用しない。
   エディタエンジンには拡張性とパフォーマンスに優れた **CodeMirror** (`@uiw/react-codemirror`) を採用し、「Markdown記号を維持したままの控えめなシンタックスハイライト（1ペイン）」を基本UXとする。
2. **Markdownのレンダリング（表示モード）:**
   保存後やプレビューなどの閲覧用画面では、Tailwind CSS v4 の公式プラグインである **Tailwind Typography (`@tailwindcss/typography`)** を使用し、親要素に `className="prose"` を付与することで美しくスタイリングすること。

## 未保存データの保護とルーティング（App Router）
Next.js App Router 環境では、クライアントサイドルーティング時にブラウザ標準の `beforeunload` が発火しないため、以下の独自ルールでデータ消失を防ぐこと。

1. **グローバルステートによる状態管理:**
   エディタ等の入力画面で未保存の変更（`isDirty`）が発生した場合、その状態はコンポーネント内に閉じず、必ず Zustand (`useEditorStore`) を用いてグローバルに同期すること。
2. **`<CustomLink>` の使用の徹底:**
   アプリ内遷移には `next/link` を直接使わず、必ず `useEditorStore` を監視して離脱警告ダイアログ（confirm）を出すラッパーコンポーネント **`<CustomLink>`** (`@/components/ui/custom-link`) を使用すること。また、実装時はNext.jsの静的解析エラー（404バグ）を防ぐため、`href` は props に含めず明示的に抽出して `<Link href={href} ...>` に渡すこと。
3. **Save後のステート同期バグの回避:**
   保存処理（Save）後に `isDirty` が true のままになるバグを防ぐため、`isDirty` の判定において「ページロード時の初期データ（`initialDraft` 等）」を直接比較対象としないこと。必ずコンポーネント内で `savedState`（最後に保存した状態）を定義し、DB保存成功直後にそのステートを最新値で上書きして比較のベースとすること。

## Base UI Component Rules
- **Popover**: `@base-ui/react` の Popover を使用・実装する際は、必ず `<Popover.Popup>` を `<Popover.Positioner>` でラップすること。これを忘れると `PopoverPositionerContext is missing` のクラッシュエラーが発生するため厳守すること。