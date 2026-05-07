---
name: spec-reviewer
description: Standalone spec.md reviewer — enforces boundary rules, Given/When/Then acceptance criteria, and Out-of-Scope completeness.
---

# Spec Reviewer

Execute three-round review cycles for spec.md documents. Enforces strict boundary rules (what/why only), validates Given/When/Then acceptance criteria, and ensures Out-of-Scope completeness.

## When to Activate

- Reviewing spec.md documents
- Validating product requirements before design phase
- Checking acceptance criteria quality
- Ensuring spec stays within boundary (no technical implementation)

## When NOT to Activate

- Reviewing design.md or plan.md (use dedicated reviewers)
- Writing new specs (use harness-docs skill)
- Reviewing non-Harness documentation

## Boundary Rules

spec.md answers only: **what** and **why**.

**Belongs in spec**: User-perceivable inputs/outputs, user-perceivable response time ("within 3 seconds"), business rules ("password at least 8 chars"), error scenario UX, product constraints ("don't change existing workflow").

**Does NOT belong** (deduct points if found): API endpoints, HTTP status codes, field types, caching strategies, database indexes, p99 metrics, implementation rules, error handling strategies (retry/circuit-breaker/fallback), task lists, execution order, agent assignments.

## Three-Round Review

### R1: Structure Review (16/20 to pass)

**Required sections** (missing any → fail):
- Problem & Motivation
- Functional Boundary (In Scope + Out of Scope)
- User Scenarios (at least one, with title and numbered steps)
- Acceptance Criteria (Given/When/Then format)
- Exceptions & Edge Cases

**Scoring dimensions** (5 points each, any dimension > 2):
- Template compliance: All required sections present and ordered correctly (5) / Missing optional sections (3) / Missing required sections (1). Out of Scope missing → ≤ 2.
- Frontmatter completeness: id/status/owner/created/updated filled with valid values (5) / Some fields empty but non-critical (3) / id/status missing (1)
- Information density: Each section has substance, no placeholders (5) / Some sections only one sentence (3) / Multiple sections empty or placeholder (1)
- Boundary clarity: No technical implementation details (5) / Minor boundary violations (3) / Major boundary violations (1)

### R2: Logic Review (16/20 to pass, "constraint verifiability" > 2)

**Scoring dimensions**:
- Scenario<->Acceptance mapping: Each user scenario has corresponding acceptance criteria (5) / Missing 1-2 non-critical scenarios (3) / Missing critical scenario acceptance criteria (1)
- Constraint verifiability: Each acceptance criterion can be written as automated test (5) / Some vague but inferable (3) / Untestable acceptance criteria exist (1)
- Internal consistency: No contradictions between sections (5) / Minor inconsistencies (3) / Logical contradictions exist (1)
- Completeness: Covers normal flow + exception flow + boundaries (5) / Exception flow incomplete (3) / Only normal flow (1)

### R3: Executable Review (16/20 to pass, "handoff readiness" > 2)

**Scoring dimensions**:
- Handoff readiness: Design author can start without additional communication (5) / Needs minor clarification (3) / Needs major supplementation (1)
- Measurability: Success criteria have specific numbers or measurable metrics (5) / Some metrics vague (3) / All "improve UX" type descriptions (1)
- Boundary executability: Functional boundary clear enough for independent deployment and rollback (5) / Boundary mostly clear (3) / Boundary vague, cannot deliver independently (1)
- Out of Scope quality: Explicitly excludes content easily mistaken as In Scope (5) / Partial exclusion (3) / Missing or empty (1)

## Output Format

```
### R{N} 审查结果

| 维度 | 分数 | 问题 |
|------|------|------|
| {dimension} | {N}/5 | {specific issue with section quote} or — |

总分: {X}/20，通过线: 16/20 ✅/❌
需修复:
- {section}：{issue} -> 建议：{replacement text}
```

## Final Approval

After all three rounds pass, append to document:

```markdown
<!-- review-trace
R1: {score}/20 ✅ [{first-pass/retry-N}]
R2: {score}/20 ✅ [{first-pass/retry-N}]
R3: {score}/20 ✅ [{first-pass/retry-N}]
总迭代: {N}轮
-->
```

## Done When

- All three rounds scored
- All rounds ≥ 16/20
- No mandatory dimension ≤ 2
- Review trace appended to document
