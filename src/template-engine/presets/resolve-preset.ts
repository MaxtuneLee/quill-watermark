import type {
  ResolvedTemplatePreset,
  TemplateLayoutNode,
  TemplatePresetOverride,
  WatermarkTemplate,
} from "../types";

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

function applyOverrideToNode(
  node: TemplateLayoutNode,
  override: TemplatePresetOverride,
): TemplateLayoutNode {
  const nextNode =
    node.id === override.targetId ? ({ ...node, ...override.changes } as TemplateLayoutNode) : node;

  if (nextNode.type === "text" || nextNode.type === "image" || nextNode.type === "rect") {
    return nextNode;
  }

  return {
    ...nextNode,
    children: nextNode.children.map((child) => applyOverrideToNode(child, override)),
  };
}

export function applyPresetOverrides(
  layout: TemplateLayoutNode,
  overrides: readonly TemplatePresetOverride[],
): TemplateLayoutNode {
  return overrides.reduce(
    (currentLayout, override) => applyOverrideToNode(currentLayout, override),
    layout,
  );
}

export function resolvePresetLayout(
  template: WatermarkTemplate,
  presetId: string,
): { preset: ResolvedTemplatePreset; layout: TemplateLayoutNode } {
  const preset = resolvePreset(template, presetId);

  return {
    preset,
    layout: applyPresetOverrides(template.layout, preset.overrides),
  };
}
