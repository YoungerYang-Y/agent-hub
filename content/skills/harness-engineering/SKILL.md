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

- `node "$HARNESS_ENGINEERING_SKILL_DIR/scripts/lint-docs.ts"` exits 0 (run from project root)
- `grep -r '<!-- ' docs/ AGENTS.md ARCHITECTURE.md` returns no unfilled placeholders (Scenario 1 only)
- All changes committed

## Installed Skill Directory

Before running this skill's helper scripts, set `HARNESS_ENGINEERING_SKILL_DIR` to the installed directory that contains this `SKILL.md`.

- Prefer an explicit value from the active agent runtime when available
- Otherwise infer it from the current skill file location
- Do not hard-code a tool-specific home path in generated project docs or reusable commands

## Boundary: skill tools vs. project content

`lint-docs.ts` and `doc-gardening.ts` are this skill's internal verification tools. They must NOT appear in the generated project files (AGENTS.md, ARCHITECTURE.md, etc.). Project members may not have this skill installed.

- AGENTS.md dev commands section: fill with the project's own build/test/lint commands only
- If the project wants doc linting in CI, it should vendor or fetch the script, not reference an agent-specific skill home

## Default Behavior

These defaults apply to all scenarios. The agent follows them without asking. The user can override any default with an explicit instruction.

### Template is the style guide

All documents this skill creates or touches must conform to the templates in `$HARNESS_ENGINEERING_SKILL_DIR/templates/`. This is not a suggestion — it is the default output format.

- New documents → generate from the matching template
- Existing project documents that don't match template structure → migrate content into template format, preserving original wording where it fits
- Template sections with no existing content → mark with `> **TODO**: 待补充 — {what information is needed}` (blockquote, not HTML comment — so the linter won't reject it but the gap is visible)
- After migration, move the original file to `docs/archive/migrated/` with a `migrated-from-` prefix (not `docs/references/`, which is reserved for external inputs)

### Act, then report

The agent proceeds through scenario steps without stopping for confirmation at each stage. Instead:
- Execute the full scenario
- Present a summary of what was done, what was inferred, and what gaps remain (`> **TODO**` markers)
- The user reviews the result and requests changes if needed

### Ask only what you can't infer

When filling templates, scan the project first and fill everything derivable from code, config, and existing docs. Only ask the user about things that genuinely cannot be inferred:
- Ambiguous domain boundaries
- Undocumented external dependencies (auth provider, cache, CDN)
- Business intent that has no code representation yet

Questions must be specific and evidence-based ("I see Redis in docker-compose but no cache usage in code — is it used for sessions, caching, or queuing?"). Never ask open-ended questions.

---

## Scenario 1 — Bootstrap (new project)

### Step 1: Run bootstrap script

```bash
bash "$HARNESS_ENGINEERING_SKILL_DIR/scripts/bootstrap.sh" /path/to/project
```

Creates full directory structure + template files. Won't overwrite existing files.

### Step 2: Scan project context (one parallel batch, read-only)

Start with metadata, then selectively read source when needed:
- Dependency manifests (head only, skip lock files)
- Directory tree (`find . -maxdepth 2`, skip node_modules/.git)
- CI config (`.github/workflows/*.yml`, `Makefile`)
- `README*` (skip if > 500 lines)
- Existing documentation (`*.md` in root and `docs/`, if any)
- Source files: read selectively when metadata is insufficient to determine architecture, entry points, or domain boundaries (e.g., main entrypoint, router definitions, middleware chain). Avoid bulk reads.

From results, determine:
- Project type (see table below)
- Which docs to keep vs. delete
- Existing docs to migrate into template format

### Step 3: Tailor skeleton by project type

Domain docs subject to tailoring: DOMAINS, SECURITY, RELIABILITY, QUALITY_SCORE, PRODUCT_SENSE. Files not in this table are always kept (AGENTS, ARCHITECTURE, guides, active/, archive/, design-docs/).

| Project Type | Keep | Remove |
|---|---|---|
| Backend API | DOMAINS, SECURITY, RELIABILITY, QUALITY_SCORE, PRODUCT_SENSE | — |
| Frontend SPA | DOMAINS, QUALITY_SCORE, PRODUCT_SENSE | SECURITY, RELIABILITY |
| CLI Tool | SECURITY | DOMAINS, RELIABILITY, QUALITY_SCORE, PRODUCT_SENSE |
| Library / SDK | SECURITY | DOMAINS, RELIABILITY, QUALITY_SCORE, PRODUCT_SENSE |
| Full-Stack | All | — |
| Microservices | All + per-service ARCHITECTURE | — |

Delete files in "Remove" column. Remove dead links from AGENTS.md. Guides (`docs/guides/`) are universal — do not delete or tailor them.

### Step 4: Fill templates (parallel)

All domain docs consume the same Phase 2 context — they don't depend on each other. Fill in parallel.

Docs to fill (only retained ones):
- `ARCHITECTURE.md` — system description, layer model, tech stack, dependency rules
- `AGENTS.md` — project overview, navigation links, dev commands
- `docs/DOMAINS.md` — business domain boundaries, responsibilities, entities (if kept)
- `docs/SECURITY.md` — auth, input validation, dependency policy (if kept)
- `docs/RELIABILITY.md` — SLOs, observability (if kept)
- `docs/QUALITY_SCORE.md` — initial per-domain scores (if kept)
- `docs/PRODUCT_SENSE.md` — target users, principles (if kept)
- `docs/design-docs/core-beliefs.md` — adapt 10 principles to project
- `docs/guides/WORKFLOW.md` — adapt task grading thresholds to project scale
- `docs/guides/SPEC.md` — adapt spec methodology examples to project domain
- `docs/guides/DESIGN.md` — adapt design doc examples to project tech stack
- `docs/guides/PLANS.md` — adapt planning conventions to project tooling
- Leave `index.md` catalogs empty (no entries yet)

**Execution mode** — pick before starting:
- **≤ 6 docs to fill → Mode A**: single agent, 2-3 batched tool-call turns. ~50k tokens, 10-15 min.
- **≥ 7 docs to fill → Mode B**: build a compact Project Brief (~2k tokens) from Step 2 output, fan out one subagent per doc. Each subagent gets brief + template only (NOT this skill). ~100k tokens, 2-4 min.

Constraint: if a tool-call batch fails with "too large", split it in half. Never fall back to one-file-at-a-time.

### Step 4b: Generate docs from source

Read `docs/generated/index.md` registry. For each entry whose data source exists in the project:
1. Scan the declared source (ORM models, router files, etc.)
2. Generate the document with a `最后生成: YYYY-MM-DD` timestamp as the first line
3. Skip entries whose data source doesn't exist in the project

### Step 5: Validate

1. `node "$HARNESS_ENGINEERING_SKILL_DIR/scripts/lint-docs.ts"` — must exit 0
2. `grep -r '<!-- ' docs/ AGENTS.md ARCHITECTURE.md` — every hit must be filled or section deleted
3. Run through `checklists/quality-checklist.md` for full quality gate
4. Commit as initial Harness commit

---

## Scenario 2 — Evolve (existing project)

Triggered when creating, modifying, or archiving any Harness document.

| Action | Sub-operation | Done when |
|---|---|---|
| New requirement | Create requirement | `lint-docs.ts` passes + `active/index.md` updated |
| Change ARCHITECTURE / core-beliefs | Modify long-term constraint | `lint-docs.ts` passes + timestamps updated |
| Version release | Archive version | Requirement dirs in `archive/{version}/` + debt recorded |
| Same violation recurs ≥ 3 times | Rule promotion | Linter catches violation + CI gated |
| Orphan module found | Orphan management | `tech-debt-tracker.md` updated |

### Creating a new requirement

1. Read `docs/guides/WORKFLOW.md` and choose requirement size:
   - Medium requirement: create `docs/active/{requirement-name}/`, copy only `design.md` and `plan.md` from `_template/`
   - Large requirement: copy `docs/active/_template/` as `docs/active/{requirement-name}/`
2. Fill required files for that workflow:
   - Medium requirement: `design.md` → `plan.md`
   - Large requirement: `spec.md` → `design.md` → `plan.md`
3. Ensure all created files share the same slug in frontmatter `id`
4. Add entry to `docs/active/index.md`
5. Run `lint-docs.ts` to verify

### Modifying a long-term constraint (ARCHITECTURE / DESIGN / core-beliefs)

1. Check: is this really a long-term change? If not, use a design doc instead
2. Create architecture RFC: new file in `docs/design-docs/` prefixed `arch-`
3. Make the change
4. Update all affected links and timestamps
5. Run `lint-docs.ts`

### Archiving a version

Triggered by human, who provides a version number.

**Step 1: Prepare**
1. Human provides version number (e.g. `v1.2.0`)
2. Identify requirements to archive (`docs/active/` where plan status = completed)
3. Confirm all archiving requirements have design status = verified

**Step 2: Create version directory**
1. Create `docs/archive/{version}/`
2. Copy `docs/archive/_release-template.md` as `docs/archive/{version}/release.md`

**Step 3: Fill release.md**
1. frontmatter: version, date, retain_until (archive date + 12 months default), previous_version
2. Version summary: one paragraph describing core changes
3. Requirements table: extract slug, summary, change type, affected modules from each requirement's spec/design
4. Change scope overview: aggregate interface changes, data changes, dependency changes from all requirements
5. Release & rollback: aggregate from each requirement's design.md
6. Key decisions: extract from each requirement's plan.md decision log
7. Known issues: extract unresolved items from each requirement's plan.md

**Step 4: Copy requirement directories**
1. Copy archiving requirement dirs from `docs/active/` to `docs/archive/{version}/`
2. Remove archived requirement dirs from `docs/active/`

**Step 5: Update indexes**
1. Update `docs/active/index.md`: remove archived entries
2. Update `docs/archive/index.md`: add new version entry
3. If previous version exists, update its release.md `next_version` field

**Step 6: Finalize**
1. Record remaining debt in `docs/active/tech-debt-tracker.md`
2. Run `lint-docs.ts` to verify structural integrity

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
node "$HARNESS_ENGINEERING_SKILL_DIR/scripts/doc-gardening.ts"
```

Checks: catalog ↔ file sync, generated doc freshness, completed plans in active/, quality score age, stale design docs.

### Step 2: Process findings

- `🔧 auto-fixable`: execute the fix (e.g. flag completed requirement for version archiving)
- `🤖 needs-agent`: requires judgment:
  - Design docs: compare constraints against implementation → update frontmatter `status` to `verified` or `stale`
  - Product specs: verify status matches reality
  - Quality scores: re-evaluate based on current coverage
  - Generated docs: read `docs/generated/index.md` registry, regenerate stale entries from source, update timestamps

### Step 3: Commit

Open a single PR: `chore(docs): gardening — <date>`, group commits by category.

### Maintenance cadence reference

| Cadence | Task |
|---|---|
| Weekly | Scan design-docs for stale frontmatter `verified` (> 30 days) → set `status: stale` |
| Weekly | Dead-code scan; update QUALITY_SCORE.md |
| Monthly | Architecture drift review → tech-debt-tracker.md or RFC |
| Monthly | Archive completed plans |
| Continuous | Keep tech-debt-tracker.md current |

---

## Templates

All templates live in `$HARNESS_ENGINEERING_SKILL_DIR/templates/`. Bootstrap copies docs only — scripts stay in the installed skill directory and are invoked externally.

| Template | Purpose |
|---|---|
| `AGENTS.md` | Agent entry point (~100 lines) |
| `ARCHITECTURE.md` | System architecture |
| `docs/DOMAINS.md` | Business domain boundaries and responsibilities |
| `docs/guides/WORKFLOW.md` | Requirement workflow (task grading, gates, rollback) |
| `docs/guides/SPEC.md` | Spec methodology |
| `docs/guides/DESIGN.md` | Design doc methodology |
| `docs/guides/PLANS.md` | Planning conventions |
| `docs/PRODUCT_SENSE.md` | Product framework |
| `docs/QUALITY_SCORE.md` | Quality scores |
| `docs/RELIABILITY.md` | SLOs, observability |
| `docs/SECURITY.md` | Security policies |
| `docs/active/_template/{spec,design,plan}.md` | Requirement templates (copy dir per requirement) |
| `docs/active/index.md` | Active requirements index |
| `docs/active/tech-debt-tracker.md` | Tech debt registry |
| `docs/archive/index.md` | Version archive index |
| `docs/archive/_release-template.md` | Version release summary template |
| `docs/design-docs/core-beliefs.md` | Foundational engineering principles |
| `docs/design-docs/index.md` | Project-level design decisions catalog |
| `docs/design-docs/_template.md` | Design decision template (copy per topic) |
| `docs/generated/index.md` | Generated docs registry (what to generate, from where) |

### Scripts

| Script | Purpose | Usage |
|---|---|---|
| `scripts/bootstrap.sh` | Create Harness skeleton (Linux/macOS) | `bash "$HARNESS_ENGINEERING_SKILL_DIR/scripts/bootstrap.sh" /path/to/project` |
| `scripts/bootstrap.ps1` | Create Harness skeleton (Windows) | `powershell -File "$env:HARNESS_ENGINEERING_SKILL_DIR/scripts/bootstrap.ps1" -Target C:\path\to\project` |
| `scripts/lint-docs.ts` | Validate doc structure, frontmatter, placeholders | `node "$HARNESS_ENGINEERING_SKILL_DIR/scripts/lint-docs.ts"` (from project root) |
| `scripts/doc-gardening.ts` | Detect drift, stale docs, archive expiry | `node "$HARNESS_ENGINEERING_SKILL_DIR/scripts/doc-gardening.ts"` (from project root) |

## Versioning

CalVer `YYYY.MM.PATCH`. Current: **2026.04.5**

- Template changes (wording, section order) are backward-compatible
- Adding new files/sections is backward-compatible
- Renaming/removing existing files is breaking and requires migration notes

**2026.04.5** — Comprehensive consistency pass: fixed DOMAINS.md systematic omission (added to Templates table, project type table, Step 4 fill list, REFERENCE.md, lint-docs.ts); fixed design-docs/index.md and _template.md missing from bootstrap scripts; rewrote project type table with explicit Keep/Remove for all domain docs; removed PLANS phantom entry; added all 4 guides to Step 4 fill list; fixed completed/ ghost reference; added archive/migrated/ to REFERENCE.md; fixed bootstrap.ps1 parity; clarified DOMAINS.md RFC policy; removed Agent Observability and doc-health.yml ghost references; removed doc-gardening.ts from bootstrap quality checklist; renamed Mode C→B.
**2026.04.4** — Added Default Behavior section: template as style guide, act-then-report, ask only what can't be inferred. Info gaps use `> **TODO**` blockquotes (not HTML comments) to avoid linter conflict. Migrated originals go to `docs/archive/migrated/` (not `docs/references/`). Bootstrap Step 2 allows selective source reads when metadata is insufficient.
**2026.04.3** — Reorganized to standard skill directory structure: added README.md, references/, checklists/, scripts/; moved REFERENCE.md and bootstrap scripts.
**2026.04.2** — Restructured: execution methods in SKILL.md, reference knowledge in REFERENCE.md. Added Input/Output/Done, When NOT to Activate, 3-scenario structure.
**2026.04.1** — Added Project Type Profiles, Post-Bootstrap Workflow, doc-gardening.ts, expanded Rule Promotion.
