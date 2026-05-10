---
id: arch-current-cli-source-of-truth
status: verified
owner: "maintainer"
tags: ["architecture", "documentation"]
created: 2026-05-10
verified: 2026-05-10
---

# Current CLI Source Of Truth

## 背景与动机

项目文档曾描述 TypeScript `src/` 分层、`dist/cli.js` 构建产物、Vitest 测试和 `install/` bootstrap 脚本；当前仓库实际实现是零依赖 ESM 单文件 CLI。为了避免智能体按归档计划而不是现行代码工作，本设计把 `cli.js` 单文件实现确认为当前事实来源。

## 设计原则

1. 现行文档、CI 和交接命令必须引用当前可运行入口：`node cli.js ...`。
2. 归档目录中的历史 TypeScript 计划只作为历史记录，不能作为当前架构约束。
3. 未实现能力必须明确标注为缺口或债务，不能写成现有行为。
4. 如果未来重新引入 `src/`、`dist/`、测试框架或 bootstrap 脚本，需要新的需求文档和可运行验证命令。

## 标准做法

- 用 `cli.js` 描述命令路由、registry 加载、adapter、copy、manifest 和 status 行为。
- 用 `lib/prompt.mjs` 描述交互式选择器，不把它写成安装业务层。
- 用 `npm run format:check`、`node cli.js list`、`node cli.js install ... --config-dir /tmp/...` 作为当前基础验证。
- 在 `docs/active/tech-debt-tracker.md` 记录当前实现缺口，例如未受管目标冲突保护和自动化测试不足。

## 反模式

| 反模式 | 为什么禁止 |
|--------|-----------|
| 在现行文档或 CI 中引用 `dist/cli.js` | 当前没有构建产物，会导致验证命令失败 |
| 把 `src/core` / `src/adapters` 写成当前模块 | 当前不存在这些目录，智能体会修改错误位置 |
| 声称已有 `doctor`、`uninstall`、hash drift 检测或 `--force` | 当前 CLI 未实现这些命令和语义 |
| 把归档计划里的完成状态当作当前代码事实 | 归档文档保留历史，不代表工作树现状 |

## 适用范围

适用于 `AGENTS.md`、`ARCHITECTURE.md`、`README.md`、`docs/DOMAINS.md`、`docs/SECURITY.md`、`docs/RELIABILITY.md`、`docs/QUALITY_SCORE.md`、`docs/generated/*`、CI 配置和交接验证命令。

## 参考

- `ARCHITECTURE.md`
- `docs/generated/module-dependencies.md`
- `docs/active/tech-debt-tracker.md`
