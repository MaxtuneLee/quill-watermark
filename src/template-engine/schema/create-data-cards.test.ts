import { expect, test } from "vite-plus/test";
import { createDataCards } from "./create-data-cards";

test("maps resolved fields into auto, placeholder, and manual data-card states", () => {
  const cards = createDataCards({
    groups: [
      {
        id: "camera-model",
        title: "Camera Model",
        bindings: ["cameraModel"],
      },
    ],
    resolvedFields: {
      cameraModel: {
        kind: "text",
        source: "exif",
        editable: false,
        value: "Leica Q2",
        mode: "auto",
      },
    },
  });

  expect(cards[0]).toMatchObject({
    title: "Camera Model",
    mode: "auto",
    previewValue: "Leica Q2",
  });
});

test("marks optional cards disabled when all bindings are empty", () => {
  const cards = createDataCards({
    groups: [
      {
        id: "location",
        title: "Location",
        bindings: ["locationLine"],
        requiredByTemplate: false,
      },
    ],
    resolvedFields: {
      locationLine: {
        kind: "text",
        source: "derived",
        editable: false,
        value: null,
        mode: "placeholder",
      },
    },
  });

  expect(cards[0]).toMatchObject({
    enabled: false,
    mode: "placeholder",
    previewValue: null,
    requiredByTemplate: false,
  });
});
