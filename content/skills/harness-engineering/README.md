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
│   ├── bootstrap.sh            # macOS/Linux 初始化脚本
│   └── bootstrap.ps1           # Windows 初始化脚本
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
# 1. 对目标项目运行 bootstrap
bash ~/.kiro/skills/harness-engineering/scripts/bootstrap.sh /path/to/project

# 2. 让智能体填充模板（激活 harness-engineering skill）

# 3. 验证
cd /path/to/project
node ~/.kiro/skills/harness-engineering/scripts/lint-docs.ts
```

## 支持的项目类型

Backend API · Frontend SPA · CLI 工具 · Library/SDK · 全栈 · 微服务

Bootstrap 创建全量骨架，然后按项目类型裁剪不需要的文档。详见 SKILL.md § Scenario 1 Step 3。

## 核心设计原则

1. **仓库即真相** — 智能体需要的一切都在仓库中
2. **地图而非手册** — AGENTS.md 是导航入口（< 100 行），深层知识在子文档
3. **执行优于记录** — 重要规则编码为 linter，不只写文档
4. **渐进式披露** — 智能体按需导航，不一次性灌入所有上下文

完整 10 条原则见 `references/REFERENCE.md`。
