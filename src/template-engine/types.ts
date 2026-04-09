export type TemplateFamily =
  | "Info Bar"
  | "Center Brand"
  | "Full Overlay"
  | "Minimal White Space"
  | "Social Cover"
  | "Card Frame";

export type TemplateAspect = "1:1" | "4:5" | "3:2" | "16:9" | "9:16";

export type TemplateLayoutZone =
  | "bottom-strip"
  | "top-strip"
  | "center-mark"
  | "center-stack"
  | "full-overlay"
  | "margin-bottom"
  | "story-cover"
  | "editorial-card";

export type TemplateControlType = "text" | "toggle" | "slider" | "select";
export type TemplateFieldKind = "text" | "image";
export type TemplateFieldSource = "exif" | "gps" | "user" | "derived" | "afilmory" | "brand";
export type ResolvedFieldMode = "auto" | "placeholder" | "manual";
export type LayoutDirection = "row" | "column";
export type LayoutAlign = "start" | "center" | "end" | "stretch";
export type TextAlign = "left" | "center" | "right";
export type LayoutScalar = number | "fill";
export type ImageFit = "cover" | "contain";

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IntrinsicSize {
  width: number;
  height: number;
}

export type CanvasPadding = number | Point;

export interface AspectRatioDefinition {
  width: number;
  height: number;
}

export interface TemplateCanvasDefinition {
  background: string;
  padding: CanvasPadding;
  aspectRatio: AspectRatioDefinition | null;
}

export interface TemplatePresetOverride {
  targetId: string;
  changes: Record<string, unknown>;
}

export interface TemplatePreset {
  id: "original" | TemplateAspect;
  label: string;
  canvas: Partial<TemplateCanvasDefinition> & {
    aspectRatio: AspectRatioDefinition | null;
  };
  overrides: readonly TemplatePresetOverride[];
}

export interface ResolvedTemplatePreset {
  id: "original" | TemplateAspect;
  label: string;
  canvas: TemplateCanvasDefinition;
  overrides: readonly TemplatePresetOverride[];
}

interface LayoutNodeBase {
  id: string;
}

export interface StackLayoutNode extends LayoutNodeBase {
  type: "stack";
  direction: LayoutDirection;
  children: readonly TemplateLayoutNode[];
  gap?: number;
  align?: LayoutAlign;
  padding?: CanvasPadding;
}

export interface OverlayLayoutNode extends LayoutNodeBase {
  type: "overlay";
  children: readonly TemplateLayoutNode[];
  align?: LayoutAlign;
  justify?: LayoutAlign;
  padding?: CanvasPadding;
}

export interface TextLayoutNode extends LayoutNodeBase {
  type: "text";
  binding: string;
  font: string;
  lineHeight: number;
  align?: TextAlign;
  width?: LayoutScalar;
  maxLines?: number;
  flexGrow?: number;
}

export interface ImageLayoutNode extends LayoutNodeBase {
  type: "image";
  binding: string;
  intrinsicSize: IntrinsicSize;
  fit?: ImageFit;
  width?: LayoutScalar;
  height?: LayoutScalar;
  flexGrow?: number;
  align?: LayoutAlign;
}

export type TemplateLayoutNode =
  | StackLayoutNode
  | OverlayLayoutNode
  | TextLayoutNode
  | ImageLayoutNode;

export type TemplateLayout = TemplateLayoutNode;

export type TemplateFormatRule =
  | {
      type: "trim";
    }
  | {
      type: "uppercase";
    }
  | {
      type: "lowercase";
    }
  | {
      type: "prefix";
      value: string;
    }
  | {
      type: "suffix";
      value: string;
    };

export interface TemplateFallbackRule {
  whenMissing: readonly string[];
  use: string;
}

export interface TemplateFieldDefinition {
  kind: TemplateFieldKind;
  source: TemplateFieldSource;
  path?: string;
  editable: boolean;
  placeholder?: string;
  format?: readonly TemplateFormatRule[];
  fallback?: readonly TemplateFallbackRule[];
}

export interface TemplateFieldSchema {
  fields: Record<string, TemplateFieldDefinition>;
}

export interface TemplateFieldGroup {
  id: string;
  title: string;
  bindings: readonly string[];
  requiredByTemplate?: boolean;
}

export interface TemplateFieldSources {
  exif: Record<string, unknown>;
  gps: Record<string, unknown>;
  user: Record<string, unknown>;
  derived: Record<string, unknown>;
  afilmory: Record<string, unknown>;
  brand: Record<string, unknown>;
}

export type FieldOverrideMap = Record<string, string | null | undefined>;

export interface ResolveFieldsInput {
  schema: TemplateFieldSchema;
  sources: TemplateFieldSources;
  overrides: FieldOverrideMap;
}

export interface ResolvedField {
  kind: TemplateFieldKind;
  source: TemplateFieldSource;
  editable: boolean;
  mode: ResolvedFieldMode;
  value: string | null;
}

export type ResolvedFieldMap = Record<string, ResolvedField>;

export interface TemplateDataCard {
  id: string;
  title: string;
  bindings: readonly string[];
  enabled: boolean;
  mode: ResolvedFieldMode;
  previewValue: string | null;
  editable: boolean;
  requiredByTemplate: boolean;
}

export interface CreateDataCardsInput {
  groups: readonly TemplateFieldGroup[];
  resolvedFields: ResolvedFieldMap;
}

interface TemplateControlBase<TType extends TemplateControlType> {
  id: string;
  label: string;
  type: TType;
}

export interface TemplateTextControl extends TemplateControlBase<"text"> {
  defaultValue: string;
}

export interface TemplateToggleControl extends TemplateControlBase<"toggle"> {
  defaultValue: boolean;
}

export interface TemplateSliderControl extends TemplateControlBase<"slider"> {
  defaultValue: number;
  min: number;
  max: number;
  step: number;
}

export interface TemplateSelectControl extends TemplateControlBase<"select"> {
  defaultValue: string;
  options: readonly TemplateControlOption[];
}

export interface TemplateControlOption {
  label: string;
  value: string;
}

export type TemplateControl =
  | TemplateTextControl
  | TemplateToggleControl
  | TemplateSliderControl
  | TemplateSelectControl;

export interface ResolveLayoutCanvas {
  width: number;
  height: number;
  padding: CanvasPadding;
  background?: string;
}

export interface ResolveLayoutInput {
  canvas: ResolveLayoutCanvas;
  layout: TemplateLayoutNode;
  resolvedFields: Record<
    string,
    {
      value: string | null;
      mode: ResolvedFieldMode;
    }
  >;
}

export interface MeasuredTextBlock {
  lines: string[];
  width: number;
  height: number;
  didTruncate: boolean;
}

interface ResolvedLayoutLeafBase {
  id: string;
  type: "image" | "text";
  binding: string;
  frame: Rect;
  contentBox: Rect;
  align?: TextAlign;
  font?: string;
  lineHeight?: number;
  text: MeasuredTextBlock;
}

export interface ResolvedImageLayoutNode extends ResolvedLayoutLeafBase {
  type: "image";
  fit: ImageFit;
  contentBox: Rect;
}

export interface ResolvedTextLayoutNode extends ResolvedLayoutLeafBase {
  type: "text";
  font: string;
  lineHeight: number;
  text: MeasuredTextBlock;
}

export interface ResolvedLayoutNode extends ResolvedLayoutLeafBase {
  fit?: ImageFit;
}

export interface ResolvedLayoutResult {
  safeBounds: Rect;
  nodes: Record<string, ResolvedLayoutNode>;
  drawOrder: readonly string[];
}

export interface WatermarkTemplate {
  id: string;
  name: string;
  family: TemplateFamily;
  description: string;
  coverImage: string;
  aspectSupport: readonly TemplateAspect[];
  tags: readonly string[];
  canvas: TemplateCanvasDefinition;
  layout: TemplateLayoutNode;
  presets: readonly TemplatePreset[];
  schema: TemplateFieldSchema;
  fieldGroups: readonly TemplateFieldGroup[];
  controls: readonly TemplateControl[];
}
