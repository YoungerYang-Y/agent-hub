# Bootstrap 质量检查清单

Bootstrap 完成后，逐项检查。全部通过才算完成。

## 结构完整性

- [ ] 文档结构检查通过（skill 内部用 `lint-docs.ts` 验证，但项目 AGENTS.md 中不引用 skill 路径）
- [ ] `AGENTS.md` 存在且 < 100 行
- [ ] `ARCHITECTURE.md` 存在
- [ ] 所有保留的领域文档存在（按项目类型裁剪后）
- [ ] 已删除的文档在 `AGENTS.md` 中无残留链接

## 内容质量

- [ ] `grep -r '<!-- ' docs/ AGENTS.md ARCHITECTURE.md` 无未填充的占位符
- [ ] `ARCHITECTURE.md` 包含：系统描述、领域表、分层模型、技术栈表
- [ ] `AGENTS.md` 包含：项目概述（一段话）、导航链接、开发命令（仅项目自身的 build/test/lint 命令）
- [ ] `AGENTS.md` 的"开发命令"中不包含 agent-specific skill home 路径（如 `~/.codex/skills/`、`~/.kiro/skills/`、`~/.claude/skills/`）
- [ ] `docs/design-docs/core-beliefs.md` 已根据项目上下文调整（不是原始模板）
- [ ] 所有 frontmatter 日期字段已填写（created / updated / verified）

## 裁剪正确性

- [ ] 不存在空白占位文档（已按项目类型删除不适用的文档）
- [ ] `docs/guides/` 下的方法论文件未被裁剪（WORKFLOW / SPEC / DESIGN / PLANS 全部保留）
- [ ] 目录索引（`index.md`）为空或只包含实际存在的条目

## 可验证性

- [ ] 从项目根目录运行 skill 的 `lint-docs.ts` 通过（这是 skill 维护者的验证手段，不写入项目）
- [ ] 从项目根目录运行 skill 的 `doc-gardening.ts` 通过（同上）
- [ ] 变更已提交为初始 Harness commit
