import type { WatermarkTemplate } from "../types";
import {
  createBoundImageNode,
  createTemplateCanvas,
  createTemplatePresets,
  extendTemplateSchema,
} from "./shared";

export const centeredBrandMetaTemplate: WatermarkTemplate = {
  id: "centered-brand-meta",
  name: "Centered Brand + Meta",
  family: "Center Brand",
  description: "Centered two-line mark pairing brand name and photo metadata.",
  coverImage: "/templates/centerlogotext.jpg",
  aspectSupport: ["1:1", "4:5", "3:2", "16:9"],
  tags: ["brand", "metadata"],
  canvas: createTemplateCanvas(24),
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
      {
        id: "center-lockup",
        type: "stack",
        direction: "column",
        align: "center",
        gap: 18,
        width: "hug",
        children: [
          createBoundImageNode("camera-brand-logo", "cameraBrandLogo", "contain", 104, 104),
          {
            id: "brand",
            type: "text",
            binding: "cameraModel",
            font: '22px "Helvetica Neue"',
            lineHeight: 30,
            align: "center",
            width: 520,
            maxLines: 1,
          },
        ],
      },
    ],
  },
  presets: createTemplatePresets(["1:1", "4:5", "3:2", "16:9"]),
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
      bindings: ["cameraBrandLogo", "cameraModel"],
      requiredByTemplate: true,
    },
  ],
  controls: [
    {
      id: "cameraModel",
      label: "Camera model",
      type: "text",
      defaultValue: "由 {cameraModel} 拍摄",
    },
  ],
};
