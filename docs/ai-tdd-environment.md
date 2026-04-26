# AI-TDD環境構築まとめ

## 環境構築の目的とアーキテクチャ

Gemini 3.1 Pro（頭脳・設計）とGemini 3 Flash（手足・コーディング）を組み合わせた**「AI主導のテスト駆動開発（AI-TDD）」**を最高速で回すため、各ワークスペースに最適なテスト環境を構築した。

- **`apps/extension/` (WXT/React):** `Vitest` + `React Testing Library` + `happy-dom`
  - Chrome API (`chrome.runtime` 等) をモック化し、UIコンポーネントを高速テスト。
- **`apps/app/` (Next.js):** `Vitest` + `React Testing Library` + `jsdom` + `MSW`
  - バックエンド（Hono）を立ち上げずとも、MSWでAPI通信を傍受・モック化し、Next.jsのClient Componentを独立してテスト。

## 構築時の特大トラップと解決策（要注意ポイント）

モノレポ（Bun Workspaces）環境において、以下のトラップに遭遇した。今後のパッケージ追加時にも同様の注意が必要。

🚨 罠1: Reactの分裂による `Invalid hook call`

- **原因:** `apps/extension/` と `apps/app/` でReactのバージョン指定がわずかに異なっていた（`^19.2.0` と `19.2.3`）ため、Bunがパッケージの巻き上げ（Hoisting）に失敗。`node_modules` と `apps/app/node_modules` の両方に別々のReactがインストールされ、Vitest実行時にメモリ上でReactが2つ衝突してパニックを起こした。
- **解決策:**
  1. すべての `package.json` でReactのバージョン指定を完全に統一する（例: `"react": "^19.2.0"`）。
  2. ルートディレクトリで `rm -rf node_modules apps/app/node_modules bun.lock` を実行し、完全なクリーンインストールを行う。
  3. 予防薬として、`vitest.config.ts` に `resolve.dedupe: ['react', 'react-dom']` を設定し、強制的に1つのReactを読み込ませる。

🚨 罠2: 高速すぎるAPIモックによるテスト失敗

- **原因:** MSW（APIモック）のレスポンスが0秒で返ってくるため、「ローディング中（`isLoading`）のUI」を検証しようとしたテストが、一瞬で通り過ぎてしまい要素を見つけられなかった。
- **解決策:** モック環境のテストでは、一瞬のローディング状態の検証は省き、最終的なレンダリング結果（非同期でのデータ表示）の検証に集中させる（`await screen.findByText(...)` を使用）。

🚨 罠3: エディタ（TSサーバー）のゴーストエラー（`--jsx` エラー等）
- **原因:** モノレポのルートディレクトリをVSCodeやNeovimで開いた際、エディタのTypeScriptサーバーが各 `apps/` 配下の専用 `tsconfig.json`（WXTの自動生成など）を正しく認識できず、ルートの設定で `.tsx` を解析しようとして `--jsx` エラーや「モジュールが見つからない」という警告を大量発生させることがある。
- **解決策:**
  1. エディタ上の赤線は「表示上の問題（ゴーストエラー）」である可能性を疑うこと。
  2. 本当にコードが壊れているのかを判定するためには、エディタの波線に頼らず、必ずターミナルで `bun run typecheck` (`tsc --noEmit`) を実行すること。CLIでエラーが出なければ、コード自体は正常である。
  3. エディタの表示を直すには、TSサーバーの再起動、またはルートに全体を束ねる `tsconfig.json` (Project References) を適切に配置してエディタに構造を教える必要がある。


## 最終的な主要設定ファイル (apps/app ディレクトリ)

`apps/app/vitest.config.ts`
不要な除外設定を削ぎ落とし、モノレポのReact重複排除（dedupe）と、SWCコンパイラを使用した最速の設定

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  // モノレポ環境で複数のReactが読み込まれるのを強制的に防ぐ（ベストプラクティス）
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // 探索範囲をsrc以下に限定し、パフォーマンス低下やルート外への暴走を防ぐ
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
```

`apps/app/package.json` (抜粋)
バージョン不整合の修正と、Cloudflare Workers用デプロイコマンド

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "bun x opennextjs-cloudflare build",
    "deploy": "bun x wrangler deploy",
    "start": "next start",
    "test": "vitest",
    "test:ui": "vitest --ui"
  },
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  }
}
```

## 📝 Playwright E2Eテスト実装の備忘録

### 1. 実行コマンドと環境の仕様

- **テストの実行方法:**
  1. 事前にローカルSupabaseを起動しておく（`bun run supabase start`）.
  2. `cd apps/app` に移動し、`bun run test:e2e` を実行する.
  3. （※UIモードで視覚的に確認したい場合は `bun run test:e2e --ui`）.
- **Next.jsの自動起動:** `apps/app/playwright.config.ts` の `webServer` 設定により、テスト実行時に自動でNext.js（`bun run dev`）が立ち上がるよう構成されているため、Next.js側を事前に手動起動しておく必要はなくなりました.

### 2. アーキテクチャの要点（本番コード無変更の原則）

- **バックドアを使わないセッション注入:** 今回のテスト最大の成果は、「テストのために本番コード（Next.js側）に隠しAPI等を追加しなかったこと」です。 テスト開始時に裏側でSupabaseのAPI（`/auth/v1/signup` 等）を叩いて毎度ユニークなテストユーザーを動的生成し、取得したアクセストークンをPlaywrightのブラウザ（BrowserContext）に直接Cookieとして焼き付けることで、本番と全く同じログイン状態を再現しています.

### 3. 将来テストが落ちた時に疑うべき「3つの罠」

今後、Next.jsやSupabaseのライブラリをアップデートした際にテストが壊れたら、以下のトラップを最初に疑ってください。

1. **Supabase SSRの特殊なCookie仕様（Chunking）** `@supabase/ssr` は、Cookieにトークンを保存する際、サイズ制限を回避するために `sb-127-auth-token.0`, `sb-127-auth-token.1` のように分割（チャンク化）し、さらに値の先頭に `base64-` を付けてBase64URLエンコードするというマニアックな仕様を持っています。もしSupabaseのメジャーアップデート等でこの仕様が変わるとシナリオBが落ちるため、Cookieの生成ロジックを見直す必要があります。
2. **URLパラメータのエンコード不一致** ブラウザのリダイレクトをテストで検証（`expect`）する際は、`://` などが `%3A%2F%2F` に自動変換されます。文字列を比較する際は、必ず `encodeURIComponent` を通した値と比較する必要があります（シナリオAで引っかかった罠です）。
3. **`localhost` vs `127.0.0.1` のすれ違い** sitecueプロジェクトの絶対ルールとして、ローカルテストのアクセス先は `127.0.0.1` に厳格に固定しています（Supabase AuthのCookieのDomain仕様や、Next.jsの内部ルーティングバグを回避するため）。Playwright内で `localhost` という文字列が使われていないか常に注意してください。
