import { expect, test } from "vite-plus/test";
import { resolveFields } from "./resolve-fields";

test("prefers auto values and falls back to placeholder text", () => {
  const resolved = resolveFields({
    schema: {
      fields: {
        authorLine: {
          kind: "text",
          source: "user",
          path: "authorName",
          editable: true,
          placeholder: "By {{user.authorName}}",
          fallback: [{ whenMissing: ["user.authorName"], use: "By Anonymous" }],
        },
      },
    },
    sources: {
      user: {},
      exif: {},
      gps: {},
      derived: {},
      afilmory: {},
      brand: {},
    },
    overrides: {},
  });

  expect(resolved.authorLine.value).toBe("By Anonymous");
  expect(resolved.authorLine.mode).toBe("placeholder");
});

test("prefers manual overrides over auto values", () => {
  const resolved = resolveFields({
    schema: {
      fields: {
        cameraModel: {
          kind: "text",
          source: "exif",
          path: "camera.model",
          editable: true,
        },
      },
    },
    sources: {
      user: {},
      exif: {
        camera: {
          model: "Leica Q2",
        },
      },
      gps: {},
      derived: {},
      afilmory: {},
      brand: {},
    },
    overrides: {
      cameraModel: "Contax T3",
    },
  });

  expect(resolved.cameraModel.value).toBe("Contax T3");
  expect(resolved.cameraModel.mode).toBe("manual");
});

test("interpolates placeholders and applies formatter chains", () => {
  const resolved = resolveFields({
    schema: {
      fields: {
        brandLine: {
          kind: "text",
          source: "brand",
          path: "line",
          editable: false,
          placeholder: "{{brand.line}}",
          format: [{ type: "uppercase" }, { type: "suffix", value: " / FILM" }],
        },
      },
    },
    sources: {
      user: {},
      exif: {},
      gps: {},
      derived: {},
      afilmory: {},
      brand: {
        line: "quill studio",
      },
    },
    overrides: {},
  });

  expect(resolved.brandLine.value).toBe("QUILL STUDIO / FILM");
  expect(resolved.brandLine.mode).toBe("auto");
});
