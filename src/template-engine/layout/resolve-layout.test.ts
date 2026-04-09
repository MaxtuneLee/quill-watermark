import { expect, test } from "vite-plus/test";
import { resolveLayout } from "./resolve-layout";

test("resolves cover image and metadata strip boxes inside the canvas", () => {
  const result = resolveLayout({
    canvas: { width: 1200, height: 1500, padding: 48 },
    layout: {
      id: "root",
      type: "stack",
      direction: "column",
      gap: 24,
      children: [
        {
          id: "photo",
          type: "image",
          binding: "photo",
          fit: "cover",
          intrinsicSize: { width: 1600, height: 900 },
          flexGrow: 1,
        },
        {
          id: "meta",
          type: "text",
          binding: "cameraSummary",
          maxLines: 2,
          font: "24px Helvetica Neue",
          lineHeight: 32,
        },
      ],
    },
    resolvedFields: {
      cameraSummary: { value: "ISO 200 • f/2.8 • 1/33 • 9 mm", mode: "auto" },
    },
  });

  expect(result.safeBounds).toEqual({
    x: 48,
    y: 48,
    width: 1104,
    height: 1404,
  });
  expect(result.nodes.photo.frame.width).toBeGreaterThan(0);
  expect(result.nodes.photo.contentBox.width).toBeGreaterThan(result.nodes.photo.frame.width);
  expect(result.nodes.meta.frame.y).toBeGreaterThan(result.nodes.photo.frame.y);
  expect(result.nodes.meta.text.lines.length).toBeGreaterThan(0);
});

test("truncates text to max lines and keeps layout within the padded canvas", () => {
  const result = resolveLayout({
    canvas: { width: 1080, height: 1080, padding: { x: 40, y: 60 } },
    layout: {
      id: "root",
      type: "stack",
      direction: "column",
      align: "center",
      children: [
        {
          id: "headline",
          type: "text",
          binding: "headline",
          maxLines: 2,
          font: "36px Helvetica Neue",
          lineHeight: 42,
          width: "fill",
        },
      ],
    },
    resolvedFields: {
      headline: {
        value:
          "This is a deliberately long line that should wrap, truncate, and remain bounded inside the safe canvas area for social output.",
        mode: "manual",
      },
    },
  });

  expect(result.nodes.headline.frame.x).toBeGreaterThanOrEqual(40);
  expect(result.nodes.headline.frame.y).toBeGreaterThanOrEqual(60);
  expect(result.nodes.headline.frame.width).toBeLessThanOrEqual(1000);
  expect(result.nodes.headline.text.lines.length).toBe(2);
  expect(result.nodes.headline.text.didTruncate).toBe(true);
});
