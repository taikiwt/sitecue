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
  - 順序移動ロジック (Fractional Indexing): 
    拡張機能内での並び替えは、上下ボタンを完全撤廃し、@dnd-kit を用いた縦方向D&Dへと一元化する。並び替えのオーダー計算は、onDragOver によるリアルタイム配列シャッフルと、onDragEnd 時の「初期インデックス vs 最終インデックス」の差分比較を正のソースとして行う。隣接要素が同値衝突（初期値0など）している場合は、移動方向（initialIndex > finalIndex）の高低差から、確実に割り込める極小オフセット（OFFSET = 0.0001）を正確に加減算してスナップバックを物理的に防ぐこと。

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

## 日記統合（Diary Integration）＆ Dot-UI 規約
- **DAL関数の強制利用:** `sitecue_diaries` テーブルへアプリ層から `supabase.from()` を用いて直接アクセスすることは厳禁とする。必ず `@sitecue/shared` から提供される一元化されたDAL関数（`appendDiaryLog`, `fetchDiaryByDate`, `updateDiaryContent`）を経由して非同期処理を行うこと。
- **ドロワーのライフサイクル:** 日記閲覧ドロワー（サイドパネル）は、タブの切り替えやURLナビゲーションを挟んでも開いた状態を維持すること（日付をSSOTとする設計思想）。
- **厳格な英語UI表現:** 日記機能に関連するプレースホルダーやボタン等の文言（UIコピー）は、すべて洗練された英語で統一すること。
- **Dot-UIへの機能集約:** ノートアイテム内に設定用の「歯車アイコン」等を安易に配置することを禁止する。カラーインジケーター（ドット）自体をトリガーボタンとし、インラインのアコーディオン設定エリアをトグル駆動させること。
- **トピックUIの制約:** キーイベント（トピック）は必ず縦並びスタック（`flex-col`）で配置し、横折り返し（`flex-wrap`）させてはならない。また、トピックの編集と本文の編集内容は、単一の「Save」アクションによってアトミック（不可分）に同時保存される同期構造を維持すること。
- **IME変換暴発ガードの徹底:** インラインのテキスト入力欄やトピック入力欄の `KeyDown` イベントには、日本語変換確定時のEnterによる意図しない誤送信を防ぐため、必ず `if (e.nativeEvent.isComposing) return;` のガードを記述すること。
- **3日凝縮カプセルルール:** ドロワー内の日付選択は過去3日間に凝縮し、末尾にマッチする年月のアーカイブ一覧へ遷移するインライン統合カプセル `...BC ↗`（または `...Basecamp ↗`）を連結させること。
- **ホワイトキャンバスの維持:** 視認性と執筆の心地よさを最大化するため、ドロワー内部の日記プレビューおよびテキストエディタの背景は、物理的な手帳を模した「純白（bg-white / text-neutral-900）」を強制貫通させること。
- **エディタ操作の一貫性:** 日記本文のテキストエリアには必ず `useAutoIndent` フックを統合し、標準の NoteInput と全く同じシームレスな行インデント操作を提供すること。
- **無変更保存ガード（防壁）:** 日記の本文テキストとトピック配列の双方が、DBから取得した初期値と完全に一致している（変更がない）場合は、Saveボタンを必ず `disabled`（不活性）にし、無駄なネットワークミューテーションを物理的に遮断すること。
- **コンテンツエリアのスクロール隔離:** 日記ドロワーは最外殻でのスクロールを禁止し、`h-full flex flex-col` の固定構造とすること。これにより、最上部の日付タブエリアを完全不動にロックさせ、スクロール軸は白い本文カードの内側のコンテンツ領域にのみ隔離・局所化すること。

## Basecamp風 Pill-Input ＆ 入力防壁規約
- **Basecamp風 Pill-Input ＆ 入力防壁規約:** NoteとDiaryの各入力ブロックは、それ自体が [左アイコン] [中央コンテンツ] [右送信ボタン] を内包する `grid grid-cols-[auto_1fr_auto] items-center gap-3` のカプセル型の美しい浮き島にすること。全体は薄グレー背景（`bg-base-surface`）の上に上下に並列配置する。
  - **インライン中央アラインロック:** 入力エリアが縦に引き伸ばされた場合でも、左アイコンと右送信ボタンは `items-center` によって常に「垂直中央」に完全ロック固定されるマークアップにすること。
  - **入力エリアの最大高ガード:** 長文入力によって画面やレイアウトが破壊されるのを防ぐため、Note/DiaryのTextareaには必ず `max-h-24 overflow-y-auto scrollbar-none` を指定し、高さを超えた場合はインナースクロールに隔離すること。
  - **トピック視界維持とキャンバス構造:** DiaryViewの編集モードにおけるトピック入力エリアは、ユーザーが入力された2〜5個程度の主要なキーイベントを視界に維持しながら本文を執筆できるよう、カード内の上部に安易に崩れない安定したコンテキストヘッダーとして配置を最適化すること。

## 編集モードUIの同期・固定化規約
- 拡張機能（Extension）の `NoteItem` における編集モードUIは、常に `NoteInput.tsx` のデザイントークン（セレクト形式 of スコープ、カプセル型のタイプ背景、インライン構造）と完全に同期・対称性を維持しなければならない。
- 編集モードの操作要素は、スクロールアウトを防ぐため必ず `sticky` 2段構成ヘッダーへ集約し、入力エリアの肥大化から物理的に隔離すること。
