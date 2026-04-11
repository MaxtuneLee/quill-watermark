import type { WatermarkTemplate } from "../types";
import {
  createTemplateCanvas,
  createTemplatePresets,
  createImageNode,
  createTextNode,
  extendTemplateSchema,
  pickTemplateFieldGroups,
} from "./shared";

export const framedEditorialCardTemplate: WatermarkTemplate = {
  id: "framed-editorial-card",
  name: "Framed Editorial Card",
  family: "Card Frame",
  description: "Editorial frame with inset content and a compact credit block.",
  coverImage: "/templates/normal.jpg",
  aspectSupport: ["1:1", "4:5", "3:2", "16:9"],
  tags: ["editorial", "frame"],
  canvas: createTemplateCanvas(22),
  layout: {
    id: "root",
    type: "stack",
    direction: "column",
    gap: 14,
    children: [
      createImageNode("photo", "contain"),
      createTextNode("title", "titleLine", '32px "Helvetica Neue"', "left", 1),
      createTextNode("details", "shootingParameters", '20px "Helvetica Neue"', "left"),
    ],
  },
  presets: createTemplatePresets(["1:1", "4:5", "3:2", "16:9"]),
  schema: extendTemplateSchema({
    titleLine: {
      kind: "text",
      source: "brand",
      path: "editorialTitle",
      editable: true,
      placeholder: "After Rain",
    },
  }),
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
