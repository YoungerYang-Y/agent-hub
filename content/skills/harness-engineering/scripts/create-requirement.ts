/**
 * Create Requirement Directory (atomic operation)
 *
 * Creates a correctly structured requirement directory under docs/active/,
 * copies template files with filled frontmatter (slug + date), and registers
 * the entry in docs/active/index.md.
 *
 * Usage: node create-requirement.ts <slug> [medium|large]
 * Run from project root.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";

const SCRIPT_DIR = dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const SKILL_DIR = join(SCRIPT_DIR, "..");
const TEMPLATE_DIR = join(SKILL_DIR, "templates", "docs", "active", "_template");
const ROOT = process.cwd();

const slug = process.argv[2];
const size = process.argv[3] || "medium";

if (!slug) {
  console.error("❌ 用法: node create-requirement.ts <slug> [medium|large]");
  process.exit(1);
}
if (size !== "medium" && size !== "large") {
  console.error(`❌ 任务级别必须是 medium 或 large，收到: ${size}`);
  process.exit(1);
}

const targetDir = join(ROOT, "docs", "active", slug);
const indexPath = join(ROOT, "docs", "active", "index.md");
const today = new Date().toISOString().slice(0, 10);

// Pre-checks
if (!existsSync(TEMPLATE_DIR)) { console.error(`❌ 模板目录未找到: ${TEMPLATE_DIR}`); process.exit(1); }
if (existsSync(targetDir)) { console.error(`❌ 需求目录已存在: ${targetDir}`); process.exit(1); }
if (!existsSync(indexPath)) { console.error(`❌ 索引文件不存在: ${indexPath}（先运行 bootstrap）`); process.exit(1); }

// Create directory
mkdirSync(targetDir, { recursive: true });

// Copy and fill template: replace {slug} and YYYY-MM-DD placeholders
function fillTemplate(templateFile: string, destFile: string): void {
  const content = readFileSync(templateFile, "utf-8")
    .replace(/\{slug\}/g, slug)
    .replace(/YYYY-MM-DD/g, today);
  writeFileSync(destFile, content, "utf-8");
  console.log(`  ✅ ${destFile}`);
}

if (size === "large") {
  fillTemplate(join(TEMPLATE_DIR, "spec.md"), join(targetDir, "spec.md"));
}
fillTemplate(join(TEMPLATE_DIR, "design.md"), join(targetDir, "design.md"));
fillTemplate(join(TEMPLATE_DIR, "plan.md"), join(targetDir, "plan.md"));

// Register in index.md
const entry = `| spec-${slug} | ${slug} | draft | — | — | \`docs/active/${slug}/\` |`;
appendFileSync(indexPath, entry + "\n", "utf-8");
console.log(`  ✅ 已注册到 ${indexPath}`);

console.log(`\n✅ 需求 '${slug}' 创建完成 (${size})`);
console.log(size === "large"
  ? "  下一步: 填写 spec.md → design.md → plan.md"
  : "  下一步: 填写 design.md → plan.md");
