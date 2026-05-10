# AGENTS.md

<!--
  本文件是智能体的唯一入口。每次运行时注入上下文。
  保持在 100 行以内——这是一张导航地图，不是知识库。
  深层信息通过链接按需获取，不要在此堆积细节。
-->

## 项目概述

<!-- 用一段话让智能体快速理解：这个项目做什么、服务谁、核心价值是什么 -->

[项目名称] 是……

## 导航：我该去哪里找信息？

<!--
  导航分为四层（与文档分层规范对齐）：
    A. 长期约束（架构层，只读）——不因单次功能而改
    B. 流转文档（产品规格 → 设计文档 → 执行计划）——每功能一份
    C. 元规范（方法论）——告诉智能体"怎么使用此仓库"
    D. 参考与产物——外部输入 & 自动产出
-->

### A. 长期约束（只读，修改需架构 RFC）

- 系统全貌（分层、技术栈、依赖方向）：`ARCHITECTURE.md`
- 业务领域划分（领域边界、职责、实体）：`docs/DOMAINS.md`
- 核心工程信条（跨所有决策的长期原则）：`docs/design-docs/core-beliefs.md`
- 可靠性标准（SLO、可观测性）：`docs/RELIABILITY.md`
- 安全策略（认证、授权、数据保护）：`docs/SECURITY.md`

### B. 流转文档（每功能一份，可增改）

- 活跃需求（spec + design + plan 一体）：`docs/active/index.md`
- 已归档版本（历史快照）：`docs/archive/index.md`
- 技术债务清单：`docs/active/tech-debt-tracker.md`

### C. 元规范（方法论，智能体读后再动手）

- 产品思维与功能流转：`docs/PRODUCT_SENSE.md`
- 需求工作流（spec → design → plan 全流程、审查循环、回退规则）：`docs/guides/WORKFLOW.md`
- 审查方法论（三轮自审循环、评分标准、通过条件）：`docs/guides/REVIEW.md`
- 产品规格规范（如何写 spec）：`docs/guides/SPEC.md`
- 设计文档方法论（如何写 design.md）：`docs/guides/DESIGN.md`
- 计划规范（如何拆解和执行任务）：`docs/guides/PLANS.md`
- 各领域质量评分与改进优先级：`docs/QUALITY_SCORE.md`
- 项目内基础 skills（高频任务操作手册）：`docs/skills/index.md`

### D. 参考与产物

- 外部规范 / 框架文档 / 设计系统（只读外部输入）：`docs/references/`
- 自动生成的文档（数据库 Schema / API 等，禁止手改）：`docs/generated/`

## 标准工作流（单任务）

<!--
  这是智能体处理**单个任务**的标准流程，语言/技术栈无关。
  非平凡任务必须按此顺序执行；琐碎改动（注释、typo）可跳过第 2、3 步。
-->

1. **读上下文**：阅读最近相关的需求文档（`docs/active/{需求}/spec.md`、`design.md`）与长期约束（`ARCHITECTURE.md` / `docs/DOMAINS.md` / `docs/design-docs/core-beliefs.md` / `docs/SECURITY.md` / `docs/RELIABILITY.md`）。方法论参考 `docs/guides/WORKFLOW.md`。
2. **先出计划**：非平凡任务先在 `docs/active/{需求}/plan.md` 基于 `docs/active/_template/plan.md` 产出一份简短计划——目标、任务清单、影响范围。
3. **标注假设与风险**：把假设、外部依赖、失败风险写入计划的"决策日志"和"风险与阻塞"表，不要隐藏在脑子里。
4. **小步分层实施**：每次改动保持范围可控、分层清晰；**不违反依赖方向与架构约束**；如确需违反，暂停任务，升级为独立的架构 RFC。
5. **行为变化必加/改测试**：新行为、新分支、新错误路径都要被测试覆盖。
6. **收尾验证**：结束前运行 lint / typecheck / 单元与集成测试 / 文档健康检查（见下方"开发命令"）；任何一项红的不得声称完成。
7. **同步文档**：若行为、对外契约或架构发生变更，更新对应的需求文档（`docs/active/{需求}/spec.md`、`design.md`）和 `ARCHITECTURE.md`；若领域边界变更，同步 `docs/DOMAINS.md`；文档不同步等同于实现未完成。
8. **输出变更摘要**：交付时报告——做了什么、为什么、权衡点、遗留项与后续工作；遗留项登记到 `docs/active/tech-debt-tracker.md`。

## 文档与流程约定（每次写文档前必读）

- **需求目录**：每个需求在 `docs/active/{需求名}/` 下包含 `spec.md`、`design.md`、`plan.md`，三者共享相同 slug。时间戳和状态通过 YAML frontmatter 管理。**无 frontmatter 的文档视为无效草稿。**
- **流程图**：优先 Mermaid，禁止截图 / ASCII 框图（仅纯目录树允许 ASCII）。
- **生成产物**：`docs/generated/` 下文件由脚本覆盖，**禁止手改**。
- **持续维护节奏**：每周清旧、每月查 architecture drift、持续维护 `docs/active/tech-debt-tracker.md`。
- **孤儿模块**：发现无 Owner 代码路径立即登记到 `docs/active/tech-debt-tracker.md`，Owner 填 `ORPHAN`。

## 审查工作流（PR 级别）

1. 智能体提交 PR 并完成自审清单（含上方标准工作流第 6-8 步的证据）
2. 请求智能体互审（lint、结构、测试、文档同步）
3. 根据反馈迭代，直到所有智能体审查者通过
4. 仅在需要人工判断时进行人工审查
5. 合并并部署

## 开发命令

- 构建：`[构建命令]`
- 测试：`[测试命令]`
- Lint：`[Lint 命令]`
- 文档健康检查：`[文档 Lint 命令]`
