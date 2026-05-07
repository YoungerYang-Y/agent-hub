---
updated: 2026-04-26
---

# 可靠性标准

Agent Hub 是本地 CLI，不提供线上服务，因此可靠性重点是可重复执行、不会破坏本地配置、失败信息可操作、跨平台路径行为稳定。

## SLO（服务级别目标）

| 服务 | 可用性 | 延迟 (p99) | 错误率 | 智能体检查方式 |
|------|--------|-----------|--------|---------------|
| CLI build | 本地可构建 | 不适用 | 0 个 TypeScript error | `npm run build` |
| Unit tests | 测试可重复运行 | 不适用 | 0 个失败测试 | `npm test` |
| Registry listing | 能列出所有有效资源 | < 1s（本地小仓库） | 0 个 manifest error | `node dist/cli.js list` |
| Install dry-run | 不写目标也能展示计划 | < 1s（默认资源） | 0 个未解释冲突 | `node dist/cli.js install codex --dry-run` |
| Doc health | Harness 文档结构有效 | 不适用 | 0 个 error | `node content/skills/harness-docs/scripts/lint-docs.ts` |

## 可观测性要求

- CLI 错误必须包含失败资源、目标路径、manifest 路径或下一步建议。
- destructive 操作必须可 dry-run，输出 planned/removed/copied 等明确状态。
- 目标冲突、hash drift、source missing、destination missing 等状态要出现在 `status` 或 `doctor` 输出中。
- 日志和错误信息不得输出密钥、token 或用户私有文件内容。

## 智能体如何验证可靠性

- 构建与测试：`npm run build`、`npm test`。
- 安装预览：`node dist/cli.js install codex --dry-run` 和需要时的 `install all --dry-run`。
- 状态检查：使用临时 `--config-dir` 验证写入、更新、卸载，不直接污染真实用户配置。
- 文档健康：运行 Harness doc linter，确保 AGENTS 链接和占位符有效。

## 性能红线

| 操作 | 红线 | 强制执行方式 |
|------|------|-------------|
| Registry load | 不扫描 `content/` 全树推断资源 | registry 只读取 `registry/*.json` 中声明的 source |
| Dry-run install | 不写目标文件 | tests 覆盖 dry-run operations 和 manifest 行为 |
| Status check | 不修改目标 manifest | `status` 只读 manifest、source、destination |
| Uninstall | 只删除 managed manifest 中记录的目标 | tests 覆盖 resource selection 和 dry-run |

## 事件响应

- Runbook 位置：当前使用 `README.md` 与 `AGENTS.md` 的命令清单；复杂故障应新增 `docs/active/{需求}/plan.md`。
- 升级路径：无法判断是否会覆盖用户配置时暂停执行，要求用户确认目标目录或使用临时 `--config-dir`。
