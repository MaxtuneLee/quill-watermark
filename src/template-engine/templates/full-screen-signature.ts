import type { WatermarkTemplate } from "../types";
import {
  createTemplateCanvas,
  createTemplatePresets,
  createImageNode,
  createTextNode,
  extendTemplateSchema,
  pickTemplateFieldGroups,
} from "./shared";

export const fullScreenSignatureTemplate: WatermarkTemplate = {
  id: "full-screen-signature",
  name: "Full Screen Signature",
  family: "Full Overlay",
  description: "Large signature treatment intended for hero imagery and splash shots.",
  coverImage: "/templates/fullscreen.jpg",
  aspectSupport: ["1:1", "4:5", "16:9", "9:16"],
  tags: ["bold", "hero"],
  canvas: createTemplateCanvas(32),
  layout: {
    id: "root",
    type: "overlay",
    align: "center",
    justify: "center",
    children: [
      createImageNode("photo", "cover"),
      createTextNode("signature", "signatureLine", '32px "Helvetica Neue"', "center", 2),
    ],
  },
  presets: createTemplatePresets(["1:1", "4:5", "16:9", "9:16"]),
  schema: extendTemplateSchema({
    signatureLine: {
      kind: "text",
      source: "brand",
      path: "signature",
      editable: true,
      placeholder: "crafted by quill",
    },
  }),
  fieldGroups: pickTemplateFieldGroups(["location", "author", "brand-mark"]),
  controls: [
    {
      id: "signatureLine",
      label: "Signature line",
      type: "text",
      defaultValue: "crafted by quill",
    },
    {
      id: "grainAmount",
      label: "Grain amount",
      type: "slider",
      defaultValue: 0.2,
      min: 0,
      max: 1,
      step: 0.05,
    },
    { id: "showShadow", label: "Show shadow", type: "toggle", defaultValue: true },
  ],
};
