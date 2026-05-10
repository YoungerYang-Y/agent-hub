# 设计决策目录

项目级通用设计决策。每个文档定义一个跨功能的设计主题（如缓存策略、幂等设计），智能体在相关领域编码前应先查阅。

| id | 主题 | status | owner | 适用范围 | 路径 |
|----|------|--------|-------|----------|------|
| arch-current-cli-source-of-truth | Current CLI Source Of Truth | verified | maintainer | 当前 CLI 架构、文档命令、CI smoke 验证 | `docs/design-docs/arch-current-cli-source-of-truth.md` |

## status 含义

- **draft**：设计尚未落地。智能体可参考但需注意细节可能变化。
- **verified**：设计与实现一致。智能体应严格遵守。
- **stale**：实现已偏离设计。智能体不应信赖细节，需先更新。

## 如何添加

1. 复制 `_template.md` 为 `{主题名}.md`（如 `cache-strategy.md`）
2. 填写 frontmatter 和所有章节
3. 在上方目录表中添加条目
4. status 设为 draft；落地验证后更新为 verified
