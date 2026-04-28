# 活跃需求索引

<!--
  当前迭代中所有进行中的需求。每个需求是一个子目录，包含 spec.md / design.md / plan.md。
  lint-docs.ts 会校验此索引与实际目录的一致性。
-->

| id | 需求名 | status | owner | tags | 路径 |
|----|--------|--------|-------|------|------|
| <!-- spec-xxx --> | <!-- 需求名 --> | <!-- draft / in-progress --> | <!-- 负责人 --> | <!-- 标签 --> | `docs/active/<!-- 目录名 -->/` |

## 如何添加新需求

按 `docs/guides/WORKFLOW.md` 判断任务级别后：

**中任务**：
1. 创建目录 `docs/active/{slug}/`
2. 复制 `docs/active/_template/design.md` 和 `plan.md` 到该目录
3. 将 frontmatter 中的 `{slug}` 替换为实际需求名，`YYYY-MM-DD` 替换为当天日期
4. 在上方索引表中添加条目

**大任务**：
1. 将 `docs/active/_template/` 整个目录复制为 `docs/active/{slug}/`
2. 将所有文件 frontmatter 中的 `{slug}` 替换为实际需求名，`YYYY-MM-DD` 替换为当天日期
3. 在上方索引表中添加条目

三个文件的 frontmatter `id` 必须使用相同 slug（如 `spec-user-login`、`design-user-login`、`plan-user-login`）。
