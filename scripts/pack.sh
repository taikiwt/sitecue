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
repomix --include "${DIR}/**/*" \
  --ignore "${DIR}/**/*.test.*,${DIR}/**/*.spec.*,${DIR}/**/e2e/**/*" \
  --no-git-sort-by-changes \
  --output "repomix-${NAME}-2-src.xml"

# 4. テストコード群 (3-tests)
repomix --include "${DIR}/**/*.test.*,${DIR}/**/*.spec.*,${DIR}/**/e2e/**/*" \
  --no-git-sort-by-changes \
  --output "repomix-${NAME}-3-tests.xml"

# クリーンアップ
rm project-tree.txt

echo "✔ Successfully generated: repomix-${NAME}-1-base.xml, repomix-${NAME}-2-src.xml, repomix-${NAME}-3-tests.xml"
