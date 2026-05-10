# 活跃需求索引

当前迭代中所有进行中的需求。每个需求是一个子目录，至少包含 `design.md` 和 `plan.md`；大任务还包含 `spec.md`。

| id | 需求名 | status | owner | tags | 路径 |
|----|--------|--------|-------|------|------|

当前没有按 Harness active workflow 创建的进行中需求。历史设计和计划已归档到 `docs/archive/v0.1.0/plans/`。

## 如何添加新需求

1. 使用 `content/skills/harness-docs/scripts/create-requirement.ts` 创建需求目录；不要手工复制模板。
2. 中任务创建 `design.md` 与 `plan.md`；大任务创建 `spec.md`、`design.md` 与 `plan.md`。
3. 按 `docs/guides/WORKFLOW.md` 填写并审查文档；脚本会同步上方索引。
