import type { WatermarkTemplate } from "../types";
import {
  createTemplateCanvas,
  createTemplatePresets,
  createImageNode,
  createTextNode,
  extendTemplateSchema,
  pickTemplateFieldGroups,
} from "./shared";

export const storyCoverTemplate: WatermarkTemplate = {
  id: "story-cover",
  name: "Story Cover",
  family: "Social Cover",
  description: "A portrait-first cover composition made for social story exports.",
  coverImage: "/templates/blur.jpg",
  aspectSupport: ["9:16", "4:5"],
  tags: ["social", "portrait"],
  canvas: createTemplateCanvas(28),
  layout: {
    id: "root",
    type: "stack",
    direction: "column",
    align: "center",
    gap: 16,
    children: [
      createImageNode("photo", "cover", 900, 1600),
      createTextNode("title", "titleLine", '30px "Helvetica Neue"', "center", 2),
      createTextNode("subtitle", "subtitleLine", '20px "Helvetica Neue"', "center", 1),
    ],
  },
  presets: createTemplatePresets(["9:16", "4:5"]),
  schema: extendTemplateSchema({
    titleLine: {
      kind: "text",
      source: "brand",
      path: "storyTitle",
      editable: true,
      placeholder: "Coastal Diary",
    },
    subtitleLine: {
      kind: "text",
      source: "derived",
      path: "locationLine",
      editable: true,
      placeholder: "Hong Kong, 2026",
    },
  }),
  fieldGroups: pickTemplateFieldGroups(["location", "author", "brand-mark"]),
  controls: [
    { id: "titleLine", label: "Title line", type: "text", defaultValue: "Coastal Diary" },
    { id: "subtitleLine", label: "Subtitle line", type: "text", defaultValue: "Hong Kong, 2026" },
    { id: "showBackdrop", label: "Show backdrop", type: "toggle", defaultValue: true },
  ],
};
