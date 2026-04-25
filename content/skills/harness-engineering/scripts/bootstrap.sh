#!/usr/bin/env bash
#
# Harness Engineering Bootstrap Script (Bash)
#
# 将文档模板结构复制到当前项目中。
# 可安全重复运行——不会覆盖已有文件。
#
# 用法:
#   bash path/to/skills/harness-engineering/scripts/bootstrap.sh
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
  "docs/active"
  "docs/active/_template"
  "docs/archive"
  "docs/design-docs"
  "docs/generated"
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
for file in DOMAINS PRODUCT_SENSE QUALITY_SCORE RELIABILITY SECURITY; do
  copy_if_missing "${TEMPLATES_DIR}/docs/${file}.md" "${TARGET}/docs/${file}.md"
done

echo ""
echo "📄 方法论 (docs/guides/):"
mkdir -p "${TARGET}/docs/guides"
for file in WORKFLOW SPEC DESIGN PLANS; do
  copy_if_missing "${TEMPLATES_DIR}/docs/guides/${file}.md" "${TARGET}/docs/guides/${file}.md"
done

echo ""
echo "📄 需求模板 (docs/active/_template/):"
copy_if_missing "${TEMPLATES_DIR}/docs/active/_template/spec.md" "${TARGET}/docs/active/_template/spec.md"
copy_if_missing "${TEMPLATES_DIR}/docs/active/_template/design.md" "${TARGET}/docs/active/_template/design.md"
copy_if_missing "${TEMPLATES_DIR}/docs/active/_template/plan.md" "${TARGET}/docs/active/_template/plan.md"

echo ""
echo "📄 索引与追踪:"
copy_if_missing "${TEMPLATES_DIR}/docs/active/index.md" "${TARGET}/docs/active/index.md"
copy_if_missing "${TEMPLATES_DIR}/docs/active/tech-debt-tracker.md" "${TARGET}/docs/active/tech-debt-tracker.md"
copy_if_missing "${TEMPLATES_DIR}/docs/archive/index.md" "${TARGET}/docs/archive/index.md"
copy_if_missing "${TEMPLATES_DIR}/docs/archive/_release-template.md" "${TARGET}/docs/archive/_release-template.md"

echo ""
echo "📄 设计文档:"
copy_if_missing "${TEMPLATES_DIR}/docs/design-docs/core-beliefs.md" "${TARGET}/docs/design-docs/core-beliefs.md"

echo ""
echo "📄 占位文件 (.gitkeep):"
for dir in docs/generated docs/references; do
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
echo "  4. 创建第一个需求："
echo "       中任务：新建 docs/active/{需求名}/，只创建 design.md 和 plan.md"
echo "       大任务：复制 docs/active/_template/ 为 docs/active/{需求名}/"
echo "  5. 如需文档健康检查，在项目根目录运行："
echo "       node ${SKILL_DIR}/scripts/lint-docs.ts"
echo "  6. 如需文档漂移检测（周期性运行）："
echo "       node ${SKILL_DIR}/scripts/doc-gardening.ts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
