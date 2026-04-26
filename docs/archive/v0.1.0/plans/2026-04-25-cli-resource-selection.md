# CLI Resource Selection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add install/update resource selectors and target `all` batch execution.

**Architecture:** Keep copy and manifest behavior unchanged. Add a pure resource-selection helper, wire it into install/update, then let the CLI expand target `all` into repeated calls to existing target-local commands.

**Tech Stack:** TypeScript ESM, Node.js filesystem APIs, Vitest.

---

### Task 1: Resource Selector Helper

**Files:**
- Modify: `src/core/manifest.ts`
- Test: `tests/manifest.test.ts`

**Steps:**
1. Write failing tests for `--resource`, `--type`, default-only, and `--all --type` selection.
2. Run `npm test -- tests/manifest.test.ts` and confirm failures.
3. Implement `selectResourcesForTarget`.
4. Run the focused test and full `npm test`.
5. Commit.

### Task 2: Install/Update Selector Integration

**Files:**
- Modify: `src/cli.ts`
- Modify: `src/commands/install.ts`
- Test: `tests/commands.test.ts`

**Steps:**
1. Write failing tests that `runInstall` can install a selected non-default resource and select resources by type.
2. Extend parsed flags with `resourceId`, `resourceType`, and `allResources`.
3. Replace `defaultResourcesForTarget` usage with `selectResourcesForTarget`.
4. Run focused tests, full `npm test`, and `npm run build`.
5. Commit.

### Task 3: Target `all`

**Files:**
- Modify: `src/cli.ts`
- Test: `tests/cli.test.ts` or `tests/commands.test.ts`

**Steps:**
1. Write failing tests for target expansion if practical through exported helpers; otherwise test command behavior with a small extracted runner.
2. Add `all` target support for `doctor`, `status`, `install`, `update`, and `uninstall`.
3. Ensure unsupported target messages mention `all`.
4. Run focused tests, full `npm test`, and `npm run build`.
5. Commit.

### Task 4: Documentation and Verification

**Files:**
- Modify: `README.md`

**Steps:**
1. Document selector flags and target `all`.
2. Run `npm run build`.
3. Run `npm test`.
4. Run `node dist/cli.js install all --dry-run --config-dir /tmp/agent-hub-all-config`.
5. Run `node dist/cli.js status all --config-dir /tmp/agent-hub-all-config`.
6. Commit documentation.
