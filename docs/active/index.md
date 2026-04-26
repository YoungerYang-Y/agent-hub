# 活跃需求索引

当前迭代中所有进行中的需求。每个需求是一个子目录，至少包含 `design.md` 和 `plan.md`；大任务还包含 `spec.md`。

| id | 需求名 | status | owner | tags | 路径 |
|----|--------|--------|-------|------|------|

当前没有按 Harness active workflow 创建的进行中需求。历史设计和计划已归档到 `docs/archive/v0.1.0/plans/`。

## 如何添加新需求

1. 复制 `_template/` 为 `{需求名}/`（如 `user-login/`）
2. 填写 `spec.md` → `design.md` → `plan.md`，三个文件的 frontmatter `id` 使用相同 slug
3. 在上方索引表中添加条目
