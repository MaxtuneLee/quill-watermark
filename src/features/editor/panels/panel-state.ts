import type { WatermarkTemplate } from "../../../template-engine/types";
import type { TemplateLayoutNode } from "../../../template-engine/types";

export type OutputRatio = "original" | "1:1" | "4:5" | "3:2" | "16:9" | "9:16";
export type SurfaceStyle = "none" | "border" | "shadow" | "border-shadow";
export type TypographyTheme = "signature" | "editorial" | "mono";
export type BrandPosition = "bottom-left" | "bottom-right" | "center";
export type MetadataOrder = "capture-first" | "brand-first";
export type ExportFormat = "png" | "jpeg" | "webp";
export type ExportMultiplier = 1 | 2 | 3;

export interface StylePanelValues {
  outputRatio: OutputRatio;
  imageFit: "cover" | "contain";
  canvasPadding: number;
  cornerRadius: number;
  surfaceStyle: SurfaceStyle;
  typographyTheme: TypographyTheme;
  brandPosition: BrandPosition;
  metadataOrder: MetadataOrder;
}

export interface ExportPanelValues {
  format: ExportFormat;
  multiplier: ExportMultiplier;
}

function findPhotoNode(layout: TemplateLayoutNode): TemplateLayoutNode | null {
  if (layout.type === "image" && layout.binding === "photo") {
    return layout;
  }

  if (layout.type === "text" || layout.type === "image") {
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

function resolveCanvasPadding(template: WatermarkTemplate): number {
  const { padding } = template.canvas;

  return typeof padding === "number" ? padding : Math.max(padding.x, padding.y);
}

function resolveImageFit(template: WatermarkTemplate): "cover" | "contain" {
  const photoNode = findPhotoNode(template.layout);

  return photoNode?.type === "image" ? (photoNode.fit ?? "cover") : "cover";
}

export function createInitialControlValues(template: WatermarkTemplate): StylePanelValues {
  return {
    outputRatio: "original",
    imageFit: resolveImageFit(template),
    canvasPadding: resolveCanvasPadding(template),
    cornerRadius: 18,
    surfaceStyle: template.family === "Card Frame" ? "border-shadow" : "shadow",
    typographyTheme: template.family === "Minimal White Space" ? "editorial" : "signature",
    brandPosition: template.family === "Center Brand" ? "center" : "bottom-left",
    metadataOrder: "capture-first",
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
  { label: "Bottom Left", value: "bottom-left" },
  { label: "Bottom Right", value: "bottom-right" },
  { label: "Centered", value: "center" },
];

export const metadataOrderOptions: ReadonlyArray<{
  label: string;
  value: MetadataOrder;
}> = [
  { label: "Capture First", value: "capture-first" },
  { label: "Brand First", value: "brand-first" },
];

export const surfaceStyleOptions: ReadonlyArray<{
  label: string;
  value: SurfaceStyle;
}> = [
  { label: "None", value: "none" },
  { label: "Border", value: "border" },
  { label: "Shadow", value: "shadow" },
  { label: "Border + Shadow", value: "border-shadow" },
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
