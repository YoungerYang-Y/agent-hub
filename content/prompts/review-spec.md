---
name: review-spec
description: 快速审查 spec.md 文档
arguments:
  - name: file_path
    description: spec.md 文件路径
---

请使用 spec-reviewer skill 审查以下 spec 文档：{{file_path}}

重点检查：
- 边界规则完整性
- Given/When/Then 验收标准
- Out-of-Scope 部分完整性
