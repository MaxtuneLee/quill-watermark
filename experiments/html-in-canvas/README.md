# HTML-in-Canvas Spike

Walking-skeleton 验证：以 [WICG html-in-canvas](https://github.com/WICG/html-in-canvas) API 作水印渲染引擎之替代路径，端到端通一线，验证可行与否。

此目录不入 `src/`，不走 `vp build`，纯 spike 性质。

**相关 skill** — 端到端通用 API 心得与坑已收于 `~/.claude/skills/html-in-canvas/SKILL.md`。集成本项目之前务必先阅之。

## 验证结果（2026-04-11）

| #   | 验证项               | 状态 | 结论                                                  |
| --- | -------------------- | ---- | ----------------------------------------------------- |
| 1   | capability detection | ✓    | `drawElementImage` 存在于 CRC2D prototype             |
| 2   | preview pipeline     | ✓    | **需命令式 rAF 调度**，`paint` 事件在当前 Chrome 不稳 |
| 3   | dynamic update       | ✓    | rAF 调度替代 `paint` 事件后稳定                       |
| 4   | toBlob captures DOM  | ✓    | 导出 PNG 含 DOM 内容                                  |
| 5   | 2x/3x DPR export     | ✓    | CSS `--scale` custom property 方案有效，字体清晰      |

**结论：HTML-in-Canvas 作为渲染引擎分支在 Chrome Canary (flag 启用) 下端到端可行。**

## 关键发现

此 spike 过程中发现二大坑，已写入 `~/.claude/skills/html-in-canvas/SKILL.md`，集成时务必注意：

1. **`paint` 事件在当前 Chrome 实现中不可靠** — 弃之，改命令式 `requestAnimationFrame` 驱动
2. **预览 canvas 不可经 CSS 缩放** — `layoutsubtree` 子元素于 canvas CSS 盒空间 layout，若 canvas 有 `max-width: 100%` 被 CSS 缩放，`drawElementImage` 栅格化比例即错。预览必须 bitmap 1:1 显示，或于 wrapper 内 overflow auto
3. **DPR 缩放用 CSS `calc(Npx * var(--scale))` custom property**，非 `transform: scale()`（后者被 spec 明令忽略）

## 运行

### 前置

Chrome Canary，启 flag：

```
chrome://flags/#canvas-draw-element  →  Enabled
```

重启浏览器。

### 打开 spike

```sh
open experiments/html-in-canvas/spike.html
```

或 `vp dev` → `http://localhost:5173/experiments/html-in-canvas/spike.html`。

## 使用流程

1. 页顶 badge 应显 `supported`
2. 右侧 file input 选一张照片
3. 改 title / aperture / shutter / iso / lens 任一 input → 水印卡即时重绘
4. 按 `Download @1x` / `@2x` / `@3x` 得 PNG
5. 打开 PNG，验证 @2x / @3x 字体清晰不糊

## 集成路线图（下一阶段）

五验已通，下一步为将此实验能力纳入主项目，置于 `src/` 下与现 canvas engine 并行。路线如下：

### Phase 1 — 基础设施

- [ ] `src/template-engine/html-in-canvas/supported.ts` — capability 常量
- [ ] `env.d.ts` — TypeScript 增补 `CanvasRenderingContext2D.drawElementImage?` 与 `HTMLCanvasElement.requestPaint?` 为可选，强制调用方探测
- [ ] `src/template-engine/html-in-canvas/types.ts` — `DomRenderContext` 类型与 `DomTemplateDefinition` 接口

### Phase 2 — Template 扩展

- [ ] `src/template-engine/templates/types.ts` — `WatermarkTemplate` 加可选 `dom?: (ctx: DomRenderContext) => ReactNode`
- [ ] `src/template-engine/templates/minimal-info-strip.ts` — 首发 DOM 实现，依 CSS `--scale` 模式设计每个尺寸量
- [ ] 样式使用 Tailwind / CSS Modules，每个尺寸属性皆 `calc(Npx * var(--scale))`

### Phase 3 — 预览与导出

- [ ] `src/features/editor/DomCanvasPreview.tsx` — React 组件，内含 `<canvas layoutsubtree>` + `template.dom(ctx)` 子树 + rAF 调度的 `renderPreview`
  - **重要**：canvas 不可有 `max-width` / `max-height` CSS 约束。stage 容器加 `overflow: auto`。
  - 监听 `paint` 事件作冗余后备，主路径为命令式 rAF
  - `getBoundingClientRect` 前先清 `transform`，免位置漂移
- [ ] `src/features/editor/PreviewStage.tsx` — 加分支判断，不动既有 canvas 路径
  ```tsx
  if (htmlInCanvasSupported && engineMode === "dom" && template.dom) {
    return <DomCanvasPreview ... />
  }
  // 现有 renderEditorCanvas 路径原样保留
  ```
- [ ] `src/services/export/dom-export.ts` — 离屏导出，模式为 `<div host style="position:fixed;left:-99999px">` + 新 `<canvas layoutsubtree>` + 克隆模板子树 + `setProperty("--scale", String(scale))` + 二 rAF 等布局 + `drawElementImage` + `toBlob`
  - **重要**：OffscreenCanvas 不可用，必须真实 DOM
  - 导出 canvas 无 CSS 约束，故 layout 与 bitmap 严格 1:1

### Phase 4 — 用户设置

- [ ] `src/app/app-state.ts` — `editorControls` 中加 `renderEngine: "canvas" | "dom"`，默认 `"canvas"`
- [ ] `src/features/editor/panels/style/` — 于某现有 section 下加 "Engine" toggle；`htmlInCanvasSupported` 为 false 时**全然不渲染该 toggle**
- [ ] `localStorage` 持久化用户选择，免每次开档重选

### Phase 5 — 测试与兜底

- [ ] `minimal-info-strip.test.ts` — DOM 变体之渲染测试（jsdom 限制：无真 layout 引擎，测试只能覆盖 template 定义的字段绑定，非实际 canvas 输出）
- [ ] Safari / Firefox / stable Chrome 下 `htmlInCanvasSupported === false`，engine toggle 不现，既有 canvas engine 一如既往工作，无回归
- [ ] Chrome Canary + flag 下 toggle 可切换，预览与导出与现 canvas engine 视觉一致（或故意差异——若 DOM engine 旨在提供 CSS 原生之排版更胜一筹之表现）

### Phase 6 — 可选增强（DOM engine 之真正利所在）

一旦基础设施稳，可启 DOM engine 独有之编辑利：

- [ ] `contenteditable` 原位编辑文字字段，双向绑定至 Jotai atom
- [ ] 拖动定位水印卡（`pointerdown` → `pointermove` → `dispatch` 更新 offset atom）
- [ ] CSS DevTools 调试与 a11y 友好度

此诸利为加此 engine 之回报所在；canvas engine 难以实现同等编辑体验。

## 失败退路（若某阶段不通）

- Phase 3 DOM 预览位置漂移 → 查是否清 `transform` 于 `getBoundingClientRect` 前
- Phase 3 预览布局与导出不一致 → 查 `DomCanvasPreview` 根 canvas 是否有 CSS `max-width`
- Phase 3 导出 blob 空 → 查是否误用 `OffscreenCanvas`（须真实 DOM canvas）
- Phase 3 2x / 3x 糊 → 查模板是否用 `transform: scale()` 代替 `--scale` custom property

各败皆可溯至 `~/.claude/skills/html-in-canvas/SKILL.md` 之 Gotchas / Common mistakes 二节。
