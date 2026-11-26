#!/usr/bin/env bash
set -e

TARGET="${1:-ext}"

case "$TARGET" in
  ext|extension)
    NAME="ext"
    DIR="apps/extension"
    ;;
  app)
    NAME="app"
    DIR="apps/app"
    ;;
  api)
    NAME="api"
    DIR="apps/api"
    ;;
  *)
    NAME="$TARGET"
    DIR="$TARGET"
    ;;
esac

echo "📦 Packing target: $NAME ($DIR)..."

# 0. 対象ターゲットの古い XML を削除（他ターゲットの XML は保持）
rm -f "repomix-${NAME}_"*.xml

# 1. project-tree.txt の生成（.gitignore を尊重）
tree --gitignore -I 'node_modules|.git|.next|dist|build|.turbo|coverage|public|assets|migrations|snippets|test_output.txt' > project-tree.txt

# 共通オプション
FLAGS=(--remove-empty-lines --no-git-sort-by-changes)

# 2. 共通基盤 (_1-common-base)
BASE="project-tree.txt,.agent/**/*,supabase/schema.sql,packages/shared/src/**/*"
repomix --include "$BASE" \
  --ignore "packages/shared/src/**/*.test.*" \
  "${FLAGS[@]}" \
  --output "repomix-${NAME}_1-common-base.xml"

# 3. ターゲット別ソースコード (_2-src*) & テスト (_3-tests)
TESTS="${DIR}/**/*.test.*,${DIR}/**/*.spec.*,${DIR}/**/e2e/**/*"
COMMON_IGNORE="${TESTS},${DIR}/**/scripts/**,${DIR}/**/setupTests.ts,${DIR}/**/*.woff2,${DIR}/**/*.png,${DIR}/**/*.ico,${DIR}/.gitignore"

if [ "$NAME" = "app" ]; then
  # ※ (dashboard) の丸括弧は fast-glob の extglob と衝突するため **/<dir>/** で指定する
  NOTES_SCOPE="${DIR}/src/app/**/notes/**/*"
  STUDIO_SCOPE="${DIR}/src/app/**/studio/**/*,${DIR}/src/app/**/diaries/**/*,${DIR}/src/app/**/DraftEditor.tsx,${DIR}/src/app/**/NoteEditor.tsx"

  # 2-src_1-notes: ノート一覧・詳細ペイン
  repomix --include "$NOTES_SCOPE" \
    --ignore "$COMMON_IGNORE" "${FLAGS[@]}" \
    --output "repomix-app_2-src_1-notes.xml"

  # 2-src_2-studio: Studio・日記エディタ関連
  repomix --include "$STUDIO_SCOPE" \
    --ignore "$COMMON_IGNORE" "${FLAGS[@]}" \
    --output "repomix-app_2-src_2-studio.xml"

  # 2-src_3-routes: その他画面ルート（Launchpad, Guide, Templates, Trash, Auth, API）+ ルート設定
  repomix --include "${DIR}/src/app/**/*,${DIR}/package.json,${DIR}/next.config.ts,${DIR}/wrangler.toml" \
    --ignore "${COMMON_IGNORE},${NOTES_SCOPE},${STUDIO_SCOPE}" "${FLAGS[@]}" \
    --output "repomix-app_2-src_3-routes.xml"

  # 2-src_4-core: src/app 以外の src/ 全体（hooks, store, components, locales 等の新設に自動追従）
  repomix --include "${DIR}/src/**/*" \
    --ignore "${COMMON_IGNORE},${DIR}/src/app/**/*" "${FLAGS[@]}" \
    --output "repomix-app_2-src_4-core.xml"

  # 3-tests: テスト一式
  repomix --include "$TESTS" "${FLAGS[@]}" --output "repomix-app_3-tests.xml"

elif [ "$NAME" = "ext" ]; then
  UI="${DIR}/entrypoints/**/*,${DIR}/src/SidePanel.tsx,${DIR}/src/components/**/*,${DIR}/src/index.css"

  # 2-src_1-ui: サイドパネルUI・画面コンポーネント
  repomix --include "$UI" \
    --ignore "$COMMON_IGNORE" "${FLAGS[@]}" \
    --output "repomix-ext_2-src_1-ui.xml"

  # 2-src_2-core: UI以外の全体（hooks, locales, utils, public/_locales, wxt.config.ts 等に自動追従）
  repomix --include "${DIR}/**/*" \
    --ignore "${COMMON_IGNORE},${UI}" "${FLAGS[@]}" \
    --output "repomix-ext_2-src_2-core.xml"

  # 3-tests: テスト一式
  repomix --include "$TESTS" "${FLAGS[@]}" --output "repomix-ext_3-tests.xml"

else
  # API 等の単一分割ターゲット
  repomix --include "${DIR}/**/*" \
    --ignore "$COMMON_IGNORE" "${FLAGS[@]}" \
    --output "repomix-${NAME}_2-src.xml"

  repomix --include "$TESTS" "${FLAGS[@]}" --output "repomix-${NAME}_3-tests.xml"
fi

# クリーンアップ
rm project-tree.txt

# 4. 文字数上限チェック（WebUI展開上限対策: 250,000文字超過で警告）
echo ""
echo "📊 Generated files & character counts:"
for f in "repomix-${NAME}_"*.xml; do
  [ -e "$f" ] || continue
  CHARS=$(wc -m < "$f" | tr -d ' ')
  if [ "$CHARS" -gt 250000 ]; then
    echo "  ⚠️  $f :${CHARS} chars (25万文字超過！分割を検討してください)"
  else
    echo "  ✅ $f :${CHARS} chars"
  fi
done
