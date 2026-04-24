# Agent Hub

个人 AI Agent 配置源仓库与复制式安装器。

## 目标

集中维护 skills、prompts、hooks、agents 等 AI 配置内容，并通过统一 Node.js CLI 同步到 Codex、Kiro、Claude Code 等本地配置目录。

## 结构

```text
content/      # 唯一内容源
registry/     # 内容安装元数据
src/          # Node.js/TypeScript CLI
install/      # Linux/Windows bootstrap 脚本
docs/plans/   # 设计与实施计划
```

## 常用命令

```bash
npm install
npm run build
node dist/cli.js list
node dist/cli.js doctor codex
node dist/cli.js install codex --dry-run
node dist/cli.js install codex
node dist/cli.js update codex
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

## 添加内容

1. 将内容放入 `content/skills/`、`content/prompts/`、`content/hooks/` 或 `content/agents/`。
2. 在对应 `registry/*.json` 中新增资源记录。
3. 运行 `node dist/cli.js list` 验证注册结果。
4. 运行 `node dist/cli.js install <target> --dry-run` 检查同步计划。

## 当前资源

- `content/skills/harness-engineering/`：Harness Engineering 文档体系 skill。
