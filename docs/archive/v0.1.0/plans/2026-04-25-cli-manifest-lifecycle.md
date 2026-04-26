# CLI Manifest Lifecycle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add CLI lifecycle commands for inspecting and uninstalling agent-hub-managed resources, plus actionable unmanaged conflict output.

**Architecture:** Extract managed manifest read/write helpers from the copy engine into a reusable core module. Build `status` and `uninstall` command modules on top of those helpers, keeping target resolution in adapters and registry lookup in `core/manifest`.

**Tech Stack:** TypeScript ESM, Node.js filesystem APIs, Vitest.

---

### Task 1: Managed Manifest Status

**Files:**
- Create: `src/core/managed-manifest.ts`
- Modify: `src/core/copy.ts`
- Test: `tests/managed-manifest.test.ts`

**Steps:**
1. Write failing tests for status rows: current, missing destination, drifted destination, and stale registry entry.
2. Run `npm test -- tests/managed-manifest.test.ts` and confirm failures.
3. Implement exported manifest types, read/write helpers, and `collectManagedStatuses`.
4. Update `copy.ts` to reuse shared read/write helpers.
5. Run the focused test and full `npm test`.

### Task 2: Status Command

**Files:**
- Create: `src/commands/status.ts`
- Modify: `src/cli.ts`
- Test: `tests/commands.test.ts`

**Steps:**
1. Write failing command test that captures `runStatus` output for current and empty manifests.
2. Add `status <target> [--config-dir <path>]` routing and help text.
3. Implement `runStatus` using `collectManagedStatuses`.
4. Run focused command tests and full `npm test`.

### Task 3: Uninstall Command

**Files:**
- Modify: `src/core/managed-manifest.ts`
- Create/Modify: `src/commands/uninstall.ts`
- Modify: `src/cli.ts`
- Test: `tests/managed-manifest.test.ts`, `tests/commands.test.ts`

**Steps:**
1. Write failing tests for dry-run, execution, and `--resource <id>` filtering.
2. Add uninstall planning/execution helper that only removes manifest-managed destinations.
3. Add `uninstall <target> [--resource <id>] [--dry-run] [--config-dir <path>]` routing and help text.
4. Run focused tests and full `npm test`.

### Task 4: Conflict Output

**Files:**
- Modify: `src/core/copy.ts`
- Test: `tests/copy.test.ts`

**Steps:**
1. Write failing test asserting unmanaged conflict messages include destination, manifest path, `--force`, and `--config-dir`.
2. Improve the thrown error message.
3. Run focused copy tests and full `npm test`.

### Task 5: Documentation and Verification

**Files:**
- Modify: `README.md`

**Steps:**
1. Document `status` and `uninstall`.
2. Run `npm run build`.
3. Run `npm test`.
4. Run `node dist/cli.js list`.
5. Run `node dist/cli.js status codex --config-dir /tmp/agent-hub-codex-config`.
6. Run `node dist/cli.js install codex --dry-run --config-dir /tmp/agent-hub-codex-config`.
