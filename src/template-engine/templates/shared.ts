import type { TemplateFieldGroup, TemplateFieldSchema } from "../types";

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
    requiredByTemplate: true,
  },
};

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
