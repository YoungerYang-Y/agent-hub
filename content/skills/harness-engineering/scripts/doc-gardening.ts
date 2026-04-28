/**
 * Doc-Gardening Agent Script
 *
 * Automated drift detection for active/archive documentation structure.
 * Items marked [AGENT] require LLM agent to complete.
 *
 * Usage: node path/to/doc-gardening.ts   (run from project root)
 * Exit code: 0 = clean, 1 = issues found
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

interface Finding {
  category: "requirement" | "archive" | "generated" | "quality" | "agent-review";
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
  const d = resolve(dir); if (!existsSync(d)) return [];
  return readdirSync(d).filter(f => f.endsWith(".md"));
}
function listDirs(dir: string): string[] {
  const d = resolve(dir); if (!existsSync(d)) return [];
  return readdirSync(d).filter(f => f !== "_template" && statSync(join(d, f)).isDirectory());
}

function parseFrontmatter(content: string): Record<string, string> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fm: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    fm[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
  }
  return fm;
}

// 1. Active requirements: completed plans should be archived
function checkActiveRequirements(): void {
  for (const dir of listDirs("docs/active")) {
    const planPath = `docs/active/${dir}/plan.md`;
    if (!exists(planPath)) continue;
    const fm = parseFrontmatter(read(planPath));
    if (fm?.status === "completed") {
      findings.push({ category: "requirement", level: "auto-fix", file: `docs/active/${dir}/`, message: `Plan completed. Archive this requirement to a version.` });
    }
  }
}

// 2. Active requirements: stale designs
function checkStaleDesigns(): void {
  for (const dir of listDirs("docs/active")) {
    const designPath = `docs/active/${dir}/design.md`;
    if (!exists(designPath)) continue;
    const fm = parseFrontmatter(read(designPath));
    if (fm?.status === "stale") {
      findings.push({ category: "agent-review", level: "needs-agent", file: designPath, message: "Design status is 'stale'. [AGENT] Update to match implementation or re-verify." });
    }
    if (fm?.status === "verified" && fm.verified) {
      const age = (Date.now() - new Date(fm.verified).getTime()) / 86400000;
      if (age > 30) {
        findings.push({ category: "agent-review", level: "needs-agent", file: designPath, message: `Verified ${Math.floor(age)} days ago. [AGENT] Re-verify or mark as stale.` });
      }
    }
  }
}

// 3. Active index ↔ dirs sync
function checkActiveIndex(): void {
  if (!exists("docs/active/index.md")) return;
  const catalog = read("docs/active/index.md");
  for (const dir of listDirs("docs/active")) {
    if (!catalog.includes(dir)) {
      findings.push({ category: "requirement", level: "needs-agent", file: `docs/active/${dir}/`, message: "Requirement dir not listed in docs/active/index.md." });
    }
  }
}

// 4. Archive expiry
function checkArchiveExpiry(): void {
  if (!exists("docs/archive/index.md")) return;
  const content = read("docs/archive/index.md");
  // Match retention period config
  const retentionMatch = content.match(/保留期限[：:]\s*(\d+)\s*个月/);
  const retentionMonths = retentionMatch ? parseInt(retentionMatch[1]) : 12;

  for (const dir of listDirs("docs/archive")) {
    const releasePath = `docs/archive/${dir}/release.md`;
    if (!exists(releasePath)) continue;
    const fm = parseFrontmatter(read(releasePath));
    if (fm?.retain_until) {
      const retainDate = new Date(fm.retain_until);
      if (Date.now() > retainDate.getTime()) {
        findings.push({ category: "archive", level: "needs-agent", file: `docs/archive/${dir}/`, message: `Past retention date ${fm.retain_until}. Consider discarding (requires human confirmation).` });
      }
    } else if (fm?.date) {
      const archiveDate = new Date(fm.date);
      const expiryDate = new Date(archiveDate);
      expiryDate.setMonth(expiryDate.getMonth() + retentionMonths);
      if (Date.now() > expiryDate.getTime()) {
        findings.push({ category: "archive", level: "needs-agent", file: `docs/archive/${dir}/`, message: `Archived ${fm.date}, past ${retentionMonths}-month retention. Consider discarding.` });
      }
    }
  }
}

// 4b. Archive version chain consistency
function checkVersionChain(): void {
  const versionDirs = listDirs("docs/archive");
  for (const dir of versionDirs) {
    const releasePath = `docs/archive/${dir}/release.md`;
    if (!exists(releasePath)) {
      findings.push({ category: "archive", level: "needs-agent", file: `docs/archive/${dir}/`, message: "Missing release.md in archive version dir." });
      continue;
    }
    const fm = parseFrontmatter(read(releasePath));
    if (!fm?.version) findings.push({ category: "archive", level: "needs-agent", file: releasePath, message: "Missing 'version' in frontmatter." });
    if (fm?.previous_version && fm.previous_version !== "" && !versionDirs.includes(fm.previous_version)) {
      findings.push({ category: "archive", level: "needs-agent", file: releasePath, message: `previous_version '${fm.previous_version}' not found in archive/.` });
    }
    if (fm?.next_version && fm.next_version !== "" && !versionDirs.includes(fm.next_version)) {
      findings.push({ category: "archive", level: "needs-agent", file: releasePath, message: `next_version '${fm.next_version}' not found in archive/.` });
    }
  }
}

// 5. Generated docs freshness
function checkGenerated(): void {
  for (const f of listMd("docs/generated")) {
    const content = read(`docs/generated/${f}`);
    const tsMatch = content.match(/(?:Last generated|最后生成)[：:]\s*(\d{4}-\d{2}-\d{2})/);
    if (!tsMatch) {
      findings.push({ category: "generated", level: "needs-agent", file: `docs/generated/${f}`, message: "Missing generation timestamp. Regenerate." });
      continue;
    }
    const age = (Date.now() - new Date(tsMatch[1]).getTime()) / 86400000;
    if (age > 30) findings.push({ category: "generated", level: "needs-agent", file: `docs/generated/${f}`, message: `Stale: ${Math.floor(age)} days old. Regenerate.` });
  }
}

// 6. Quality score freshness
function checkQuality(): void {
  if (!exists("docs/QUALITY_SCORE.md")) return;
  const content = read("docs/QUALITY_SCORE.md");
  const tsMatch = content.match(/(?:最后更新|updated)[：:]\s*(\d{4}-\d{2}-\d{2})/i);
  if (!tsMatch) { findings.push({ category: "quality", level: "needs-agent", file: "docs/QUALITY_SCORE.md", message: "Missing update date. [AGENT] Re-evaluate." }); return; }
  const age = (Date.now() - new Date(tsMatch[1]).getTime()) / 86400000;
  if (age > 30) findings.push({ category: "quality", level: "needs-agent", file: "docs/QUALITY_SCORE.md", message: `${Math.floor(age)} days old. [AGENT] Re-evaluate.` });
}

// --- Run ---
checkActiveRequirements();
checkStaleDesigns();
checkActiveIndex();
checkArchiveExpiry();
checkVersionChain();
checkGenerated();
checkQuality();

if (findings.length === 0) { console.log("✅ Doc gardening: no drift detected."); process.exit(0); }

console.log(`\n🌱 Doc Gardening Report — ${findings.length} finding(s)\n`);
const grouped = new Map<string, Finding[]>();
for (const f of findings) { const arr = grouped.get(f.category) || []; arr.push(f); grouped.set(f.category, arr); }
for (const [cat, items] of grouped) {
  console.log(`── ${cat} ──`);
  for (const item of items) console.log(`  ${item.level === "auto-fix" ? "🔧" : "🤖"} ${item.file ?? ""}: ${item.message}`);
  console.log();
}
const af = findings.filter(f => f.level === "auto-fix").length;
const na = findings.filter(f => f.level === "needs-agent").length;
console.log(`Summary: ${af} auto-fixable, ${na} need agent review`);
process.exit(1);
