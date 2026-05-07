# Harness Engineering

为 AI 驱动的代码库构建和维护智能体优先的文档体系。

基于 [OpenAI Harness Engineering 方法论](https://openai.com/index/harness-engineering/)。

## 这个 Skill 做什么

为项目创建一套结构化的文档体系（AGENTS.md、ARCHITECTURE.md、领域文档、设计文档目录、产品规格目录、执行计划），让 AI 智能体能够自主导航项目知识、理解约束、执行任务。

## 三个使用场景

| 场景 | 触发时机 | 做什么 |
|------|----------|--------|
| Bootstrap | 新项目初始化 | 创建文档骨架 → 按项目类型裁剪 → 填充模板 |
| Evolve | 日常开发中修改 Harness 文档 | 创建新 spec/design/plan、归档、规则提升 |
| Gardening | 周/月维护 | 运行漂移检测脚本 → 修复过期文档 |

## 目录结构

```
harness-engineering/
├── SKILL.md                    # 执行方法（智能体读这个）
├── README.md                   # 人类可读说明（你在看的这个）
├── references/
│   └── REFERENCE.md            # 参考知识（原则、文档角色、反模式等）
├── checklists/
│   └── quality-checklist.md    # Bootstrap 完成后的质量检查清单
├── scripts/
│   ├── bootstrap.ts            # 初始化脚本（跨平台）
│   ├── create-requirement.ts   # 创建需求目录（原子操作，跨平台）
│   ├── lint-docs.ts            # 文档结构校验
│   └── doc-gardening.ts        # 漂移检测
└── templates/
    ├── AGENTS.md               # 智能体入口模板
    ├── ARCHITECTURE.md         # 系统架构模板
    ├── docs/                   # 领域文档模板
    │   ├── guides/              # 方法论（WORKFLOW / SPEC / DESIGN / PLANS）
    │   ├── PRODUCT_SENSE.md
    │   ├── QUALITY_SCORE.md
    │   ├── RELIABILITY.md
    │   ├── SECURITY.md
    │   ├── active/             # 需求模板 + 索引
    │   │   ├── _template/      # spec.md / design.md / plan.md
    │   │   └── index.md
    │   ├── archive/            # 版本归档模板 + 索引
    │   ├── design-docs/        # 长期架构决策（core-beliefs）
    │   ├── generated/          # 自动生成文档占位
    │   └── references/         # 外部参考文档占位
```

## 快速开始

```bash
# 1. 设置当前 agent 中已安装 skill 的路径
export HARNESS_ENGINEERING_SKILL_DIR=/path/to/installed/harness-engineering

# 2. 对目标项目运行 bootstrap
node "$HARNESS_ENGINEERING_SKILL_DIR/scripts/bootstrap.ts" /path/to/project

# 3. 让智能体填充模板（激活 harness-engineering skill）

# 4. 验证
cd /path/to/project
node "$HARNESS_ENGINEERING_SKILL_DIR/scripts/lint-docs.ts"
```

## 支持的项目类型

Backend API · Frontend SPA · CLI 工具 · Library/SDK · 全栈 · 微服务

Bootstrap 创建全量骨架，然后按项目类型裁剪不需要的文档。详见 SKILL.md § Scenario 1 Step 3。

---

## 使用指南：怎么跟智能体说

以下是各场景下推荐的 prompt 示例。直接复制或根据实际情况调整即可。

### 初始化项目 Harness 文档

> 为当前项目初始化 Harness 文档体系。这是一个 [Backend API / Frontend SPA / CLI 工具 / Library / 全栈 / 微服务] 项目。

如果不确定项目类型，可以让智能体自行判断：

> 为当前项目初始化 Harness 文档体系，请根据项目结构自动判断项目类型。

### 创建新需求

中任务（4-8 个 task，跨模块或涉及契约变更）：

> 创建一个中任务需求「{需求名}」，需求描述：{一段话描述要做什么}。

大任务（> 8 个 task，跨 3+ 模块，新领域接入）：

> 创建一个大任务需求「{需求名}」，需求描述：{一段话描述要做什么}。

智能体会按 WORKFLOW.md 流程创建需求目录、生成文档、执行三轮审查循环。

### 迭代已有需求文档

对已有需求的 spec/design/plan 进行修改：

> 修改需求「{需求名}」的 design.md，{具体修改内容}。修改后重新执行审查循环。

如果需要从 spec 阶段重新开始：

> 需求「{需求名}」的 spec 需要调整：{变更内容}。请更新 spec 并级联更新 design 和 plan。

### 版本归档

> 将已完成的需求归档为版本 v{X.Y.Z}。

智能体会按 WORKFLOW.md 的版本归档工作流执行 6 步操作。

### 架构变更（RFC）

当需要修改长期约束时：

> 我需要修改 {ARCHITECTURE.md / core-beliefs.md} 中的 {具体约束}。请先创建架构 RFC。

### 文档维护（Gardening）

周期性维护：

> 对当前项目的 Harness 文档执行一次维护检查。

智能体会检查过期文档、已完成但未归档的需求、stale 的 design-doc 等。

### 技术债务登记

> 发现一个技术债务：{问题描述}，影响 {模块}，优先级 {紧急/高/中/低}。请登记到 tech-debt-tracker。

### 小任务（不需要正式文档）

小任务不需要特殊 prompt，正常描述任务即可。智能体会根据 WORKFLOW.md 的分级表自行判断是否需要创建需求目录：

> 帮我 {修复 XXX bug / 添加 XXX 功能 / 重构 XXX}。

---

## 核心设计原则

1. **仓库即真相** — 智能体需要的一切都在仓库中
2. **地图而非手册** — AGENTS.md 是导航入口（< 100 行），深层知识在子文档
3. **执行优于记录** — 重要规则编码为 linter，不只写文档
4. **渐进式披露** — 智能体按需导航，不一次性灌入所有上下文

完整 10 条原则见 `references/REFERENCE.md`。
