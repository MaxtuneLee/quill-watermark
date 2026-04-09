import type { WatermarkTemplate } from "../types";
import { centeredBrandMetaTemplate } from "./centered-brand-meta";
import { centeredDeviceMarkTemplate } from "./centered-device-mark";
import { classicInfoStripTemplate } from "./classic-info-strip";
import { framedEditorialCardTemplate } from "./framed-editorial-card";
import { fullScreenSignatureTemplate } from "./full-screen-signature";
import { minimalInfoStripTemplate } from "./minimal-info-strip";
import { quietWhiteMarginTemplate } from "./quiet-white-margin";
import { storyCoverTemplate } from "./story-cover";

export const templates: readonly WatermarkTemplate[] = [
  classicInfoStripTemplate,
  minimalInfoStripTemplate,
  centeredDeviceMarkTemplate,
  centeredBrandMetaTemplate,
  fullScreenSignatureTemplate,
  quietWhiteMarginTemplate,
  storyCoverTemplate,
  framedEditorialCardTemplate,
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
