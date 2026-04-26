---
version: "v0.1.0"
date: 2026-04-27
retain_until: 2027-04-27
previous_version: ""
next_version: ""
---

# 版本发布：v0.1.0

## 版本摘要

v0.1.0 归档 Agent Hub 从初始 TypeScript CLI 到 managed manifest 生命周期的已完成设计与实施文档。该版本确立了 `content/` 作为资源真相、`registry/` 作为安装元数据、adapter 作为目标差异层，以及 copy-based installation、resource selection、target `all`、status/uninstall/prune、doctor manifest health 等 CLI 能力。

## Changelog

### Features

- 初始化 Agent Hub CLI、registry、adapter、copy engine 和 bootstrap 脚本。
- 增加 managed manifest status、uninstall、resource selectors、target `all`、stale prune 和 doctor manifest health。

### Fixes

- 改进未受管安装冲突输出，明确 destination、manifest 和下一步。
- 隔离 `all --config-dir` 下不同 target 的配置目录，避免批量 dry-run 和安装互相覆盖。

### Misc

- 将迁移前的完成态设计/计划文档从 `docs/plans/` 归档到 `docs/archive/v0.1.0/plans/`。

## 包含需求

| 需求 slug | 概述 | 变更类型 | 影响模块 | 关联 commits |
|-----------|------|----------|----------|-------------|
| agent-hub-structure | 建立 Agent Hub 仓库结构、registry/content 模型、adapter 边界和复制式安装语义 | 新增 | `content/`, `registry/`, `src/`, `install/`, `README.md`, `AGENTS.md` | 5969c94 |
| cli-manifest-lifecycle | 增加 managed manifest 状态查看、受管资源卸载和冲突提示 | 新增 | `src/core/managed-manifest.ts`, `src/commands/status.ts`, `src/commands/uninstall.ts`, `src/core/copy.ts`, `README.md` | 57b1c9d, 186be18, eafe11b, 79e109f, 8709eec, 10b39af, 611e2d2 |
| cli-resource-selection | 支持按 resource/type/all 选择资源，并支持 target `all` 批处理 | 新增 | `src/core/manifest.ts`, `src/cli.ts`, `src/commands/targets.ts`, `src/commands/install.ts`, `src/commands/update.ts`, `README.md` | 1f28f35, 05ebce0, a84ad6d, 092fd3a, baca99a |
| cli-manifest-health | 增加 target-specific config dir、stale prune 和 doctor manifest health 检查 | 新增 | `src/commands/targets.ts`, `src/core/managed-manifest.ts`, `src/commands/prune.ts`, `src/commands/doctor.ts`, `README.md` | 2084305, 1dcaada, b729a91, d7f7861, 2107818 |

## 独立提交（不对应具体需求）

| commit | 类型 | 说明 |
|--------|------|------|
| dc29a66 | docs | 补齐当前仓库的 Harness Engineering 文档体系 |

## 变更范围总览

### 接口变更

| 接口 | 变更类型 | 向后兼容 | 说明 |
|------|----------|----------|------|
| `agent-hub list` | 新增 | 是 | 列出 registry 中的资源与支持 target |
| `agent-hub install/update <target>` | 新增/迭代 | 是 | 支持 dry-run、force、config-dir、resource/type/all selector |
| `agent-hub status <target>` | 新增 | 是 | 查看 managed manifest 中的资源状态 |
| `agent-hub uninstall <target>` | 新增 | 是 | 只移除 manifest 记录的受管资源 |
| `agent-hub prune <target|all>` | 新增 | 是 | 清理 stale managed manifest entries |
| `agent-hub doctor <target|all>` | 迭代 | 是 | 增加 manifest health 报告 |

### 数据变更

| 变更 | 类型 | 可回滚 | 说明 |
|------|------|--------|------|
| `.agent-hub-manifest.json` | 格式 | 是 | 记录 agent-hub 管理的目标资源、hash 和更新时间 |
| `registry/*.json` | 格式 | 是 | 资源声明包含 id、type、source、targets、default、description |
| `docs/archive/v0.1.0/` | 文档归档 | 是 | 历史设计/计划文档从 `docs/plans/` 移入归档目录 |

### 依赖变更

| 依赖 | 变更 | 原因 |
|------|------|------|
| `typescript` | 新增 | 构建 Node.js CLI |
| `vitest` | 新增 | 覆盖 registry、copy、manifest、command 和 target 行为 |
| `@types/node` | 新增 | TypeScript 使用 Node.js 标准库类型 |

## 发布与回滚

- **发布策略**：本地 CLI 全量使用；没有服务端灰度。
- **回滚方案**：通过 git revert 回滚代码；文档归档可将 `docs/archive/v0.1.0/plans/` 移回 `docs/plans/`。
- **回滚触发条件**：核心命令 build/test 失败，或 install/status/uninstall/prune 出现不可解释的目标文件破坏风险。
- **Feature flags**：无。

## 关键决策

- 使用 copy-based installation 而不是 symlink，确保目标 agent 不依赖当前仓库路径。
- 把 target 差异限制在 adapter 层，copy、hash、manifest、selection 保持 target-neutral。
- 默认拒绝覆盖未受管目标文件，只有显式 `--force` 才允许替换。
- 将受管状态写入目标 config dir 的 `.agent-hub-manifest.json`，卸载和 prune 只处理 manifest 中的路径。
- `all --config-dir` 使用 target 子目录，避免不同 agent 的安装目标互相污染。

## 已知遗留

| 问题 | 影响 | 跟踪位置 |
|------|------|----------|
| Bootstrap 脚本缺少与 CLI 同等级别的自动化覆盖 | 中 | `docs/active/tech-debt-tracker.md` |

## 验证状态

- [x] 所有历史计划已归档到 `docs/archive/v0.1.0/plans/`
- [x] 历史设计与计划已在本 release 中建立索引
- [x] 关联 commit hash 已记录
- [x] Changelog 已填写完整
- [x] 接口变更已在 release 范围中记录
- [x] 数据变更不涉及数据库 migration
