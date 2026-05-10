---
updated: 2026-05-10
---

# 产品思维

## 这个产品是给谁用的？

主要用户是维护个人 AI agent 配置的开发者，以及受托在该仓库中修改资源、安装逻辑和 Harness 文档的智能体。用户关心的是：资源来源清晰、安装结果可预览、本地已有配置不被意外覆盖、同一套内容能分发到多个 agent 运行时。

次要用户是未来新增 target adapter 或新增资源类型的维护者。他们需要通过少量约定理解如何扩展 registry、adapter 和 CLI，而不必重新学习整个仓库。

## 产品原则

1. 安装安全优先于便利：当前安全边界是默认 dry-run 和 `--apply` 显式写入；未受管冲突保护尚未实现，不能在产品说明中声称已有 `--force`。
2. 仓库内容优先于本机状态：`content/` 和 `registry/` 是资源真相，目标 config dir 只保存已安装副本和 managed manifest。
3. 预览优先于执行：新增 destructive 或写入行为必须支持 dry-run 或等价的可审计输出。
4. 多目标一致，差异收敛到 adapter：命令语义跨 Codex/Kiro/Claude Code 保持一致。
5. 文档服务智能体执行：每个规则都应指向文件、命令或测试，而不是依赖口头说明。

## 决策优先级

1. 用户本地配置完整性
2. 资源注册与安装语义正确性
3. 多目标一致性
4. Harness skill 的可安装、可执行、可验证
5. CLI 输出清晰度与使用体验

## 功能生命周期

```mermaid
flowchart LR
  Idea["需求或问题"] --> Spec["必要时写 spec"]
  Spec --> Design["设计文档"]
  Design --> Plan["执行计划"]
  Plan --> Code["实现与测试"]
  Code --> Verify["build/test/list/dry-run"]
  Verify --> Archive["完成后归档或保留计划记录"]
```

| 阶段 | 文档位置 | 智能体的角色 |
|------|----------|-------------|
| 产品规格 | `docs/active/{需求}/spec.md` | 只在大任务中定义用户可见行为和边界 |
| 设计文档 | `docs/active/{需求}/design.md` 或归档历史 `docs/archive/v0.1.0/plans/*-design.md` | 记录技术方案、影响范围、权衡 |
| 执行计划 | `docs/active/{需求}/plan.md` 或归档历史 `docs/archive/v0.1.0/plans/*.md` | 拆分任务、定义验证命令、记录决策 |
| 完成验证 | 命令输出、格式检查和文档 lint | 更新计划状态或在交接中说明验证结果 |

## 架构层不进入每功能流转

以下文档是长期约束，不能作为单个功能的副产品随手修改：

| 长期约束文档 | 变更规则 |
|---|---|
| `ARCHITECTURE.md` | 依赖方向、系统边界、核心安装语义变更时才修改 |
| `docs/DOMAINS.md` | 领域边界随代码组织演进直接更新 |
| `docs/design-docs/core-beliefs.md` | 修改需创建架构 RFC |
| `docs/SECURITY.md` / `docs/RELIABILITY.md` | 变更安全或可靠性红线时更新 |

若实现中发现文档与代码冲突，以代码现状为事实来源，先更新对应 Harness 文档，再继续执行。
