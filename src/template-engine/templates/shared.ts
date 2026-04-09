import type {
  AspectRatioDefinition,
  ImageLayoutNode,
  TemplateAspect,
  TemplateCanvasDefinition,
  TemplateFieldGroup,
  TemplateFieldSchema,
  TemplateLayoutNode,
  TemplateLayoutZone,
  TemplatePreset,
  TemplatePresetOverride,
  TextAlign,
  TextLayoutNode,
} from "../types";

export const defaultTemplateSchema: TemplateFieldSchema = {
  fields: {
    brandLine: {
      kind: "text",
      source: "brand",
      path: "line",
      editable: true,
      placeholder: "Shot on Quill",
    },
    cameraModel: {
      kind: "text",
      source: "exif",
      path: "camera.model",
      editable: false,
      placeholder: "Camera unavailable",
    },
    shootingParameters: {
      kind: "text",
      source: "derived",
      path: "shootingParameters",
      editable: false,
      placeholder: "Settings unavailable",
    },
    shotTime: {
      kind: "text",
      source: "derived",
      path: "shotTimeLine",
      editable: false,
      placeholder: "Shot time unavailable",
    },
    locationLine: {
      kind: "text",
      source: "derived",
      path: "locationLine",
      editable: false,
      placeholder: "Location unavailable",
    },
    authorLine: {
      kind: "text",
      source: "user",
      path: "authorName",
      editable: true,
      placeholder: "By {{user.authorName}}",
      fallback: [{ whenMissing: ["user.authorName"], use: "By Anonymous" }],
    },
  },
};

const fieldGroupsById: Record<string, TemplateFieldGroup> = {
  "camera-model": {
    id: "camera-model",
    title: "Camera Model",
    bindings: ["cameraModel"],
    requiredByTemplate: true,
  },
  "shooting-parameters": {
    id: "shooting-parameters",
    title: "Shooting Parameters",
    bindings: ["shootingParameters"],
    requiredByTemplate: true,
  },
  "shot-time": {
    id: "shot-time",
    title: "Shot Time",
    bindings: ["shotTime"],
    requiredByTemplate: true,
  },
  location: {
    id: "location",
    title: "Location",
    bindings: ["locationLine"],
    requiredByTemplate: true,
  },
  author: {
    id: "author",
    title: "Author",
    bindings: ["authorLine"],
    requiredByTemplate: true,
  },
  "brand-mark": {
    id: "brand-mark",
    title: "Brand Mark",
    bindings: ["brandLine"],
    requiredByTemplate: false,
  },
};

const aspectRatios: Record<TemplateAspect, AspectRatioDefinition> = {
  "1:1": { width: 1, height: 1 },
  "4:5": { width: 4, height: 5 },
  "3:2": { width: 3, height: 2 },
  "16:9": { width: 16, height: 9 },
  "9:16": { width: 9, height: 16 },
};

function createPresetOverrides(aspect: TemplateAspect): readonly TemplatePresetOverride[] {
  switch (aspect) {
    case "1:1":
      return [
        { targetId: "root", changes: { gap: 20 } },
        { targetId: "meta", changes: { width: 760 } },
      ];
    case "4:5":
      return [
        { targetId: "root", changes: { gap: 28 } },
        { targetId: "photo", changes: { flexGrow: 1.2 } },
      ];
    case "3:2":
      return [
        { targetId: "meta", changes: { maxLines: 1 } },
        { targetId: "photo", changes: { fit: "contain" } },
      ];
    case "16:9":
      return [
        { targetId: "root", changes: { gap: 18 } },
        { targetId: "photo", changes: { flexGrow: 1.4 } },
      ];
    case "9:16":
      return [
        { targetId: "root", changes: { gap: 32 } },
        { targetId: "photo", changes: { flexGrow: 1.5 } },
      ];
  }
}

function createImageNode(
  id: string,
  fit: "cover" | "contain",
  width = 1600,
  height = 900,
): ImageLayoutNode {
  return {
    id,
    type: "image",
    binding: "photo",
    fit,
    intrinsicSize: { width, height },
    width: "fill",
    flexGrow: 1,
  };
}

function createTextNode(
  id: string,
  binding: string,
  font: string,
  align: TextAlign,
  maxLines = 2,
): TextLayoutNode {
  return {
    id,
    type: "text",
    binding,
    font,
    lineHeight: font.startsWith("30px") ? 38 : font.startsWith("32px") ? 40 : 30,
    align,
    width: "fill",
    maxLines,
  };
}

export function createTemplateCanvas(
  padding: number,
  background = "#111111",
): TemplateCanvasDefinition {
  return {
    background,
    padding,
    aspectRatio: null,
  };
}

export function createTemplatePresets(
  supportedAspects: readonly TemplateAspect[],
): readonly TemplatePreset[] {
  return [
    {
      id: "original",
      label: "Original",
      canvas: {
        aspectRatio: null,
      },
      overrides: [],
    },
    ...supportedAspects.map((aspect) => ({
      id: aspect,
      label: aspect,
      canvas: {
        aspectRatio: aspectRatios[aspect],
      },
      overrides: createPresetOverrides(aspect),
    })),
  ];
}

export function createTemplateLayout(
  zone: TemplateLayoutZone,
  textAlign: TextAlign,
): TemplateLayoutNode {
  switch (zone) {
    case "bottom-strip":
      return {
        id: "root",
        type: "stack",
        direction: "column",
        gap: 24,
        children: [
          createImageNode("photo", "cover"),
          createTextNode("meta", "shootingParameters", '24px "Helvetica Neue"', textAlign),
        ],
      };
    case "top-strip":
      return {
        id: "root",
        type: "stack",
        direction: "column",
        gap: 18,
        children: [
          createTextNode("meta", "brandLine", '20px "Helvetica Neue"', textAlign, 1),
          createImageNode("photo", "cover"),
        ],
      };
    case "center-mark":
      return {
        id: "root",
        type: "stack",
        direction: "column",
        align: "center",
        gap: 20,
        children: [
          createImageNode("photo", "cover"),
          createTextNode("meta", "brandLine", '30px "Helvetica Neue"', textAlign, 1),
        ],
      };
    case "center-stack":
      return {
        id: "root",
        type: "stack",
        direction: "column",
        align: "center",
        gap: 12,
        children: [
          createImageNode("photo", "cover"),
          createTextNode("meta", "brandLine", '30px "Helvetica Neue"', textAlign, 1),
          createTextNode("details", "shootingParameters", '20px "Helvetica Neue"', textAlign),
        ],
      };
    case "full-overlay":
      return {
        id: "root",
        type: "overlay",
        align: "center",
        justify: "center",
        children: [
          createImageNode("photo", "cover"),
          createTextNode("meta", "brandLine", '32px "Helvetica Neue"', textAlign, 2),
        ],
      };
    case "margin-bottom":
      return {
        id: "root",
        type: "stack",
        direction: "column",
        gap: 18,
        children: [
          createImageNode("photo", "contain"),
          createTextNode("meta", "shotTime", '20px "Helvetica Neue"', textAlign, 1),
          createTextNode("author", "authorLine", '20px "Helvetica Neue"', textAlign, 1),
        ],
      };
    case "story-cover":
      return {
        id: "root",
        type: "stack",
        direction: "column",
        align: "center",
        gap: 16,
        children: [
          createImageNode("photo", "cover", 900, 1600),
          createTextNode("meta", "locationLine", '30px "Helvetica Neue"', textAlign, 2),
          createTextNode("author", "authorLine", '20px "Helvetica Neue"', textAlign, 1),
        ],
      };
    case "editorial-card":
      return {
        id: "root",
        type: "stack",
        direction: "column",
        gap: 14,
        children: [
          createImageNode("photo", "contain"),
          createTextNode("meta", "brandLine", '32px "Helvetica Neue"', textAlign, 1),
          createTextNode("details", "shootingParameters", '20px "Helvetica Neue"', textAlign),
        ],
      };
  }
}

export function pickTemplateFieldGroups(
  groupIds: readonly string[],
): readonly TemplateFieldGroup[] {
  return groupIds.map((groupId) => {
    const group = fieldGroupsById[groupId];
    if (!group) {
      throw new Error(`Unknown template field group: ${groupId}`);
    }

    return group;
  });
}
