import type {
  EdgeInsets,
  TemplateLayoutNode,
  WatermarkTemplate,
} from "../../../template-engine/types";

export type OutputRatio = "original" | "1:1" | "4:5" | "3:2" | "16:9" | "9:16";
export type TypographyTheme = "signature" | "editorial" | "mono";
export type BrandPosition = "bottom-left" | "bottom-right" | "center";
export type ExportFormat = "png" | "jpeg" | "webp";
export type ExportMultiplier = 1 | 2 | 3;

export interface StylePanelValues {
  outputRatio: OutputRatio;
  imageFit: "cover" | "contain";
  canvasPaddingTop: number;
  canvasPaddingRight: number;
  canvasPaddingBottom: number;
  canvasPaddingLeft: number;
  canvasBackground: string;
  textColor: string;
  logoColor: string;
  logoScale: number;
  typographyTheme: TypographyTheme;
  brandPosition: BrandPosition;
}

export interface ExportPanelValues {
  format: ExportFormat;
  multiplier: ExportMultiplier;
}

export type StyleControlId = keyof StylePanelValues;
export type StyleControlValue = StylePanelValues[StyleControlId];
export const styleControlIds = [
  "outputRatio",
  "imageFit",
  "canvasPaddingTop",
  "canvasPaddingRight",
  "canvasPaddingBottom",
  "canvasPaddingLeft",
  "canvasBackground",
  "textColor",
  "logoColor",
  "logoScale",
  "typographyTheme",
  "brandPosition",
] as const satisfies readonly StyleControlId[];

export function isStyleControlId(value: string): value is StyleControlId {
  return styleControlIds.includes(value as StyleControlId);
}

function findPhotoNode(layout: TemplateLayoutNode): TemplateLayoutNode | null {
  if (layout.type === "image" && layout.binding === "photo") {
    return layout;
  }

  if (layout.type === "text" || layout.type === "image" || layout.type === "rect") {
    return null;
  }

  for (const child of layout.children) {
    const match = findPhotoNode(child);
    if (match) {
      return match;
    }
  }

  return null;
}

function resolveCanvasPadding(template: WatermarkTemplate): EdgeInsets {
  const { padding } = template.canvas;

  if (typeof padding === "number") {
    return {
      top: padding,
      right: padding,
      bottom: padding,
      left: padding,
    };
  }

  if ("x" in padding) {
    return {
      top: padding.y,
      right: padding.x,
      bottom: padding.y,
      left: padding.x,
    };
  }

  return padding;
}

function resolveImageFit(template: WatermarkTemplate): "cover" | "contain" {
  const photoNode = findPhotoNode(template.layout);

  return photoNode?.type === "image" ? (photoNode.fit ?? "cover") : "cover";
}

function hexToRgb(hexColor: string): { r: number; g: number; b: number } | null {
  const normalized = hexColor.trim();
  const shortMatch = /^#([\da-f]{3})$/i.exec(normalized);
  if (shortMatch) {
    const digits = shortMatch[1];
    return {
      r: Number.parseInt(`${digits[0]}${digits[0]}`, 16),
      g: Number.parseInt(`${digits[1]}${digits[1]}`, 16),
      b: Number.parseInt(`${digits[2]}${digits[2]}`, 16),
    };
  }

  const fullMatch = /^#([\da-f]{6})$/i.exec(normalized);
  if (!fullMatch) {
    return null;
  }

  const digits = fullMatch[1];
  return {
    r: Number.parseInt(digits.slice(0, 2), 16),
    g: Number.parseInt(digits.slice(2, 4), 16),
    b: Number.parseInt(digits.slice(4, 6), 16),
  };
}

function pickReadableColor(background: string): string {
  const rgb = hexToRgb(background);
  if (rgb === null) {
    return "#ffffff";
  }

  const perceivedLuma = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return perceivedLuma > 150 ? "#111111" : "#ffffff";
}

function findFirstNodeColor(
  layout: TemplateLayoutNode,
  predicate: (node: TemplateLayoutNode) => boolean,
): string | null {
  if (predicate(layout) && "color" in layout && typeof layout.color === "string") {
    return layout.color;
  }

  if (layout.type === "text" || layout.type === "image" || layout.type === "rect") {
    return null;
  }

  for (const child of layout.children) {
    const color = findFirstNodeColor(child, predicate);
    if (color !== null) {
      return color;
    }
  }

  return null;
}

export function createInitialControlValues(template: WatermarkTemplate): StylePanelValues {
  const padding = resolveCanvasPadding(template);
  const fallbackColor = pickReadableColor(template.canvas.background);
  const textColor =
    findFirstNodeColor(template.layout, (node) => node.type === "text") ?? fallbackColor;
  const logoColor =
    findFirstNodeColor(
      template.layout,
      (node) => node.type === "image" && node.binding !== "photo",
    ) ?? fallbackColor;
  return {
    outputRatio: "original",
    imageFit: resolveImageFit(template),
    canvasPaddingTop: padding.top,
    canvasPaddingRight: padding.right,
    canvasPaddingBottom: padding.bottom,
    canvasPaddingLeft: padding.left,
    canvasBackground: template.canvas.background,
    textColor,
    logoColor,
    logoScale: 1,
    typographyTheme: template.family === "Minimal White Space" ? "editorial" : "signature",
    brandPosition: template.family === "Center Brand" ? "center" : "bottom-left",
  };
}

export function createInitialCardEnabled(template: WatermarkTemplate): Record<string, boolean> {
  return Object.fromEntries(template.fieldGroups.map((group) => [group.id, true]));
}

export function createInitialExportValues(): ExportPanelValues {
  return {
    format: "png",
    multiplier: 1,
  };
}

export const typographyThemeOptions: ReadonlyArray<{
  label: string;
  value: TypographyTheme;
}> = [
  { label: "Signature", value: "signature" },
  { label: "Editorial", value: "editorial" },
  { label: "Mono", value: "mono" },
];

export const brandPositionOptions: ReadonlyArray<{
  label: string;
  value: BrandPosition;
}> = [
  { label: "Left", value: "bottom-left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "bottom-right" },
];

export const imageFillOptions: ReadonlyArray<{
  label: string;
  value: StylePanelValues["imageFit"];
}> = [
  { label: "Fill", value: "cover" },
  { label: "Fit", value: "contain" },
];

export const exportFormatOptions: ReadonlyArray<{
  label: string;
  value: ExportFormat;
}> = [
  { label: "PNG", value: "png" },
  { label: "JPEG", value: "jpeg" },
  { label: "WEBP", value: "webp" },
];

export const exportMultiplierOptions: ReadonlyArray<{
  label: string;
  value: ExportMultiplier;
}> = [
  { label: "1x", value: 1 },
  { label: "2x", value: 2 },
  { label: "3x", value: 3 },
];
