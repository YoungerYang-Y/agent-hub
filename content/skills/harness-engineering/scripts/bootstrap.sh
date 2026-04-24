#!/usr/bin/env bash
#
# Harness Engineering Bootstrap Script (Bash)
#
# 将文档模板结构复制到当前项目中。
# 可安全重复运行——不会覆盖已有文件。
#
# 用法:
#   bash path/to/skills/harness-engineering/bootstrap.sh
#   bash bootstrap.sh /path/to/your/project
#

set -euo pipefail

TARGET="${1:-.}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
TEMPLATES_DIR="${SKILL_DIR}/templates"

if [ ! -d "$TEMPLATES_DIR" ]; then
  echo "❌ 模板目录未找到: $TEMPLATES_DIR"
  exit 1
fi

echo "🚀 正在初始化 Harness Engineering 文档体系: $(cd "$TARGET" && pwd)"
echo ""

DIRS=(
  "docs"
  "docs/design-docs"
  "docs/exec-plans"
  "docs/exec-plans/active"
  "docs/exec-plans/completed"
  "docs/generated"
  "docs/product-specs"
  "docs/references"
)

for dir in "${DIRS[@]}"; do
  mkdir -p "${TARGET}/${dir}"
done

copy_if_missing() {
  local src="$1"
  local dest="$2"
  if [ -f "$dest" ]; then
    echo "  ⏭️  已存在，跳过: $dest"
  else
    cp "$src" "$dest"
    echo "  ✅ 已创建: $dest"
  fi
}

echo "📄 根级文档:"
copy_if_missing "${TEMPLATES_DIR}/AGENTS.md" "${TARGET}/AGENTS.md"
copy_if_missing "${TEMPLATES_DIR}/ARCHITECTURE.md" "${TARGET}/ARCHITECTURE.md"

echo ""
echo "📄 领域文档 (docs/*.md):"
for file in DESIGN FRONTEND PLANS PRODUCT_SENSE QUALITY_SCORE RELIABILITY SECURITY; do
  copy_if_missing "${TEMPLATES_DIR}/docs/${file}.md" "${TARGET}/docs/${file}.md"
done

echo ""
echo "📄 设计文档:"
copy_if_missing "${TEMPLATES_DIR}/docs/design-docs/index.md" "${TARGET}/docs/design-docs/index.md"
copy_if_missing "${TEMPLATES_DIR}/docs/design-docs/core-beliefs.md" "${TARGET}/docs/design-docs/core-beliefs.md"
copy_if_missing "${TEMPLATES_DIR}/docs/design-docs/_template.md" "${TARGET}/docs/design-docs/_template.md"

echo ""
echo "📄 执行计划:"
copy_if_missing "${TEMPLATES_DIR}/docs/exec-plans/_template.md" "${TARGET}/docs/exec-plans/_template.md"
copy_if_missing "${TEMPLATES_DIR}/docs/exec-plans/tech-debt-tracker.md" "${TARGET}/docs/exec-plans/tech-debt-tracker.md"

echo ""
echo "📄 产品规格:"
copy_if_missing "${TEMPLATES_DIR}/docs/product-specs/index.md" "${TARGET}/docs/product-specs/index.md"
copy_if_missing "${TEMPLATES_DIR}/docs/product-specs/_template.md" "${TARGET}/docs/product-specs/_template.md"

echo ""
echo "📄 占位文件 (.gitkeep):"
for dir in docs/generated docs/references docs/exec-plans/active docs/exec-plans/completed; do
  dest="${TARGET}/${dir}/.gitkeep"
  if [ -f "$dest" ]; then
    echo "  ⏭️  已存在，跳过: $dest"
  else
    touch "$dest"
    echo "  ✅ 已创建: $dest"
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Harness Engineering 初始化完成!"
echo ""
echo "后续步骤:"
echo "  1. 在 AGENTS.md 中填写 [项目名称] 和占位符"
echo "  2. 在 ARCHITECTURE.md 中填写领域地图和技术栈"
echo "  3. 根据项目定制 docs/*.md 领域文档"
echo "     （纯后端 / CLI / SDK 项目可删除 docs/FRONTEND.md，并同步删掉 AGENTS.md 中的链接）"
echo "  4. 如需文档健康检查，在项目根目录运行（无需复制脚本到仓库）:"
echo "       node ${SKILL_DIR}/templates/scripts/lint-docs.ts"
echo "  5. 如需文档漂移检测（周期性运行），在项目根目录运行:"
echo "       node ${SKILL_DIR}/templates/scripts/doc-gardening.ts"
echo "     （两个脚本均以 cwd 为 ROOT，在项目根目录执行即可）"
echo "     （需要 Node 22+，无需额外安装 ts-node）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
