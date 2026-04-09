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

export interface TemplateLayout {
  zone: TemplateLayoutZone;
  textAlign: "left" | "center" | "right";
}

export interface TemplatePreset {
  opacity: number;
  textScale: number;
  padding: number;
  backgroundStrength: number;
  align: "start" | "center" | "end";
}

export interface TemplateControlOption {
  label: string;
  value: string;
}

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

export type TemplateControl =
  | TemplateTextControl
  | TemplateToggleControl
  | TemplateSliderControl
  | TemplateSelectControl;

export interface WatermarkTemplate {
  id: string;
  name: string;
  family: TemplateFamily;
  description: string;
  coverImage: string;
  aspectSupport: readonly TemplateAspect[];
  tags: readonly string[];
  layout: TemplateLayout;
  presets: TemplatePreset;
  schema: TemplateFieldSchema;
  fieldGroups: readonly TemplateFieldGroup[];
  controls: readonly TemplateControl[];
}
