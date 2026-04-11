# App Basecamp（Next.js）の拡張ルール

## 1. 独立ルーティング（隔離）の原則

App Basecamp（`apps/app/`）に新しい機能や画面を追加する場合、既存のページ（`/app/page.tsx` など）のUIを直接改修して複雑化させることは厳禁です。
必ず Next.js の App Router の仕組みを利用し、**完全に独立した専用ページ（特設ルーム）** として作成してください。

- **Bad:** 既存の `apps/app/src/app/page.tsx` の中に、モーダルや条件分岐で新しいAI機能をねじ込む。
- **Good:** `apps/app/src/app/studio/page.tsx` のような新しいルーティングを作成し、既存のコードと物理的に切り離す。
※旧 `/weave` パスは拡張機能の古いバージョンとの後方互換性を保つために物理的に残存させているため、新規開発でこのディレクトリを改修してはならない。


## 2. コンポーネントの隔離 (Feature Colocation)

新機能専用のコンポーネントは、共通の `_components/` ディレクトリに漫然と混ぜるのではなく、必ず機能ごとにディレクトリを切って隔離してください。

- **Bad:** Studio画面専用の `PaywallModal.tsx` を `apps/app/src/app/_components/` に置く。
- **Good:** Studio画面専用のコンポーネントは `apps/app/src/app/studio/_components/` を作成してそこに閉じ込める。
- **理由:** 特定のページにしか依存しないサブコンポーネントを機能単位で隔離（Colocation）することで、将来的なリファクタリング時の影響範囲を限定し、コードの肥大化を防ぐため。


## 3. アトミックな機能実装

新機能を追加する際は、App Basecamp（UI）の追加と API（Hono）の追加を1つのプロンプト・1つのコミットで同時に行わないこと。
まずはUIのモックアップ（箱）だけを独立したルーティング上に作り、その後のステップでAPIとの繋ぎ込みを行う「Expand & Contract パターン」を意識してください。

## 4. App Router & OpenNext ビルド制約 (Suspense Rule)

- **`useSearchParams` のラップ必須化**:
  Client Component (`"use client"`) 内で `useSearchParams()` フックを使用する場合、そのコンポーネントまたは呼び出し元を必ず React の `<Suspense fallback={...}>` でラップしてください。
  これを行わないと、OpenNext のビルドプロセス中の静的生成 (Prerendering) がクライアント側のパラメータに依存してしまい、ビルドが完全に失敗します。