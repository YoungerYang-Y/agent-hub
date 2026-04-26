# Agent Hub Instructions

This file preserves the pre-Harness `AGENTS.md` content that was migrated on 2026-04-26.

## Project Model

- `content/` is the canonical source for skills, prompts, hooks, and agent definitions.
- `registry/` describes which resources install to which agent targets.
- `src/core/` contains reusable registry, path, hash, and copy logic.
- `src/adapters/` contains Codex, Kiro, and Claude Code target-specific mappings.
- `install/` contains lightweight bootstrap scripts only; keep business logic in TypeScript.

## Development Rules

- Prefer copy-based installation over symlinks.
- Preserve existing content when moving directories.
- Add tests for new CLI behavior and copy semantics.
- Do not hard-code user-specific paths; support environment variables and `--config-dir`.
- Keep adapters thin and put shared logic in `src/core/`.

## Verification

Run these before handoff:

```bash
npm run build
npm test
node dist/cli.js list
node dist/cli.js install codex --dry-run
```
