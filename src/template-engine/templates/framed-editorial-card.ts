import type { WatermarkTemplate } from "../types";
import { defaultTemplateSchema, pickTemplateFieldGroups } from "./shared";

export const framedEditorialCardTemplate: WatermarkTemplate = {
  id: "framed-editorial-card",
  name: "Framed Editorial Card",
  family: "Card Frame",
  description: "Editorial frame with inset content and a compact credit block.",
  coverImage: "/templates/normal.jpg",
  aspectSupport: ["1:1", "4:5", "3:2", "16:9"],
  tags: ["editorial", "frame"],
  layout: {
    zone: "editorial-card",
    textAlign: "left",
  },
  presets: {
    opacity: 0.8,
    textScale: 0.96,
    padding: 22,
    backgroundStrength: 0.48,
    align: "start",
  },
  schema: defaultTemplateSchema,
  fieldGroups: pickTemplateFieldGroups([
    "camera-model",
    "shooting-parameters",
    "shot-time",
    "location",
    "author",
    "brand-mark",
  ]),
  controls: [
    { id: "titleLine", label: "Title line", type: "text", defaultValue: "After Rain" },
    {
      id: "frameTone",
      label: "Frame tone",
      type: "select",
      defaultValue: "warm",
      options: [
        { label: "Warm", value: "warm" },
        { label: "Neutral", value: "neutral" },
        { label: "Cool", value: "cool" },
      ],
    },
    { id: "showShadow", label: "Show shadow", type: "toggle", defaultValue: false },
  ],
};
