# Bootstrap 质量检查清单

Bootstrap 完成后，逐项检查。全部通过才算完成。

## 结构完整性

- [ ] `lint-docs.ts` 退出码为 0
- [ ] `AGENTS.md` 存在且 < 100 行
- [ ] `ARCHITECTURE.md` 存在
- [ ] 所有保留的领域文档存在（按项目类型裁剪后）
- [ ] 已删除的文档在 `AGENTS.md` 中无残留链接

## 内容质量

- [ ] `grep -r '<!-- ' docs/ AGENTS.md ARCHITECTURE.md` 无未填充的占位符
- [ ] `ARCHITECTURE.md` 包含：系统描述、领域表、分层模型、技术栈表
- [ ] `AGENTS.md` 包含：项目概述（一段话）、导航链接、开发命令
- [ ] `docs/design-docs/core-beliefs.md` 已根据项目上下文调整（不是原始模板）
- [ ] 所有日期字段已填写（创建日期 / 最后更新 / 最后验证）

## 裁剪正确性

- [ ] 不存在空白占位文档（已按项目类型删除不适用的文档）
- [ ] `DESIGN.md` 只保留了适用的接口类型章节
- [ ] 目录索引（`index.md`）为空或只包含实际存在的条目

## 可验证性

- [ ] 从项目根目录可成功运行 `lint-docs.ts`
- [ ] 从项目根目录可成功运行 `doc-gardening.ts`
- [ ] 变更已提交为初始 Harness commit
