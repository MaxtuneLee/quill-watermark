import type { WatermarkTemplate } from "../types";
import { defaultTemplateSchema, pickTemplateFieldGroups } from "./shared";

export const quietWhiteMarginTemplate: WatermarkTemplate = {
  id: "quiet-white-margin",
  name: "Quiet White Margin",
  family: "Minimal White Space",
  description: "Places a subtle label in a preserved white margin with minimal contrast.",
  coverImage: "/templates/minimal.jpeg",
  aspectSupport: ["1:1", "4:5", "3:2"],
  tags: ["minimal", "margin"],
  layout: {
    zone: "margin-bottom",
    textAlign: "left",
  },
  presets: {
    opacity: 0.55,
    textScale: 0.9,
    padding: 26,
    backgroundStrength: 0.12,
    align: "start",
  },
  schema: defaultTemplateSchema,
  fieldGroups: pickTemplateFieldGroups(["shot-time", "location", "author", "brand-mark"]),
  controls: [
    { id: "brandLine", label: "Brand line", type: "text", defaultValue: "Quill Journal" },
    { id: "metaLine", label: "Meta line", type: "text", defaultValue: "Issue 018" },
    { id: "showDivider", label: "Show divider", type: "toggle", defaultValue: true },
  ],
};
