---
name: design-reviewer
description: Standalone design.md reviewer — checks three technical sub-sections, optional spec->design mapping, and verifiable constraints.
---

# Design Reviewer

Execute three-round review cycles for design.md documents. Enforces technical solution structure (data model + interface contract + core flow), validates spec->design mapping when spec exists, and ensures constraints are verifiable.

## When to Activate

- Reviewing design.md documents
- Validating technical solutions before implementation
- Checking spec->design mapping completeness
- Ensuring design stays within boundary (how only, no what/why)

## When NOT to Activate

- Reviewing spec.md or plan.md (use dedicated reviewers)
- Writing new designs (use harness-docs skill)
- Reviewing non-Harness documentation

## Boundary Rules

design.md answers only: **how**.

**Belongs in design**: Data models, interface contracts, core flows, technical constraints, performance constraints, impact scope (which modules/files to change), technical error handling strategies, migration/compatibility/rollback plans.

**Does NOT belong** (deduct points if found): User stories, acceptance criteria (belongs in spec), original product constraint descriptions (belongs in spec), task lists, agent assignments (belongs in plan), error scenario UX descriptions (belongs in spec), execution order, dependency relationships (belongs in plan).

## Three-Round Review

### R1: Structure Review (16/20 to pass)

**Required sections** (missing any → fail):
- Background
- Technical Solution (must contain all three sub-sections: Data Model, Interface Contract, Core Flow)
- Impact Scope (table format, specific to file paths)
- Constraints
- Verification Method

**Scoring dimensions** (5 points each, any dimension > 2):
- Template compliance: All required sections present, Technical Solution has all three sub-sections (5) / Missing optional sections (3) / Missing required sections or sub-sections (1). Any sub-section empty → ≤ 2.
- Frontmatter completeness: id/status/owner/created/verified filled with valid values (5) / Some fields empty but non-critical (3) / id/status missing (1)
- Information density: Each section has substance; Core Flow has Mermaid diagram (5) / Some sections only one sentence (3) / Multiple sections empty or placeholder (1)
- Boundary clarity: No spec/plan level content (5) / Minor boundary violations (3) / Major boundary violations (1)

### R2: Logic Review (16/20 to pass, "constraint verifiability" > 2)

**spec->design mapping check** (when spec.md exists):
- Each user scenario → Core Flow Mermaid
- Each input/output → Interface Contract
- Each exception scenario → Exception Handling table
- Each product constraint → Constraints section
- Each acceptance criterion → Verification Method

**Scoring dimensions**:
- Upstream mapping completeness: Every spec element has correspondence (or internal completeness if no spec) (5) / Missing 1-2 non-critical mappings (3) / Missing critical mappings (1)
- Constraint verifiability: Each constraint has quantified metrics or executable test method (5) / Some constraints vague but inferable (3) / Unverifiable constraints exist (1)
- Internal consistency: No contradictions between sections (5) / Minor inconsistencies (3) / Logical contradictions exist (1)
- Completeness: Covers normal flow + exception flow + boundary technical handling (5) / Exception flow incomplete (3) / Only normal flow (1)

### R3: Executable Review (16/20 to pass, "impact scope actionable" > 2)

**Scoring dimensions**:
- Impact scope actionable: Impact scope table specific to file paths, directly mappable to tasks (5) / Some entries only module-level (3) / Impact scope vague, cannot break into tasks (1)
- Migration & compatibility: Filled or explicitly marked "N/A" (5) / Partially filled (3) / Left empty (1)
- Alternative solutions: At least one alternative (including "do nothing" option) (5) / Has alternatives but missing rejection reasons (3) / No alternatives (1)
- Rollback feasibility: Rollback plan specific and actionable (5) / Exists but not specific enough (3) / No rollback plan (1)

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
- spec->design mapping checked (if spec exists)
- Review trace appended to document
