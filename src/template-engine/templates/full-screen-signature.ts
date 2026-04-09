import type { WatermarkTemplate } from "../types";
import { defaultTemplateSchema, pickTemplateFieldGroups } from "./shared";

export const fullScreenSignatureTemplate: WatermarkTemplate = {
  id: "full-screen-signature",
  name: "Full Screen Signature",
  family: "Full Overlay",
  description: "Large signature treatment intended for hero imagery and splash shots.",
  coverImage: "/templates/fullscreen.jpg",
  aspectSupport: ["1:1", "4:5", "16:9", "9:16"],
  tags: ["bold", "hero"],
  layout: {
    zone: "full-overlay",
    textAlign: "center",
  },
  presets: {
    opacity: 0.9,
    textScale: 1.22,
    padding: 32,
    backgroundStrength: 0.74,
    align: "center",
  },
  schema: defaultTemplateSchema,
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
