/**
 * Documentation Health Linter
 *
 * Validates the Harness Engineering documentation structure:
 * - AGENTS.md exists and is under 100 lines
 * - ARCHITECTURE.md exists
 * - Required domain docs exist
 * - All links in AGENTS.md resolve to real files
 * - active/ requirement dirs each have spec.md, design.md, plan.md with valid frontmatter
 * - active/index.md matches actual requirement dirs
 * - Frontmatter status enums, cross-references, key sections
 * - Generated docs have freshness timestamps
 *
 * Usage: node path/to/lint-docs.ts
 * Exit code: 0 if all checks pass, 1 if any errors found
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

interface Issue { file: string; level: "error" | "warning"; message: string; }
interface Frontmatter { [key: string]: string; }

const ROOT = process.cwd();
const GENERATED_TIMESTAMP_HEADERS = ["Last generated:", "Last generated：", "最后生成:", "最后生成："];
const SPEC_STATUSES = new Set(["draft", "in-progress", "shipped"]);
const DESIGN_STATUSES = new Set(["draft", "verified", "stale"]);
const PLAN_STATUSES = new Set(["not-started", "in-progress", "completed", "blocked"]);

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

const ROOT_FILE_WHITELIST = new Set(["AGENTS.md", "ARCHITECTURE.md", "README.md", "README.MD", "CHANGELOG.md", "LICENSE", "LICENSE.md"]);

function isProjectRelativeLink(c: string): boolean {
  if (c.includes("{") || c.includes("<!--")) return false;
  if (/^[/~$]/.test(c) || /^https?:/.test(c) || c.includes(" ")) return false;
  if (!c.includes("/")) return ROOT_FILE_WHITELIST.has(c);
  return true;
}

function extractMarkdownLinks(content: string): string[] {
  const re = /`([^`]+\.(?:md|txt|ts|js))`/g; const links: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) { if (isProjectRelativeLink(m[1])) links.push(m[1]); }
  return links;
}

function extractDirectoryLinks(content: string): string[] {
  const re = /`([^`]+\/)`/g; const dirs: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    const c = m[1];
    if (c.includes("{") || c.includes("<!--") || /^[/~$]/.test(c) || /^https?:/.test(c) || c.includes(" ")) continue;
    dirs.push(c);
  }
  return dirs;
}

function parseFrontmatter(content: string): Frontmatter | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fm: Frontmatter = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    fm[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
  }
  return fm;
}

function checkFm(issues: Issue[], path: string, content: string, keys: string[], statuses: Set<string>): Frontmatter | null {
  const fm = parseFrontmatter(content);
  if (!fm) { issues.push({ file: path, level: "error", message: "Missing YAML frontmatter." }); return null; }
  for (const k of keys) {
    if (!fm[k] || fm[k] === "" || fm[k].includes("{"))
      issues.push({ file: path, level: "error", message: `Frontmatter '${k}' is missing or placeholder.` });
  }
  if (fm.status && !fm.status.includes("{") && !statuses.has(fm.status))
    issues.push({ file: path, level: "error", message: `Invalid status '${fm.status}'. Allowed: ${[...statuses].join(", ")}` });
  return fm;
}

// --- Checks ---

function checkAgentsMd(issues: Issue[]): void {
  if (!exists("AGENTS.md")) { issues.push({ file: "AGENTS.md", level: "error", message: "Missing." }); return; }
  const content = read("AGENTS.md");
  if (content.split("\n").length > 100) issues.push({ file: "AGENTS.md", level: "error", message: "Too long (max 100 lines)." });
  for (const link of extractMarkdownLinks(content)) { if (!exists(link)) issues.push({ file: "AGENTS.md", level: "error", message: `Broken link: ${link}` }); }
  for (const dir of extractDirectoryLinks(content)) { if (!existsSync(resolve(dir))) issues.push({ file: "AGENTS.md", level: "error", message: `Broken directory link: ${dir}` }); }
}

function checkRequiredFiles(issues: Issue[]): void {
  if (!exists("ARCHITECTURE.md")) issues.push({ file: "ARCHITECTURE.md", level: "error", message: "Missing." });
  const required = [
    "docs/guides/DESIGN.md", "docs/guides/PLANS.md", "docs/guides/SPEC.md", "docs/guides/WORKFLOW.md",
    "docs/PRODUCT_SENSE.md", "docs/design-docs/core-beliefs.md",
    "docs/active/index.md", "docs/active/tech-debt-tracker.md",
    "docs/archive/index.md",
  ];
  for (const f of required) { if (!exists(f)) issues.push({ file: f, level: "error", message: "Missing required file." }); }
  // Optional files: only warn if AGENTS.md links to them but they don't exist
  const optional = ["docs/QUALITY_SCORE.md", "docs/RELIABILITY.md", "docs/SECURITY.md"];
  if (exists("AGENTS.md")) {
    const agents = read("AGENTS.md");
    for (const f of optional) {
      if (agents.includes(f) && !exists(f)) {
        issues.push({ file: f, level: "error", message: "Referenced in AGENTS.md but missing. Either create it or remove the link." });
      }
    }
  }
}

function checkActiveRequirements(issues: Issue[]): void {
  const reqDirs = listDirs("docs/active");
  for (const dir of reqDirs) {
    const base = `docs/active/${dir}`;
    // design.md and plan.md are required; spec.md is optional (medium tasks skip it)
    for (const file of ["design.md", "plan.md"]) {
      if (!exists(`${base}/${file}`)) {
        issues.push({ file: `${base}/${file}`, level: "error", message: `Missing. Requirement dir must have design.md and plan.md.` });
      }
    }
    // Validate frontmatter for each file that exists
    if (exists(`${base}/spec.md`)) checkFm(issues, `${base}/spec.md`, read(`${base}/spec.md`), ["id", "status", "owner", "created", "updated"], SPEC_STATUSES);
    if (exists(`${base}/design.md`)) checkFm(issues, `${base}/design.md`, read(`${base}/design.md`), ["id", "status", "owner", "created", "verified"], DESIGN_STATUSES);
    if (exists(`${base}/plan.md`)) checkFm(issues, `${base}/plan.md`, read(`${base}/plan.md`), ["id", "status", "owner", "created", "updated"], PLAN_STATUSES);

    // Slug consistency: all three files in same dir must share the same slug
    const specFm = exists(`${base}/spec.md`) ? parseFrontmatter(read(`${base}/spec.md`)) : null;
    const designFm = exists(`${base}/design.md`) ? parseFrontmatter(read(`${base}/design.md`)) : null;
    const planFm = exists(`${base}/plan.md`) ? parseFrontmatter(read(`${base}/plan.md`)) : null;
    const extractSlug = (id: string | undefined, prefix: string): string | null => {
      if (!id || id.includes("{")) return null;
      return id.startsWith(prefix) ? id.slice(prefix.length) : null;
    };
    const specSlug = extractSlug(specFm?.id, "spec-");
    const designSlug = extractSlug(designFm?.id, "design-");
    const planSlug = extractSlug(planFm?.id, "plan-");
    if (specSlug && designSlug && specSlug !== designSlug) {
      issues.push({ file: `${base}/design.md`, level: "error", message: `Slug mismatch: spec id slug '${specSlug}' ≠ design id slug '${designSlug}'. Must match within same requirement dir.` });
    }
    if (specSlug && planSlug && specSlug !== planSlug) {
      issues.push({ file: `${base}/plan.md`, level: "error", message: `Slug mismatch: spec id slug '${specSlug}' ≠ plan id slug '${planSlug}'. Must match within same requirement dir.` });
    }
  }

  // Check active/index.md lists all dirs
  if (exists("docs/active/index.md")) {
    const catalog = read("docs/active/index.md");
    for (const dir of reqDirs) {
      if (!catalog.includes(dir)) {
        issues.push({ file: `docs/active/${dir}/`, level: "warning", message: "Requirement dir not listed in docs/active/index.md." });
      }
    }
  }
}

function checkKeySections(issues: Issue[]): void {
  const designSections = ["## 技术方案", "## 影响范围", "## 约束", "## 验证方式"];
  const specSections = ["## 功能边界", "## 验收标准"];
  for (const dir of listDirs("docs/active")) {
    const base = `docs/active/${dir}`;
    if (exists(`${base}/design.md`)) {
      const content = read(`${base}/design.md`);
      for (const s of designSections) { if (!content.includes(s)) issues.push({ file: `${base}/design.md`, level: "warning", message: `Missing section '${s}'.` }); }
    }
    if (exists(`${base}/spec.md`)) {
      const content = read(`${base}/spec.md`);
      for (const s of specSections) { if (!content.includes(s)) issues.push({ file: `${base}/spec.md`, level: "warning", message: `Missing section '${s}'.` }); }
    }
  }
}

function checkGeneratedDocs(issues: Issue[]): void {
  for (const file of listMd("docs/generated")) {
    const content = read(`docs/generated/${file}`);
    if (!GENERATED_TIMESTAMP_HEADERS.some(h => content.includes(h)))
      issues.push({ file: `docs/generated/${file}`, level: "warning", message: "Missing generation timestamp header." });
  }
}

function checkArchiveExpiry(issues: Issue[]): void {
  if (!exists("docs/archive/index.md")) return;
  const content = read("docs/archive/index.md");
  const rows = content.match(/\|\s*v[\d.]+\s*\|[^|]*\|\s*(\d{4}-\d{2}-\d{2})\s*\|/g) || [];
  for (const row of rows) {
    const dateMatch = row.match(/(\d{4}-\d{2}-\d{2})\s*\|$/);
    if (!dateMatch) continue;
    const retainUntil = new Date(dateMatch[1]);
    if (Date.now() > retainUntil.getTime()) {
      issues.push({ file: "docs/archive/index.md", level: "warning", message: `Archive version past retention date ${dateMatch[1]}. Consider discarding.` });
    }
  }
}

function checkPlaceholders(issues: Issue[]): void {
  const placeholderRe = /<!--\s*[^>]*\s*-->/;
  // Check active requirement docs
  for (const dir of listDirs("docs/active")) {
    for (const file of ["spec.md", "design.md", "plan.md"]) {
      const path = `docs/active/${dir}/${file}`;
      if (!exists(path)) continue;
      const content = read(path);
      const bodyStart = content.indexOf("---", content.indexOf("---") + 3);
      if (bodyStart === -1) continue;
      const body = content.slice(bodyStart + 3);
      if (placeholderRe.test(body)) {
        issues.push({ file: path, level: "error", message: "Contains unfilled <!-- --> placeholders. Fill or remove." });
      }
    }
  }
  // Check root docs
  for (const file of ["AGENTS.md", "ARCHITECTURE.md"]) {
    if (!exists(file)) continue;
    if (placeholderRe.test(read(file))) {
      issues.push({ file, level: "error", message: "Contains unfilled <!-- --> placeholders. Fill or remove." });
    }
  }
  // Check domain docs
  for (const file of ["PRODUCT_SENSE.md", "QUALITY_SCORE.md", "RELIABILITY.md", "SECURITY.md"]) {
    const path = `docs/${file}`;
    if (!exists(path)) continue;
    if (placeholderRe.test(read(path))) {
      issues.push({ file: path, level: "error", message: "Contains unfilled <!-- --> placeholders. Fill or remove." });
    }
  }
  for (const file of ["DESIGN.md", "PLANS.md", "SPEC.md", "WORKFLOW.md"]) {
    const path = `docs/guides/${file}`;
    if (!exists(path)) continue;
    if (placeholderRe.test(read(path))) {
      issues.push({ file: path, level: "error", message: "Contains unfilled <!-- --> placeholders. Fill or remove." });
    }
  }
  // Check structural docs that agents read as truth
  for (const path of ["docs/design-docs/core-beliefs.md", "docs/active/index.md", "docs/active/tech-debt-tracker.md", "docs/archive/index.md"]) {
    if (!exists(path)) continue;
    if (placeholderRe.test(read(path))) {
      issues.push({ file: path, level: "error", message: "Contains unfilled <!-- --> placeholders. Fill or remove." });
    }
  }
  // Check archive release.md files
  for (const dir of listDirs("docs/archive")) {
    const path = `docs/archive/${dir}/release.md`;
    if (!exists(path)) continue;
    const content = read(path);
    const bodyStart = content.indexOf("---", content.indexOf("---") + 3);
    if (bodyStart === -1) continue;
    if (placeholderRe.test(content.slice(bodyStart + 3))) {
      issues.push({ file: path, level: "error", message: "Contains unfilled <!-- --> placeholders. Fill or remove." });
    }
  }
}

function lintDocs(): Issue[] {
  const issues: Issue[] = [];
  checkAgentsMd(issues);
  checkRequiredFiles(issues);
  checkActiveRequirements(issues);
  checkKeySections(issues);
  checkGeneratedDocs(issues);
  checkArchiveExpiry(issues);
  checkPlaceholders(issues);
  return issues;
}

// --- Main ---
const issues = lintDocs();
const errors = issues.filter(i => i.level === "error");
const warnings = issues.filter(i => i.level === "warning");

if (issues.length === 0) { console.log("✅ Doc health check passed."); process.exit(0); }
for (const i of issues) { console.log(`${i.level === "error" ? "❌" : "⚠️"} [${i.file}] ${i.message}`); }
console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length > 0 ? 1 : 0);
