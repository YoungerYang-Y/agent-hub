---
name: harness-engineering
description: Agent-first documentation system for AI-driven codebases — structured knowledge bases, progressive disclosure, executable constraints, and feedback loops that keep agents effective at scale.
---

# Harness Engineering

Build and maintain an agent-first documentation system. One skill, three scenarios: bootstrap a new Harness, evolve an existing one, or run periodic gardening.

Reference knowledge (principles, document roles, directory structure, anti-patterns) lives in `references/REFERENCE.md`. Read it when you need background — it is NOT injected automatically. Bootstrap quality checklist in `checklists/quality-checklist.md`.

## When to Activate

- Setting up a new project's Harness documentation (→ Scenario 1)
- Creating / modifying / archiving Harness documents in an existing project (→ Scenario 2)
- Running a weekly or monthly maintenance pass (→ Scenario 3)

## When NOT to Activate

- Writing ordinary business code that doesn't touch Harness docs
- The project already has a complete Harness and you're not modifying it
- Working on non-documentation tasks (tests, features, bug fixes)

## Input

- A project directory with at least one dependency manifest (`package.json` / `go.mod` / `pyproject.toml` / `Cargo.toml` / `build.gradle` / `pom.xml`)
- Optional: user-specified project type (otherwise auto-detect)

## Output

- Scenario 1: filled Harness documentation skeleton, `lint-docs.ts` passes
- Scenario 2: updated Harness documents with timestamps refreshed
- Scenario 3: drift report + fixes committed

## Done When

- `node "$HARNESS_ENGINEERING_SKILL_DIR/templates/scripts/lint-docs.ts"` exits 0 (run from project root)
- `grep -r '<!-- ' docs/ AGENTS.md ARCHITECTURE.md` returns no unfilled placeholders (Scenario 1 only)
- All changes committed

---

## Scenario 1 — Bootstrap (new project)

### Step 1: Run bootstrap script

```bash
HARNESS_ENGINEERING_SKILL_DIR=/path/to/installed/harness-engineering
bash "$HARNESS_ENGINEERING_SKILL_DIR/scripts/bootstrap.sh" /path/to/project
```

Creates full directory structure + template files. Won't overwrite existing files.

### Step 2: Scan project context (one parallel batch, read-only)

Read metadata only — NOT source file bodies. Target < 20k input tokens:
- Dependency manifests (head only, skip lock files)
- Directory tree (`find . -maxdepth 2`, skip node_modules/.git)
- CI config (`.github/workflows/*.yml`, `Makefile`)
- `README*` (skip if > 500 lines)

From results, determine:
- Project type (see table below)
- Which docs to keep vs. delete

### Step 3: Tailor skeleton by project type

| Project Type | Keep | Remove | DESIGN.md: Keep Sections |
|---|---|---|---|
| Backend API | AGENTS, ARCHITECTURE, DESIGN, PLANS, SECURITY, RELIABILITY, QUALITY_SCORE, PRODUCT_SENSE | FRONTEND | API 规范 |
| Frontend SPA | AGENTS, ARCHITECTURE, DESIGN, FRONTEND, PLANS, QUALITY_SCORE, PRODUCT_SENSE | RELIABILITY (SLO section) | Web UI 规范 |
| CLI Tool | AGENTS, ARCHITECTURE, DESIGN, PLANS, SECURITY | FRONTEND, RELIABILITY, QUALITY_SCORE | CLI 规范 |
| Library / SDK | AGENTS, ARCHITECTURE, DESIGN, PLANS, SECURITY | FRONTEND, RELIABILITY | SDK/API 设计 |
| Full-Stack | All | — | All |
| Microservices | All + per-service ARCHITECTURE | — | API 规范 + 服务间通信 |

Delete files in "Remove" column. Delete inapplicable DESIGN.md sections. Remove dead links from AGENTS.md.

### Step 4: Fill templates (parallel)

All domain docs consume the same Phase 2 context — they don't depend on each other. Fill in parallel.

Docs to fill (only retained ones):
- `ARCHITECTURE.md` — system description, domain table, layer model, tech stack, dependency rules
- `AGENTS.md` — project overview, navigation links, dev commands
- `docs/DESIGN.md` — retained interface sections
- `docs/SECURITY.md` — auth, input validation, dependency policy
- `docs/RELIABILITY.md` — SLOs, observability (if kept)
- `docs/QUALITY_SCORE.md` — initial per-domain scores (if kept)
- `docs/PRODUCT_SENSE.md` — target users, principles
- `docs/design-docs/core-beliefs.md` — adapt 10 principles to project
- Leave `index.md` catalogs empty (no entries yet)

**Execution mode** — pick before starting:
- **≤ 6 docs to fill → Mode A**: single agent, 2-3 batched tool-call turns. ~50k tokens, 10-15 min.
- **≥ 7 docs to fill → Mode C**: build a compact Project Brief (~2k tokens) from Step 2 output, fan out one subagent per doc. Each subagent gets brief + template only (NOT this skill). ~100k tokens, 2-4 min.

Constraint: if a tool-call batch fails with "too large", split it in half. Never fall back to one-file-at-a-time.

### Step 5: Validate

1. `node "$HARNESS_ENGINEERING_SKILL_DIR/templates/scripts/lint-docs.ts"` — must exit 0
2. `grep -r '<!-- ' docs/ AGENTS.md ARCHITECTURE.md` — every hit must be filled or section deleted
3. Run through `checklists/quality-checklist.md` for full quality gate
4. Commit as initial Harness commit

---

## Scenario 2 — Evolve (existing project)

Triggered when creating, modifying, or archiving any Harness document.

| 你要做什么 | 子操作 | 完成标准 |
|---|---|---|
| 新增 spec / design doc / plan | 创建新文档 | `lint-docs.ts` 通过 + `index.md` 已更新 |
| 改 ARCHITECTURE / DESIGN / core-beliefs | 修改长期约束 | `lint-docs.ts` 通过 + 时间戳已更新 |
| 计划所有任务已完成 | 归档计划 | 文件在 `completed/` + 债务已记录 |
| 同一违规反复出现 ≥ 3 次 | 规则提升 | linter 能捕获该违规 + CI 已 gate |
| 发现无主模块 | Orphan 管理 | `tech-debt-tracker.md` 已记录 |

### Creating a new document

1. Copy from `_template.md` in the appropriate directory
2. Fill all sections, set date fields to today
3. Add entry to the directory's `index.md` catalog
4. Run `lint-docs.ts` to verify links

### Modifying a long-term constraint (ARCHITECTURE / DESIGN / core-beliefs)

1. Check: is this really a long-term change? If not, use a design doc instead
2. Create architecture RFC: new file in `docs/design-docs/` prefixed `arch-`
3. Make the change
4. Update all affected links and timestamps
5. Run `lint-docs.ts`

### Archiving a completed plan

1. Verify status is 已完成/completed and all checkboxes checked
2. Move from `exec-plans/active/` to `completed/` — do NOT rename the file
3. Record remaining debt in `tech-debt-tracker.md`

### Rule Promotion (when same violation recurs ≥ 3 times)

1. **Observe**: identify the signal (PR review repeats, gardening findings recur)
2. **Encode**: add lint rule to appropriate tool:
   - Doc structure → extend `lint-docs.ts`
   - Code pattern → project linter (ESLint, golangci-lint, etc.)
   - Architecture → custom lint script
3. **Verify**: run linter, confirm it catches the violation, gate CI on it

### Orphan management

When discovering a module with no spec/design-doc/owner:
1. Add to `tech-debt-tracker.md` with `Owner: ORPHAN`
2. Surface at next monthly review
3. Un-owned > 30 days → archive or delete

---

## Scenario 3 — Gardening (periodic maintenance)

Run weekly or monthly. Two layers: automated script + agent review.

### Step 1: Run automated checks

```bash
node "$HARNESS_ENGINEERING_SKILL_DIR/templates/scripts/doc-gardening.ts"
```

Checks: catalog ↔ file sync, generated doc freshness, completed plans in active/, quality score age, stale design docs.

### Step 2: Process findings

- `🔧 auto-fixable`: execute the fix (e.g. move completed plan to `completed/`)
- `🤖 needs-agent`: requires judgment:
  - Design docs: compare constraints against implementation → update status to 已验证 ✅ or 过期 ⚠️
  - Product specs: verify status matches reality
  - Quality scores: re-evaluate based on current coverage
  - Generated docs: regenerate from source, update timestamps

### Step 3: Commit

Open a single PR: `chore(docs): gardening — <date>`, group commits by category.

### Maintenance cadence reference

| Cadence | Task |
|---|---|
| Weekly | Scan design-docs for stale `最后验证` (> 30 days) → mark 过期 ⚠️ |
| Weekly | Dead-code scan; update QUALITY_SCORE.md |
| Monthly | Architecture drift review → tech-debt-tracker.md or RFC |
| Monthly | Archive completed plans |
| Continuous | Keep tech-debt-tracker.md current |

---

## Templates

All templates live under the installed skill directory: `$HARNESS_ENGINEERING_SKILL_DIR/templates/`. Bootstrap copies docs only — scripts stay in skill directory and are invoked externally.

| Template | Purpose |
|---|---|
| `AGENTS.md` | Agent entry point (~100 lines) |
| `ARCHITECTURE.md` | System architecture |
| `docs/DESIGN.md` | Interface specs (API/UI/CLI/SDK) |
| `docs/FRONTEND.md` | Frontend architecture (optional) |
| `docs/PLANS.md` | Planning conventions |
| `docs/PRODUCT_SENSE.md` | Product framework |
| `docs/QUALITY_SCORE.md` | Quality scores |
| `docs/RELIABILITY.md` | SLOs, observability |
| `docs/SECURITY.md` | Security policies |
| `docs/design-docs/{index,core-beliefs,_template}.md` | Design doc catalog + template |
| `docs/exec-plans/{_template,tech-debt-tracker}.md` | Plan template + debt tracker |
| `docs/product-specs/{index,_template}.md` | Spec catalog + template |
| `scripts/lint-docs.ts` | Doc structure linter (9 checks) |
| `scripts/doc-gardening.ts` | Drift detection (6 checks) |

### Running scripts

```bash
# From project root — both use process.cwd() as root
node "$HARNESS_ENGINEERING_SKILL_DIR/templates/scripts/lint-docs.ts"
node "$HARNESS_ENGINEERING_SKILL_DIR/templates/scripts/doc-gardening.ts"
```

## Versioning

CalVer `YYYY.MM.PATCH`. Current: **2026.04.3**

- Template changes (wording, section order) are backward-compatible
- Adding new files/sections is backward-compatible
- Renaming/removing existing files is breaking and requires migration notes

**2026.04.3** — Reorganized to standard skill directory structure: added README.md, references/, checklists/, scripts/; moved REFERENCE.md and bootstrap scripts.
**2026.04.2** — Restructured: execution methods in SKILL.md, reference knowledge in REFERENCE.md. Added Input/Output/Done, When NOT to Activate, 3-scenario structure.
**2026.04.1** — Added Project Type Profiles, Post-Bootstrap Workflow, doc-gardening.ts, expanded Rule Promotion.
