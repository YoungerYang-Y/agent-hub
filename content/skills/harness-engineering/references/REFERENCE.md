# Harness Engineering — Reference Knowledge

Agent reads this file on demand (linked from SKILL.md). Not injected automatically.

## Core Principles

| # | Principle | Description |
|---|-----------|-------------|
| 1 | Repo-Local Truth | Everything the agent needs must be in the repo. No external wikis, no Slack context. |
| 2 | Map, Not Manual | AGENTS.md is a table of contents (~100 lines). Deep knowledge lives in structured docs. |
| 3 | Enforce, Don't Document | Encode rules as linters, structure tests, or CI checks. Docs alone rot. |
| 4 | Progressive Disclosure | Agents start from a small entry point and navigate deeper on demand. |
| 5 | Constrain Boundaries, Allow Freedom Within | Strict architectural boundaries; freedom in implementation. |
| 6 | Prefer Boring Technology | Composable, API-stable, well-represented in training data. Re-implement subsets over opaque deps. |
| 7 | Low-Cost Correction | Fix forward with follow-up PRs. Correction cost is low; waiting cost is high. |
| 8 | Continuous Garbage Collection | Periodic cleanup agents catch drift. Small continuous fixes beat big rewrites. |
| 9 | Taste as Code | Human preferences get encoded into linters and structure tests, not left as informal norms. |
| 10 | Deep-First Decomposition | When agent is stuck, don't "try harder" — ask what capability is missing and build it. |

## Directory Structure

```
repo-root/
├── AGENTS.md                          # Agent entry point (~100 lines, map only)
├── ARCHITECTURE.md                    # System architecture overview
├── docs/
│   ├── design-docs/                   # Technical design decisions
│   │   ├── index.md                   # Catalog of all design docs with status
│   │   ├── core-beliefs.md            # Foundational technical principles
│   │   ├── _template.md               # Template for new design docs
│   │   └── {feature-name}.md          # Individual design records
│   ├── exec-plans/                    # Execution plans as first-class artifacts
│   │   ├── active/                    # Currently executing plans
│   │   ├── completed/                 # Finished plans with decision logs
│   │   ├── _template.md               # Template for new plans
│   │   └── tech-debt-tracker.md       # Known debt, version-controlled
│   ├── generated/                     # Auto-generated docs (DB schema, API docs)
│   ├── product-specs/                 # Agent-facing product specifications
│   │   ├── index.md                   # Catalog of all product specs
│   │   ├── _template.md               # Template for new specs
│   │   └── {feature-name}.md          # Individual product specs
│   ├── references/                    # External LLM-optimized reference docs
│   │   └── {library}-llms.txt         # Pattern: {library-name}-llms.txt
│   ├── DESIGN.md                      # Interface & interaction specs (API/UI/CLI/SDK)
│   ├── FRONTEND.md                    # Frontend architecture (optional; delete if no frontend)
│   ├── PLANS.md                       # Planning process & conventions
│   ├── PRODUCT_SENSE.md               # Product thinking & decision framework
│   ├── QUALITY_SCORE.md               # Quality grades per domain/layer
│   ├── RELIABILITY.md                 # SLOs, observability, incident response
│   └── SECURITY.md                    # Security policies & requirements
└── .github/
    └── workflows/
        └── doc-health.yml             # CI job (optional)
```

## Document Roles

文档按四个分层组织，核心规则：**需求、设计、计划、长期约束不要混写**。

> - **长期约束**（Architecture）= 不因一个功能而改，修改需独立架构 RFC
> - **产品规格**（Product Spec）= 为什么做、做什么、用户与业务规则
> - **设计文档**（Design Doc）= 某次决策的怎么做与权衡
> - **执行计划**（Exec Plan）= 这次怎么拆、先后、风险、验收

### A. 长期约束（架构层，只读，跨功能稳定）

| Document | 角色 |
|---|---|
| `ARCHITECTURE.md` | 系统边界、领域、分层、依赖方向、技术栈 |
| `docs/design-docs/core-beliefs.md` | 跨所有决策的长期工程信条 |
| `docs/DESIGN.md` | 对外接口的长期规范（API/UI/CLI/Mobile/SDK） |
| `docs/FRONTEND.md` | ARCHITECTURE 的前端子视图（无前端项目可删） |
| `docs/RELIABILITY.md` | SLO、可观测性、性能红线 |
| `docs/SECURITY.md` | 认证、授权、数据保护 |

### B. 流转文档（每功能一份）

| Document | 角色 |
|---|---|
| `docs/product-specs/*.md` | 单个功能的产品规格 |
| `docs/design-docs/*.md` | 单次技术决策的记录 |
| `docs/exec-plans/active/*.md` | 进行中的执行计划 |
| `docs/exec-plans/completed/*.md` | 已完成的计划归档 |
| `docs/exec-plans/tech-debt-tracker.md` | 持续维护的债务登记 |

### C. 元规范

| Document | 角色 |
|---|---|
| `AGENTS.md` | 智能体入口，唯一每次注入的文件（< 100 行） |
| `docs/PRODUCT_SENSE.md` | 产品方法论与功能流转规则 |
| `docs/PLANS.md` | 计划的拆解与执行规范 |
| `docs/QUALITY_SCORE.md` | 领域质量评分与改进优先级 |

### D. 参考与产物

| Document | 可写性 |
|---|---|
| `docs/references/` | 只读（外部规范 / 框架文档） |
| `docs/generated/` | 机器写，人类禁止手改 |

### 子目录约定

- `index.md`：流转目录的索引，智能体据此发现存在什么
- `_template.md`：复制起点，不直接填写

## Standard Agent Workflow (per task)

Eight steps, language- and stack-agnostic:

1. **Read context** — nearest product spec, design doc, and long-term constraints (ARCHITECTURE / DESIGN / core-beliefs / SECURITY / RELIABILITY).
2. **Plan first** — non-trivial tasks produce a short plan under `docs/exec-plans/active/` from `_template.md`.
3. **Annotate assumptions & risks** — written into the plan's decision log and risk table.
4. **Implement in small, layered steps** — never violate dependency direction; if you must, escalate to architecture RFC.
5. **Behavioral change → test change** — new behavior, new branch, new error path all get covered.
6. **Verify before claiming done** — run lint / typecheck / tests / `lint-docs.ts`. Red check = not done.
7. **Sync docs** — any behavior/contract/architecture change updates matching docs. Out-of-sync = incomplete.
8. **Summarize the change** — what, why, trade-offs, follow-ups → `tech-debt-tracker.md`.

## Agent Review Workflow (PR level)

1. Agent opens PR with self-review (tests green, docs synced, change summary)
2. Request agent peer review (security, architecture, etc.)
3. Agent responds to all feedback and iterates
4. Human reviews only when judgment is required
5. Merge when all agent reviewers pass

## Agent Observability

- App can start per git worktree for isolated verification
- CDP (Chrome DevTools Protocol) for DOM snapshots and screenshots
- Structured logs queryable via LogQL (or equivalent)
- Metrics queryable via PromQL (or equivalent)
- Local observability stack is ephemeral per worktree

## File Naming & Timestamps

| Document Type | Convention |
|---|---|
| `docs/exec-plans/active/*.md` | `YYYY-MM-DD-{short-name}.md` |
| `docs/exec-plans/completed/*.md` | Same filename as when created — do NOT rename on archival |
| `docs/design-docs/*.md` | `{short-name}.md` + required `创建日期` / `最后验证` fields inside |
| `docs/product-specs/*.md` | `{short-name}.md` + required `创建日期` / `最后更新` fields inside |

A flow document without a timestamp is an invalid draft. Agents must refuse to implement based on it.

## Diagram Conventions

Prefer Mermaid for any flow / state / dependency / sequence diagram. ASCII only for simple directory trees. Screenshots and binary images are banned — agents cannot read them.

## Anti-Patterns

- Monolithic AGENTS.md (500+ lines) — context crowding, pattern drift
- Decisions in Slack/Google Docs/wikis — invisible to agents
- Rules without enforcement — rot immediately
- Missing catalogs — agents can't discover what they don't know exists
- Manual-only doc maintenance — doesn't scale with agent throughput
- Over-specifying implementation — constrain boundaries, not internals
- Ignoring "AI residue" — small inconsistencies compound into drift
- Mixing product specs with design docs — different audiences, different lifecycles
- Missing freshness timestamps on generated docs — stale generated docs mislead
- "Try harder" when agent is stuck — build the missing capability instead

## Lint Error Messages as Agent Instructions

Custom linters should embed fix instructions directly in error messages:

```typescript
// ✅ GOOD: Actionable
{ message: 'Unstructured log statement detected', file: 'src/billing/service.ts', line: 42,
  fix: 'Replace console.log(msg) with logger.info(msg, { domain: "billing" }). Import from packages/core/logger.' }

// ❌ BAD: Vague
{ message: 'Logging violation', file: 'src/billing/service.ts', line: 42 }
```
