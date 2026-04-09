import type { WatermarkTemplate } from "../types";
import { defaultTemplateSchema, pickTemplateFieldGroups } from "./shared";

export const centeredDeviceMarkTemplate: WatermarkTemplate = {
  id: "centered-device-mark",
  name: "Centered Device Mark",
  family: "Center Brand",
  description: "Single center lockup focused on a clean camera/device mark.",
  coverImage: "/templates/centerlogo.jpg",
  aspectSupport: ["1:1", "4:5", "16:9"],
  tags: ["logo-first", "centered"],
  layout: {
    zone: "center-mark",
    textAlign: "center",
  },
  presets: {
    opacity: 0.73,
    textScale: 1.08,
    padding: 20,
    backgroundStrength: 0.42,
    align: "center",
  },
  schema: defaultTemplateSchema,
  fieldGroups: pickTemplateFieldGroups(["camera-model", "shooting-parameters", "author"]),
  controls: [
    { id: "brandLine", label: "Brand line", type: "text", defaultValue: "Shot on QuillCam X" },
    {
      id: "fontStyle",
      label: "Font style",
      type: "select",
      defaultValue: "mono",
      options: [
        { label: "Mono", value: "mono" },
        { label: "Serif", value: "serif" },
      ],
    },
    { id: "showDivider", label: "Show divider", type: "toggle", defaultValue: false },
  ],
};
