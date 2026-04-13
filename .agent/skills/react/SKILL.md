---
name: React & UI Rules
description: 楽観的UI、ソート描画、UX等に関するReactのリファレンスとルール
---

# React & UI Implementation Rules

## Optimistic UI (楽観的UI)

- **楽観的UI更新のフリーズ防止**: API通信を伴うUI操作（並び替え等）は、ロールバックの無限ループを防ぐため、通信中は必ずステート（`isSorting` 等）でUIをロック（`disabled`）すること。

## Sorting & Rendering

- **UIソートとデータソートの分離禁止**: 手動で並び替えられるリストの描画時、`.sort()` に他のカテゴリ等の強制ソート条件を混入させないこと（手動ソート順が反映されなくなるため）。

## UX & Styling

- **ツールチップのUX**: ネイティブの `title` 属性を使用する要素に `cursor-help` を付与しないこと。カーソル変化がツールチップの文字化け（？）と誤認されるため。
- **Icons & Tooltips (Lucide Reactの型エラー回避)**: `lucide-react` のアイコンコンポーネント（例: `<Search />` 等）に直接 `title` 属性を渡すとTypeScriptの型エラーとなるため絶対に行わないこと。ツールチップやタイトルが必要な場合は、アイコンを `<span>` や `<button>` などのラッパー要素で囲み、そちらのラッパー要素に対して `title` 属性や `aria-label` 属性を付与すること。
- **Interactive Feedback & Button Components (環境ごとのボタン実装ルール)**:
  - **App Basecamp (`apps/app/`) の場合**:
    生の `<button>` タグの使用は原則禁止。必ず `import { Button } from "@/components/ui/button"` を使用し、用途に合わせて `variant` (default, outline, ghost, destructive等) と `size` を指定すること。また、`<Link>` コンポーネントをボタン化する際も、独自のクラスをベタ書きせず `buttonVariants` と `cn` を用いて共通テーマを適用すること。
  - **Extension (`apps/extension/`) の場合**:
    現在は共通Buttonコンポーネントが未導入のため、生の `<button>` タグを使用してよい。ただし操作性低下を防ぐため、必ず `cursor-pointer` を付与し、主要な黒色ボタンには `bg-neutral-800 hover:bg-neutral-500 duration-200` などの視覚的フィードバックを明示的に指定すること。

## Hierarchical Navigation UI (階層型ナビゲーションのUIパターン)

- **親要素の責務制限 (Parent-Toggle Pattern)**: ドメインリストなどのアコーディオン付きツリー構造において、親要素（ヘッダー部分）は「開閉（Toggle）のみ」を担当させ、画面遷移やノート選択のイベントを発火させないこと。
- **全体スコープの明示**: ドメイン全体のノートなど、親スコープそのものに紐づくデータへのリンクは、展開されたアコーディオンの子要素の先頭に「🌐 全体のノート」等の独立したアイテムとして明示的に配置し、ユーザーの誤操作を防ぐこと。
- **Search-driven Expansion (検索時の自動展開)**: 検索キーワードが入力されている状態、またはその親要素配下のアイテムが現在アクティブな状態では、ユーザーの視認性を高めるために対象のアコーディオンを自動的に展開（Force Open）するロジックを含めること。


## In-Memory First Pattern (DBアクセスの最適化と履歴管理)

ユーザー入力などの頻繁な状態変化や、親データが未確定の際の子データの作成において、無駄なDBアクセスやゴーストデータの発生を防ぐため、以下の設計パターンを遵守すること。

- **ゴーストデータの防止:** 親データ（例: 新規ドラフト）がDBに未保存の状態で子データ（例: メモ）を作成する場合、裏側で勝手に親を自動保存（Auto-save）してはならない。必ず子データはブラウザのメモリ上（React State）で一時保持し、ユーザーが明示的に保存ボタンを押したタイミングで、親の生成と子の一括同期（Bulk Insert）を行うこと。
- **インメモリ履歴 (Undo/Redo):** テキスト入力やAIによる生成結果など、ユーザーが元の状態に戻したくなる操作に対しては、DBにいちいちスナップショットを保存するのではなく、React State内の配列（In-Memory Stack）を用いて履歴を管理すること。

## Responsive Design (レスポンシブ対応)

- **Responsive Layout Wrapper パターンの徹底**: PCとモバイルで大きく構造が変わるUI（ドロワーやサイドシートへの格納など）を実装する際、1つのコンポーネント内に `hidden md:block` などのCSSクラスを多用して無理に共存させないこと。必ず `useMediaQuery` フックを用いて「PC用レイアウト」と「モバイル用レイアウト（shadcnのDrawer/Sheet等）」を物理的に分離したラッパーコンポーネントを作成し、関心の分離を保つこと。

## UI Component Library (shadcn/ui の制約)

- **部分導入の原則 (Partial Adoption)**:
  本プロジェクトでは、モバイル対応などで複雑なアクセシビリティ（Focus Trapやアニメーション等）が要求されるコンポーネント（例: `Drawer`, `Sheet`, `Dialog`）にのみ特例として `shadcn/ui` を部分的に導入しています。
- **肥大化の防止**:
  基本となるUI（ボタン、カード、入力フォーム等）は、依存関係の肥大化を防ぐため、引き続きピュアな Tailwind CSS を用いて独自実装してください。安易に `bunx shadcn add` を実行してプロジェクト全体をshadcnに依存させることは禁止です。
- **技術仕様 (Tailwind v4 / @base-ui)**:
  当プロジェクトの shadcn コンポーネント群は Tailwind v4 環境に適合するようセットアップされており、Radix UI ではなく `@base-ui` に依存している場合があります（`asChild` ではなく `render` プロップを使用するなど）。コードを生成する際は現在の `components/ui/` 配下の実装パターンを必ず踏襲してください。


## Drag and Drop (@dnd-kit) Rules
- **useSortableの単一呼び出し**: `useSortable` は1つのリストアイテム（同じID）につき必ず1回のみ呼び出すこと。ドラッグハンドルと本体のコンポーネントで二重に呼び出すと、内部エンジンが干渉して機能が完全に停止する。
- **ドラッグハンドルの必須スタイル**: ドラッグハンドルとして機能する要素（アイコンボタン等）には、ブラウザのスクロール操作との干渉を防ぐため必ず `style={{ touchAction: "none" }}` を付与すること。
- **SSR時のHydrationエラー防止**: Next.js (App Router) 環境で `<DndContext>` を使用する場合、サーバーとクライアントでのアクセシビリティID（`aria-describedby`）の不一致によるHydration Mismatchを防ぐため、必ず固定のID（例: `id="notes-dnd-context"`）をプロパティとして渡すこと。

## Sorting & Rendering
- **Fractional Indexingとサーバーソートの同期**: ドラッグ＆ドロップ等でDBの `sort_order` を更新した際、データを取得する親コンポーネント（`page.tsx` 等の Server Component）の取得クエリや、メモリ上での `.sort()` ロジックが「作成日順」等に固定されていないか必ず確認・修正すること。サーバー側の順序が `sort_order` を優先するようになっていないと、リロード時等にUIのスナップバック（巻き戻り現象）が発生する。