import { expect, test, vi } from "vite-plus/test";
import { renderCanvas } from "./render-canvas";

test("draws background, image, and text in the expected order", async () => {
  const callOrder: string[] = [];
  const fillRect = vi.fn(() => {
    callOrder.push("fillRect");
  });
  const drawImage = vi.fn(() => {
    callOrder.push("drawImage");
  });
  const fillText = vi.fn(() => {
    callOrder.push("fillText");
  });

  const ctx = {
    fillRect,
    drawImage,
    fillText,
    save: vi.fn(),
    restore: vi.fn(),
  } as unknown as CanvasRenderingContext2D;

  await renderCanvas(ctx, {
    canvas: { width: 1200, height: 1500, background: "#111111" },
    nodes: [
      {
        type: "image",
        frame: { x: 0, y: 0, width: 100, height: 100 },
        source: {} as CanvasImageSource,
      },
      { type: "text", frame: { x: 0, y: 120, width: 300, height: 24 }, value: "Leica Q2" },
    ],
  });

  expect(fillRect).toHaveBeenCalled();
  expect(drawImage).toHaveBeenCalled();
  expect(fillText).toHaveBeenCalledWith("Leica Q2", expect.any(Number), expect.any(Number));
  expect(callOrder).toEqual(["fillRect", "drawImage", "fillText"]);
});

test("applies retained surface styling inside the rendered canvas", async () => {
  const beginPath = vi.fn();
  const roundRect = vi.fn();
  const clip = vi.fn();
  const stroke = vi.fn();
  const fill = vi.fn();
  const drawImage = vi.fn();
  const ctx = {
    beginPath,
    roundRect,
    clip,
    stroke,
    fill,
    drawImage,
    fillText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    fillRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D;

  await renderCanvas(ctx, {
    canvas: {
      width: 1200,
      height: 1500,
      background: "#111111",
      cornerRadius: 24,
      surfaceStyle: "border-shadow",
    },
    nodes: [
      {
        type: "image",
        frame: { x: 20, y: 20, width: 100, height: 100 },
        source: {} as CanvasImageSource,
      },
    ],
  });

  expect(roundRect).toHaveBeenCalled();
  expect(clip).toHaveBeenCalled();
  expect(fill).toHaveBeenCalled();
  expect(stroke).toHaveBeenCalled();
  expect(drawImage).toHaveBeenCalled();
});
