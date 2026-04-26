# CLI Manifest Health Design

## Context

`agent-hub` now supports install/update resource selection, target `all`, status, and uninstall. The remaining safety gap is manifest health: batch operations with `--config-dir` can collide, stale entries can only be observed but not cleaned, and `doctor` does not inspect managed resource drift.

## Goals

- Make `all --config-dir <path>` safe by resolving each target under a target-specific subdirectory.
- Add `prune <target|all> [--dry-run] [--config-dir <path>]` to clean stale manifest entries.
- Extend `doctor` with manifest health checks.
- Keep existing single-target behavior unchanged.

## Non-Goals

- No atomic install or backup behavior in this phase.
- No JSON output.
- No update semantic change.
- No parser framework replacement.
- No zip/package export.

## Target-Specific Config Directories

When target is `all` and `--config-dir <path>` is provided, each resolved target receives:

- Codex: `<path>/codex`
- Kiro: `<path>/kiro`
- Claude Code: `<path>/claude-code`

Without `--config-dir`, each adapter keeps its normal default home resolution. Single-target commands keep the exact provided `--config-dir`.

## Prune Command

`prune` removes stale managed resources: manifest entries whose resource id no longer exists in current registries.

Behavior:

- Reads the target manifest.
- Computes managed statuses with the current registry.
- Selects entries where `registryState === "stale"`.
- Deletes destination directories when present.
- Removes stale entries from the manifest.
- In `--dry-run`, only prints planned removals.
- Does not touch unmanaged files.

## Doctor Manifest Health

`doctor` should continue checking Node, registry, and write access. It should also report manifest health:

- manifest absent: ok, no managed resources
- manifest unreadable JSON: failed
- managed destination missing: warning/failure summary
- managed source missing: warning/failure summary
- drifted destination hash: warning/failure summary
- stale registry entry: warning/failure summary

For this phase, manifest health issues should be reported as warnings unless manifest JSON cannot be parsed. Registry errors still set exit code 1.

## Testing

Required coverage:

- `all --config-dir` maps each target to a subdirectory.
- `prune --dry-run` leaves destination and manifest unchanged.
- `prune` removes stale destinations and manifest entries.
- `prune` does not remove current registry entries.
- `doctor` reports manifest health for drifted, missing, and stale resources.
- Invalid/corrupt manifest JSON makes doctor fail clearly.

## Rollout

1. Target config-dir resolution.
2. Prune core helper and command.
3. Doctor manifest health.
4. README and verification.
