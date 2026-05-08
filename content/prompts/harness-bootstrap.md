---
name: harness-bootstrap
description: 为新项目初始化 Harness 文档系统
arguments:
  - name: project_type
    description: 项目类型（可选，会自动检测）
    required: false
---

使用 harness-docs skill 为当前项目初始化 Harness 文档系统。

{{#if project_type}}
项目类型：{{project_type}}
{{/if}}

执行 Scenario 1：bootstrap 新 Harness