import { expect, test } from "vite-plus/test";
import { classicInfoStripTemplate } from "../templates/classic-info-strip";
import { resolvePreset } from "./resolve-preset";

test("applies 4:5 overrides without cloning a second template", () => {
  const preset = resolvePreset(classicInfoStripTemplate, "4:5");

  expect(preset.id).toBe("4:5");
  expect(preset.canvas.aspectRatio).toEqual({ width: 4, height: 5 });
  expect(preset.overrides.length).toBeGreaterThan(0);
});

test("falls back to original when the requested preset is unavailable", () => {
  const preset = resolvePreset(classicInfoStripTemplate, "9:16");

  expect(preset.id).toBe("original");
  expect(preset.canvas.aspectRatio).toBeNull();
});
