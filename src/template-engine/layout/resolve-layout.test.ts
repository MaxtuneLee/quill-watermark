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
  expect(result.nodes.photo.contentBox.width).toBeGreaterThanOrEqual(
    result.nodes.photo.frame.width,
  );
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

test("keeps space-between children inside bounds when a column child contains fill text", () => {
  const result = resolveLayout({
    canvas: { width: 900, height: 180, padding: 0 },
    layout: {
      id: "footer-strip",
      type: "container",
      direction: "row",
      width: "fill",
      justifyContent: "space-between",
      alignItems: "center",
      padding: { x: 22, y: 18 },
      children: [
        {
          id: "copy",
          type: "container",
          direction: "column",
          gap: 2,
          children: [
            {
              id: "brand",
              type: "text",
              binding: "brandLine",
              font: '18px "Helvetica Neue"',
              lineHeight: 24,
              align: "left",
              width: "fill",
              maxLines: 1,
            },
            {
              id: "camera",
              type: "text",
              binding: "cameraModel",
              font: '12px "Helvetica Neue"',
              lineHeight: 16,
              align: "left",
              width: 240,
              maxLines: 1,
            },
          ],
        },
        {
          id: "logo",
          type: "image",
          binding: "cameraBrandLogo",
          fit: "contain",
          intrinsicSize: { width: 50, height: 50 },
          width: 50,
          height: 50,
        },
      ],
    },
    resolvedFields: {
      brandLine: { value: "Quill Studio", mode: "manual" },
      cameraModel: { value: "iPhone 14 Pro", mode: "auto" },
      cameraBrandLogo: { value: "apple", mode: "auto" },
    },
  });

  expect(result.nodes.logo.frame.x).toBeGreaterThan(result.nodes.camera.frame.x);
  expect(result.nodes.logo.frame.x + result.nodes.logo.frame.width).toBeLessThanOrEqual(878);
});
