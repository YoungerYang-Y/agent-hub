# 活跃需求索引

<!--
  当前迭代中所有进行中的需求。每个需求是一个子目录，包含 spec.md / design.md / plan.md。
  lint-docs.ts 会校验此索引与实际目录的一致性。
-->

| id | 需求名 | status | owner | tags | 路径 |
|----|--------|--------|-------|------|------|
| <!-- spec-xxx --> | <!-- 需求名 --> | <!-- draft / in-progress --> | <!-- 负责人 --> | <!-- 标签 --> | `docs/active/<!-- 目录名 -->/` |

## 如何添加新需求

1. 复制 `_template/` 为 `{需求名}/`（如 `user-login/`）
2. 填写 `spec.md` → `design.md` → `plan.md`，三个文件的 frontmatter `id` 使用相同 slug
3. 在上方索引表中添加条目
