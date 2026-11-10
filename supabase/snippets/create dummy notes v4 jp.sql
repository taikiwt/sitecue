DO $$
DECLARE
  v_target_email text := 'claudeslogos@gmail.com';
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_target_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'メールアドレス「%」のユーザーが見つかりませんでした。', v_target_email;
  END IF;

  -- ===========================================================================
  -- A. ノート100件の一括作成 (public.sitecue_notes)
  -- ===========================================================================
  INSERT INTO public.sitecue_notes (
    user_id, url_pattern, scope, note_type, content,
    is_pinned, is_resolved, sort_order, created_at, updated_at, tags
  )
  VALUES
    -- -------------------------------------------------------------------------
    -- 1. github.com (計18件: domain 2件 + exact 3ページ計16件)
    -- -------------------------------------------------------------------------
    (v_user_id, 'github.com', 'domain', 'info',
$c$# GitHub 運用・ショートカット共通ルール
- PR作成時は Biome のフォーマットチェック通過を必須とする
- Issue 番号をコミットメッセージに含めて自動リンクさせる$c$,
    true, false, 1.0, now() - interval '1 hour', now() - interval '1 hour', ARRAY['__demo_seed__', 'github', 'workflow']),

    (v_user_id, 'github.com', 'domain', 'info',
$c$# リポジトリ横断検索コマンド
`org:taikiwt path:package.json "wxt"` で拡張機能関連の依存バージョンを一括確認。$c$,
    false, false, 2.0, now() - interval '2 hours', now() - interval '2 hours', ARRAY['__demo_seed__', 'github', 'tips']),

    -- github.com/taikiwt/sitecue/issues (7件)
    (v_user_id, 'github.com/taikiwt/sitecue/issues', 'exact', 'alert',
$c$# キャッシュ無効化のタイミング調整
Server Actions 実行後に `revalidatePath('/notes', 'page')` を呼び出し、不要なレイアウト再検証を防ぐ。$c$,
    true, false, 3.0, now() - interval '3 hours', now() - interval '3 hours', ARRAY['__demo_seed__', 'sitecue', 'nextjs']),

    (v_user_id, 'github.com/taikiwt/sitecue/issues', 'exact', 'idea',
$c$# 3ペイン画面のキーボードナビゲーション強化
- `j` / `k` でノート一覧の上下移動
- `/` で検索バーに即座にフォーカス$c$,
    false, false, 4.0, now() - interval '5 hours', now() - interval '5 hours', ARRAY['__demo_seed__', 'sitecue', 'ux']),

    (v_user_id, 'github.com/taikiwt/sitecue/issues', 'exact', 'alert',
$c$# サイドパネル幅縮小時のタブ折り返し防止
パネル幅 320px 未満で Quick Panel のアイコンが崩れる問題。`flex-shrink-0` で固定する。$c$,
    false, false, 5.0, now() - interval '1 day 2 hours', now() - interval '1 day 2 hours', ARRAY['__demo_seed__', 'css', 'bug']),

    (v_user_id, 'github.com/taikiwt/sitecue/issues', 'exact', 'info',
$c$# 3色マーカーのカラーパレット統一
- Info: `#38BDF8`
- Alert: `#F87171`
- Idea: `#FBBF24`$c$,
    false, true, 6.0, now() - interval '2 days 4 hours', now() - interval '2 days 4 hours', ARRAY['__demo_seed__', 'design', 'ui']),

    (v_user_id, 'github.com/taikiwt/sitecue/issues', 'exact', 'idea',
$c$# Scratchpad から Diary へのワンクリック追記
一時メモの内容にタイムスタンプを自動付与して当日の Diary へ転送するアクション。$c$,
    false, false, 7.0, now() - interval '3 days 6 hours', now() - interval '3 days 6 hours', ARRAY['__demo_seed__', 'diary', 'feature']),

    (v_user_id, 'github.com/taikiwt/sitecue/issues', 'exact', 'alert',
$c$# Wayland + Fcitx5 環境での Enter 確定誤送信
`e.nativeEvent.isComposing` をチェックして変換確定時の送信をブロックする。$c$,
    false, true, 8.0, now() - interval '5 days', now() - interval '5 days', ARRAY['__demo_seed__', 'ime', 'linux']),

    (v_user_id, 'github.com/taikiwt/sitecue/issues', 'exact', 'info',
$c$# Resolve（解決済み）トグルのトランジション
完了チェック時に opacity 0.6 と取り消し線を 150ms でアニメーションさせる。$c$,
    false, true, 9.0, now() - interval '7 days', now() - interval '7 days', ARRAY['__demo_seed__', 'ui', 'animation']),

    -- github.com/taikiwt/arrowmind/issues (5件)
    (v_user_id, 'github.com/taikiwt/arrowmind/issues', 'exact', 'idea',
$c$# 螺旋レイアウト（Spiral Overview）の座標計算
ノード数が増えても重ならないよう、角度ステップと半径を動的に減衰させる計算式を `spiralGeometry.ts` に分離。$c$,
    false, false, 10.0, now() - interval '8 hours', now() - interval '8 hours', ARRAY['__demo_seed__', 'arrowmind', 'math']),

    (v_user_id, 'github.com/taikiwt/arrowmind/issues', 'exact', 'info',
$c$# 0ms 楽観的UI更新の徹底
矢印の追加・編集時はサーバー応答を待たずにローカルステートを即時反映する。$c$,
    false, false, 11.0, now() - interval '1 day 10 hours', now() - interval '1 day 10 hours', ARRAY['__demo_seed__', 'arrowmind', 'ux']),

    (v_user_id, 'github.com/taikiwt/arrowmind/issues', 'exact', 'alert',
$c$# 1ファイル150行制限のCIチェック
肥大化しやすい Canvas 描画コンポーネントを Hooks と純粋関数へ分割する。$c$,
    false, true, 12.0, now() - interval '3 days 2 hours', now() - interval '3 days 2 hours', ARRAY['__demo_seed__', 'architecture', 'ci']),

    (v_user_id, 'github.com/taikiwt/arrowmind/issues', 'exact', 'idea',
$c$# 紙送り（Paper-Feed）UIのスクロール慣性
自問自答の深掘りに集中できるよう、直前の親ノードと現在の入力欄のみを視野中央に保つ。$c$,
    false, false, 13.0, now() - interval '6 days', now() - interval '6 days', ARRAY['__demo_seed__', 'arrowmind', 'ui']),

    (v_user_id, 'github.com/taikiwt/arrowmind/issues', 'exact', 'info',
$c$# Hono RPC の型共有設定
フロントエンドとバックエンド間で API スキーマを型推論させ、ランタイムエラーを防ぐ。$c$,
    false, true, 14.0, now() - interval '9 days', now() - interval '9 days', ARRAY['__demo_seed__', 'hono', 'typescript']),

    -- github.com/taikiwt/sitecue/pulls (4件)
    (v_user_id, 'github.com/taikiwt/sitecue/pulls', 'exact', 'info',
$c$# WXT v0.19 アップグレードPRのマージ確認
Manifest V3 の `side_panel` 定義と background サービスワーカーの型チェック通過を確認。$c$,
    false, true, 15.0, now() - interval '12 hours', now() - interval '12 hours', ARRAY['__demo_seed__', 'wxt', 'pr']),

    (v_user_id, 'github.com/taikiwt/sitecue/pulls', 'exact', 'info',
$c$# Supabase セッション永続化アダプタの導入
`chrome.storage.local` を用いたトークンリフレッシュ処理を実装完了。$c$,
    false, true, 16.0, now() - interval '2 days 12 hours', now() - interval '2 days 12 hours', ARRAY['__demo_seed__', 'supabase', 'auth']),

    (v_user_id, 'github.com/taikiwt/sitecue/pulls', 'exact', 'alert',
$c$# CodeMirror 拡張のバンドルサイズ確認
不要な言語パックを除外し、Markdown と主要言語のみを遅延ロードする構成に変更。$c$,
    false, true, 17.0, now() - interval '4 days 8 hours', now() - interval '4 days 8 hours', ARRAY['__demo_seed__', 'bundle', 'perf']),

    (v_user_id, 'github.com/taikiwt/sitecue/pulls', 'exact', 'info',
$c$# Polar Webhook ハンドラーのテスト追加
署名検証エラー時と正常処理時のステータスコード単体テストを追加。$c$,
    false, true, 18.0, now() - interval '8 days', now() - interval '8 days', ARRAY['__demo_seed__', 'polar', 'test']),

    -- -------------------------------------------------------------------------
    -- 2. nextjs.org (計10件: domain 2件 + exact 2ページ計8件)
    -- -------------------------------------------------------------------------
    (v_user_id, 'nextjs.org', 'domain', 'info',
$c$# Next.js App Router 設計基本方針
- データフェッチは原則 Server Components で行う
- クライアント側のインタラクション末端のみ `'use client'` を宣言する$c$,
    true, false, 1.0, now() - interval '4 hours', now() - interval '4 hours', ARRAY['__demo_seed__', 'nextjs', 'architecture']),

    (v_user_id, 'nextjs.org', 'domain', 'info',
$c$# Route Handlers と Hono の統合
`/api/[[...route]]/route.ts` で Hono インスタンスをエクスポートしてエッジ対応させる。$c$,
    false, false, 2.0, now() - interval '1 day 4 hours', now() - interval '1 day 4 hours', ARRAY['__demo_seed__', 'nextjs', 'hono']),

    -- nextjs.org/docs/app/building-your-application/caching (4件)
    (v_user_id, 'nextjs.org/docs/app/building-your-application/caching', 'exact', 'alert',
$c$# Data Cache と Full Route Cache の切り分け
Basecamp のダッシュボードはリアルタイム性が必須のため `export const dynamic = 'force-dynamic'` を明示する。$c$,
    false, false, 3.0, now() - interval '6 hours', now() - interval '6 hours', ARRAY['__demo_seed__', 'nextjs', 'cache']),

    (v_user_id, 'nextjs.org/docs/app/building-your-application/caching', 'exact', 'info',
$c$# Router Cache の無効化挙動
Server Actions 内で `revalidatePath` を呼ぶとクライアント側の Router Cache もクリアされる仕様を確認。$c$,
    false, true, 4.0, now() - interval '2 days 2 hours', now() - interval '2 days 2 hours', ARRAY['__demo_seed__', 'nextjs', 'cache']),

    (v_user_id, 'nextjs.org/docs/app/building-your-application/caching', 'exact', 'idea',
$c$# unstable_cache の活用箇所
ドメイン一覧の集計など、数分間キャッシュしても問題ない重いクエリへの適用を検討。$c$,
    false, false, 5.0, now() - interval '4 days 10 hours', now() - interval '4 days 10 hours', ARRAY['__demo_seed__', 'perf', 'cache']),

    (v_user_id, 'nextjs.org/docs/app/building-your-application/caching', 'exact', 'info',
$c$# fetch オプションの整理
`cache: 'no-store'` と `next: { revalidate: 0 }` の等価性についてドキュメント確認済み。$c$,
    false, true, 6.0, now() - interval '9 days 4 hours', now() - interval '9 days 4 hours', ARRAY['__demo_seed__', 'nextjs', 'docs']),

    -- nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations (4件)
    (v_user_id, 'nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations', 'exact', 'info',
$c$# useActionState によるエラーハンドリング
例外をスローせず `{ success: false, error: '...' }` を返却してトースト通知を表示するパターンに統一。$c$,
    false, false, 7.0, now() - interval '1 day 8 hours', now() - interval '1 day 8 hours', ARRAY['__demo_seed__', 'nextjs', 'forms']),

    (v_user_id, 'nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations', 'exact', 'idea',
$c$# useOptimistic を使ったノート即時追加
サーバーの応答前にリスト先頭へ仮ノートを描画し、体感速度を 0ms にする。$c$,
    false, false, 8.0, now() - interval '3 days 8 hours', now() - interval '3 days 8 hours', ARRAY['__demo_seed__', 'optimistic-ui', 'ux']),

    (v_user_id, 'nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations', 'exact', 'alert',
$c$# 認証チェックの徹底
Server Actions は公開エンドポイントと同等のため、関数冒頭で必ず `supabase.auth.getUser()` を検証すること。$c$,
    false, true, 9.0, now() - interval '6 days 6 hours', now() - interval '6 days 6 hours', ARRAY['__demo_seed__', 'security', 'auth']),

    (v_user_id, 'nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations', 'exact', 'info',
$c$# フォーム送信時のショートカット対応
`Cmd + Enter` で `form.requestSubmit()` を発火させるイベントハンドラを共通化。$c$,
    false, true, 10.0, now() - interval '11 days', now() - interval '11 days', ARRAY['__demo_seed__', 'ux', 'shortcut']),

    -- -------------------------------------------------------------------------
    -- 3. notion.so (計9件: domain 2件 + exact 2ページ計7件)
    -- -------------------------------------------------------------------------
    (v_user_id, 'notion.so', 'domain', 'info',
$c$# Notion と sitecue の役割分担
- Notion: 長期的な事業計画・静的ドキュメントの保管
- sitecue: 日々のブラウジング現場のメモ・タスク・記事ドラフトの執筆$c$,
    false, false, 1.0, now() - interval '7 hours', now() - interval '7 hours', ARRAY['__demo_seed__', 'notion', 'workflow']),

    (v_user_id, 'notion.so', 'domain', 'info',
$c$# Zero Management の設計原則
手動でのフォルダ分けやタグ管理を強制せず、URLとドメイン構造そのものを分類軸にする。$c$,
    false, false, 2.0, now() - interval '2 days', now() - interval '2 days', ARRAY['__demo_seed__', 'philosophy', 'design']),

    -- notion.so/sitecue-explanation-draft (4件)
    (v_user_id, 'notion.so/sitecue-explanation-draft', 'exact', 'idea',
$c$# LP 構成案のブラッシュアップ
抽象的なキャッチコピーを排し、「拡張機能（現場）」と「Webアプリ（拠点）」の実際の画面と機能をストレートに並べる。$c$,
    false, false, 3.0, now() - interval '9 hours', now() - interval '9 hours', ARRAY['__demo_seed__', 'lp', 'copy']),

    (v_user_id, 'notion.so/sitecue-explanation-draft', 'exact', 'info',
$c$# ターゲットユーザーの明確化
ブラウザで調べもの・開発・執筆を完結させたい個人開発者や技術ライター向けに機能説明を最適化する。$c$,
    false, false, 4.0, now() - interval '1 day 14 hours', now() - interval '1 day 14 hours', ARRAY['__demo_seed__', 'marketing', 'target']),

    (v_user_id, 'notion.so/sitecue-explanation-draft', 'exact', 'alert',
$c$# スクリーンショットの解像度とテーマ統一
LPに掲載するキャプチャはダークテーマの比率とフォントサイズを揃えて撮影する。$c$,
    false, false, 5.0, now() - interval '3 days 12 hours', now() - interval '3 days 12 hours', ARRAY['__demo_seed__', 'assets', 'lp']),

    (v_user_id, 'notion.so/sitecue-explanation-draft', 'exact', 'info',
$c$# Webクリッパーとの違い（逆アプローチ）の言語化
「ページを別アプリに保存して忘れる」のではなく「サイト自体にメモを残して再訪時に呼び出す」仕組みを図解する。$c$,
    false, true, 6.0, now() - interval '6 days 10 hours', now() - interval '6 days 10 hours', ARRAY['__demo_seed__', 'concept', 'positioning']),

    -- notion.so/Qiita-Zenn-note-drafts (3件)
    (v_user_id, 'notion.so/Qiita-Zenn-note-drafts', 'exact', 'idea',
$c$# 技術記事の3部構成テンプレート
1. 解決したい開発・作業上のペイン
2. 採用したアーキテクチャと実装コード
3. 運用してわかったメリットと今後の課題$c$,
    false, false, 7.0, now() - interval '1 day 18 hours', now() - interval '1 day 18 hours', ARRAY['__demo_seed__', 'writing', 'template']),

    (v_user_id, 'notion.so/Qiita-Zenn-note-drafts', 'exact', 'info',
$c$# 各プラットフォームの読者層の違い
- Zenn: 体系的な設計・モダン技術スタックの深掘り
- Qiita: 具体的なエラー解決・コマンド手順
- note: 開発背景のストーリーや思想$c$,
    false, true, 8.0, now() - interval '4 days 16 hours', now() - interval '4 days 16 hours', ARRAY['__demo_seed__', 'zenn', 'qiita']),

    (v_user_id, 'notion.so/Qiita-Zenn-note-drafts', 'exact', 'idea',
$c$# 次回執筆テーマ候補
「なぜブックマークした記事は二度と読まれないのか？— URL連動型ノートを作った理由」$c$,
    false, false, 9.0, now() - interval '8 days 6 hours', now() - interval '8 days 6 hours', ARRAY['__demo_seed__', 'blog', 'idea']),

    -- -------------------------------------------------------------------------
    -- 4. chromewebstore.google.com (計8件: domain 2件 + exact 2ページ計6件)
    -- -------------------------------------------------------------------------
    (v_user_id, 'chromewebstore.google.com', 'domain', 'info',
$c$# Chrome Web Store 審査・公開チェックリスト
- 不要な権限（permissions）を要求しない
- プライバシー慣行タブのデータ収集宣言を最新状態に保つ$c$,
    true, false, 1.0, now() - interval '10 hours', now() - interval '10 hours', ARRAY['__demo_seed__', 'cws', 'release']),

    (v_user_id, 'chromewebstore.google.com', 'domain', 'info',
$c$# ストア分析メトリクス確認
週次のインプレッション数とインストール転換率（CVR）を定期的に記録する。$c$,
    false, false, 2.0, now() - interval '3 days', now() - interval '3 days', ARRAY['__demo_seed__', 'cws', 'analytics']),

    -- chromewebstore.google.com/detail/sitecue/finajjlpkgkaboljmeinfngohlhemak (4件)
    (v_user_id, 'chromewebstore.google.com/detail/sitecue/finajjlpkgkaboljmeinfngohlhemak', 'exact', 'info',
$c$# 日英ストア説明文のアップデート完了
飾った表現をなくし、サイドパネル拡張機能とWebアプリの2つの役割がストレートに伝わる構成に改訂。$c$,
    false, true, 3.0, now() - interval '11 hours', now() - interval '11 hours', ARRAY['__demo_seed__', 'cws', 'copy']),

    (v_user_id, 'chromewebstore.google.com/detail/sitecue/finajjlpkgkaboljmeinfngohlhemak', 'exact', 'alert',
$c$# ストア掲載スクリーンショット（1280x800）の差し替え
Quick Panel（Command / Links）と Daily Diary の画面を含めた最新5枚に更新する。$c$,
    false, false, 4.0, now() - interval '1 day 20 hours', now() - interval '1 day 20 hours', ARRAY['__demo_seed__', 'cws', 'assets']),

    (v_user_id, 'chromewebstore.google.com/detail/sitecue/finajjlpkgkaboljmeinfngohlhemak', 'exact', 'idea',
$c$# コンテンツによるユースケース提示
「どう使うと便利なのか」の具体例（開発時のコマンド控え、記事執筆の素材集め）を画像内のキャプションに添える。$c$,
    false, false, 5.0, now() - interval '4 days 4 hours', now() - interval '4 days 4 hours', ARRAY['__demo_seed__', 'cws', 'ux']),

    (v_user_id, 'chromewebstore.google.com/detail/sitecue/finajjlpkgkaboljmeinfngohlhemak', 'exact', 'info',
$c$# プロモーションタイル画像の登録確認
440x280（小タイル）と 920x680（大型タイル）の表示崩れがないかチェック完了。$c$,
    false, true, 6.0, now() - interval '7 days 12 hours', now() - interval '7 days 12 hours', ARRAY['__demo_seed__', 'cws', 'design']),

    -- chromewebstore.google.com/category/extensions/productivity (2件)
    (v_user_id, 'chromewebstore.google.com/category/extensions/productivity', 'exact', 'info',
$c$# 生産性カテゴリの競合拡張機能リサーチ
単なる付箋やタブ保存ツールは多いが、URL自動連動＋長文執筆スタジオ（Webアプリ）の連携構成は独自性が高い。$c$,
    false, false, 7.0, now() - interval '5 days 8 hours', now() - interval '5 days 8 hours', ARRAY['__demo_seed__', 'research', 'competitor']),

    (v_user_id, 'chromewebstore.google.com/category/extensions/productivity', 'exact', 'idea',
$c$# 検索キーワード対策
`side panel notes`, `url note taking`, `markdown browser editor` を説明文の自然な文脈に含める。$c$,
    false, true, 8.0, now() - interval '10 days', now() - interval '10 days', ARRAY['__demo_seed__', 'seo', 'cws']),

    -- -------------------------------------------------------------------------
    -- 5. supabase.com (計8件: domain 2件 + exact 2ページ計6件)
    -- -------------------------------------------------------------------------
    (v_user_id, 'supabase.com', 'domain', 'info',
$c$# Supabase 運用・マイグレーション手順
- ローカル検証: `bunx supabase db reset`
- 本番反映前に必ず RLS ポリシーの権限漏れをテストする$c$,
    true, false, 1.0, now() - interval '5 hours', now() - interval '5 hours', ARRAY['__demo_seed__', 'supabase', 'ops']),

    (v_user_id, 'supabase.com', 'domain', 'info',
$c$# 拡張機能からの直接通信アーキテクチャ
Chrome拡張機能は Hono API を経由せず、Supabase Client から RLS 保護下で直接クエリを実行してレイテンシを最小化する。$c$,
    false, false, 2.0, now() - interval '2 days 6 hours', now() - interval '2 days 6 hours', ARRAY['__demo_seed__', 'supabase', 'architecture']),

    -- supabase.com/docs/guides/auth/row-level-security (3件)
    (v_user_id, 'supabase.com/docs/guides/auth/row-level-security', 'exact', 'alert',
$c$# RLS 条件式でのインデックス活用
`auth.uid() = user_id` の評価を高速化するため、`sitecue_notes(user_id)` に B-tree インデックスが貼られていることを確認。$c$,
    false, false, 3.0, now() - interval '13 hours', now() - interval '13 hours', ARRAY['__demo_seed__', 'supabase', 'rls']),

    (v_user_id, 'supabase.com/docs/guides/auth/row-level-security', 'exact', 'info',
$c$# Freeプラン制限トリガーの動作確認
`check_note_limit` 関数（上限500件）と `check_draft_limit` 関数（上限50件）の SECURITY DEFINER 設定を確認済み。$c$,
    false, true, 4.0, now() - interval '3 days 16 hours', now() - interval '3 days 16 hours', ARRAY['__demo_seed__', 'postgres', 'trigger']),

    (v_user_id, 'supabase.com/docs/guides/auth/row-level-security', 'exact', 'info',
$c$# get_dashboard_domain_activity RPCのアクセス制御
関数冒頭で `auth.uid() <> p_user_id` の場合に例外を投げるガード処理を確認。$c$,
    false, true, 5.0, now() - interval '8 days 2 hours', now() - interval '8 days 2 hours', ARRAY['__demo_seed__', 'rpc', 'security']),

    -- supabase.com/docs/guides/database/postgres/indexes (3件)
    (v_user_id, 'supabase.com/docs/guides/database/postgres/indexes', 'exact', 'info',
$c$# タグ配列検索用の GIN インデックス
`tags` カラムに対する `ANY` 演算子や `@>` 検索を高速化するためのインデックス設計。$c$,
    false, false, 6.0, now() - interval '1 day 22 hours', now() - interval '1 day 22 hours', ARRAY['__demo_seed__', 'postgres', 'index']),

    (v_user_id, 'supabase.com/docs/guides/database/postgres/indexes', 'exact', 'idea',
$c$# pg_trgm を使った高速全文検索
ノート数が増えた際の `ILIKE '%query%'` を高速化するため、Trigram インデックスの導入を検討。$c$,
    false, false, 7.0, now() - interval '5 days 12 hours', now() - interval '5 days 12 hours', ARRAY['__demo_seed__', 'search', 'perf']),

    (v_user_id, 'supabase.com/docs/guides/database/postgres/indexes', 'exact', 'info',
$c$# URL パターン検索のパフォーマンス
`sitecue_notes_url_idx` により `url_pattern` の完全一致検索が O(log N) で実行されることを EXPLAIN で確認。$c$,
    false, true, 8.0, now() - interval '12 days', now() - interval '12 days', ARRAY['__demo_seed__', 'sql', 'perf']),

    -- -------------------------------------------------------------------------
    -- 6. zenn.dev (計8件: domain 2件 + exact 2ページ計6件)
    -- -------------------------------------------------------------------------
    (v_user_id, 'zenn.dev', 'domain', 'info',
$c$# Zenn 記事公開ワークフロー
1. 日々のブラウジング中に拡張機能でメモを蓄積
2. Basecamp の Studio で素材（Materials）を引用しながら構成作成
3. 完成した Markdown を Zenn リポジトリへ反映$c$,
    false, false, 1.0, now() - interval '6 hours', now() - interval '6 hours', ARRAY['__demo_seed__', 'zenn', 'workflow']),

    (v_user_id, 'zenn.dev', 'domain', 'idea',
$c$# 技術発信テーマのストック
- WXT + React で作るサイドパネル型 Chrome 拡張機能
- 個人開発に Polar.sh（MoR）を導入して海外対応サブスクを実装した手順$c$,
    false, false, 2.0, now() - interval '2 days 8 hours', now() - interval '2 days 8 hours', ARRAY['__demo_seed__', 'zenn', 'ideas']),

    -- zenn.dev/taikiwt/articles/sitecue-architecture (3件)
    (v_user_id, 'zenn.dev/taikiwt/articles/sitecue-architecture', 'exact', 'info',
$c$# 記事構成案：現場（拡張機能）と基地（Webアプリ）のハイブリッド設計
なぜ拡張機能単体ではなく Next.js の Web ダッシュボード（Basecamp）を組み合わせたのか、その設計意図を解説する。$c$,
    false, false, 3.0, now() - interval '14 hours', now() - interval '14 hours', ARRAY['__demo_seed__', 'article', 'architecture']),

    (v_user_id, 'zenn.dev/taikiwt/articles/sitecue-architecture', 'exact', 'idea',
$c$# 図解の追加メモ
Excalidraw で「ブラウザのURLにメモが張り付き、Basecamp に自動集約される流れ」の概念図を作成して差し込む。$c$,
    false, false, 4.0, now() - interval '3 days 4 hours', now() - interval '3 days 4 hours', ARRAY['__demo_seed__', 'diagram', 'excalidraw']),

    (v_user_id, 'zenn.dev/taikiwt/articles/sitecue-architecture', 'exact', 'info',
$c$# 導入部のフック確認
「メモをどのツールに書くか迷って思考が途切れた経験」から書き始め、読者の共感を得る構成にする。$c$,
    false, true, 5.0, now() - interval '6 days 14 hours', now() - interval '6 days 14 hours', ARRAY['__demo_seed__', 'writing', 'intro']),

    -- zenn.dev/topics/chrome-extension (3件)
    (v_user_id, 'zenn.dev/topics/chrome-extension', 'exact', 'info',
$c$# Chrome Extension Manifest V3 トレンド調査
`chrome.sidePanel` API を活用した常駐型ツールが主流になりつつある。ポップアップ型と違いページ遷移で閉じない利点が大きい。$c$,
    false, false, 6.0, now() - interval '2 days 16 hours', now() - interval '2 days 16 hours', ARRAY['__demo_seed__', 'extension', 'mv3']),

    (v_user_id, 'zenn.dev/topics/chrome-extension', 'exact', 'alert',
$c$# Content Script の CSS 汚染防止
ページ側に UI を注入する場合は Shadow DOM を用いる。sitecue はネイティブ Side Panel 方式のためサイトの CSS と一切干渉しない。$c$,
    false, true, 7.0, now() - interval '5 days 16 hours', now() - interval '5 days 16 hours', ARRAY['__demo_seed__', 'css', 'sidepanel']),

    (v_user_id, 'zenn.dev/topics/chrome-extension', 'exact', 'info',
$c$# WXT フレームワークの採用メリットまとめ
Vite ベースの高速 HMR と、ファイルベースのエントリポイント管理が非常に扱いやすい。$c$,
    false, true, 8.0, now() - interval '10 days 8 hours', now() - interval '10 days 8 hours', ARRAY['__demo_seed__', 'wxt', 'vite']),

    -- -------------------------------------------------------------------------
    -- 7. x.com (計7件: domain 2件 + exact 2ページ計5件)
    -- -------------------------------------------------------------------------
    (v_user_id, 'x.com', 'domain', 'info',
$c$# X 発信スタイル・メモ
- 実際の動作画面（GIFやスクリーンショット）を添えて機能をシンプルに紹介する
- Studio の 140字モードで下書きを推敲してから投稿する$c$,
    false, false, 1.0, now() - interval '8 hours', now() - interval '8 hours', ARRAY['__demo_seed__', 'x', 'sns']),

    (v_user_id, 'x.com', 'domain', 'idea',
$c$# 固定ポスト用のショート紹介文
「Webサイトを見ながらその場のURLにメモを残すChrome拡張機能と、記録を振り返り文章に仕立てるWebアプリ『sitecue』を開発しています。」$c$,
    false, false, 2.0, now() - interval '3 days 10 hours', now() - interval '3 days 10 hours', ARRAY['__demo_seed__', 'copy', 'profile']),

    -- x.com/taikiwt/status/185490123456 (3件)
    (v_user_id, 'x.com/taikiwt/status/185490123456', 'exact', 'info',
$c$# リリース報告ポストへの反応メモ
「サイドパネルでコマンドや関連リンクをサイトごとに控えられて便利」というコメントあり。LPの活用シーンにも反映する。$c$,
    false, false, 3.0, now() - interval '16 hours', now() - interval '16 hours', ARRAY['__demo_seed__', 'feedback', 'lp']),

    (v_user_id, 'x.com/taikiwt/status/185490123456', 'exact', 'idea',
$c$# デモ動画の撮影ポイント
サイトを再訪した瞬間にアイコンバッジが点灯し、過去のメモが自動で現れる様子を短尺動画にする。$c$,
    false, false, 4.0, now() - interval '2 days 18 hours', now() - interval '2 days 18 hours', ARRAY['__demo_seed__', 'video', 'demo']),

    (v_user_id, 'x.com/taikiwt/status/185490123456', 'exact', 'info',
$c$# ハッシュタグの選定
`#個人開発` `#Chrome拡張機能` `#buildinpublic` を適宜活用。$c$,
    false, true, 5.0, now() - interval '6 days 18 hours', now() - interval '6 days 18 hours', ARRAY['__demo_seed__', 'marketing', 'tags']),

    -- x.com/i/bookmarks (2件)
    (v_user_id, 'x.com/i/bookmarks', 'exact', 'info',
$c$# UIデザイン参考ブックマーク
ダークモード時のボーダー輝度（`rgba(255,255,255,0.08)`）とカード間の余白バランスの参考事例。$c$,
    false, false, 6.0, now() - interval '4 days 12 hours', now() - interval '4 days 12 hours', ARRAY['__demo_seed__', 'ui', 'design']),

    (v_user_id, 'x.com/i/bookmarks', 'exact', 'info',
$c$# 海外ディレクトリ登録先のリスト
Product Hunt, AlternativeTo, BetaList, ExtensionLaunch の特徴まとめスレッド。$c$,
    false, true, 7.0, now() - interval '9 days 12 hours', now() - interval '9 days 12 hours', ARRAY['__demo_seed__', 'directory', 'seo']),

    -- -------------------------------------------------------------------------
    -- 8. polar.sh (計6件: domain 2件 + exact 2ページ計4件)
    -- -------------------------------------------------------------------------
    (v_user_id, 'polar.sh', 'domain', 'info',
$c$# Polar.sh サブスクリプション設定概要
- Monthly: $5 / Yearly: $48
- Merchant of Record として消費税・VAT処理を自動化$c$,
    true, false, 1.0, now() - interval '12 hours', now() - interval '12 hours', ARRAY['__demo_seed__', 'polar', 'billing']),

    (v_user_id, 'polar.sh', 'domain', 'info',
$c$# 本番環境の環境変数確認
Cloudflare Workers / Vercel 側の `POLAR_WEBHOOK_SECRET` と Checkout URL が Live 環境向けになっていることを確認済み。$c$,
    false, true, 2.0, now() - interval '4 days', now() - interval '4 days', ARRAY['__demo_seed__', 'polar', 'env']),

    -- polar.sh/docs/api-reference/checkouts/create (2件)
    (v_user_id, 'polar.sh/docs/api-reference/checkouts/create', 'exact', 'alert',
$c$# チェックアウト遷移時のユーザー紐づけ
Checkout リンク生成時に `customer_email` または `metadata.user_id` を確実に渡し、Webhook 側で `sitecue_profiles` を特定できるようにする。$c$,
    false, false, 3.0, now() - interval '1 day 6 hours', now() - interval '1 day 6 hours', ARRAY['__demo_seed__', 'polar', 'checkout']),

    (v_user_id, 'polar.sh/docs/api-reference/checkouts/create', 'exact', 'info',
$c$# Sandbox 環境でのテスト手順
ngrok でローカルポートを公開し、テストカード決済から `plan = 'pro'` への昇格までを一通り検証完了。$c$,
    false, true, 4.0, now() - interval '5 days 4 hours', now() - interval '5 days 4 hours', ARRAY['__demo_seed__', 'sandbox', 'ngrok']),

    -- polar.sh/docs/webhooks/order-created (2件)
    (v_user_id, 'polar.sh/docs/webhooks/order-created', 'exact', 'info',
$c$# Webhook イベントの冪等性担保
同じイベントIDが再送された場合でも `sitecue_profiles` の更新が安全に上書き処理されることを確認。$c$,
    false, true, 5.0, now() - interval '3 days 18 hours', now() - interval '3 days 18 hours', ARRAY['__demo_seed__', 'webhook', 'idempotency']),

    (v_user_id, 'polar.sh/docs/webhooks/order-created', 'exact', 'info',
$c$# 解約・期限切れイベント（subscription.canceled）の扱い
期間満了までは Pro 権限を維持し、`subscription.revoked` 受信時に `free` プランへ戻す。$c$,
    false, true, 6.0, now() - interval '8 days 14 hours', now() - interval '8 days 14 hours', ARRAY['__demo_seed__', 'subscription', 'lifecycle']),

    -- -------------------------------------------------------------------------
    -- 9. claude.ai (計6件: domain 2件 + exact 2ページ計4件)
    -- -------------------------------------------------------------------------
    (v_user_id, 'claude.ai', 'domain', 'info',
$c$# AI 壁打ち時のメモ運用ルール
議論の中で決まった仕様やSQLクエリは、チャット履歴に埋もれさせず即座に右横の sitecue サイドパネルへ抜き出す。$c$,
    false, false, 1.0, now() - interval '15 hours', now() - interval '15 hours', ARRAY['__demo_seed__', 'claude', 'workflow']),

    (v_user_id, 'claude.ai', 'domain', 'info',
$c$# よく使うプロンプトテンプレート
Quick Panel の Scratchpad からシステム設計レビュー用の定型プロンプトをコピーして貼り付ける。$c$,
    false, false, 2.0, now() - interval '4 days 2 hours', now() - interval '4 days 2 hours', ARRAY['__demo_seed__', 'prompt', 'scratchpad']),

    -- claude.ai/chat/26bd318d-da45-420a-b59e-727cf546ef8a (2件)
    (v_user_id, 'claude.ai/chat/26bd318d-da45-420a-b59e-727cf546ef8a', 'exact', 'alert',
$c$# モバイル表示時のタブ切り替え負荷の検証
不要な再レンダリングを防ぐため、非アクティブなタブのツリーはメモ化しておく。$c$,
    false, false, 3.0, now() - interval '1 day 12 hours', now() - interval '1 day 12 hours', ARRAY['__demo_seed__', 'react', 'perf']),

    (v_user_id, 'claude.ai/chat/26bd318d-da45-420a-b59e-727cf546ef8a', 'exact', 'info',
$c$# PWA マニフェストのキャッシュ戦略確認
初回ロード高速化のためのアセットキャッシュ設定を整理。$c$,
    false, true, 4.0, now() - interval '5 days 20 hours', now() - interval '5 days 20 hours', ARRAY['__demo_seed__', 'pwa', 'cache']),

    -- claude.ai/chat/a4196da0-0099-418f-95e8-41ecce539bc6 (2件)
    (v_user_id, 'claude.ai/chat/a4196da0-0099-418f-95e8-41ecce539bc6', 'exact', 'idea',
$c$# get_dashboard_domain_activity の正規表現抽出
`regexp_replace(url_pattern, '^(?:https?://)?(?:www\.)?([^/]+).*$', '\1')` でホスト名を綺麗に集計するクエリ案。$c$,
    false, true, 5.0, now() - interval '2 days 20 hours', now() - interval '2 days 20 hours', ARRAY['__demo_seed__', 'sql', 'regex']),

    (v_user_id, 'claude.ai/chat/a4196da0-0099-418f-95e8-41ecce539bc6', 'exact', 'info',
$c$# LATERAL JOIN を用いた上位N件取得
各ドメインごとの最新2件のノートを効率よく JSON 集約する SQL パターン。$c$,
    false, true, 6.0, now() - interval '7 days 18 hours', now() - interval '7 days 18 hours', ARRAY['__demo_seed__', 'postgres', 'json']),

    -- -------------------------------------------------------------------------
    -- 10. tailwindcss.com (計4件: domain 1件 + exact 1ページ計3件)
    -- -------------------------------------------------------------------------
    (v_user_id, 'tailwindcss.com', 'domain', 'info',
$c$# Tailwind カラートークン定義
ダーク背景 `#15151A`、サーフェス `#1E1E26`、ボーダー `#2E2E38` を基準にコントラスト比を維持する。$c$,
    false, false, 1.0, now() - interval '18 hours', now() - interval '18 hours', ARRAY['__demo_seed__', 'tailwind', 'design']),

    (v_user_id, 'tailwindcss.com/docs/v4-beta', 'exact', 'alert',
$c$# Tailwind v4 での設定ファイル廃止対応
`tailwind.config.js` ではなく CSS ファイル内の `@theme` ディレクティブへ変数を移行する。$c$,
    false, false, 2.0, now() - interval '2 days 10 hours', now() - interval '2 days 10 hours', ARRAY['__demo_seed__', 'tailwind', 'v4']),

    (v_user_id, 'tailwindcss.com/docs/v4-beta', 'exact', 'info',
$c$# @container クエリによるサイドパネル最適化
パネル幅に応じて1カラムと2カラムを自動で切り替えるレスポンシブ指定。$c$,
    false, true, 3.0, now() - interval '5 days 6 hours', now() - interval '5 days 6 hours', ARRAY['__demo_seed__', 'css', 'container']),

    (v_user_id, 'tailwindcss.com/docs/v4-beta', 'exact', 'info',
$c$# Typography プラグインの prose-invert 調整
Markdown プレビュー時のコードブロック背景色とインラインコードの余白を微調整済み。$c$,
    false, true, 4.0, now() - interval '9 days 8 hours', now() - interval '9 days 8 hours', ARRAY['__demo_seed__', 'markdown', 'typography']),

    -- -------------------------------------------------------------------------
    -- 11. cloudflare.com (計4件: domain 1件 + exact 1ページ計3件)
    -- -------------------------------------------------------------------------
    (v_user_id, 'cloudflare.com', 'domain', 'info',
$c$# ドメイン・インフラ管理メモ
- `sitecue.app`: Astro LP (Cloudflare Workers Static Assets)
- `support@sitecue.app`: Cloudflare Email Routing で開発用アドレスへ転送$c$,
    false, false, 1.0, now() - interval '20 hours', now() - interval '20 hours', ARRAY['__demo_seed__', 'cloudflare', 'infra']),

    (v_user_id, 'cloudflare.com/workers/configuration/routing', 'exact', 'alert',
$c$# サブドメインの DNS プロキシ設定注意
`app.sitecue.app` の CNAME レコードは SSL 証明書の競合を避けるため DNS Only（グレー雲）で運用する。$c$,
    false, false, 2.0, now() - interval '3 days 14 hours', now() - interval '3 days 14 hours', ARRAY['__demo_seed__', 'dns', 'ssl']),

    (v_user_id, 'cloudflare.com/workers/configuration/routing', 'exact', 'info',
$c$# Workers Static Assets のキャッシュヘッダー
画像・フォントアセットに対する `Cache-Control: public, max-age=31536000, immutable` の配信確認。$c$,
    false, true, 3.0, now() - interval '6 days 20 hours', now() - interval '6 days 20 hours', ARRAY['__demo_seed__', 'workers', 'cache']),

    (v_user_id, 'cloudflare.com/workers/configuration/routing', 'exact', 'info',
$c$# SPF / DKIM レコードの検証完了
サポートメール返信時の到達率を高めるための DNS テキストレコード設定。$c$,
    false, true, 4.0, now() - interval '11 days 12 hours', now() - interval '11 days 12 hours', ARRAY['__demo_seed__', 'email', 'dns']),

    -- -------------------------------------------------------------------------
    -- 12. biomejs.dev (計3件: domain 1件 + exact 1ページ計2件)
    -- -------------------------------------------------------------------------
    (v_user_id, 'biomejs.dev', 'domain', 'info',
$c$# Biome 共通コマンド
`bunx @biomejs/biome check --write .` でフォーマット・リント・インポート整理を一括実行。$c$,
    false, false, 1.0, now() - interval '1 day 16 hours', now() - interval '1 day 16 hours', ARRAY['__demo_seed__', 'biome', 'linter']),

    (v_user_id, 'biomejs.dev/linter/rules', 'exact', 'alert',
$c$# noExplicitAny ルールの厳格運用
Chrome 拡張のメッセージ通信ペイロードに `any` を使わず、型安全な Union 型を定義する。$c$,
    false, true, 2.0, now() - interval '4 days 20 hours', now() - interval '4 days 20 hours', ARRAY['__demo_seed__', 'typescript', 'biome']),

    (v_user_id, 'biomejs.dev/linter/rules', 'exact', 'info',
$c$# useExhaustiveDependencies の確認
React Hooks の依存配列漏れによる古いステート参照バグを未然に防ぐ。$c$,
    false, true, 3.0, now() - interval '8 days 20 hours', now() - interval '8 days 20 hours', ARRAY['__demo_seed__', 'react', 'hooks']),

    -- -------------------------------------------------------------------------
    -- 13. alternativeto.net (計3件: domain 1件 + exact 1ページ計2件)
    -- -------------------------------------------------------------------------
    (v_user_id, 'alternativeto.net', 'domain', 'info',
$c$# AlternativeTo 掲載ステータス
Notion、Obsidian、Raindrop.io の代替（オルタナティブ）として登録完了。$c$,
    false, false, 1.0, now() - interval '22 hours', now() - interval '22 hours', ARRAY['__demo_seed__', 'alternativeto', 'marketing']),

    (v_user_id, 'alternativeto.net/software/sitecue/about', 'exact', 'info',
$c$# アプリ紹介文とスクリーンショットの更新
「Chrome拡張機能とWebアプリを1セットとしてどう使い分けるか」が伝わる画像を追加する。$c$,
    false, false, 2.0, now() - interval '3 days 20 hours', now() - interval '3 days 20 hours', ARRAY['__demo_seed__', 'alternativeto', 'assets']),

    (v_user_id, 'alternativeto.net/software/sitecue/about', 'exact', 'idea',
$c$# 特徴タグの最適化
`Side Panel`, `URL-Linked Notes`, `Markdown Editor`, `Zero Management` の訴求ポイントを整理。$c$,
    false, true, 3.0, now() - interval '7 days 6 hours', now() - interval '7 days 6 hours', ARRAY['__demo_seed__', 'seo', 'tags']),

    -- -------------------------------------------------------------------------
    -- 14. amazon.co.jp (計2件: exact 1ページ計2件)
    -- -------------------------------------------------------------------------
    (v_user_id, 'amazon.co.jp/dp/B0F7X3VJ99', 'exact', 'info',
$c$# 27インチ 4K モニター比較メモ
エディタとブラウザ（＋サイドパネル）を横に並べて作業するためのスケーリングと文字の視認性をチェック。$c$,
    false, false, 1.0, now() - interval '2 days 14 hours', now() - interval '2 days 14 hours', ARRAY['__demo_seed__', 'hardware', 'monitor']),

    (v_user_id, 'amazon.co.jp/dp/B0F7X3VJ99', 'exact', 'idea',
$c$# セール時期の価格推移チェック
ブラックフライデー期間中のポイント還元率を見て導入を判断する。$c$,
    false, false, 2.0, now() - interval '6 days 2 hours', now() - interval '6 days 2 hours', ARRAY['__demo_seed__', 'shopping']),

    -- -------------------------------------------------------------------------
    -- 15. developer.mozilla.org (計2件: exact 1ページ計2件)
    -- -------------------------------------------------------------------------
    (v_user_id, 'developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API', 'exact', 'info',
$c$# BroadcastChannel によるタブ間リアルタイム同期
拡張機能のサイドパネルで追加したノートを、開いている Basecamp 側の画面にも即座に反映させる仕組み。$c$,
    false, true, 1.0, now() - interval '4 days 6 hours', now() - interval '4 days 6 hours', ARRAY['__demo_seed__', 'web-api', 'sync']),

    (v_user_id, 'developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API', 'exact', 'info',
$c$# メモリリーク防止のクリーンアップ
コンポーネントのアンマウント時に必ず `channel.close()` を呼ぶこと。$c$,
    false, true, 2.0, now() - interval '10 days 12 hours', now() - interval '10 days 12 hours', ARRAY['__demo_seed__', 'javascript', 'memory']),

    -- -------------------------------------------------------------------------
    -- 16. inbox (計2件: グローバルな自由ノート)
    -- -------------------------------------------------------------------------
    (v_user_id, 'inbox', 'inbox', 'idea',
$c$# 露出施策・メディア対応の候補リスト
1. 個人開発者向けショーケース・ディレクトリへの登録推進
2. Zenn / Qiita での技術アーキテクチャ解説記事の継続発信
3. LPのファーストビュー改善と実画面スクリーンショットの刷新$c$,
    true, false, 1.0, now() - interval '2 hours', now() - interval '2 hours', ARRAY['__demo_seed__', 'marketing', 'strategy']),

    (v_user_id, 'inbox', 'inbox', 'info',
$c$# 週次振り返りメモ（どこからでも参照するグローバルノート）
- 現場（拡張機能）で拾ったメモのうち、記事ネタになるものを週末に Studio で形にするサイクルが定着してきた。
- フォルダ整理をなくしたことで「どこに書くか迷う時間」が完全にゼロになった。$c$,
    false, false, 2.0, now() - interval '1 day', now() - interval '1 day', ARRAY['__demo_seed__', 'review', 'workflow']);

  -- ===========================================================================
  -- B. デモ用ドラフト3件の作成 (public.sitecue_drafts)
  -- ===========================================================================
  INSERT INTO public.sitecue_drafts (
    user_id, title, content, created_at, updated_at, tags
  )
  VALUES
    (v_user_id, 'ブラウジングと執筆を直結させる「sitecue」の設計思想',
$c$# なぜ作ったのか？

調べものや開発をしているとき、「このメモをどこに書こうか？」と迷って思考が途切れたことはありませんか？
せっかくノートアプリに整理してまとめても、作業現場であるブラウザから離れているため、結局データの海に埋もれて二度と見返さないことが多くありました。

## 1. Webクリッパーの逆アプローチ
ページを切り取って別アプリに溜め込むのではなく、**「見ているWebサイト（URL・ドメイン）自体にメモを残し、次に開いたときに自動で呼び出す」** という仕組みを採用しました。

## 2. 現場（拡張機能）と基地（Webアプリ）の往復
- **Chrome拡張機能**: サイドパネルでブラウジングを止めずにメモ・ToDo・コマンドを記録
- **Webアプリ（Basecamp）**: 集まったメモを俯瞰し、StudioでブログやSNSの下書きを執筆

フォルダ分けやタグ管理の手間をゼロ（Zero Management）にし、残したメモを最後まで使い切るためのツールです。$c$,
    now() - interval '3 hours', now() - interval '1 hour', ARRAY['__demo_seed__', 'sitecue', 'concept']),

    (v_user_id, 'WXT + Next.js + Supabase で作るChrome拡張＆Webアプリ連携構成',
$c$# アーキテクチャ概要

Chrome拡張機能のサイドパネルと、Next.js (App Router) のWebダッシュボード間でリアルタイムにデータを共有する実践構成のまとめです。

## 技術スタック
- **Extension**: WXT (Manifest V3), React, Tailwind CSS
- **Web App**: Next.js App Router, Hono, CodeMirror
- **Backend / DB**: Supabase (PostgreSQL, Auth, RLS)
- **Tooling**: Bun, Biome, Turborepo$c$,
    now() - interval '2 days', now() - interval '1 day', ARRAY['__demo_seed__', 'wxt', 'nextjs']),

    (v_user_id, 'Polar.sh（MoR）を用いた個人開発アプリのサブスク課金実装手順',
$c$# 概要

個人開発のWebサービスで海外対応のサブスクリプションを導入する際、消費税やEU VATの税務処理を自動化できる Merchant of Record (Polar.sh) の導入手順をまとめました。

1. Sandbox 環境での Product と Webhook の準備
2. ngrok を用いたローカル Webhook 検証
3. Supabase RLS とプランステータス更新トリガーの連携$c$,
    now() - interval '4 days', now() - interval '3 days', ARRAY['__demo_seed__', 'polar', 'supabase']);

  RAISE NOTICE 'ユーザー「% (ID: %)」向けに日本語デモノート100件＋ドラフト3件を作成しました。', v_target_email, v_user_id;
END $$;