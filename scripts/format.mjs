import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const mode = process.argv.includes("--write") ? "write" : "check";
const root = process.cwd();
const roots = [
  ".github",
  "content",
  "docs",
  "install",
  "registry",
  "scripts",
  "src",
  "tests",
  "AGENTS.md",
  "ARCHITECTURE.md",
  "README.md",
  "LICENSE",
  ".gitignore",
  "package-lock.json",
  "package.json",
  "tsconfig.json",
  "vitest.config.ts",
];
const extensions = new Set([".json", ".md", ".mjs", ".ps1", ".sh", ".ts", ".yml", ".yaml"]);
const changed = [];

for (const entry of roots) {
  const path = join(root, entry);
  if (existsSync(path)) visit(path);
}

if (changed.length > 0) {
  for (const file of changed) console.error(`Needs formatting: ${relative(root, file)}`);
  if (mode === "check") {
    console.error("Run npm run format to update formatting.");
    process.exit(1);
  }
}

function visit(path) {
  const stats = statSync(path);
  if (stats.isDirectory()) {
    for (const entry of readdirSync(path)) {
      if (entry === "node_modules" || entry === "dist" || entry === ".git" || entry === ".tmp-tests" || entry === ".worktrees") {
        continue;
      }
      visit(join(path, entry));
    }
    return;
  }

  if (!shouldFormat(path)) return;
  const original = readFileSync(path, "utf-8");
  const formatted = normalizeText(original);
  if (formatted === original) return;
  changed.push(path);
  if (mode === "write") writeFileSync(path, formatted);
}

function shouldFormat(path) {
  if (path.endsWith(".gitignore")) return true;
  for (const extension of extensions) {
    if (path.endsWith(extension)) return true;
  }
  return false;
}

function normalizeText(text) {
  const withoutBom = text.replace(/^\uFEFF/, "");
  const lines = withoutBom.replace(/\r\n?/g, "\n").split("\n");
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return `${lines.map((line) => line.replace(/[ \t]+$/g, "")).join("\n")}\n`;
}
