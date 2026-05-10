---
updated: 2026-05-10
---

# 可靠性标准

Agent Hub 是本地 CLI，不提供线上服务，因此可靠性重点是可重复执行、不会破坏本地配置、失败信息可操作、跨平台路径行为稳定。

## SLO（服务级别目标）

| 服务 | 可用性 | 延迟 (p99) | 错误率 | 智能体检查方式 |
|------|--------|-----------|--------|---------------|
| Format check | 文本格式一致 | 不适用 | 0 个格式错误 | `npm run format:check` |
| Registry listing | 能列出所有有效资源 | < 1s（本地小仓库） | 0 个 registry load error | `node cli.js list` |
| Install dry-run | 不写目标也能展示计划 | < 1s（默认资源） | 0 个 registry/path error | `node cli.js install codex --config-dir /tmp/agent-hub-codex` |
| Status check | 能读取目标 manifest 或报告目录不存在 | < 1s | 0 个未捕获错误 | `node cli.js status codex --config-dir /tmp/agent-hub-codex` |
| Doc health | Harness 文档结构有效 | 不适用 | 0 个 error | `node content/skills/harness-docs/scripts/lint-docs.ts` |

## 可观测性要求

- CLI 错误必须包含失败资源、目标路径、manifest 路径或下一步建议。
- 写入操作必须可预览或要求显式确认，输出目标路径和资源 ID。
- `status` 当前只检查 manifest 记录的 destination 是否存在；hash drift、source missing、doctor 等能力尚未实现，不能在交付说明中声称存在。
- 日志和错误信息不得输出密钥、token 或用户私有文件内容。

## 智能体如何验证可靠性

- 格式检查：`npm run format:check`。
- 安装预览：`node cli.js install codex --config-dir /tmp/agent-hub-codex` 和需要时的 `node cli.js install all --config-dir /tmp/agent-hub-all`。
- 状态检查：使用临时 `--config-dir` 验证 status 输出，不直接污染真实用户配置。
- 文档健康：运行 Harness doc linter，确保 AGENTS 链接和占位符有效。

## 性能红线

| 操作 | 红线 | 强制执行方式 |
|------|------|-------------|
| Registry load | 不扫描 `content/` 全树推断资源 | registry 只读取 `registry/*.json` 中声明的 source |
| Dry-run install | 不写目标文件 | CI smoke 覆盖 list 和 install 预览 |
| Status check | 不修改目标 manifest | `status` 只读 manifest 和 destination |
| Reset | 删除前需要明确确认 | 交互式 `yes` 确认或测试使用临时 `--config-dir` |

## 事件响应

- Runbook 位置：当前使用 `README.md` 与 `AGENTS.md` 的命令清单；复杂故障应新增 `docs/active/{需求}/plan.md`。
- 升级路径：无法判断是否会覆盖用户配置时暂停执行，要求用户确认目标目录或使用临时 `--config-dir`。
