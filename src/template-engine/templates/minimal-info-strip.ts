import type { WatermarkTemplate } from "../types";
import {
  createTemplateCanvas,
  createTemplateLayout,
  createTemplatePresets,
  defaultTemplateSchema,
  pickTemplateFieldGroups,
} from "./shared";

export const minimalInfoStripTemplate: WatermarkTemplate = {
  id: "minimal-info-strip",
  name: "Minimal Info Strip",
  family: "Info Bar",
  description: "A slim strip with restrained spacing for subtle credit lines.",
  coverImage: "/templates/minimal.jpeg",
  aspectSupport: ["1:1", "4:5", "3:2"],
  tags: ["minimal", "light"],
  canvas: createTemplateCanvas(18),
  layout: createTemplateLayout("top-strip", "right"),
  presets: createTemplatePresets(["1:1", "4:5", "3:2"]),
  schema: defaultTemplateSchema,
  fieldGroups: pickTemplateFieldGroups([
    "camera-model",
    "shooting-parameters",
    "author",
    "brand-mark",
  ]),
  controls: [
    { id: "brandLine", label: "Brand line", type: "text", defaultValue: "Quill Studio" },
    { id: "metaLine", label: "Meta line", type: "text", defaultValue: "Film simulation" },
    {
      id: "lineWeight",
      label: "Line weight",
      type: "slider",
      defaultValue: 1,
      min: 0.5,
      max: 2,
      step: 0.1,
    },
  ],
};
