# Agent Hub Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Node.js CLI that syncs this repository's AI configuration content into local Codex, Kiro, and Claude Code config directories using copy-based installation.

**Architecture:** Keep `content/` as the single source of truth, `registry/` as declarative install metadata, `src/core/` for reusable install logic, and `src/adapters/` for tool-specific destination rules. The shell and PowerShell scripts only bootstrap Node and call the CLI.

**Tech Stack:** Node.js, TypeScript, Vitest, JSON registries, filesystem-based copy operations.

---

### Task 1: Initialize Node CLI Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `src/cli.ts`
- Create: `src/commands/list.ts`

**Step 1: Add package metadata**

Create `package.json` with a CLI entry named `agent-hub`, TypeScript build scripts, and test script placeholders.

**Step 2: Add TypeScript config**

Create `tsconfig.json` targeting modern Node.js with `moduleResolution` set for Node-compatible imports.

**Step 3: Add minimal CLI dispatcher**

Create `src/cli.ts` that reads `process.argv`, dispatches `list`, and prints help for unknown commands.

**Step 4: Add empty list command**

Create `src/commands/list.ts` that prints a placeholder resource list until registry loading is implemented.

**Step 5: Verify**

Run `npm run build`.

Expected: TypeScript compiles without errors.

---

### Task 2: Define Registry Schema

**Files:**
- Create: `registry/skills.json`
- Create: `registry/prompts.json`
- Create: `registry/hooks.json`
- Create: `registry/agents.json`
- Create: `src/core/manifest.ts`
- Modify: `src/commands/list.ts`

**Step 1: Add initial registries**

Create four JSON files with arrays of resources. `skills.json` should include `harness-engineering`; the others can start empty.

**Step 2: Implement registry loading**

Create `src/core/manifest.ts` with functions to load and validate all registry files from the repository root.

**Step 3: Wire list command**

Update `src/commands/list.ts` to print resource ID, type, supported targets, and default status.

**Step 4: Verify**

Run `npm run build` and `node dist/cli.js list`.

Expected: `harness-engineering` appears in the list.

---

### Task 3: Migrate Existing Skill Content

**Files:**
- Move: `skills/harness-engineering/` to `content/skills/harness-engineering/`
- Modify: `registry/skills.json`
- Modify: `README.md`

**Step 1: Move skill directory**

Move the existing `skills/harness-engineering/` tree under `content/skills/harness-engineering/`.

**Step 2: Update registry source path**

Ensure `registry/skills.json` points at `content/skills/harness-engineering`.

**Step 3: Update docs**

Update `README.md` to describe `content/` as the canonical source location.

**Step 4: Verify**

Run `node dist/cli.js list`.

Expected: the moved skill still appears with a valid source path.

---

### Task 4: Implement Platform Path Helpers

**Files:**
- Create: `src/core/platform.ts`
- Create: `src/core/paths.ts`
- Create: `src/adapters/types.ts`

**Step 1: Define adapter interface**

Create an interface with target ID, display name, config path resolver, and install mapping resolver.

**Step 2: Add platform helpers**

Implement OS detection and home/config directory helpers using Node `os`, `path`, and environment variables.

**Step 3: Add path override support**

Support `--config-dir` at command level later by designing resolver functions to accept optional overrides.

**Step 4: Verify**

Run `npm run build`.

Expected: no TypeScript errors.

---

### Task 5: Add Target Adapters

**Files:**
- Create: `src/adapters/codex.ts`
- Create: `src/adapters/kiro.ts`
- Create: `src/adapters/claude-code.ts`
- Create: `src/adapters/index.ts`

**Step 1: Implement Codex adapter**

Resolve config home from `CODEX_HOME` or platform default, then map skills to the Codex skills directory.

**Step 2: Implement Kiro adapter**

Resolve config home from `KIRO_HOME` or platform default, then map skills to the Kiro skills directory.

**Step 3: Implement Claude Code adapter**

Resolve config home from `CLAUDE_HOME` or platform default, then map supported content types to Claude Code-compatible locations.

**Step 4: Add adapter registry**

Create `src/adapters/index.ts` exporting supported target adapters by ID.

**Step 5: Verify**

Run `npm run build`.

Expected: adapters compile and expose all three targets.

---

### Task 6: Implement Copy Engine

**Files:**
- Create: `src/core/copy.ts`
- Create: `src/core/hash.ts`
- Modify: `src/core/manifest.ts`

**Step 1: Add recursive copy**

Implement directory and file copying with target directory creation.

**Step 2: Add managed manifest**

Write `.agent-hub-manifest.json` in each target config root with installed resource IDs, destination paths, timestamps, and content hash.

**Step 3: Add conflict handling**

If destination exists and is not in the manifest, report conflict unless `--force` is set.

**Step 4: Add dry-run support**

Return planned operations without writing when `--dry-run` is set.

**Step 5: Verify**

Run build and manually test against a temporary directory.

Expected: files copy and manifest is written.

---

### Task 7: Implement Install And Update Commands

**Files:**
- Create: `src/commands/install.ts`
- Create: `src/commands/update.ts`
- Modify: `src/cli.ts`

**Step 1: Parse target and flags**

Support `agent-hub install <target>`, `--dry-run`, `--force`, and `--config-dir`.

**Step 2: Select resources**

Install resources whose registry target list includes the selected target and whose `default` flag is true.

**Step 3: Execute copy plan**

Use the adapter and copy engine to perform installation.

**Step 4: Make update call install**

Implement `update` as the same sync path with clearer command wording.

**Step 5: Verify**

Run `node dist/cli.js install codex --dry-run`.

Expected: CLI prints planned copy operations without writing files.

---

### Task 8: Implement Doctor Command

**Files:**
- Create: `src/commands/doctor.ts`
- Modify: `src/cli.ts`

**Step 1: Validate target adapter**

Check that the selected target exists.

**Step 2: Validate registry**

Load all registries and report malformed entries or missing source paths.

**Step 3: Validate target path**

Resolve config directory and check whether it can be created or written.

**Step 4: Print actionable output**

Summarize checks as pass, warning, or error.

**Step 5: Verify**

Run `node dist/cli.js doctor codex`.

Expected: command reports registry and path status.

---

### Task 9: Add Bootstrap Scripts

**Files:**
- Create: `install/install.sh`
- Create: `install/install.ps1`
- Modify: `README.md`

**Step 1: Add Bash bootstrap**

Check Node version, run dependency installation if needed, build CLI, and call `agent-hub install`.

**Step 2: Add PowerShell bootstrap**

Mirror the Bash behavior without duplicating install business logic.

**Step 3: Document usage**

Add Linux and Windows quick-start examples to `README.md`.

**Step 4: Verify**

Run scripts in dry-run mode where possible.

Expected: scripts delegate to Node CLI successfully.

---

### Task 10: Add Tests

**Files:**
- Create: `tests/manifest.test.ts`
- Create: `tests/paths.test.ts`
- Create: `tests/copy.test.ts`
- Modify: `package.json`

**Step 1: Add Vitest**

Configure `npm test` to run Vitest.

**Step 2: Test registry validation**

Cover valid resources, missing fields, unsupported targets, and missing source paths.

**Step 3: Test path resolution**

Cover environment overrides and Linux/Windows path helpers with mocked environment variables.

**Step 4: Test copy behavior**

Use temporary directories to verify copy, dry-run, manifest write, and conflict detection.

**Step 5: Verify**

Run `npm test`.

Expected: all tests pass.

---

### Task 11: Final Documentation Pass

**Files:**
- Modify: `README.md`
- Create or modify: `AGENTS.md`

**Step 1: Document repository model**

Explain `content/`, `registry/`, `src/adapters/`, and `install/`.

**Step 2: Document common commands**

Include examples for `list`, `doctor`, `install`, `update`, `--dry-run`, and `--config-dir`.

**Step 3: Document contribution rules**

Explain how to add a new skill, prompt, hook, agent, or target adapter.

**Step 4: Verify**

Run build, tests, and a dry-run install.

Expected: repository is ready for first implementation milestone.
