import type { WatermarkTemplate } from "../types";
import { defaultTemplateSchema, pickTemplateFieldGroups } from "./shared";

export const classicInfoStripTemplate: WatermarkTemplate = {
  id: "classic-info-strip",
  name: "Classic Info Strip",
  family: "Info Bar",
  description: "A balanced lower-third bar for brand and capture metadata.",
  coverImage: "/templates/normal.jpg",
  aspectSupport: ["1:1", "4:5", "16:9"],
  tags: ["balanced", "signature"],
  layout: {
    zone: "bottom-strip",
    textAlign: "left",
  },
  presets: {
    opacity: 0.84,
    textScale: 1,
    padding: 24,
    backgroundStrength: 0.68,
    align: "start",
  },
  schema: defaultTemplateSchema,
  fieldGroups: pickTemplateFieldGroups([
    "camera-model",
    "shooting-parameters",
    "location",
    "author",
    "brand-mark",
  ]),
  controls: [
    { id: "brandLine", label: "Brand line", type: "text", defaultValue: "Shot on Quill" },
    { id: "metaLine", label: "Meta line", type: "text", defaultValue: "@quillstudio" },
    { id: "showBackground", label: "Show background", type: "toggle", defaultValue: true },
  ],
};
