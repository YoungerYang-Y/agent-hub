# 前端架构

<!--
  分层定位：
  本文件是 ARCHITECTURE.md 的**前端子视图**，属架构层长期约束。
  不是某次前端功能的设计文档；具体功能设计应放在 docs/design-docs/。

  适用范围：
  - ✅ 有 Web 前端的项目（React / Vue / Svelte / Angular 等）
  - ✅ 有跨端 UI 的项目（RN / Flutter 桌面端等，可在此扩展一节）
  - ⚠️ 纯后端 / CLI / SDK / 纯 Android 原生 / 纯 iOS 原生 项目：
        本文件对你无意义，**可以直接删除**，并在 AGENTS.md 导航中去掉对应链接
        （Android/iOS 的平台层规范建议写在 `docs/DESIGN.md` 的"移动端规范"章节）

  本模板语言/框架无关，示例仅作参考，请按项目替换或删除不适用内容。
-->

## 路由结构

<!-- 智能体需要知道：路由方案、路由文件在哪里、如何添加新页面 -->

## 状态管理

- **客户端状态**：<!-- 如 useState, Zustand, Jotai -->
- **服务端状态**：<!-- 如 React Query, SWR, Server Components -->
- **表单状态**：<!-- 如 React Hook Form, Formik -->

## 数据获取模式

<!-- 智能体需要知道：从哪里获取数据、用什么模式 -->

## 代码组织

<!--
  智能体需要知道：新文件应该放在哪里。
  以下为 React/TS 风格**示例**，按项目实际结构调整（Vue / Svelte / Angular / 纯 JS 均适用同样理念）。
-->

```
src/
├── components/ui/        # 通用可复用组件
├── components/features/  # 功能特定组件
├── hooks/ or composables/ or stores/  # 状态与副作用封装（按框架）
├── lib/                  # 工具函数和配置
└── types/                # 类型定义（TS）或 schema 定义
```

## 性能约束

<!--
  以下为 Web 场景**示例**指标，按实际项目替换：
  - Web：LCP < 2.5s, INP < 200ms, CLS < 0.1
  - 桌面/嵌入式：冷启动、首屏渲染时长
  - 移动 H5：首字节、资源总大小、主线程阻塞
-->

- 交互响应：<!-- 具体指标 -->
- 每个路由/视图的包体积上限：<!-- 具体值 -->
- 大组件/重依赖必须懒加载

## 智能体如何验证 UI

- 应用可按 git worktree 启动独立实例，用于隔离验证
- 通过 CDP（Chrome DevTools Protocol）获取 DOM 快照和截图
- 智能体可以复现 Bug、验证修复、直接推理 UI 行为
