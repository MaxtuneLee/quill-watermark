import type { WatermarkTemplate } from "../types";
import {
  createBoundImageNode,
  createTemplateCanvas,
  createTemplatePresets,
  extendTemplateSchema,
} from "./shared";

export const centeredDeviceMarkTemplate: WatermarkTemplate = {
  id: "centered-device-mark",
  name: "Centered Device Mark",
  family: "Center Brand",
  description: "Single center lockup focused on a clean camera/device mark.",
  coverImage: "/templates/centerlogo.jpg",
  aspectSupport: ["1:1", "4:5", "16:9"],
  tags: ["logo-first", "centered"],
  canvas: createTemplateCanvas(20),
  layout: {
    id: "root",
    type: "overlay",
    align: "center",
    justify: "center",
    children: [
      {
        id: "photo",
        type: "image",
        binding: "photo",
        fit: "cover",
        intrinsicSize: { width: 1600, height: 900 },
        width: "fill",
        height: "fill",
        flexGrow: 1,
      },
      createBoundImageNode("camera-brand-logo", "cameraBrandLogo", "contain", 104, 104),
    ],
  },
  presets: createTemplatePresets(["1:1", "4:5", "16:9"]),
  schema: extendTemplateSchema({
    cameraBrandLogo: {
      kind: "image",
      source: "derived",
      path: "cameraBrandLogo",
      editable: false,
    },
  }),
  fieldGroups: [
    {
      id: "brand-mark",
      title: "Brand Mark",
      bindings: ["cameraBrandLogo"],
      requiredByTemplate: true,
    },
  ],
  controls: [],
};
