// HTML-in-Canvas spike — Quill Watermark
//
// Walking-skeleton verification of the end-to-end DOM engine path:
//   1. capability detection (drawElementImage on CRC2D prototype)
//   2. preview pipeline (paint event + drawElementImage renders DOM into canvas bitmap)
//   3. dynamic updates (text mutation fires paint)
//   4. toBlob captures the rasterized DOM content
//   5. 2x / 3x DPR export via offscreen-in-DOM hidden canvas + CSS --scale

/** @type {Record<string, string>} */
const CHECK_LABELS = {
  capability: "1. capability detection",
  preview: "2. preview pipeline",
  dynamic: "3. dynamic update fires paint",
  toBlob: "4. toBlob contains DOM content",
  dpr: "5. 2x/3x DPR export",
};

const checklistEl = document.getElementById("checklist");

function logCheck(key, ok, detail = "") {
  const prefix = ok ? "✓" : "✗";
  console.log(`[spike] ${prefix} ${CHECK_LABELS[key]}${detail ? ` — ${detail}` : ""}`);
  const li = checklistEl?.querySelector(`[data-key="${key}"]`);
  if (li) {
    li.classList.remove("ok", "no");
    li.classList.add(ok ? "ok" : "no");
    li.textContent = `${prefix} ${CHECK_LABELS[key]}${detail ? ` — ${detail}` : ""}`;
  }
}

// ─── Check 1: capability ─────────────────────────────────────────────────────
const supported =
  typeof CanvasRenderingContext2D !== "undefined" &&
  "drawElementImage" in CanvasRenderingContext2D.prototype;

const badge = document.getElementById("capsBadge");
if (supported) {
  badge.textContent = "supported";
  badge.classList.add("ok");
  logCheck("capability", true, "drawElementImage present");
} else {
  badge.textContent = "not supported";
  badge.classList.add("no");
  logCheck("capability", false, "enable chrome://flags/#canvas-draw-element in Chrome Canary");
}

// ─── DOM refs ────────────────────────────────────────────────────────────────
/** @type {HTMLCanvasElement} */
const canvas = document.getElementById("previewCanvas");
const ctx = canvas.getContext("2d");
const card = document.getElementById("previewCard");

const fileInput = document.getElementById("fileInput");
const titleInput = document.getElementById("titleInput");
const apertureInput = document.getElementById("apertureInput");
const shutterInput = document.getElementById("shutterInput");
const isoInput = document.getElementById("isoInput");
const lensInput = document.getElementById("lensInput");

// ─── State ───────────────────────────────────────────────────────────────────
let photo = null; // HTMLImageElement once loaded
let renderCount = 0;
let paintEventCount = 0;
let firstPreviewLogged = false;
let firstDynamicLogged = false;
let rafHandle = 0;

// ─── Geometry helper ─────────────────────────────────────────────────────────
function fitContain(srcW, srcH, boxW, boxH) {
  const scale = Math.min(boxW / srcW, boxH / srcH);
  const drawW = srcW * scale;
  const drawH = srcH * scale;
  const drawX = (boxW - drawW) / 2;
  const drawY = (boxH - drawH) / 2;
  return { drawX, drawY, drawW, drawH };
}

// ─── Imperative preview render ──────────────────────────────────────────────
// The paint event does not fire reliably in current Chrome implementations, so
// we drive rendering ourselves: any state change schedules a rAF → renderPreview.
// This mirrors what the export path does (which works), just for the live canvas.
function renderPreview() {
  if (!supported) return;
  renderCount += 1;

  ctx.reset();
  ctx.fillStyle = "#1a1918";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (photo) {
    const photoBoxH = canvas.height * 0.78;
    const { drawX, drawY, drawW, drawH } = fitContain(
      photo.naturalWidth,
      photo.naturalHeight,
      canvas.width,
      photoBoxH,
    );
    ctx.drawImage(photo, drawX, drawY + 20, drawW, drawH);
  }

  // Reset any previously-applied transform before measuring; otherwise the
  // returned bounding rect reflects the last transform we wrote.
  card.style.transform = "";
  const rect = card.getBoundingClientRect();
  const x = (canvas.width - rect.width) / 2;
  const y = canvas.height - rect.height - 48;
  const transform = ctx.drawElementImage(card, x, y);
  card.style.transform = transform.toString();

  if (renderCount <= 2) {
    const cssRect = canvas.getBoundingClientRect();
    console.log(
      `[spike] render #${renderCount}: bitmap=${canvas.width}×${canvas.height}  ` +
        `css=${cssRect.width.toFixed(0)}×${cssRect.height.toFixed(0)}  ` +
        `card=${rect.width.toFixed(0)}×${rect.height.toFixed(0)}  ` +
        `drawAt=(${x.toFixed(0)}, ${y.toFixed(0)})`,
    );
  }

  if (!firstPreviewLogged) {
    firstPreviewLogged = true;
    logCheck("preview", true, `renderCount=${renderCount}`);
  }
}

function schedulePreview() {
  if (rafHandle) return;
  rafHandle = requestAnimationFrame(() => {
    rafHandle = 0;
    try {
      renderPreview();
    } catch (err) {
      console.error("[spike] renderPreview threw", err);
      logCheck("preview", false, String(err));
    }
  });
}

// Belt-and-suspenders: also bind the paint event in case this Chrome build
// does fire it. If it does, we'll see paintEventCount > 0 in the console.
canvas.addEventListener("paint", () => {
  paintEventCount += 1;
  if (paintEventCount === 1) {
    console.log("[spike] paint event fired (count will grow if reactive)");
  }
  renderPreview();
});
// Initial render once layout settles.
if (supported) {
  requestAnimationFrame(() => requestAnimationFrame(schedulePreview));
  // If Chrome also fires paint, this is a no-op; otherwise this is the only
  // thing that draws the first frame.
}

// ─── Check 3: dynamic updates ────────────────────────────────────────────────
function wireInput(input, targetId) {
  const target = document.getElementById(targetId);
  input.addEventListener("input", () => {
    target.textContent = input.value;
    schedulePreview();
    if (!firstDynamicLogged) {
      firstDynamicLogged = true;
      logCheck("dynamic", true, "imperative scheduling on input");
    }
  });
}

wireInput(titleInput, "fTitle");
wireInput(apertureInput, "fAperture");
wireInput(shutterInput, "fShutter");
wireInput(isoInput, "fIso");
wireInput(lensInput, "fLens");

// ─── File input: load a photo and resize canvas to its aspect ────────────────
fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  const img = new Image();
  img.decoding = "async";
  img.src = URL.createObjectURL(file);
  await img.decode();
  photo = img;

  // Keep bitmap modest so the canvas fits viewport at 1:1 CSS. See the comment
  // in spike.html about layoutsubtree layout space.
  const longEdge = 900;
  const aspect = img.naturalWidth / img.naturalHeight;
  if (aspect >= 1) {
    canvas.width = longEdge;
    canvas.height = Math.round(longEdge / aspect);
  } else {
    canvas.height = longEdge;
    canvas.width = Math.round(longEdge * aspect);
  }

  schedulePreview();
});

// ─── Checks 4 & 5: export via hidden offscreen-in-DOM canvas ─────────────────
async function exportAtScale(scale) {
  if (!supported) {
    alert(
      "HTML-in-Canvas not supported. Enable chrome://flags/#canvas-draw-element in Chrome Canary.",
    );
    return;
  }
  if (!photo) {
    alert("Pick a photo first.");
    return;
  }

  // A hidden host in the real DOM tree.
  // OffscreenCanvas cannot have child elements, so layoutsubtree requires a
  // real <canvas> placed somewhere in the document.
  const host = document.createElement("div");
  host.style.cssText =
    "position:fixed;left:-99999px;top:0;pointer-events:none;opacity:0;contain:size layout style;";

  const hiddenCanvas = document.createElement("canvas");
  hiddenCanvas.setAttribute("layoutsubtree", "");
  hiddenCanvas.width = canvas.width * scale;
  hiddenCanvas.height = canvas.height * scale;

  // Clone the live preview card — this carries the user's current text edits.
  const hiddenCard = card.cloneNode(true);
  hiddenCard.removeAttribute("id");
  // Descendant ids would collide with the live DOM; strip them.
  for (const el of hiddenCard.querySelectorAll("[id]")) el.removeAttribute("id");
  // The card is wired to scale via CSS custom property --scale: everything is
  // calc(Npx * var(--scale)). No JS walking needed, no getComputedStyle, no
  // inline overrides. This is the cleanest way to get a true physical-pixel
  // resize, which is what drawElementImage rasterizes.
  hiddenCard.style.setProperty("--scale", String(scale));

  hiddenCanvas.append(hiddenCard);
  host.append(hiddenCanvas);
  document.body.append(host);

  // Let the browser lay out the subtree.
  await new Promise((r) => requestAnimationFrame(r));
  await new Promise((r) => requestAnimationFrame(r));

  const hctx = hiddenCanvas.getContext("2d");
  hctx.reset();
  hctx.fillStyle = "#1a1918";
  hctx.fillRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);

  const photoBoxH = hiddenCanvas.height * 0.78;
  const fitted = fitContain(photo.naturalWidth, photo.naturalHeight, hiddenCanvas.width, photoBoxH);
  hctx.drawImage(photo, fitted.drawX, fitted.drawY + 20 * scale, fitted.drawW, fitted.drawH);

  const rect = hiddenCard.getBoundingClientRect();
  const cx = (hiddenCanvas.width - rect.width) / 2;
  const cy = hiddenCanvas.height - rect.height - 48 * scale;
  hctx.drawElementImage(hiddenCard, cx, cy);

  const blob = await new Promise((resolve) => hiddenCanvas.toBlob(resolve, "image/png"));

  if (blob && blob.size > 0) {
    logCheck("toBlob", true, `${(blob.size / 1024).toFixed(1)} KB`);
    if (scale >= 2) {
      logCheck(
        "dpr",
        true,
        `${scale}x export (${rect.width.toFixed(0)}×${rect.height.toFixed(0)} card)`,
      );
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spike-${scale}x.png`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    logCheck("toBlob", false, "blob empty — drawElementImage may have failed");
  }

  host.remove();
}

document.getElementById("export1x").addEventListener("click", () => exportAtScale(1));
document.getElementById("export2x").addEventListener("click", () => exportAtScale(2));
document.getElementById("export3x").addEventListener("click", () => exportAtScale(3));
