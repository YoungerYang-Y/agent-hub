/**
 * Harness Engineering Bootstrap Script (cross-platform)
 *
 * Copies the documentation template structure into a project.
 * Safe to re-run — never overwrites existing files.
 *
 * Usage: node bootstrap.ts [project-root]
 *        Defaults to current working directory.
 */

import { existsSync, mkdirSync, copyFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

const SCRIPT_DIR = dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const SKILL_DIR = join(SCRIPT_DIR, "..");
const TEMPLATES_DIR = join(SKILL_DIR, "templates");
const TARGET = resolve(process.argv[2] || ".");

if (!existsSync(TEMPLATES_DIR)) {
  console.error(`❌ 模板目录未找到: ${TEMPLATES_DIR}`);
  process.exit(1);
}

mkdirSync(TARGET, { recursive: true });
console.log(`🚀 正在初始化 Harness Engineering 文档体系: ${TARGET}\n`);

// --- Directories ---
const DIRS = [
  "docs", "docs/active", "docs/active/_template",
  "docs/archive", "docs/archive/migrated",
  "docs/design-docs", "docs/generated", "docs/references", "docs/skills",
  "docs/skills/quality-gate",
];
for (const dir of DIRS) mkdirSync(join(TARGET, dir), { recursive: true });

// --- Copy helpers ---
function copyIfMissing(src: string, dest: string): void {
  if (existsSync(dest)) { console.log(`  ⏭️  已存在，跳过: ${dest}`); }
  else { copyFileSync(src, dest); console.log(`  ✅ 已创建: ${dest}`); }
}

function touchIfMissing(dest: string): void {
  if (existsSync(dest)) { console.log(`  ⏭️  已存在，跳过: ${dest}`); }
  else { writeFileSync(dest, "", "utf-8"); console.log(`  ✅ 已创建: ${dest}`); }
}

const t = (rel: string) => join(TEMPLATES_DIR, rel);
const d = (rel: string) => join(TARGET, rel);

// --- Root docs ---
console.log("📄 根级文档:");
copyIfMissing(t("AGENTS.md"), d("AGENTS.md"));
copyIfMissing(t("ARCHITECTURE.md"), d("ARCHITECTURE.md"));

// --- Domain docs ---
console.log("\n📄 领域文档 (docs/*.md):");
for (const f of ["DOMAINS", "PRODUCT_SENSE", "QUALITY_SCORE", "RELIABILITY", "SECURITY"]) {
  copyIfMissing(t(`docs/${f}.md`), d(`docs/${f}.md`));
}

// --- Guides ---
console.log("\n📄 方法论 (docs/guides/):");
mkdirSync(d("docs/guides"), { recursive: true });
for (const f of ["WORKFLOW", "SPEC", "DESIGN", "PLANS", "REVIEW"]) {
  copyIfMissing(t(`docs/guides/${f}.md`), d(`docs/guides/${f}.md`));
}

// --- Requirement templates ---
console.log("\n📄 需求模板 (docs/active/_template/):");
for (const f of ["spec.md", "design.md", "plan.md"]) {
  copyIfMissing(t(`docs/active/_template/${f}`), d(`docs/active/_template/${f}`));
}

// --- Indexes & tracking ---
console.log("\n📄 索引与追踪:");
copyIfMissing(t("docs/active/index.md"), d("docs/active/index.md"));
copyIfMissing(t("docs/active/tech-debt-tracker.md"), d("docs/active/tech-debt-tracker.md"));
copyIfMissing(t("docs/archive/index.md"), d("docs/archive/index.md"));
copyIfMissing(t("docs/archive/_release-template.md"), d("docs/archive/_release-template.md"));

// --- Design docs ---
console.log("\n📄 设计文档:");
copyIfMissing(t("docs/design-docs/core-beliefs.md"), d("docs/design-docs/core-beliefs.md"));
copyIfMissing(t("docs/design-docs/index.md"), d("docs/design-docs/index.md"));
copyIfMissing(t("docs/design-docs/_template.md"), d("docs/design-docs/_template.md"));

// --- Generated docs registry ---
console.log("\n📄 自动生成文档注册表:");
copyIfMissing(t("docs/generated/index.md"), d("docs/generated/index.md"));
copyIfMissing(t("docs/generated/_template.md"), d("docs/generated/_template.md"));

// --- Project skills ---
console.log("\n📄 项目内基础 skills:");
for (const f of [
  "index.md",
  "quality-gate/SKILL.md",
]) {
  copyIfMissing(t(`docs/skills/${f}`), d(`docs/skills/${f}`));
}

// --- .gitkeep ---
console.log("\n📄 占位文件 (.gitkeep):");
touchIfMissing(d("docs/references/.gitkeep"));

// --- Done ---
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Harness Engineering 初始化完成!

后续步骤:
  1. 在 AGENTS.md 中填写 [项目名称] 和占位符
  2. 在 ARCHITECTURE.md 中填写领域地图和技术栈
  3. 根据项目定制 docs/*.md 领域文档
  4. 创建第一个需求:
       node "${SKILL_DIR}/scripts/create-requirement.ts" <slug> <medium|large>
  5. 文档健康检查（项目根目录运行）:
       node "${SKILL_DIR}/scripts/lint-docs.ts"
  6. 文档漂移检测（周期性运行）:
       node "${SKILL_DIR}/scripts/doc-gardening.ts"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
