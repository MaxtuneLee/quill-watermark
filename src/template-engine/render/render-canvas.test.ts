import { expect, test, vi } from "vite-plus/test";
import { renderCanvas } from "./render-canvas";

test("draws background, image, and text in the expected order", async () => {
  const fillRect = vi.fn();
  const drawImage = vi.fn();
  const fillText = vi.fn();

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
});
