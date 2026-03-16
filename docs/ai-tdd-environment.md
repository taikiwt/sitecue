### AI-TDD環境構築まとめ

#### 環境構築の目的とアーキテクチャ

Gemini 3.1 Pro（頭脳・設計）とGemini 3 Flash（手足・コーディング）を組み合わせた**「AI主導のテスト駆動開発（AI-TDD）」**を最高速で回すため、各ワークスペースに最適なテスト環境を構築した。

- **`extension/` (Vite/React):** `Vitest` + `React Testing Library` + `happy-dom`
  - Chrome API (`chrome.runtime` 等) をモック化し、UIコンポーネントを高速テスト。
- **`web/` (Next.js):** `Vitest` + `React Testing Library` + `jsdom` + `MSW`
  - バックエンド（Hono）を立ち上げずとも、MSWでAPI通信を傍受・モック化し、Next.jsのClient Componentを独立してテスト。

#### 構築時の特大トラップと解決策（要注意ポイント）

モノレポ（Bun Workspaces）環境において、以下のトラップに遭遇した。今後のパッケージ追加時にも同様の注意が必要。

🚨 罠1: Reactの分裂による `Invalid hook call`

- **原因:** `extension/` と `web/` でReactのバージョン指定がわずかに異なっていた（`^19.2.0` と `19.2.3`）ため、Bunがパッケージの巻き上げ（Hoisting）に失敗。`node_modules` と `web/node_modules` の両方に別々のReactがインストールされ、Vitest実行時にメモリ上でReactが2つ衝突してパニックを起こした。
- **解決策:**
  1. すべての `package.json` でReactのバージョン指定を完全に統一する（例: `"react": "^19.2.0"`）。
  2. ルートディレクトリで `rm -rf node_modules web/node_modules bun.lock` を実行し、完全なクリーンインストールを行う。
  3. 予防薬として、`vitest.config.ts` に `resolve.dedupe: ['react', 'react-dom']` を設定し、強制的に1つのReactを読み込ませる。

🚨 罠2: シンボリックリンクによる `ELOOP` (無限ループ)

- **原因:** Cloudflare (`next-on-pages`) のデプロイバグを回避するために作った `web/web` というシンボリックリンクを、Vitestの監視システム（Watcher）が無限に辿り続け、クラッシュした。
- **解決策:**
  - 物理的なシンボリックリンクは削除する。
  - 代わりに `web/package.json` のビルドコマンド内で「ビルド直前にリンクを作り、完了後に即消す」スクリプトに変更した。

🚨 罠3: 高速すぎるAPIモックによるテスト失敗

- **原因:** MSW（APIモック）のレスポンスが0秒で返ってくるため、「ローディング中（`isLoading`）のUI」を検証しようとしたテストが、一瞬で通り過ぎてしまい要素を見つけられなかった。
- **解決策:** モック環境のテストでは、一瞬のローディング状態の検証は省き、最終的なレンダリング結果（非同期でのデータ表示）の検証に集中させる（`await screen.findByText(...)` を使用）。

#### 最終的な主要設定ファイル (webディレクトリ)

`web/vitest.config.ts`
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

`web/package.json` (抜粋)
バージョン不整合の修正と、Cloudflareデプロイ用の「ヒット＆アウェイ」式ビルドスクリプト

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "pages:build": "ln -s . web && bun x @cloudflare/next-on-pages; rm -f web",
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
