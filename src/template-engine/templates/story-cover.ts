import type { WatermarkTemplate } from "../types";
import { defaultTemplateSchema, pickTemplateFieldGroups } from "./shared";

export const storyCoverTemplate: WatermarkTemplate = {
  id: "story-cover",
  name: "Story Cover",
  family: "Social Cover",
  description: "A portrait-first cover composition made for social story exports.",
  coverImage: "/templates/blur.jpg",
  aspectSupport: ["9:16", "4:5"],
  tags: ["social", "portrait"],
  layout: {
    zone: "story-cover",
    textAlign: "center",
  },
  presets: {
    opacity: 0.82,
    textScale: 1.16,
    padding: 28,
    backgroundStrength: 0.58,
    align: "center",
  },
  schema: defaultTemplateSchema,
  fieldGroups: pickTemplateFieldGroups(["location", "author", "brand-mark"]),
  controls: [
    { id: "titleLine", label: "Title line", type: "text", defaultValue: "Coastal Diary" },
    { id: "subtitleLine", label: "Subtitle line", type: "text", defaultValue: "Hong Kong, 2026" },
    { id: "showBackdrop", label: "Show backdrop", type: "toggle", defaultValue: true },
  ],
};
