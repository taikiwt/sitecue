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

# 1. project-tree.txt の生成
tree -I 'node_modules|.git|.next|dist|build|.turbo|coverage|public|assets|migrations|snippets|test_output.txt' > project-tree.txt

# 2. 共通基盤 (1-base)
BASE='project-tree.txt,.agent/**/*,supabase/schema.sql,packages/shared/src/**/*'
repomix --include "$BASE" --no-git-sort-by-changes --output "repomix-${NAME}-1-base.xml"

# 3. 本体ソースコード (2-src)
IGNORE_TESTS="${DIR}/**/*.test.*,${DIR}/**/*.spec.*,${DIR}/**/e2e/**/*"

if [ "$NAME" = "app" ]; then
  # App Basecamp はテキスト上限回避のため 2a (画面ルート) と 2b (共通基盤) に分割
  repomix --include "${DIR}/src/app/**/*" \
    --ignore "$IGNORE_TESTS" \
    --no-git-sort-by-changes \
    --output "repomix-app-2a-routes.xml"

  repomix --include "${DIR}/src/components/**/*,${DIR}/src/hooks/**/*,${DIR}/src/store/**/*,${DIR}/src/utils/**/*,${DIR}/src/lib/**/*,${DIR}/src/providers/**/*,${DIR}/src/middleware.ts,${DIR}/src/proxy.ts,${DIR}/package.json" \
    --ignore "$IGNORE_TESTS" \
    --no-git-sort-by-changes \
    --output "repomix-app-2b-core.xml"
else
  repomix --include "${DIR}/**/*" \
    --ignore "$IGNORE_TESTS" \
    --no-git-sort-by-changes \
    --output "repomix-${NAME}-2-src.xml"
fi

# 4. テストコード群 (3-tests)
repomix --include "${DIR}/**/*.test.*,${DIR}/**/*.spec.*,${DIR}/**/e2e/**/*" \
  --no-git-sort-by-changes \
  --output "repomix-${NAME}-3-tests.xml"

# クリーンアップ
rm project-tree.txt

if [ "$NAME" = "app" ]; then
  echo "✔ Successfully generated: repomix-app-1-base.xml, repomix-app-2a-routes.xml, repomix-app-2b-core.xml, repomix-app-3-tests.xml"
else
  echo "✔ Successfully generated: repomix-${NAME}-1-base.xml, repomix-${NAME}-2-src.xml, repomix-${NAME}-3-tests.xml"
fi
