/**
 * Doc-Gardening Agent Script
 *
 * Automated checks for documentation drift. Run weekly or per-sprint.
 * Handles the mechanizable subset of doc-gardening; items marked [AGENT]
 * require an LLM agent to complete (semantic verification).
 *
 * Usage: node path/to/doc-gardening.ts   (run from project root)
 * Exit code: 0 = clean, 1 = issues found
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

interface Finding {
  category: "catalog" | "plan" | "generated" | "quality" | "agent-review";
  level: "auto-fix" | "needs-agent";
  message: string;
  file?: string;
}

const ROOT = process.cwd();
const findings: Finding[] = [];

function resolve(p: string): string { return join(ROOT, p); }
function exists(p: string): boolean { return existsSync(resolve(p)); }
function read(p: string): string { return readFileSync(resolve(p), "utf-8"); }
function listMd(dir: string): string[] {
  const d = resolve(dir);
  if (!existsSync(d)) return [];
  return readdirSync(d).filter(f => f.endsWith(".md"));
}

function isPlaceholderPath(value: string): boolean {
  return value.includes("{") || value.includes("<!--");
}

// 1. Design doc catalog ↔ files sync
function checkDesignCatalog(): void {
  const catalogPath = "docs/design-docs/index.md";
  if (!exists(catalogPath)) return;
  const skip = new Set(["index.md", "core-beliefs.md", "_template.md"]);
  const files = listMd("docs/design-docs").filter(f => !skip.has(f));
  const catalog = read(catalogPath);
  for (const f of files) {
    if (!catalog.includes(f)) {
      findings.push({ category: "catalog", level: "needs-agent", file: `docs/design-docs/${f}`, message: `Design doc not listed in catalog. Add entry to ${catalogPath}.` });
    }
  }
  const entryRe = /`docs\/design-docs\/([^`]+\.md)`/g;
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(catalog)) !== null) {
    if (isPlaceholderPath(m[1])) continue;
    if (!exists(`docs/design-docs/${m[1]}`)) {
      findings.push({ category: "catalog", level: "needs-agent", file: catalogPath, message: `Catalog references missing file: docs/design-docs/${m[1]}` });
    }
  }
}

// 2. Product spec catalog ↔ files sync
function checkSpecCatalog(): void {
  const catalogPath = "docs/product-specs/index.md";
  if (!exists(catalogPath)) return;
  const skip = new Set(["index.md", "_template.md"]);
  const files = listMd("docs/product-specs").filter(f => !skip.has(f));
  const catalog = read(catalogPath);
  for (const f of files) {
    if (!catalog.includes(f)) {
      findings.push({ category: "catalog", level: "needs-agent", file: `docs/product-specs/${f}`, message: `Spec not listed in catalog. Add entry to ${catalogPath}.` });
    }
  }
}

// 3. Generated docs freshness
function checkGenerated(): void {
  for (const f of listMd("docs/generated")) {
    const content = read(`docs/generated/${f}`);
    const tsMatch = content.match(/(?:Last generated|最后生成)[：:]\s*(\d{4}-\d{2}-\d{2})/);
    if (!tsMatch) {
      findings.push({ category: "generated", level: "needs-agent", file: `docs/generated/${f}`, message: "Missing generation timestamp. Regenerate this file." });
      continue;
    }
    const age = (Date.now() - new Date(tsMatch[1]).getTime()) / 86400000;
    if (age > 30) {
      findings.push({ category: "generated", level: "needs-agent", file: `docs/generated/${f}`, message: `Stale: generated ${Math.floor(age)} days ago. Regenerate from source.` });
    }
  }
}

// 4. Completed plans still in active/
function checkPlans(): void {
  const activeDir = "docs/exec-plans/active";
  if (!exists(activeDir)) return;
  for (const f of listMd(activeDir)) {
    const content = read(`${activeDir}/${f}`);
    const statusDone = /状态[：:]\s*(已完成|完成|completed|done)/i.test(content);
    const boxes = content.match(/- \[[ x]\]/g) || [];
    const unchecked = boxes.filter(b => b.includes("[ ]")).length;
    if (statusDone && unchecked === 0) {
      findings.push({ category: "plan", level: "auto-fix", file: `${activeDir}/${f}`, message: `Plan completed. Move to docs/exec-plans/completed/${f}` });
    }
  }
}

// 5. Quality score freshness
function checkQuality(): void {
  const qPath = "docs/QUALITY_SCORE.md";
  if (!exists(qPath)) return;
  const content = read(qPath);
  const tsMatch = content.match(/最后更新[：:]\s*(\d{4}-\d{2}-\d{2})/);
  if (!tsMatch) {
    findings.push({ category: "quality", level: "needs-agent", file: qPath, message: "Missing '最后更新' date. [AGENT] Re-evaluate quality scores." });
    return;
  }
  const age = (Date.now() - new Date(tsMatch[1]).getTime()) / 86400000;
  if (age > 30) {
    findings.push({ category: "quality", level: "needs-agent", file: qPath, message: `Quality scores ${Math.floor(age)} days old. [AGENT] Re-evaluate and update.` });
  }
}

// 6. Design docs with 过期 status
function checkStaleDesignDocs(): void {
  const catalogPath = "docs/design-docs/index.md";
  if (!exists(catalogPath)) return;
  const catalogRows = read(catalogPath)
    .split("\n")
    .filter(line => line.trim().startsWith("|") && line.includes("`docs/design-docs/") && !line.includes("<!--"));
  if (catalogRows.some(line => (line.split("|")[3] ?? "").includes("过期 ⚠️"))) {
    findings.push({ category: "agent-review", level: "needs-agent", file: catalogPath, message: "Catalog contains 过期 ⚠️ entries. [AGENT] Update design docs to match implementation or re-verify." });
  }
}

// --- Run all checks ---
checkDesignCatalog();
checkSpecCatalog();
checkGenerated();
checkPlans();
checkQuality();
checkStaleDesignDocs();

// --- Report ---
if (findings.length === 0) {
  console.log("✅ Doc gardening: no drift detected.");
  process.exit(0);
}

console.log(`\n🌱 Doc Gardening Report — ${findings.length} finding(s)\n`);

const grouped = new Map<string, Finding[]>();
for (const f of findings) {
  const arr = grouped.get(f.category) || [];
  arr.push(f);
  grouped.set(f.category, arr);
}

for (const [cat, items] of grouped) {
  console.log(`── ${cat} ──`);
  for (const item of items) {
    const icon = item.level === "auto-fix" ? "🔧" : "🤖";
    console.log(`  ${icon} ${item.file ?? ""}: ${item.message}`);
  }
  console.log();
}

const autoFix = findings.filter(f => f.level === "auto-fix").length;
const needsAgent = findings.filter(f => f.level === "needs-agent").length;
console.log(`Summary: ${autoFix} auto-fixable, ${needsAgent} need agent review`);
process.exit(1);
