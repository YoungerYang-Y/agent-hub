---
name: review-design
description: 快速审查 design.md 文档
arguments:
  - name: file_path
    description: design.md 文件路径
---

请使用 design-reviewer skill 审查以下 design 文档：{{file_path}}

重点检查：
- 三个技术子章节完整性
- spec->design 映射（如适用）
- 可验证约束