/**
 * Documentation Health Linter
 *
 * Validates the Harness Engineering documentation structure:
 * - AGENTS.md exists and is under 100 lines
 * - ARCHITECTURE.md exists
 * - Required domain docs exist (FRONTEND.md is optional if AGENTS.md does not link to it)
 * - All links in AGENTS.md resolve to real files
 * - Design catalog matches actual design doc files
 * - Product specs catalog matches actual spec files
 * - Design docs and product specs carry non-placeholder timestamps
 * - Exec plans keep creation dates in filenames
 * - Generated docs have freshness timestamps
 *
 * Usage: node path/to/lint-docs.ts
 * Exit code: 0 if all checks pass, 1 if any errors found
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

interface Issue {
  file: string;
  level: "error" | "warning";
  message: string;
}

const ROOT = process.cwd();
const DATE_VALUE = "\\d{4}-\\d{2}-\\d{2}";
const EXEC_PLAN_FILENAME = /^\d{4}-\d{2}-\d{2}-.+\.md$/;
const GENERATED_TIMESTAMP_HEADERS = ["Last generated:", "Last generated：", "最后生成:", "最后生成："];

function resolve(path: string): string {
  return join(ROOT, path);
}

function fileExists(path: string): boolean {
  return existsSync(resolve(path));
}

function readFile(path: string): string {
  return readFileSync(resolve(path), "utf-8");
}

function listMdFiles(dir: string): string[] {
  const fullDir = resolve(dir);
  if (!existsSync(fullDir)) return [];
  return readdirSync(fullDir).filter((f) => f.endsWith(".md"));
}

const ROOT_FILE_WHITELIST = new Set([
  "AGENTS.md",
  "ARCHITECTURE.md",
  "README.md",
  "README.MD",
  "CHANGELOG.md",
  "LICENSE",
  "LICENSE.md",
]);

function isProjectRelativeLink(candidate: string): boolean {
  // Reject placeholders and HTML comment artefacts.
  if (candidate.includes("{") || candidate.includes("<!--")) return false;
  // Reject shell/command-line shapes: absolute, user-home, env-var, URL, or containing spaces.
  if (/^[/~$]/.test(candidate)) return false;
  if (/^https?:/.test(candidate)) return false;
  if (candidate.includes(" ")) return false;
  // Bare filenames (no directory component) are assumed to be term/example mentions
  // unless they name a known root-level doc — those are real intra-repo links.
  if (!candidate.includes("/")) return ROOT_FILE_WHITELIST.has(candidate);
  return true;
}

function extractMarkdownLinks(content: string): string[] {
  const linkRegex = /`([^`]+\.(?:md|txt|ts|js))`/g;
  const links: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(content)) !== null) {
    if (!isProjectRelativeLink(match[1])) continue;
    links.push(match[1]);
  }
  return links;
}

function extractDirectoryLinks(content: string): string[] {
  const dirRegex = /`([^`]+\/)`/g;
  const dirs: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = dirRegex.exec(content)) !== null) {
    const candidate = match[1];
    if (candidate.includes("{") || candidate.includes("<!--")) continue;
    if (/^[/~$]/.test(candidate)) continue;
    if (/^https?:/.test(candidate)) continue;
    if (candidate.includes(" ")) continue;
    dirs.push(candidate);
  }
  return dirs;
}

function parseCatalogPaths(content: string): string[] {
  const pathRegex = /`(docs\/[^`]+\.md)`/g;
  const paths: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = pathRegex.exec(content)) !== null) {
    if (match[1].includes("{") || match[1].includes("<!--")) continue;
    paths.push(match[1]);
  }
  return paths;
}

function checkAgentsMd(issues: Issue[]): void {
  if (!fileExists("AGENTS.md")) {
    issues.push({
      file: "AGENTS.md",
      level: "error",
      message: "Missing. Create the agent entry point.",
    });
    return;
  }

  const content = readFile("AGENTS.md");
  const lineCount = content.split("\n").length;
  if (lineCount > 100) {
    issues.push({
      file: "AGENTS.md",
      level: "error",
      message: `Too long: ${lineCount} lines (max 100). Move details to docs/.`,
    });
  }

  for (const link of extractMarkdownLinks(content)) {
    if (!fileExists(link)) {
      issues.push({
        file: "AGENTS.md",
        level: "error",
        message: `Broken link: ${link}`,
      });
    }
  }

  for (const dir of extractDirectoryLinks(content)) {
    if (!existsSync(resolve(dir))) {
      issues.push({
        file: "AGENTS.md",
        level: "error",
        message: `Broken directory link: ${dir}`,
      });
    }
  }
}

function checkRequiredFiles(issues: Issue[]): void {
  if (!fileExists("ARCHITECTURE.md")) {
    issues.push({
      file: "ARCHITECTURE.md",
      level: "error",
      message: "Missing. Create system architecture overview.",
    });
  }

  const requiredDocs = [
    "docs/DESIGN.md",
    "docs/PLANS.md",
    "docs/PRODUCT_SENSE.md",
    "docs/SECURITY.md",
    "docs/design-docs/index.md",
    "docs/design-docs/core-beliefs.md",
    "docs/design-docs/_template.md",
    "docs/product-specs/index.md",
    "docs/product-specs/_template.md",
    "docs/exec-plans/_template.md",
    "docs/exec-plans/tech-debt-tracker.md",
  ];

  for (const doc of requiredDocs) {
    if (!fileExists(doc)) {
      issues.push({ file: doc, level: "error", message: "Missing required file." });
    }
  }
}

function hasDateField(content: string, label: string): boolean {
  const regex = new RegExp(`${label}[：:]\\s*(${DATE_VALUE})`);
  return regex.test(content);
}

function checkFlowDocTimestamps(issues: Issue[]): void {
  const designFiles = listMdFiles("docs/design-docs").filter(
    (f) => !new Set(["index.md", "core-beliefs.md", "_template.md"]).has(f)
  );
  for (const file of designFiles) {
    const path = `docs/design-docs/${file}`;
    const content = readFile(path);
    if (!hasDateField(content, "创建日期")) {
      issues.push({
        file: path,
        level: "error",
        message: "Missing or placeholder 创建日期. Replace `—` with YYYY-MM-DD.",
      });
    }
    if (!hasDateField(content, "最后验证")) {
      issues.push({
        file: path,
        level: "error",
        message: "Missing or placeholder 最后验证. Replace `—` with YYYY-MM-DD.",
      });
    }
  }

  const specFiles = listMdFiles("docs/product-specs").filter(
    (f) => !new Set(["index.md", "_template.md"]).has(f)
  );
  for (const file of specFiles) {
    const path = `docs/product-specs/${file}`;
    const content = readFile(path);
    if (!hasDateField(content, "创建日期")) {
      issues.push({
        file: path,
        level: "error",
        message: "Missing or placeholder 创建日期. Replace `—` with YYYY-MM-DD.",
      });
    }
    if (!hasDateField(content, "最后更新")) {
      issues.push({
        file: path,
        level: "error",
        message: "Missing or placeholder 最后更新. Replace `—` with YYYY-MM-DD.",
      });
    }
  }
}

function checkExecPlanFilenames(issues: Issue[]): void {
  const execPlanDirs = ["docs/exec-plans/active", "docs/exec-plans/completed"];
  for (const dir of execPlanDirs) {
    for (const file of listMdFiles(dir)) {
      if (!EXEC_PLAN_FILENAME.test(file)) {
        issues.push({
          file: `${dir}/${file}`,
          level: "error",
          message: "Invalid exec plan filename. Use YYYY-MM-DD-{short-name}.md.",
        });
      }
    }
  }
}

function checkCatalogSync(
  issues: Issue[],
  catalogPath: string,
  dirPath: string,
  skipFiles: Set<string>
): void {
  if (!fileExists(catalogPath)) return;

  const catalog = readFile(catalogPath);
  const catalogPaths = parseCatalogPaths(catalog);
  const actualFiles = listMdFiles(dirPath).filter((f) => !skipFiles.has(f));

  // Check: file on disk but not in catalog
  for (const file of actualFiles) {
    const fullPath = `${dirPath}/${file}`;
    if (!catalogPaths.some((p) => p.endsWith(file))) {
      issues.push({
        file: fullPath,
        level: "warning",
        message: `Not listed in ${catalogPath}.`,
      });
    }
  }

  // Check: path in catalog but file missing on disk
  for (const catalogEntry of catalogPaths) {
    if (!fileExists(catalogEntry)) {
      issues.push({
        file: catalogPath,
        level: "error",
        message: `Broken catalog entry: ${catalogEntry} does not exist.`,
      });
    }
  }
}

function checkGeneratedDocs(issues: Issue[]): void {
  for (const file of listMdFiles("docs/generated")) {
    const content = readFile(`docs/generated/${file}`);
    if (!GENERATED_TIMESTAMP_HEADERS.some((header) => content.includes(header))) {
      issues.push({
        file: `docs/generated/${file}`,
        level: "warning",
        message: "Missing generation timestamp header (`Last generated:` or `最后生成：`).",
      });
    }
  }
}

function lintDocs(): Issue[] {
  const issues: Issue[] = [];

  checkAgentsMd(issues);
  checkRequiredFiles(issues);
  checkCatalogSync(
    issues,
    "docs/design-docs/index.md",
    "docs/design-docs",
    new Set(["index.md", "core-beliefs.md", "_template.md"])
  );
  checkCatalogSync(
    issues,
    "docs/product-specs/index.md",
    "docs/product-specs",
    new Set(["index.md", "_template.md"])
  );
  checkFlowDocTimestamps(issues);
  checkExecPlanFilenames(issues);
  checkGeneratedDocs(issues);

  return issues;
}

// --- Main ---
const issues = lintDocs();
const errors = issues.filter((i) => i.level === "error");
const warnings = issues.filter((i) => i.level === "warning");

if (issues.length === 0) {
  console.log("✅ Doc health check passed. All files present and valid.");
  process.exit(0);
}

for (const issue of issues) {
  const icon = issue.level === "error" ? "❌" : "⚠️";
  console.log(`${icon} [${issue.file}] ${issue.message}`);
}

console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length > 0 ? 1 : 0);
