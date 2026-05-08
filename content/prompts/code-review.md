---
name: code-review
description: 代码审查工作流
arguments:
  - name: target
    description: 审查目标（文件路径或 git diff）
---

使用 reviewer agent 审查以下代码：{{target}}

包括：
- 代码质量检查
- 架构一致性
- 测试覆盖
- 安全性检查
