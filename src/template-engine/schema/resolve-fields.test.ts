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

test("resolves single-brace field expressions inside manual overrides", () => {
  const resolved = resolveFields({
    schema: {
      fields: {
        shootingParameters: {
          kind: "text",
          source: "derived",
          path: "shootingParameters",
          editable: false,
          placeholder: "Settings unavailable",
        },
        signature: {
          kind: "text",
          source: "user",
          path: "signature",
          editable: true,
          placeholder: "Shot on Quill",
        },
      },
    },
    sources: {
      user: {},
      exif: {},
      gps: {},
      derived: {
        shootingParameters: "28mm • f/1.7 • 1/125s • ISO 400",
      },
      afilmory: {},
      brand: {},
    },
    overrides: {
      signature: "Shot on {shootingParameters}",
      shootingParameters: "{shootingParameters}",
    },
  });

  expect(resolved.signature.value).toBe("Shot on 28mm • f/1.7 • 1/125s • ISO 400");
  expect(resolved.signature.mode).toBe("manual");
  expect(resolved.shootingParameters.value).toBe("28mm • f/1.7 • 1/125s • ISO 400");
  expect(resolved.shootingParameters.mode).toBe("manual");
});

test("interpolates placeholders and applies formatter chains", () => {
  const resolved = resolveFields({
    schema: {
      fields: {
        signature: {
          kind: "text",
          source: "user",
          path: "signature",
          editable: false,
          placeholder: "{{user.signature}}",
          format: [{ type: "uppercase" }, { type: "suffix", value: " / FILM" }],
        },
      },
    },
    sources: {
      user: {
        signature: "quill studio",
      },
      exif: {},
      gps: {},
      derived: {},
      afilmory: {},
      brand: {},
    },
    overrides: {},
  });

  expect(resolved.signature.value).toBe("QUILL STUDIO / FILM");
  expect(resolved.signature.mode).toBe("auto");
});
