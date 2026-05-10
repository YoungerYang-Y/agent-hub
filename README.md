# Agent Hub

个人 AI Agent 配置源仓库与复制式安装器。

## 定位

Agent Hub 是三个东西的组合：

1. **个人 agent-hub CLI**：用 `agent-hub` 命令把本仓库中的 agent 配置复制安装到本机工具目录。
2. **Skill registry**：用 `content/` 保存真实资源，用 `registry/` 声明资源元数据、默认安装状态和目标支持关系。
3. **交互式安装**：无参数运行 `agent-hub install` 进入交互式选择界面。

它不是公共技能市场，也不依赖常驻服务。当前目标是安全地维护个人 AI agent 配置，并让 Kiro、Codex、Claude Code 等本地 agent 共享同一套资源来源。

## 目标

集中维护 skills、prompts、hooks、agents 等 AI 配置内容，并通过统一 Node.js CLI 同步到本地配置目录。

## 结构

```text
content/      # 唯一内容源
registry/     # 内容安装元数据
cli.js        # CLI 主入口
lib/          # 交互式选择库
docs/         # 文档
```

## 常用命令

```bash
node cli.js list
node cli.js install              # 交互式安装
node cli.js install kiro         # dry-run 预览
node cli.js install kiro --apply # 实际安装
node cli.js status kiro
node cli.js reset kiro
```

## 配置目录

默认目录可通过环境变量或参数覆盖：

- Kiro：`KIRO_HOME`
- Codex：`CODEX_HOME`
- Claude Code：`CLAUDE_HOME`

示例：

```bash
agent-hub install kiro --config-dir /tmp/kiro-config
```

## 选择目标与资源

目标可以是单个 agent，也可以是 `all`：

```bash
# 对所有支持目标（Kiro / Codex / Claude Code）预览安装默认资源
node cli.js install all

# 查看所有目标下的受管资源状态
node cli.js status all
```

安装默认只处理 `default: true` 的资源。可以用选择器收窄或扩大范围：

```bash
# 只安装指定资源（即使它不是 default）
node cli.js install kiro --resource harness-docs --apply

# 安装目标支持的所有资源，包括非 default
node cli.js install kiro --all --apply
```

## 管理已安装资源

安装会在目标配置目录写入 `.agent-hub-manifest.json`，只记录由 agent-hub 管理的资源。

```bash
# 查看 Kiro 目标下的受管资源状态
node cli.js status kiro

# 清除旧配置并重新安装默认资源
node cli.js reset kiro
```

## 添加内容

1. 将内容放入 `content/skills/`、`content/prompts/`、`content/hooks/` 或 `content/agents/`。
2. 在对应 `registry/*.json` 中新增资源记录。
3. 运行 `node cli.js list` 验证注册结果。
4. 运行 `node cli.js install <target>` 检查同步计划。

## 当前资源

运行以下命令查看所有已注册资源：

```bash
node cli.js list
```

当前包含 5 个 skills 和 2 个 agents，支持 Kiro、Codex、Claude Code 三个目标。
