# Agent Hub Instructions

Agent Hub is a personal AI agent configuration hub and copy-based installer. It stores agent resources in the repo, validates registry metadata, and installs selected skills, prompts, hooks, and agent definitions into Codex, Kiro, and Claude Code config directories.

## Navigation

- Architecture and dependency rules: `ARCHITECTURE.md`
- Domain boundaries: `docs/DOMAINS.md`
- Product decisions: `docs/PRODUCT_SENSE.md`
- Security rules: `docs/SECURITY.md`
- Reliability expectations: `docs/RELIABILITY.md`
- Quality map: `docs/QUALITY_SCORE.md`
- Workflow: `docs/guides/WORKFLOW.md`
- Specs/design/plans: `docs/guides/SPEC.md`, `docs/guides/DESIGN.md`, `docs/guides/PLANS.md`
- Active work: `docs/active/index.md`
- Known debt: `docs/active/tech-debt-tracker.md`
- Generated references: `docs/generated/index.md`

## Project Model

- `content/` is the canonical source for skills, prompts, hooks, and agent definitions.
- `registry/` declares installable resources, target support, default install status, and source paths.
- `src/core/` owns reusable manifest loading, resource selection, path resolution, hashing, copying, and managed manifest logic.
- `src/adapters/` maps each agent target to config directories and install destinations.
- `src/commands/` contains CLI command orchestration; keep business logic in `src/core/`.
- `install/` contains bootstrap scripts only; do not move TypeScript install behavior into shell or PowerShell.
- `docs/archive/v0.1.0/plans/` contains historical design and implementation plans predating the Harness `docs/active/` workflow.

## Development Rules

- Prefer copy-based installation over symlinks.
- Preserve existing user-managed target files unless `--force` is explicit.
- Do not hard-code user-specific paths; support target env vars and `--config-dir`.
- Keep adapters thin and put shared behavior in `src/core/`.
- Add or update tests for new CLI behavior, registry validation, target selection, and copy semantics.
- When changing Harness templates or scripts, verify they still install as normal skill content.

## Commands

```bash
npm install
npm run build
npm test
npm run check
node dist/cli.js list
node dist/cli.js doctor codex
node dist/cli.js status codex
node dist/cli.js install codex --dry-run
node dist/cli.js install all --dry-run
node dist/cli.js uninstall codex --dry-run
```

## Handoff Verification

Run these before handoff unless the change is docs-only and clearly does not affect code:

```bash
npm run build
npm test
node dist/cli.js list
node dist/cli.js install codex --dry-run
npx tsx content/skills/harness-docs/scripts/lint-docs.ts
```
