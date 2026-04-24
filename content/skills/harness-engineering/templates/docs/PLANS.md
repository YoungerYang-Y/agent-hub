# 计划规范

<!--
  本文件告诉智能体如何理解和执行计划。
  智能体在开始执行任务前应先阅读此文件，了解计划的结构和工作方式。
-->

## 计划类型

| 类型 | 适用场景 | 格式 |
|------|----------|------|
| 临时 | 小改动（< 半天） | 无需正式计划，直接执行 |
| 轻量 | 1-3 天的工作 | 在 `exec-plans/active/` 中创建单个 markdown |
| 完整计划 | 复杂工作、跨领域 | 详细执行计划 + 决策日志，使用 `exec-plans/_template.md` |

## 文件命名与时间戳约定（重要）

**目的**：让人和智能体在不打开文件的情况下判断文档的时间维度，避免堆积后无法辨认新旧。

| 目录 | 命名规范 | 示例 |
|------|----------|------|
| `docs/exec-plans/active/` | `YYYY-MM-DD-{短名}.md`（日期前缀表示创建日） | `2025-04-22-user-login.md` |
| `docs/exec-plans/completed/` | 同上，**完成时不改文件名**，保留创建日 | `2025-04-22-user-login.md` |
| `docs/design-docs/` | `{短名}.md`（长期档案，稳定引用）；**必须填写"创建日期 / 最后验证"字段** | `user-login.md` |
| `docs/product-specs/` | `{短名}.md`（长期档案，稳定引用）；**必须填写"创建日期 / 最后更新"字段** | `user-login.md` |

规则：

- 执行计划用**文件名前缀携带时间**，因为它们流动快、数量多、需要按时间排序
- 设计文档 / 产品规格用**内部字段携带时间**，因为它们被长期引用，文件名要稳定
- 没有时间信息的流转文档视为无效草稿，智能体应拒绝基于它继续实现

## 智能体如何执行计划

1. 阅读 `exec-plans/active/` 中的计划文件，理解目标和任务列表
2. 按任务顺序执行，每完成一个任务更新 checkbox
3. 遇到需要决策的地方，记录到计划的"决策日志"中
4. 遇到阻塞时，不要反复重试——参考下方"阻塞处理"

## 阻塞处理

当智能体卡住时，答案永远不是"再努力一点"。正确做法：

1. 将目标拆解为更小的构建模块（设计、代码、审查、测试）
2. 先构建缺失的基础模块
3. 用已完成的模块解锁更复杂的任务
4. 如果仍然阻塞，暂停并向人类报告："缺少什么能力？"

**判断标准：**
- 同一任务失败 3 次以上 → 缺少能力，不是缺少努力，请求人工介入
- 架构不清晰 → 先阅读或创建设计文档
- 跨领域影响 → 需要完整计划

## 生命周期

1. 在 `exec-plans/active/` 中创建计划，文件名为 `YYYY-MM-DD-{短名}.md`
2. 随工作推进更新进度和决策日志
3. 完成后移至 `exec-plans/completed/`（**不改名**，保留原始创建日）
4. 将剩余债务记录到 `tech-debt-tracker.md`

## 持续维护节奏（与 core-beliefs 第 8 条"持续垃圾回收"对齐）

**这个 Harness 不是一次性生成的产物，而是需要持续演进的工作系统。** 下表是标准运维节奏，由人类或专门的 doc-gardening / cleanup agent 定期执行。

| 频率 | 维护任务 | 执行方式 |
|------|----------|----------|
| 每周 | 清理过时文档：扫描 `design-docs/` 中 `最后验证` 超过 30 天、状态为 `草稿 📝` 的条目；标记 `过期 ⚠️` 或刷新 | doc-gardening agent |
| 每周 | 扫描重复 util / dead code，提 PR 合并或删除；更新 `QUALITY_SCORE.md` | cleanup agent（按语言运行 knip / ts-prune / vulture / staticcheck / ktlint 等） |
| 每月 | 回顾 architecture drift：对比实现与 `ARCHITECTURE.md` / `DESIGN.md` / `core-beliefs.md`；偏离项进入 `tech-debt-tracker.md` 或触发架构 RFC | 架构 reviewer |
| 每月 | 归档已完成计划：`active/` 中已达完成标准的移至 `completed/`；未完成的更新状态或重新拆解 | doc-gardening agent |
| 持续 | `tech-debt-tracker.md`：新增即登记，解决即删除（并在关联计划决策日志中记录解决方式） | 所有智能体 |
| 持续 | `docs/generated/` 下文件**只能由生成脚本覆盖**，任何手改 PR 应被拒绝；CI 必须校验 `git diff --exit-code docs/generated/` 在 re-generate 后为空 | CI |
| 持续 | 发现孤儿模块（无明确 owner 的代码路径、无对应 product-spec / design-doc 的实现）时，在 `tech-debt-tracker.md` 登记并**指派 owner**；若 30 天内无人认领，建议归档或删除 | 发现者 |

## 流程图表达约定

**优先使用 Mermaid**——GitHub / GitLab 原生渲染、diff 可读、智能体可编程生成。

- 架构图、状态机、数据流、时序图、生命周期 → Mermaid
- 纯结构层级（如目录树）可用 ASCII
- 避免截图或二进制图片（智能体无法阅读）

示例：

```mermaid
flowchart LR
  Idea["想法"] --> Spec["产品规格"]
  Spec --> Design["设计文档"]
  Design --> Plan["执行计划"]
  Plan --> Release["上线"]
  Release --> Metrics["度量"]
```
