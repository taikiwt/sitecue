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
  - **Communication Pattern**: `@sitecue/shared` から提供される純粋なDAL関数を直接インポートして使用すること。
  - 🧩 **Shared Logic & Utilities (Background vs. UI)**:
    - **DRY原則と一貫性**: URLの正規化やパースなど、コアなドメインロジックをバックグラウンド（`background.ts`）とサイドパネル（UI側）で二重管理・再定義しないこと。
    - **⚠️ Service Worker Constraints (DOM依存への警戒) とインポート戦略**:
      - `background.ts` は Service Worker 上で動作するため、`window` や `document` などのDOM APIにアクセスすると拡張機能が即座にクラッシュする。
      - 当プロジェクトでは環境依存コードの混入を防ぐため、純粋なドメインロジックのみを抽出した共通パッケージ `@sitecue/shared` が導入されている。
      - **絶対ルール**: Service Worker側（`background.ts` 等）からURL正規化やタグ抽出などのロジックを呼び出す際は、環境依存コードを含むローカルの `utils/url.ts` を絶対に経由してはならない。クラッシュリスクを完全に排除するため、必ず `@sitecue/shared` から直接純粋な関数をインポートして使用すること。
  - ⛔ **Prohibited**: apps/extension/ から自社DBのCRUD操作のために apps/api/ (Hono) を経由することは禁止（必ず `@sitecue/shared` のDALを経由すること）。
  - ⚙️ **Manifest Configuration (開発/本番の動的切り替え)**:
    - ローカル開発中の誤操作を防ぐため、`wxt.config.ts` にて拡張機能の名称（`[DEV] sitecue`）や開発用アイコンへの差し替えを動的に行っています。
    - 拡張機能のメタデータ（アイコンや名称など）を変更・追加する際は、静的な `manifest.json` ではなく、すべて `wxt.config.ts` 内で定義してください。
  - 🛡️ **Permissions Strategy (権限戦略 - 引き算の美学)**:
    - 拡張機能の `wxt.config.ts` における権限要求は極限まで最小化し、ユーザーのインストール時に不要な警戒感（「〇〇上にある自分のデータの読み取りと変更」等）を与えないことを徹底する。
    - **Dynamic Permissions (Safety First)**: `<all_urls>` を `host_permissions` に直接記述することは審査リスクの増大とユーザーの警戒感を招くため**絶対禁止**とする。対象ページへのアクセスが必要な場合は、必ず `optional_host_permissions` に定義し、処理実行の直前に `browser.permissions.request` を用いて、ユーザーのアクションに応じた動的な権限要求を行うこと。
    - 外部API（Supabase等）との通信は、原則として `host_permissions` を使用せず、サーバー側の **CORS設定** で拡張機能IDを許可することで通信を行うこと。
    - ローカル開発用のURL（`http://localhost/*`, `http://127.0.0.1/*`）は開発体験（DX）維持のため `wxt.config.ts` の `host_permissions` に残し、本番ビルド時（`command === 'build'`）にのみ自動除外する仕組みを維持すること。
  - 📐 **Layout & Rendering (Anti-CLS)**:
    - 拡張機能のメインレイアウト（SidePanel等）には `display: grid` を用い、主要なUIパーツ（Header/Filter/List/Input）の領域を宣言的に固定してレイアウトシフトを防止すること。
  - 🔐 **タブスコープの厳格な隔離原則 (Isolation Principle & SSOT)**
    - 拡張機能のサイドパネルにおいてノートをフィルタリングする際は、表示対象の決定権を親コンポーネントのSSOTロジックへ完全に集約すること。
    - 「お気に入りノート (`is_favorite`)」であっても全タブへ無条件に貫通させてはならない。必ず現在のタブ状態 (`viewScope`) および詳細なURLコンテキスト (`url_pattern`) と厳格に照合し、他ドメインのノートが混入したり、お気に入りを解除した瞬間にゾンビ化して別タブへ居座る現象を物理的に防ぐ設計とすること。
  - **順序移動ロジック (Fractional Indexing)**: 
    拡張機能内での上下ボタンによる順序移動は、UI層で計算せず、必ず `@sitecue/shared` の `calculateOrderForDirection` 関数を用いて新たな `sort_order` を算出すること。これにより、同値競合時のスナップバックバグを物理的に防ぐ。

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

## ゲストデータ隔離の原則
- **ユーザー識別子**: ゲストユーザーの `user_id` は一律 `"guest-user"` と明示し、作成時のID衝突を防ぐために `crypto.randomUUID()` で一意な識別キーを発行する。
- **保存上限**: ゲストモードのデータは `chrome.storage.local`（テスト/フォールバック環境では `localStorage`）に隔離して保存し、最大50件（Inboxノートを除く）の上限を設ける。上限に達した場合は適切な警告（toast または UI内のアラート）を表示し、アカウント作成とクラウド同期へ誘導する。
- **初期化フェーズのハングバグ防御（Local-First最優先）**: オンライン認証（Supabaseのセッション取得等）の非同期 Promise は、拡張機能のサイドパネル環境下において Pending のまま解決せず永久にハングするリスクがある。画面全体の描画（`LoginScreen` などのマウント）を人質に取らせないよう、初期セッションフェッチには必ず極小のタイムアウト安全装置（例: 200msサーキットブレーカー）を配備し、ローカルのゲスト状態チェックを最優先で評価・確定させて画面のフリーズを回避すること。
- **ストレージ境界の隠れた罠**: 拡張機能のUI層（サイドパネル）とバックグラウンド層（Service Worker）の双方が共通して参照・参照更新するモードフラグやデータは、絶対に `localStorage` に依存してはならない。Service Worker 環境下からは DOM ストレージへのアクセスが物理的に遮断されランタイムエラーとなるため、双方から透過的にアクセス可能な `chrome.storage.local` に一元管理・集約すること。
- **レースコンディションとURL同期の完全化**: UI側からのデータ保存直後にメッセージング（`sendMessage`）をバックグラウンドへ飛ばしてアイコンバッジ等を同期させる際、ストレージへの物理書き込みラグによるデータの空振りを防ぐため、バックグラウンドの集計処理の直前に必ず極小の非同期待機（例: 50msディレイ）を挟むこと。また、環境差異によるURLパースの揺らぎや文字レベルのすれ違いを防ぐため、集計時のURLパターン照合はインラインでプロトコル、`www.`、末尾スラッシュをアトミックに削ぎ落とす軽量正規化ロジックを用いてビットレベルで完全一致させること。

## Diary Integration & Dot-UI Rules
- **DAL Enforcement:** Never access `sitecue_diaries` directly via `supabase.from()`. Always use `appendDiaryLog`, `fetchDiaryByDate`, and `updateDiaryContent` from `@sitecue/shared`.
- **Drawer Lifecycle:** The diary review drawer must stay open across tab changes and URL navigation (Date-SSOT concept).
- **Strict English UI:** All diary-related copy must be in English.
- **Dot-UI Consolidation:** Gears for settings are prohibited in Note Items. The color dot indicator itself must serve as the trigger button to toggle the inline accordion setting area.
- **Topic UI Constraints:** Topics must be displayed in a vertical stack (`flex-col`), never wrapped (`flex-wrap`). Topic and content editing must be synchronized and saved atomically via a single `Save` action.
- **IME Guard Rule:** Every inline text/topic input must contain `if (e.nativeEvent.isComposing) return;` on KeyDown to prevent accidental submission during Japanese input conversion.
- **Compact Capsule Rule:** The date selector in the drawer must be constrained to the last 3 days, with an inline integrated capsule `...Basecamp ↗` as the terminal element pointing to the matching year/month archive list.
- **Canvas Background Rule:** To maximize readability, the diary preview and text editor canvas inside the drawer must feature a pure white background (`bg-white text-neutral-900`) mimicking a tactile physical paper notebook.
- **Editor Operation Consistency:** The diary text editor textarea must integrate the `useAutoIndent` hook to guarantee seamless line indentation handling, identical to the standard NoteInput experience.
- **Unchanged Save Guard Rule:** The diary `Save` button must remain `disabled` if both the text content and the topics array match their original values, preventing redundant network mutations.
- **Full-Height Editor Canvas:** The diary drawer content area must enforce a two-layer separation: a pure outer scroll window (`overflow-y-auto h-full w-full`) and an inner height-flexible wrapper (`min-h-full flex flex-col p-4 space-y-5`). This isolated structure guarantees that the white notebook canvas expands smoothly alongside long markdown texts without any technical background clip or layout truncation.
- **NoteInput Shared Layout Isolation:** When exposing both note creation and diary appending inside the same `NoteInput` overlay, the original note form padding and styling must remain fully preserved in its root layer. The diary append section must be placed strictly below, isolated as an independent boxed island container (`mt-4 pt-4 border-t`), preventing the note creation area from being cramped or visually distorted.
