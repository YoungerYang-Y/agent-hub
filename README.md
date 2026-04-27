# Agent Hub

个人 AI Agent 配置源仓库与复制式安装器。

## 定位

Agent Hub 是三个东西的组合：

1. **个人 agent-hub CLI**：用 `agent-hub` 命令把本仓库中的 agent 配置复制安装到本机工具目录。
2. **Skill registry**：用 `content/` 保存真实资源，用 `registry/` 声明资源元数据、默认安装状态和目标支持关系。
3. **`npx agent-hub add` 兼容入口**：面向脚本化安装入口提供 `add` 命令别名；底层仍复用 agent-hub 的 registry、dry-run、manifest 和 copy 安装规则。

它不是公共技能市场，也不依赖常驻服务。当前目标是安全地维护个人 AI agent 配置，并让 Codex、Kiro、Claude Code 等本地 agent 共享同一套资源来源。

## 目标

集中维护 skills、prompts、hooks、agents 等 AI 配置内容，并通过统一 Node.js CLI 同步到本地配置目录。

## 结构

```text
content/      # 唯一内容源
registry/     # 内容安装元数据
src/          # Node.js/TypeScript CLI
install/      # Linux/Windows bootstrap 脚本
docs/         # Harness 文档、设计归档与执行计划
```

## 常用命令

```bash
npm install
npm run build
npm run format
npm run check
node dist/cli.js list
node dist/cli.js doctor codex
node dist/cli.js status codex
node dist/cli.js install codex --dry-run
node dist/cli.js install all --dry-run
node dist/cli.js install codex
node dist/cli.js update codex
node dist/cli.js uninstall codex --dry-run
node dist/cli.js prune codex --dry-run
```

## Bootstrap 安装脚本

`install/install.sh` 和 `install/install.ps1` 会严格要求 Node.js 22+。默认执行 dry-run，只展示将安装的资源：

```bash
./install/install.sh codex
```

确认计划后，用 `--apply` 才会实际写入目标配置目录：

```bash
./install/install.sh codex --apply
```

PowerShell 用法相同：

```powershell
.\install\install.ps1 codex
.\install\install.ps1 codex --apply
```

## 配置目录

默认目录可通过环境变量或参数覆盖：

- Codex：`CODEX_HOME`
- Kiro：`KIRO_HOME`
- Claude Code：`CLAUDE_HOME`

示例：

```bash
node dist/cli.js install codex --config-dir /tmp/codex-config
```

当目标是 `all` 且传入 `--config-dir` 时，CLI 会为每个 agent 自动分配子目录，避免相互覆盖：

```text
/tmp/agent-hub-config/codex
/tmp/agent-hub-config/kiro
/tmp/agent-hub-config/claude-code
```

## 选择目标与资源

目标可以是单个 agent，也可以是 `all`：

```bash
# 对所有支持目标（Codex / Kiro / Claude Code）预览安装默认资源
node dist/cli.js install all --dry-run

# 查看所有目标下的受管资源状态
node dist/cli.js status all
```

安装 / 更新默认只处理 `default: true` 的资源。可以用选择器收窄或扩大范围：

```bash
# 只安装指定资源（即使它不是 default）
node dist/cli.js install codex --resource harness-engineering

# 只安装默认 skill
node dist/cli.js install codex --type skill

# 安装目标支持的所有 skill，包括非 default
node dist/cli.js install codex --all --type skill
```

注意：命令中的第一个 `all` 是目标选择（所有 agent），`--all` 是资源选择（包含非 default 资源）。

## 管理已安装资源

安装会在目标配置目录写入 `.agent-hub-manifest.json`，只记录由 agent-hub 管理的资源。

```bash
# 查看 Codex 目标下的受管资源状态、目标是否存在、hash 是否漂移
node dist/cli.js status codex

# 预览卸载所有由 agent-hub 管理的 Codex 资源
node dist/cli.js uninstall codex --dry-run

# 只卸载单个受管资源
node dist/cli.js uninstall codex --resource harness-engineering
```

`uninstall` 只删除 manifest 中记录的受管目标，不会删除未由 agent-hub 管理的本地文件。

如果 registry 中删除了某个资源，manifest 中会留下 stale 记录。使用 `prune` 清理这类受管资源：

```bash
# 预览清理 stale 受管资源
node dist/cli.js prune codex --dry-run

# 清理所有目标下的 stale 受管资源
node dist/cli.js prune all
```

`doctor` 会检查 registry、写权限和 manifest health。manifest health 会报告目标缺失、hash 漂移、source 缺失和 stale registry entries。

## 添加内容

1. 将内容放入 `content/skills/`、`content/prompts/`、`content/hooks/` 或 `content/agents/`。
2. 在对应 `registry/*.json` 中新增资源记录。
3. 运行 `node dist/cli.js list` 验证注册结果。
4. 运行 `node dist/cli.js install <target> --dry-run` 检查同步计划。

## 当前资源

- `content/skills/harness-engineering/`：Harness Engineering 文档体系 skill。
