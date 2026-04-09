import type { WatermarkTemplate } from "../types";
import {
  createTemplateCanvas,
  createTemplateLayout,
  createTemplatePresets,
  defaultTemplateSchema,
  pickTemplateFieldGroups,
} from "./shared";

export const centeredBrandMetaTemplate: WatermarkTemplate = {
  id: "centered-brand-meta",
  name: "Centered Brand + Meta",
  family: "Center Brand",
  description: "Centered two-line mark pairing brand name and photo metadata.",
  coverImage: "/templates/centerlogotext.jpg",
  aspectSupport: ["1:1", "4:5", "3:2", "16:9"],
  tags: ["brand", "metadata"],
  canvas: createTemplateCanvas(24),
  layout: createTemplateLayout("center-stack", "center"),
  presets: createTemplatePresets(["1:1", "4:5", "3:2", "16:9"]),
  schema: defaultTemplateSchema,
  fieldGroups: pickTemplateFieldGroups([
    "camera-model",
    "shooting-parameters",
    "author",
    "brand-mark",
  ]),
  controls: [
    { id: "brandLine", label: "Brand line", type: "text", defaultValue: "QUILL STUDIO" },
    { id: "metaLine", label: "Meta line", type: "text", defaultValue: "35mm • f/2 • ISO 200" },
    { id: "showBackground", label: "Show background", type: "toggle", defaultValue: true },
  ],
};
