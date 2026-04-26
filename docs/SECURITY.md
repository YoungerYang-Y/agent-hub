---
updated: 2026-04-26
---

# 安全策略

Agent Hub 操作的是用户本机 agent 配置目录。安全重点不是网络认证，而是本地文件安全、路径约束、密钥不入库、安装行为可预览。

## 认证

本项目没有服务端认证流程，也不存储 access token。CLI 只读取本地仓库内容、registry 文件、目标 config dir 和环境变量路径。若未来接入远程下载或 GitHub API，必须新增独立设计文档并说明凭证来源、最小权限和撤销方式。

## 授权

授权边界来自用户显式执行的命令和目标目录选择：

- 默认目标目录由 adapter 解析；用户可以通过 `CODEX_HOME`、`KIRO_HOME`、`CLAUDE_HOME` 或 `--config-dir` 覆盖。
- 写入目标前必须检查未受管冲突；未受管目标存在时默认失败。
- `--force` 是覆盖未受管目标的显式授权，相关行为必须保持清晰输出。
- `uninstall` 只能删除 `.agent-hub-manifest.json` 中记录的受管资源。

## 智能体必须遵守的安全规则

1. **路径安全**：不要把个人绝对路径写入可复用代码或项目文档；使用 env var、`--config-dir`、adapter 默认路径。
2. **冲突保护**：任何覆盖未受管文件的行为都必须要求显式 `--force`。
3. **卸载保护**：卸载只处理 managed manifest 中的 destination，不扫描删除用户手写文件。
4. **密钥保护**：不提交 token、私钥、cookie、`.env` 或真实 agent 配置目录内容。
5. **输入验证**：registry JSON 必须通过 `validateResource()`；新增字段需测试错误信息。
6. **动态执行限制**：禁止从 registry 或 content 动态执行脚本作为安装步骤；content 只能复制。

## 安全审查清单

- [ ] 新增写入路径支持 dry-run 或等价预览。
- [ ] 新增覆盖行为需要显式 flag。
- [ ] 新增删除行为只作用于受管资源。
- [ ] 错误信息不泄露敏感文件内容。
- [ ] 新增 target adapter 支持 `--config-dir`。
- [ ] 新增依赖不引入远程执行或安装时下载行为。
