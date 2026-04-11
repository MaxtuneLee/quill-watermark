import type { WatermarkTemplate } from "../types";
import { centeredBrandMetaTemplate } from "./centered-brand-meta";
import { centeredDeviceMarkTemplate } from "./centered-device-mark";
import { classicInfoStripTemplate } from "./classic-info-strip";
import { minimalInfoStripTemplate } from "./minimal-info-strip";

export const templates: readonly WatermarkTemplate[] = [
  classicInfoStripTemplate,
  minimalInfoStripTemplate,
  centeredDeviceMarkTemplate,
  centeredBrandMetaTemplate,
];

export type {
  TemplateAspect,
  TemplateControl,
  TemplateControlType,
  TemplateFamily,
  TemplateLayout,
  TemplateLayoutZone,
  TemplatePreset,
  WatermarkTemplate,
} from "../types";
