# CLI Resource Selection Design

## Context

`agent-hub` now has a complete managed-resource lifecycle: install, status, and uninstall. The next usability gap is command scope. Today install/update operate only on default resources for one target at a time, which is fine for a single skill but weak once prompts, hooks, agents, and optional resources are added.

## Goals

- Let users select install/update resources by id with `--resource <id>`.
- Let users select install/update resources by type with `--type <skill|prompt|hook|agent>`.
- Let users install/update every resource supported by a target with `--all`.
- Let users run `doctor`, `status`, `install`, `update`, and `uninstall` against every supported target with target `all`.
- Keep default behavior unchanged: `install codex` still installs default resources for Codex only.

## Non-Goals

- Do not change copy semantics, conflict behavior, or manifest format.
- Do not add backup or atomic replacement in this phase.
- Do not change update into a managed-only operation in this phase.
- Do not replace the hand-written CLI parser yet.

## Resource Selection

Install/update use a resource selector after loading all registries:

1. `--resource <id>` selects resources with that id.
2. `--type <type>` filters by resource type.
3. `--all` includes non-default resources.
4. With no selector flags, keep current behavior: default resources only.

Selectors compose conservatively:

- `--resource harness-engineering --type skill` is valid and must match both.
- `--all --type skill` means all skills supported by the target.
- `--all --resource harness-engineering` is allowed but redundant.

If selection yields no resources for a target, print a clear no-op message and exit 0.

## Target `all`

Target `all` expands to the existing adapter list: Codex, Kiro, Claude Code.

Supported commands:

- `doctor all`
- `status all`
- `install all`
- `update all`
- `uninstall all`

Execution is sequential and prints each target section separately. If any target fails, continue to the next target, then set exit code 1 at the end. This keeps batch operations useful while still surfacing failures.

## Architecture

- Add a resource selector helper in `src/core/manifest.ts` or a focused `src/core/resource-selection.ts`.
- Add a target runner helper in `src/cli.ts` or `src/commands/targets.ts` for `all` expansion.
- Keep command modules target-local. The CLI layer handles `all` by invoking each target-local command once per adapter.
- Extend parsed flags with `resourceType?: HubResourceType` and `allResources: boolean`.

## Testing

Use unit-level command tests for selection and CLI-adjacent tests for target expansion where practical.

Required coverage:

- `--resource` selects a named non-default resource.
- `--type` selects default resources of that type by default.
- `--all --type` selects non-default resources of that type.
- `install all --dry-run --config-dir <tmp>` prints sections for all three targets.
- `status all --config-dir <tmp>` reports all three targets without requiring manifests.
- invalid `--type` fails with supported type names.

## Rollout

Ship in small commits:

1. Resource selector helper and tests.
2. Install/update selector integration.
3. Target `all` expansion.
4. README updates and full verification.
