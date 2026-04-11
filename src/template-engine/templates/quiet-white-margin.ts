import type { WatermarkTemplate } from "../types";
import {
  createTemplateCanvas,
  createTemplatePresets,
  createImageNode,
  createTextNode,
  extendTemplateSchema,
  pickTemplateFieldGroups,
} from "./shared";

export const quietWhiteMarginTemplate: WatermarkTemplate = {
  id: "quiet-white-margin",
  name: "Quiet White Margin",
  family: "Minimal White Space",
  description: "Places a subtle label in a preserved white margin with minimal contrast.",
  coverImage: "/templates/minimal.jpeg",
  aspectSupport: ["1:1", "4:5", "3:2"],
  tags: ["minimal", "margin"],
  canvas: createTemplateCanvas(26, "#faf7f2"),
  layout: {
    id: "root",
    type: "stack",
    direction: "column",
    gap: 14,
    children: [
      createImageNode("photo", "contain"),
      createTextNode("brand", "brandLine", '20px "Helvetica Neue"', "left", 1),
      createTextNode("meta", "metaLine", '18px "Helvetica Neue"', "left", 1),
    ],
  },
  presets: createTemplatePresets(["1:1", "4:5", "3:2"]),
  schema: extendTemplateSchema({
    metaLine: {
      kind: "text",
      source: "brand",
      path: "journalIssue",
      editable: true,
      placeholder: "Issue 018",
    },
  }),
  fieldGroups: pickTemplateFieldGroups(["shot-time", "location", "author", "brand-mark"]),
  controls: [
    { id: "brandLine", label: "Brand line", type: "text", defaultValue: "Quill Journal" },
    { id: "metaLine", label: "Meta line", type: "text", defaultValue: "Issue 018" },
    { id: "showDivider", label: "Show divider", type: "toggle", defaultValue: true },
  ],
};
