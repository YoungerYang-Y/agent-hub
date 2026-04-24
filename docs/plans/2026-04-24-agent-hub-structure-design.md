# Agent Hub Structure Design

## Goal

将当前仓库规划为个人 AI 配置源仓库与统一运行器，用于集中维护 skills、hooks、prompts、agent 定义等内容，并通过复制模式同步到 Codex、Kiro、Claude Code 等主流 AI Agent 的本地配置目录。

## Decisions

- 仓库定位：配置源 + 运行器。
- 同步策略：默认复制模式，不使用软链接。
- 运行器：Node.js CLI。
- 平台目标：Linux 与 Windows 优先，macOS 后续可自然兼容。
- 适配目标：Codex、Kiro、Claude Code，后续通过 adapter 扩展。

## Proposed Repository Layout

```text
agent-hub/
├── package.json
├── tsconfig.json
├── README.md
├── AGENTS.md
├── src/
│   ├── cli.ts
│   ├── commands/
│   │   ├── install.ts
│   │   ├── update.ts
│   │   ├── list.ts
│   │   └── doctor.ts
│   ├── adapters/
│   │   ├── codex.ts
│   │   ├── kiro.ts
│   │   ├── claude-code.ts
│   │   └── types.ts
│   └── core/
│       ├── manifest.ts
│       ├── copy.ts
│       ├── paths.ts
│       └── platform.ts
├── registry/
│   ├── skills.json
│   ├── prompts.json
│   ├── hooks.json
│   └── agents.json
├── content/
│   ├── skills/
│   ├── prompts/
│   ├── hooks/
│   └── agents/
├── install/
│   ├── install.sh
│   └── install.ps1
└── docs/
    └── plans/
```

## Content Model

`content/` 是唯一内容源，所有可同步资产都先放在这里：

- `content/skills/`：通用 skill 或按工具适配后的 skill。
- `content/prompts/`：可复用系统提示、任务提示、审查提示。
- `content/hooks/`：工具 hook 脚本或配置片段。
- `content/agents/`：Agent persona、子 Agent 定义、角色模板。

当前已有的 `skills/harness-engineering/` 后续迁移到 `content/skills/harness-engineering/`，避免根目录同时存在多个内容源。

## Registry Model

`registry/*.json` 描述内容如何安装，而不是把规则写死在脚本里。每条资源至少包含：

- `id`：稳定资源 ID。
- `type`：`skill`、`prompt`、`hook`、`agent`。
- `source`：仓库内源路径。
- `targets`：支持的目标工具，如 `codex`、`kiro`、`claude-code`。
- `default`：是否默认安装。
- `description`：简短说明。

Adapter 根据 registry 和自身路径规则，把资源复制到目标配置目录。

## CLI Commands

第一版提供四个命令：

- `agent-hub list`：列出 registry 中可安装资源及目标支持情况。
- `agent-hub install <target>`：安装指定目标工具的默认资源。
- `agent-hub update <target>`：重新同步指定目标工具，语义上等价于安全覆盖安装。
- `agent-hub doctor <target>`：检查 Node 版本、目标路径、写入权限、registry 合法性。

后续可扩展：

- `--all`：安装所有支持目标。
- `--include <id>`：额外安装非默认资源。
- `--dry-run`：只打印将复制的文件。
- `--force`：允许覆盖冲突文件。

## Adapter Responsibilities

每个 adapter 只负责目标工具差异：

- 识别默认配置目录。
- 允许通过环境变量覆盖配置目录。
- 定义不同内容类型的目标路径。
- 判断目标工具是否可用。
- 输出安装摘要与冲突提示。

核心复制、manifest 校验、平台识别逻辑放在 `src/core/`，避免每个 adapter 重复实现。

## Platform Paths

路径解析按优先级处理：

1. 用户显式参数，例如 `--config-dir`。
2. 工具专属环境变量，例如 `CODEX_HOME`、`KIRO_HOME`、`CLAUDE_HOME`。
3. 平台默认路径。

Windows 路径使用 `APPDATA` 或用户目录推导；Linux 使用 `XDG_CONFIG_HOME` 或用户目录推导。所有路径操作使用 Node `path` 与 `fs` API，避免 shell 差异。

## Copy Semantics

复制模式遵循安全优先：

- 默认创建目标目录。
- 默认覆盖由 agent-hub 管理的同名文件。
- 对未知已有文件给出冲突提示，除非使用 `--force`。
- 每次安装生成 `.agent-hub-manifest.json`，记录源资源、目标路径、更新时间和内容 hash。
- `update` 根据 manifest 判断哪些文件需要刷新。

## Bootstrap Scripts

`install/install.sh` 与 `install/install.ps1` 只做轻量启动：

- 检查 Node.js 版本。
- 安装依赖或提示用户运行包管理器命令。
- 调用 Node CLI 执行安装。

业务逻辑全部留在 TypeScript CLI，避免 Bash 与 PowerShell 逻辑漂移。

## Error Handling

- registry 格式错误：阻止安装并指出具体文件与资源 ID。
- 目标目录不可写：阻止安装并提示配置目录或权限处理方式。
- 文件冲突：默认跳过或报错，使用 `--force` 后覆盖。
- 未支持目标：列出当前支持目标。
- 部分安装失败：输出成功项、失败项和下一步建议。

## Testing Strategy

- 单元测试：manifest 解析、路径解析、复制决策、冲突策略。
- 集成测试：用临时目录模拟 Codex/Kiro/Claude Code 配置目录。
- CLI 测试：验证 `list`、`doctor`、`install --dry-run` 输出。
- 跨平台重点：避免依赖 shell 语法，路径相关逻辑使用 Node 标准库。

## Migration Plan

1. 初始化 Node + TypeScript CLI 基础结构。
2. 将当前 `skills/harness-engineering/` 迁移到 `content/skills/harness-engineering/`。
3. 添加 `registry/skills.json`，先登记 `harness-engineering`。
4. 实现 Codex adapter。
5. 增加 Kiro 与 Claude Code adapter。
6. 添加 bootstrap 脚本。
7. 补充 README 使用说明。

## Open Questions

- Codex、Kiro、Claude Code 的最终默认配置目录需要在实现阶段验证。
- Claude Code 的本地 agent 定义格式需要按当前版本确认。
- hooks 在不同工具中的能力差异较大，第一版可以只同步文件，不强行启用。
