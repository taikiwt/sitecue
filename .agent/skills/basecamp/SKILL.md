# App Basecamp (Next.js) Implementation Rules

sitecueの活動拠点となるApp Basecamp（`apps/app/`）側の実装において、AIエディタが遵守すべきUI/UXおよびNext.js固有の実装ルールを定義する。

## エディタ（Markdown）の実装方針
1. **WYSIWYGの禁止とCodeMirrorの採用:**
   NotionライクなブロックベースのWYSIWYGエディタ（TipTap等）は、DOMの肥大化や入力コントロールの喪失（意図しない自動変換）を招くため採用しない。
   エディタエンジンには拡張性とパフォーマンスに優れた **CodeMirror** (`@uiw/react-codemirror`) を採用し、「Markdown記号を維持したままの控えめなシンタックスハイライト（1ペイン）」を基本UXとする。
2. **Markdownのレンダリング（表示モード）:**
   保存後やプレビューなどの閲覧用画面では、Tailwind CSS v4 の公式プラグインである **Tailwind Typography (`@tailwindcss/typography`)** を使用し、親要素に `className="prose"` を付与することで美しくスタイリングすること。
3. **CodeMirror設定のメモ化必須化 (Prevent Infinite Loops & CPU Spikes):**
   - `@uiw/react-codemirror` コンポーネントに渡す `extensions` プロパティに対し、インラインの配列（`[...]`）やメモ化されていないオブジェクトを直接渡すことは **絶対禁止** とする。
   - レンダリングのたびに新しい配列が生成されると、CodeMirrorが再初期化を繰り返し、`onChange` が暴発してブラウザとサーバーのCPUを100%まで消費する無限ループ（致命的なDDoS状態）を引き起こす。
   - ショートカット（`keymap.of`）などの動的な拡張を追加する際は、必ず `const extensions = useMemo(() => [...], [])` のようにメモ化し、依存配列を正しく管理すること。

## 未保存データの保護とルーティング（App Router）
Next.js App Router 環境では、クライアントサイドルーティング時にブラウザ標準の `beforeunload` が発火しないため、以下の独自ルールでデータ消失を防ぐこと。

1. **グローバルステートによる状態管理:**
   エディタ等の入力画面で未保存の変更（`isDirty`）が発生した場合、その状態はコンポーネント内に閉じず、必ず Zustand (`useEditorStore`) を用いてグローバルに同期すること。
2. **`<CustomLink>` の使用と `router.push()` の制限（未保存ガードの徹底）:**
   アプリ内遷移には `next/link` を直接使わず、必ず `useEditorStore` を監視して離脱警告ダイアログ（confirm）を出すラッパーコンポーネント **`<CustomLink>`** (`@/components/ui/custom-link`) を使用すること。
   **【🚨過去のバグ教訓】** 「戻る」ボタンなどを実装する際、`<Button onClick={() => router.push('/')}>` のように Next.js の `useRouter` を用いて直接遷移させると、この未保存ガードを完全にすり抜けてしまう致命的な不具合が発生した。そのため、ボタンの見た目が必要な場合でも、必ず `<CustomLink href="...">` に対して Tailwind クラス（`buttonVariants` など）を当てて実装し、ユーザーのクリックによる画面遷移で `router.push()` を安易に使用しないこと。
3. **Save後のステート同期バグの回避:**
   保存処理（Save）後に `isDirty` が true のままになるバグを防ぐため、`isDirty` の判定において「ページロード時の初期データ（`initialDraft` 等）」を直接比較対象としないこと。必ずコンポーネント内で `savedState`（最後に保存した状態）を定義し、DB保存成功直後にそのステートを最新値で上書きして比較のベースとすること。

## Base UI Component Rules
- **Popover**: `@base-ui/react` の Popover を使用・実装する際は、必ず `<Popover.Popup>` を `<Popover.Positioner>` でラップすること。これを忘れると `PopoverPositionerContext is missing` のクラッシュエラーが発生するため厳守すること。
- **Floating UIのスタッキングコンテキスト (Explicit z-index for Positioners)**:
  - `@base-ui/react` (または Radix UI) の Popover 等を使用する際、トリガー要素が `sticky` や `fixed` などのスタッキングコンテキストを持つ親要素（例: `z-10` のヘッダー）の内部にある場合、ポップオーバーが親要素の下に隠れてしまう（見切れる）問題が発生する。
  - `<Popover.Popup>` (または `PopoverContent`) 自体に `z-50` を設定するだけでは不十分である。必ずその親となる `<Popover.Positioner>` (または `FloatingPortal` 内のラッパー) に対して明示的に `className="z-50"` 等の z-index を付与し、フローティング要素全体を正しいレイヤーに引き上げること。