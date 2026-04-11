import type { WatermarkTemplate } from "../types";
import {
  createTemplateCanvas,
  createTemplatePresets,
  createBoundImageNode,
  createImageNode,
  extendTemplateSchema,
  pickTemplateFieldGroups,
} from "./shared";

export const classicInfoStripTemplate: WatermarkTemplate = {
  id: "classic-info-strip",
  name: "Classic Info Strip",
  family: "Info Bar",
  description: "A balanced lower-third bar for brand and capture metadata.",
  coverImage: "/templates/normal.jpg",
  aspectSupport: ["1:1", "4:5", "16:9"],
  tags: ["balanced", "signature"],
  canvas: createTemplateCanvas({ top: 24, right: 24, bottom: 0, left: 24 }, "#ffffff"),
  layout: {
    id: "root",
    type: "container",
    direction: "column",
    gap: 0,
    width: "fill",
    height: "fill",
    children: [
      {
        ...createImageNode("photo", "cover"),
        width: "fill",
        height: "fill",
      },
      {
        id: "info-bar",
        type: "container",
        direction: "row",
        width: "fill",
        justifyContent: "space-between",
        alignItems: "center",
        padding: { x: 12, y: 14 },
        children: [
          {
            id: "info-copy",
            type: "container",
            direction: "column",
            gap: 2,
            children: [
              {
                id: "settings",
                type: "text",
                binding: "shootingParameters",
                font: '17px "Helvetica Neue"',
                lineHeight: 22,
                color: "#000000",
                align: "left",
                width: 520,
                maxLines: 1,
              },
              {
                id: "location",
                type: "text",
                binding: "locationLine",
                font: '12px "Helvetica Neue"',
                lineHeight: 16,
                color: "#000000",
                align: "left",
                opacity: 0.6,
                width: 360,
                maxLines: 1,
              },
            ],
          },
          {
            ...createBoundImageNode("camera-brand-logo", "cameraBrandLogo", "contain", 42, 42),
            color: "#000000",
            align: "center",
          },
        ],
      },
    ],
  },
  presets: createTemplatePresets(["1:1", "4:5", "16:9"]),
  schema: extendTemplateSchema({
    metaLine: {
      kind: "text",
      source: "brand",
      path: "socialHandle",
      editable: true,
      placeholder: "@quillstudio",
    },
  }),
  fieldGroups: pickTemplateFieldGroups([
    "camera-model",
    "shooting-parameters",
    "location",
    "author",
    "brand-mark",
  ]),
  controls: [
    {
      id: "brandLine",
      label: "Brand line",
      type: "text",
      defaultValue: "Shot on Quill",
    },
    {
      id: "metaLine",
      label: "Meta line",
      type: "text",
      defaultValue: "@quillstudio",
    },
    {
      id: "showBackground",
      label: "Show background",
      type: "toggle",
      defaultValue: true,
    },
  ],
};
