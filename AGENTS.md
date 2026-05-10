# AGENTS.md

## 项目概述

Agent Hub 是一个零依赖的 Node.js CLI 工具，用于集中维护个人 AI agent 配置资源（skills、prompts、hooks、agents），并通过复制式安装将这些资源同步到本机 Kiro / Codex / Claude Code 等目标配置目录。

## 导航：我该去哪里找信息？

### A. 长期约束（只读，修改需架构 RFC）

- 系统全貌（分层、技术栈、依赖方向）：`ARCHITECTURE.md`
- 核心工程信条（跨所有决策的长期原则）：`docs/design-docs/core-beliefs.md`
- 安全策略（密钥管理、内容安全）：`docs/SECURITY.md`

### B. 流转文档（每功能一份，可增改）

- 活跃需求：`docs/active/index.md`
- 已归档版本：`docs/archive/index.md`
- 技术债务清单：`docs/active/tech-debt-tracker.md`

### C. 元规范（方法论）

- 需求工作流：`docs/guides/WORKFLOW.md`
- 审查方法论：`docs/guides/REVIEW.md`
- 产品规格规范：`docs/guides/SPEC.md`
- 设计文档方法论：`docs/guides/DESIGN.md`
- 计划规范：`docs/guides/PLANS.md`

### D. 参考与产物

- 外部参考：`docs/references/`

## 标准工作流（单任务）

1. **读上下文**：阅读相关需求文档与长期约束（`ARCHITECTURE.md` / `docs/design-docs/core-beliefs.md` / `docs/SECURITY.md`）
2. **先出计划**：非平凡任务先产出计划——目标、任务清单、影响范围
3. **标注假设与风险**：把假设、外部依赖、失败风险写入计划
4. **小步实施**：每次改动保持范围可控；不违反架构约束
5. **行为变化必加测试**：新行为、新分支都要被测试覆盖
6. **收尾验证**：运行 `node cli.js list` 确认 registry 正确；`node cli.js install <target>` 确认安装计划
7. **同步文档**：若架构或对外契约变更，更新 `ARCHITECTURE.md`
8. **输出变更摘要**：交付时报告做了什么、为什么、权衡点

## 开发命令

- 验证 registry：`node cli.js list`
- 预览安装：`node cli.js install kiro`
- 实际安装：`node cli.js install kiro --apply`
- 查看状态：`node cli.js status kiro`
- 交互式安装：`node cli.js install`
- 重置配置：`node cli.js reset kiro`
