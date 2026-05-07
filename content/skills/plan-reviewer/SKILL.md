---
name: plan-reviewer
description: Standalone plan.md reviewer — validates task field completeness, executable verify commands, and optional design->plan mapping.
---

# Plan Reviewer

Execute three-round review cycles for plan.md documents. Validates task field completeness (id/depends_on/scope/verify/agent/status), ensures verify commands are executable, and checks design->plan mapping when design exists.

## When to Activate

- Reviewing plan.md documents
- Validating execution plans before implementation
- Checking design->plan mapping completeness
- Ensuring tasks have executable verify commands

## When NOT to Activate

- Reviewing spec.md or design.md (use dedicated reviewers)
- Writing new plans (use harness-docs skill)
- Reviewing non-Harness documentation

## Boundary Rules

plan.md answers only: **how to break down, who executes, what order**.

**Belongs in plan**: Task list (id/depends_on/scope/verify/agent/status), execution mode (sequential/parallel/mixed), risks & blockers, completion criteria.

**Does NOT belong** (deduct points if found): Technical solution details, data models (belongs in design), product constraints, user scenarios (belongs in spec), interface contracts, Mermaid flow diagrams (belongs in design), Given/When/Then acceptance criteria (belongs in spec).

## Three-Round Review

### R1: Structure Review (16/20 to pass, "task field completeness" > 2)

**Required sections** (missing any → fail):
- Goal
- Execution Mode (sequential / parallel / mixed)
- Task List (each task must have: id / depends_on / scope / verify / agent / status)
- Completion Criteria

**Scoring dimensions** (5 points each, "task field completeness" > 2):
- Template compliance: All required sections present (5) / Missing optional sections (3) / Missing required sections (1)
- Task field completeness: Every task has all 6 fields (5) / Some tasks missing optional fields (3) / Any task missing id/verify/scope (1)
- Information density: Each section has substance, no placeholders (5) / Some sections only one sentence (3) / Multiple sections empty or placeholder (1)
- Boundary clarity: No spec/design level content (5) / Minor boundary violations (3) / Major boundary violations (1)

### R2: Logic Review (16/20 to pass, "dependency correctness" > 2)

**design->plan mapping check** (when design.md exists):
- Impact scope table each row → at least one task
- Module dependencies → depends_on
- Verification method → verify command
- Migration & compatibility → prerequisite tasks

**Scoring dimensions**:
- Upstream mapping completeness: Every design impact scope row has corresponding task (or internal completeness if no design) (5) / Missing 1-2 non-critical tasks (3) / Missing critical module tasks (1)
- Dependency correctness: depends_on reflects real dependencies, no cycles, no omissions (5) / Minor inaccuracies (3) / Circular dependencies or missing critical dependencies (1)
- Internal consistency: Execution mode matches task dependency relationships (5) / Minor inconsistencies (3) / Execution mode contradicts dependencies (1)
- Completeness: Covers all change modules + migration + verification (5) / Migration or verification tasks missing (3) / Only feature tasks (1)

### R3: Executable Review (16/20 to pass, "verify executable" > 2)

**Simulate execution for first task** (four questions):
1. Is scope specific to file paths? (not "modify auth module")
2. Is verify a directly runnable command? (not "check it" or "confirm functionality works")
3. Is depends_on correct?
4. Do we know how to rollback if it fails?

**Scoring dimensions**:
- verify executable: Each verify is a directly runnable command (5) / Some verify needs adjustment (3) / verify is descriptive text (1)
- scope specific: Each scope specific to file paths (5) / Some scope only directory-level (3) / scope is module name or description (1)
- Risk coverage: At least one risk + mitigation measure (5) / Has risks but mitigation vague (3) / Risk list empty (1)
- Completion criteria verifiable: Completion criteria objectively judgeable (tests pass / files exist etc.) (5) / Some criteria vague (3) / Completion criteria is subjective description (1)

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
- design->plan mapping checked (if design exists)
- First task passes four-question simulation
- Review trace appended to document
