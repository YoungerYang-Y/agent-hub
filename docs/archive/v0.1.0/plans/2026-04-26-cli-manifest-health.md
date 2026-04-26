# CLI Manifest Health Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make batch target config directories safe, add stale manifest pruning, and extend doctor with managed resource health checks.

**Architecture:** Keep command modules target-local. Add target-specific config-dir resolution in the target runner, add prune helpers alongside existing uninstall helpers, and reuse managed status computation for doctor health.

**Tech Stack:** TypeScript ESM, Node.js filesystem APIs, Vitest.

---

### Task 1: Target-Specific Config Dir for `all`

**Files:**
- Modify: `src/commands/targets.ts`
- Modify: `src/cli.ts`
- Test: `tests/targets.test.ts`

**Steps:**
1. Write failing tests for `resolveConfigDirForTargetSelection("all", "/tmp/root", adapter)` returning `/tmp/root/<target>`.
2. Implement target-specific config-dir helper.
3. Wire CLI `runForTargets` to pass adjusted `configDir` per target.
4. Run focused tests, full `npm test`, and `npm run build`.
5. Commit.

### Task 2: Prune Core and Command

**Files:**
- Modify: `src/core/managed-manifest.ts`
- Create: `src/commands/prune.ts`
- Modify: `src/cli.ts`
- Test: `tests/managed-manifest.test.ts`, `tests/commands.test.ts`

**Steps:**
1. Write failing tests for dry-run, execution, and preserving current entries.
2. Implement stale pruning helper using `collectManagedStatuses`.
3. Add `runPrune`.
4. Route `prune <target|all> [--dry-run] [--config-dir <path>]`.
5. Run focused tests, full `npm test`, and `npm run build`.
6. Commit.

### Task 3: Doctor Manifest Health

**Files:**
- Modify: `src/commands/doctor.ts`
- Test: `tests/commands.test.ts`

**Steps:**
1. Write failing tests for drifted, missing destination, stale entry, and corrupt manifest JSON.
2. Implement manifest health reporting by reusing managed statuses.
3. Keep registry errors as exit-code failures; report manifest health warnings in output.
4. Run focused tests, full `npm test`, and `npm run build`.
5. Commit.

### Task 4: Documentation and Verification

**Files:**
- Modify: `README.md`

**Steps:**
1. Document `prune`, manifest health, and `all --config-dir` subdirectory behavior.
2. Run `npm run build`.
3. Run `npm test`.
4. Run `node dist/cli.js install all --dry-run --config-dir /tmp/agent-hub-all-config`.
5. Run `node dist/cli.js status all --config-dir /tmp/agent-hub-all-config`.
6. Run `node dist/cli.js prune all --dry-run --config-dir /tmp/agent-hub-all-config`.
7. Run `node dist/cli.js doctor all --config-dir /tmp/agent-hub-all-config`.
8. Commit.
