---
name: review-plan
description: 快速审查 plan.md 文档
arguments:
  - name: file_path
    description: plan.md 文件路径
---

请使用 plan-reviewer skill 审查以下 plan 文档：{{file_path}}

重点检查：
- 任务字段完整性
- 可执行验证命令
- design->plan 映射（如适用）