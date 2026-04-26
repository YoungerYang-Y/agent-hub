# CLI Manifest Lifecycle Design

## Context

`agent-hub` already has a copy-based installer, target adapters, registry validation, and a managed manifest at `.agent-hub-manifest.json`. The current CLI can install and update default resources, but users cannot inspect managed state or remove managed resources through the CLI.

The first optimization phase should close that lifecycle without expanding the whole command surface.

## Goals

- Add `status <target>` so users can inspect installed managed resources.
- Add `uninstall <target> [--resource <id>] [--dry-run]` so users can remove only agent-hub-managed resources.
- Improve unmanaged install conflict messages with actionable next steps.
- Keep Codex, Kiro, and Claude Code support target-neutral.

## Non-Goals

- No `all` target support in this phase.
- No selective install (`--resource`, `--type`, `--all`) in this phase.
- No backup or atomic replace behavior in this phase.
- No migration of existing unmanaged local skill directories.

## Proposed Behavior

### `status <target>`

The command reads the target config directory and `.agent-hub-manifest.json`, then prints one row per managed resource for that target:

- resource id and type
- source path from the manifest
- destination path
- destination state: present or missing
- hash state: current, drifted, source missing, or not checked
- stale state when the resource id no longer appears in the current registry

If the manifest is absent or has no entries for the target, print a clean empty state and exit 0.

### `uninstall <target> [--resource <id>] [--dry-run]`

The command reads the manifest and removes only entries where `target` matches the active adapter and, if provided, `id` matches `--resource`.

For each matched resource:

- if the destination exists, remove it recursively
- if the destination is missing, still remove the manifest entry
- if `--dry-run`, print planned removals and do not write files

If no entries match, print a clear message and exit 0. The command must never delete paths that are not represented in the managed manifest.

### Conflict Output

When install/update finds an unmanaged destination conflict, the error should include:

- resource id
- destination path
- manifest path
- suggested next actions: use `--force`, use `--config-dir`, or manually back up/delete the destination

## Architecture

- Keep `src/cli.ts` as the command router, but extend flag parsing with `--resource`.
- Keep manifest read/write and path resolution in `src/core/copy.ts`; expose small lifecycle helpers there or in a new `src/core/managed-manifest.ts` if the file becomes too large.
- Add command modules:
  - `src/commands/status.ts`
  - `src/commands/uninstall.ts`
- Reuse existing adapters and registry loading so behavior stays target-neutral.

## Testing

Use Vitest and temporary config directories.

Tests should cover:

- `status` reports current, missing destination, drifted destination, and stale registry entries.
- `uninstall --dry-run` does not delete files or rewrite manifest.
- `uninstall` removes managed destinations and manifest entries.
- `uninstall --resource <id>` removes only the selected resource.
- unmanaged conflict message contains destination, manifest path, and actionable next steps.

## Rollout

Implement in small TDD slices:

1. Manifest status helper and command.
2. Uninstall planning and dry-run.
3. Uninstall execution and manifest rewrite.
4. Conflict message improvement.
5. README command documentation and full verification.
