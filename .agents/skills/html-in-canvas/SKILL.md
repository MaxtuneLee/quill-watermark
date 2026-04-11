---
name: html-in-canvas
description: Use when integrating, debugging, or evaluating the experimental WICG HTML-in-Canvas API (drawElementImage, layoutsubtree, canvas-place-element) for rendering DOM subtrees into a 2D canvas bitmap and exporting the result
---

# HTML-in-Canvas API

## Overview

WICG `html-in-canvas` lets `<canvas layoutsubtree>` rasterize DOM children into its bitmap via `ctx.drawElementImage(element, x, y)`. Useful when a canvas export pipeline wants CSS-driven text/layout instead of hand-rolled text measurement.

**Status as of 2026:** Chromium-only, behind `chrome://flags/#canvas-draw-element`. Not in Safari or Firefox. **Always** build as an optional branch with capability detection and a fallback engine.

**Proposal:** https://github.com/WICG/html-in-canvas

## When to use

- Replacing manual canvas text layout with CSS/flexbox
- Rasterizing rich HTML/SVG into an exported image (PNG/JPEG)
- WYSIWYG editing where preview and export share one DOM template

**Don't use** as the only rendering path — cross-browser users see nothing. Capability-gate and fall back.

## Three primitives

| API                                     | Purpose                                                                                                                                                        |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `layoutsubtree` attribute on `<canvas>` | Opts children into layout. Hit-test + a11y only; visually rendered solely via `drawElementImage` into the bitmap.                                              |
| `ctx.drawElementImage(el, x, y)`        | Rasterizes element into canvas bitmap at bitmap coords. Returns a `DOMMatrix` to apply via `el.style.transform` so DOM hit-testing follows the drawn location. |
| `paint` event / `canvas.requestPaint()` | Intended reactive repaint hook. **Unreliable in current Chrome builds — do not depend on it.**                                                                 |

## Capability detection

```js
const supported =
  typeof CanvasRenderingContext2D !== "undefined" &&
  "drawElementImage" in CanvasRenderingContext2D.prototype;
```

## Gotchas (learned empirically)

### 1. Preview canvas must render 1:1 — no CSS scaling

`layoutsubtree` children lay out in the canvas element's **CSS box space**, not its bitmap space. If the canvas has `max-width: 100%` / `max-height: Nvh` and is CSS-scaled to fit a viewport, children lay out in the smaller CSS box, but `drawElementImage` then rasterizes them at CSS size into bitmap pixels → proportions break. Export paths that use hidden unconstrained canvases look correct while the live preview looks wrong. Symptom: preview and export disagree on layout despite sharing the same element/template.

**Fix:** No `max-width` / `max-height` / `object-fit` on a live `<canvas layoutsubtree>`. Size the bitmap (via `width`/`height` attributes) to fit the viewport directly, and wrap in `overflow: auto` for overflow safety.

### 2. `paint` event is unreliable — drive rendering imperatively

Calling `canvas.requestPaint()` may not dispatch, and child mutations don't always fire `paint`. Use a `requestAnimationFrame`-scheduled render function triggered on state change, exactly like normal canvas. Keep `addEventListener("paint", render)` as a fallback — if the implementation ever fires it, you get a free redraw.

### 3. Clear `transform` before measuring

`drawElementImage`'s returned `DOMMatrix` is applied to `el.style.transform` to sync DOM hit-testing with the drawn location. On the next render, clear that transform before `getBoundingClientRect` or the measurement reflects the transformed box, and positioning drifts each frame.

```js
el.style.transform = ""; // reset before measure
const rect = el.getBoundingClientRect();
const x = (canvas.width - rect.width) / 2;
const y = canvas.height - rect.height - 48;
const transform = ctx.drawElementImage(el, x, y);
el.style.transform = transform.toString(); // apply after draw
```

### 4. Export cannot use `OffscreenCanvas`

`layoutsubtree` requires a real DOM layout engine and real DOM children. `OffscreenCanvas` has neither. Export must use a real `<canvas>` placed in a visually hidden host still attached to `document`:

```js
const host = document.createElement("div");
host.style.cssText = "position:fixed;left:-99999px;top:0;pointer-events:none;opacity:0;";
const exportCanvas = document.createElement("canvas");
exportCanvas.setAttribute("layoutsubtree", "");
exportCanvas.width = bitmapW * scale;
exportCanvas.height = bitmapH * scale;
exportCanvas.append(clonedElement); // the element to draw
host.append(exportCanvas);
document.body.append(host);
// ... rAF wait, drawElementImage, toBlob, cleanup host
```

### 5. DPR / 2x·3x export via CSS `--scale`, not `transform: scale()`

The spec explicitly **ignores** CSS `transform` on the source element for drawing purposes. For higher-density export, the element must physically re-layout at larger CSS dimensions.

**Clean pattern:** design templates with `calc(Npx * var(--scale))` on every size, padding, gap, font-size, border, line-height. At export time, set `clone.style.setProperty("--scale", String(scale))`. No `getComputedStyle` walking, no inline overrides, no fragile computed-style→inline-style transcription.

```css
.card {
  --scale: 1;
  width: calc(560px * var(--scale));
  padding: calc(32px * var(--scale));
  gap: calc(8px * var(--scale));
}
.card .title {
  font-size: calc(20px * var(--scale));
}
```

### 6. Two rAF ticks before measuring an appended clone

When building an offscreen export canvas, append the clone, then wait two `requestAnimationFrame` ticks before calling `getBoundingClientRect` / `drawElementImage`. One tick is not always enough for layout to settle (esp. with `contain` on the host or nested flex).

## Minimal end-to-end pattern

```js
// ── PREVIEW ─────────────────────────────────────────────────────────────────
let rafHandle = 0;
function schedulePreview() {
  if (rafHandle) return;
  rafHandle = requestAnimationFrame(() => {
    rafHandle = 0;
    renderPreview();
  });
}

function renderPreview() {
  ctx.reset();
  ctx.drawImage(photo, 0, 0, canvas.width, canvas.height);

  card.style.transform = "";
  const rect = card.getBoundingClientRect();
  const x = (canvas.width - rect.width) / 2;
  const y = canvas.height - rect.height - 48;
  const transform = ctx.drawElementImage(card, x, y);
  card.style.transform = transform.toString();
}

// Trigger on any state change — initial, input, file load, resize.
canvas.addEventListener("paint", renderPreview); // fallback only
requestAnimationFrame(() => requestAnimationFrame(schedulePreview));

// ── EXPORT at target scale ──────────────────────────────────────────────────
async function exportAt(scale) {
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-99999px;top:0;pointer-events:none;opacity:0;";
  const exportCanvas = document.createElement("canvas");
  exportCanvas.setAttribute("layoutsubtree", "");
  exportCanvas.width = canvas.width * scale;
  exportCanvas.height = canvas.height * scale;

  const clone = card.cloneNode(true);
  clone.removeAttribute("id");
  for (const el of clone.querySelectorAll("[id]")) el.removeAttribute("id");
  clone.style.setProperty("--scale", String(scale));

  exportCanvas.append(clone);
  host.append(exportCanvas);
  document.body.append(host);

  await new Promise((r) => requestAnimationFrame(r));
  await new Promise((r) => requestAnimationFrame(r));

  const ctx2 = exportCanvas.getContext("2d");
  ctx2.drawImage(photo, 0, 0, exportCanvas.width, exportCanvas.height);

  const rect = clone.getBoundingClientRect();
  const cx = (exportCanvas.width - rect.width) / 2;
  const cy = exportCanvas.height - rect.height - 48 * scale;
  ctx2.drawElementImage(clone, cx, cy);

  const blob = await new Promise((r) => exportCanvas.toBlob(r, "image/png"));
  host.remove();
  return blob;
}
```

## TypeScript: augment lib.dom.d.ts

`drawElementImage`, `layoutsubtree`, and `requestPaint` are not yet in `lib.dom.d.ts`. Add a global declaration file:

```ts
// env.d.ts
declare global {
  interface CanvasRenderingContext2D {
    drawElementImage?(el: Element, x: number, y: number): DOMMatrix;
  }
  interface HTMLCanvasElement {
    requestPaint?(): void;
  }
}
export {};
```

Mark as optional (`?`) so call sites are forced to capability-check.

## Common mistakes

| Mistake                                 | Fix                                                 |
| --------------------------------------- | --------------------------------------------------- |
| `max-width: 100%` on preview canvas     | No CSS sizing; bitmap = CSS 1:1                     |
| Depending on `paint` event              | Imperative rAF render, paint event as fallback      |
| `OffscreenCanvas` for export            | Real canvas in hidden DOM host                      |
| `transform: scale()` for DPR            | CSS `--scale` custom property                       |
| `getComputedStyle` walk for DPR         | CSS `--scale` custom property                       |
| Measuring rect while transform applied  | Clear `transform` first, then measure               |
| One rAF tick before measuring clone     | Wait **two** rAF ticks                              |
| No capability fallback                  | Always capability-gate with alternative engine      |
| Shipping behind flag as production path | Keep as opt-in beta; ship the fallback to all users |

## Red flags — STOP and reconsider

- Your preview and export disagree on layout → check #1 (CSS scaling on preview canvas)
- Your preview canvas is blank / black → check #2 (`paint` event dependency)
- Cards drift across frames → check #3 (transform not cleared before measure)
- `drawElementImage is not a function` on export canvas → you used `OffscreenCanvas` (see #4)
- 2x export is blurry, not sharper → you used `transform: scale()` (see #5)

## Verification checklist before shipping

1. Capability detection returns `true` on Chrome Canary with flag, `false` elsewhere
2. `paint` event fires or doesn't — either way, rendering works via rAF scheduler
3. Preview and export produce pixel-identical layout at 1x
4. 2x / 3x exports are actually sharper (not just upscaled blur)
5. `toBlob()` output contains DOM content — open the PNG in an image viewer, not just the browser
6. Fallback engine renders correctly in Safari/Firefox/stable Chrome

## Reference: writing a capability-gated engine branch

```ts
export const htmlInCanvasSupported =
  typeof CanvasRenderingContext2D !== "undefined" &&
  "drawElementImage" in CanvasRenderingContext2D.prototype;

// In the render dispatcher:
if (htmlInCanvasSupported && engineMode === "dom" && template.dom) {
  return new DomCanvasRenderer(template, photo);
}
return new CanvasRenderer(template, photo); // existing fallback
```

UI: expose the engine toggle only when `htmlInCanvasSupported` is true; default to the canvas engine and persist the user's choice in `localStorage` so the flag-off population never sees the option.
