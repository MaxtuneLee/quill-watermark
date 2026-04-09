import type { ResolvedTemplatePreset, WatermarkTemplate } from "../types";

function buildOriginalPreset(template: WatermarkTemplate): ResolvedTemplatePreset {
  return {
    id: "original",
    label: "Original",
    canvas: template.canvas,
    overrides: [],
  };
}

export function resolvePreset(
  template: WatermarkTemplate,
  presetId: string,
): ResolvedTemplatePreset {
  const originalPreset = template.presets.find((preset) => preset.id === "original");
  const selectedPreset =
    template.presets.find((preset) => preset.id === presetId) ?? originalPreset ?? null;

  if (selectedPreset === null) {
    return buildOriginalPreset(template);
  }

  return {
    id: selectedPreset.id,
    label: selectedPreset.label,
    canvas: {
      background: selectedPreset.canvas.background ?? template.canvas.background,
      padding: selectedPreset.canvas.padding ?? template.canvas.padding,
      aspectRatio: selectedPreset.canvas.aspectRatio ?? null,
    },
    overrides: [...selectedPreset.overrides],
  };
}
