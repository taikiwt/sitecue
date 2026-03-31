---
name: Extension Rules
description: Extensionのアーキテクチャ、権限戦略、Markdownレンダリング、Auth戦略のルール
---

# Extension Architecture & Rules

- **Extension**: React + WXT + Tailwind CSS (Chrome Extension Manifest V3)
  - Path: `apps/extension/`
  - **Key Libraries**:
    - `react-textarea-autosize`: テキスト入力の自動伸長に使用。
    - `lucide-react`: アイコン表示に使用。
  - **Communication Pattern**: Supabase JS Client (`@supabase/supabase-js`) を使用して **DBと直接通信する**。
  - 🧩 **Shared Logic & Utilities (Background vs. UI)**:
    - **DRY原則と一貫性**: URLの正規化やパースなど、コアなドメインロジックをバックグラウンド（`background.ts`）とサイドパネル（UI側）で二重管理・再定義しないこと。不整合を防ぐため、必ず `utils/` 配下の共通関数を `import` して使用する。
    - **⚠️ Service Worker Constraints (DOM依存への警戒)**:
      - `background.ts` は Service Worker 上で動作するため、`window` や `document` などのDOM APIにアクセスすると拡張機能が即座にクラッシュする。
      - 共通Utilityファイル（例: `utils/url.ts`）をバックグラウンドで読み込む際は、そのファイルのトップレベルにDOMに依存する処理が含まれていないか必ず確認すること。
      - DOM依存の関数と純粋なロジック関数が同じファイルに同居している場合は、バックグラウンド側からは「純粋なロジック関数のみ」を呼び出すよう細心の注意を払うこと（可能であれば将来的にDOM依存ファイルと純粋なロジックファイルは分離することが望ましい）。
  - ⛔ **Prohibited**: `apps/extension/` から `apps/api/` (Cloudflare Workers) を経由してCRUDを行ってはならない。`axios` や `fetch` でバックエンドを叩くのは禁止。
  - ⚙️ **Manifest Configuration (開発/本番の動的切り替え)**:
    - ローカル開発中の誤操作を防ぐため、`wxt.config.ts` にて拡張機能の名称（`[DEV] sitecue`）や開発用アイコンへの差し替えを動的に行っています。
    - 拡張機能のメタデータ（アイコンや名称など）を変更・追加する際は、静的な `manifest.json` ではなく、すべて `wxt.config.ts` 内で定義してください。
  - 🛡️ **Permissions Strategy (権限戦略 - 引き算の美学)**:
    - 拡張機能の `wxt.config.ts` における権限要求は極限まで最小化し、ユーザーのインストール時に不要な警戒感（「〇〇上にある自分のデータの読み取りと変更」等）を与えないことを徹底する。
    - **Dynamic Permissions (Safety First)**: `<all_urls>` を `host_permissions` に直接記述することは審査リスクの増大とユーザーの警戒感を招くため**絶対禁止**とする。対象ページへのアクセスが必要な場合は、必ず `optional_host_permissions` に定義し、処理実行の直前に `browser.permissions.request` を用いて、ユーザーのアクションに応じた動的な権限要求を行うこと。
    - 外部API（Supabase等）との通信は、原則として `host_permissions` を使用せず、サーバー側の **CORS設定** で拡張機能IDを許可することで通信を行うこと。
    - ローカル開発用のURL（`http://localhost/*`, `http://127.0.0.1/*`）は開発体験（DX）維持のため `wxt.config.ts` の `host_permissions` に残し、本番ビルド時（`command === 'build'`）にのみ自動除外する仕組みを維持すること。

## Markdown Rendering Rules

- 拡張機能の「軽快さ」を死守するため、バンドルサイズを肥大化させる重いライブラリの使用を固く禁ずる。
- **Text Rendering**: `react-markdown` を使用。
  - プラグイン: `remark-breaks` (改行反映), `remark-gfm` (タスクリスト等のGFM対応)。
- **Syntax Highlighting**: `react-syntax-highlighter` を使用。
  - **重要**: 全言語バンドル（`Prism`）のインポートは厳禁。必ず `PrismLight` を使用し、必要な主要言語（js, ts, jsx, tsx, python, sql, bash, json, yaml, toml, html, css, diff, markdown）のみを個別に `registerLanguage` して使用すること。

## Authentication Strategy

- **Provider**: Supabase Auth
- **Methods**: OAuth (Google, GitHub) ※Email/Passwordは廃止済み
- **Extension Constraints (重要)**:
  - Chrome拡張機能（SidePanel等）内では通常のリダイレクトによるOAuthフローが機能しない。
  - そのため、ソーシャルログインの実装・改修を行う際は、必ず `chrome.identity.launchWebAuthFlow` を使用すること。
  - Supabaseの `signInWithOAuth()` を呼び出す際は、`options.redirectTo` に `chrome.identity.getRedirectURL()` で動的に取得したURL（`https://<app-id>.chromiumapp.org/`）を必ず指定し、PKCEフローで認証を完了させること。
  - **アカウント選択の強制**: Googleログイン時は必ず `options: { queryParams: { prompt: 'select_account' } }` を付与し、意図しないアカウントでの自動ログインを防ぐこと。

## Security & Fail-safe Mechanisms (Safety First)

- **Kill Switch & Circuit Breaker**:
  - 対象ページに対して重い処理（全体テキストの抽出など）やDOMアクセス（`chrome.scripting.executeScript`等）を行う場合、ブラウザのフリーズを防ぐためのフェイルセーフを必ず実装すること。
  - 処理には必ず `withTimeout` 等でタイムアウト（例: 3秒）を設ける。
  - 取得データ量も拡張機能側の元栓で制限する（例: `document.body.innerText` の先頭5万文字までなど）。
  - `catch` ブロックでのエラーハンドリング時、巨大なオブジェクトをそのまま `console.error` 等に出力しないこと。速やかに `window.close()` 等を呼んでプロセスを強制終了させ、PCのフリーズを回避すること。
