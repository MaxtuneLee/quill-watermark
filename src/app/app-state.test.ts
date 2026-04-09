import { createStore } from "jotai";
import { beforeEach, expect, test, vi } from "vite-plus/test";
import type { NormalizedMetadata } from "../services/metadata/types";
import * as metadataService from "../services/metadata/extract-metadata";
import {
  appScreenAtom,
  dataCardsAtom,
  editorControlsAtom,
  editorDispatchAtom,
  editorExportOptionsAtom,
  editorImportErrorAtom,
  editorInstanceAtom,
  editorPreviewResolvedFieldsAtom,
  resolvedFieldsAtom,
  selectedTemplateIdAtom,
} from "./app-state";

vi.mock("../services/metadata/extract-metadata", () => ({
  extractMetadata: vi.fn(),
}));

beforeEach(() => {
  const extractMetadataMock = vi.mocked(metadataService.extractMetadata);
  extractMetadataMock.mockReset();
});

test("successful file import stores the file with normalized metadata and enters editor state", async () => {
  const store = createStore();
  const file = new File(["binary"], "photo.jpg", { type: "image/jpeg" });
  const extractMetadataMock = vi.mocked(metadataService.extractMetadata);
  const metadata: NormalizedMetadata = {
    camera: { make: "Leica", model: "Q2" },
    exposure: {
      iso: 400,
      aperture: 1.7,
      shutterSeconds: 1 / 125,
      focalLengthMm: 28,
    },
    location: {
      latitude: 22.302711,
      longitude: 114.177216,
    },
    shotTime: "2026-04-09T02:15:00.000Z",
  };
  extractMetadataMock.mockResolvedValue(metadata);

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "classic-info-strip",
  });
  await store.set(editorDispatchAtom, { type: "import-image", sourceFile: file });

  expect(store.get(selectedTemplateIdAtom)).toBe("classic-info-strip");
  expect(store.get(appScreenAtom)).toBe("editor");
  expect(store.get(editorImportErrorAtom)).toBe(null);
  expect(store.get(editorInstanceAtom)).toEqual({
    sourceFile: file,
    metadata,
  });
  expect(store.get(resolvedFieldsAtom).cameraModel.value).toBe("Q2");
  expect(store.get(dataCardsAtom).find((card) => card.id === "camera-model")).toMatchObject({
    enabled: true,
    mode: "auto",
    previewValue: "Q2",
  });
});

test("failed file import keeps pending-image state and stores explicit import error", async () => {
  const store = createStore();
  const file = new File(["binary"], "bad.jpg", { type: "image/jpeg" });
  const extractMetadataMock = vi.mocked(metadataService.extractMetadata);
  extractMetadataMock.mockRejectedValue(new Error("decode failed"));

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "classic-info-strip",
  });
  await store.set(editorDispatchAtom, { type: "import-image", sourceFile: file });

  expect(store.get(selectedTemplateIdAtom)).toBe("classic-info-strip");
  expect(store.get(appScreenAtom)).toBe("editor-pending-image");
  expect(store.get(editorInstanceAtom)).toBe(null);
  expect(store.get(editorImportErrorAtom)).toBe(
    "Could not import photo. Please try a different image.",
  );
});

test("manual overrides recompute resolved fields and data cards", async () => {
  const store = createStore();
  const file = new File(["binary"], "photo.jpg", { type: "image/jpeg" });
  const extractMetadataMock = vi.mocked(metadataService.extractMetadata);
  extractMetadataMock.mockResolvedValue({
    camera: { make: "Leica", model: "Q2" },
    exposure: {
      iso: 400,
      aperture: 1.7,
      shutterSeconds: 1 / 125,
      focalLengthMm: 28,
    },
    location: {
      latitude: 22.302711,
      longitude: 114.177216,
    },
    shotTime: "2026-04-09T02:15:00.000Z",
  } satisfies NormalizedMetadata);

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "classic-info-strip",
  });
  await store.set(editorDispatchAtom, { type: "import-image", sourceFile: file });
  await store.set(editorDispatchAtom, {
    type: "set-field-override",
    fieldId: "cameraModel",
    value: "Contax T3",
  });

  expect(store.get(resolvedFieldsAtom).cameraModel).toMatchObject({
    value: "Contax T3",
    mode: "manual",
  });
  expect(store.get(dataCardsAtom).find((card) => card.id === "camera-model")).toMatchObject({
    mode: "manual",
    previewValue: "Contax T3",
  });
});

test("user source values populate schema-backed user paths independently of field overrides", async () => {
  const store = createStore();

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "classic-info-strip",
  });
  await store.set(editorDispatchAtom, {
    type: "set-user-source-value",
    path: "authorName",
    value: "Max Tune",
  });

  expect(store.get(resolvedFieldsAtom).authorLine).toMatchObject({
    value: "By Max Tune",
    mode: "auto",
  });

  await store.set(editorDispatchAtom, {
    type: "set-field-override",
    fieldId: "authorLine",
    value: "By Override",
  });

  expect(store.get(resolvedFieldsAtom).authorLine).toMatchObject({
    value: "By Override",
    mode: "manual",
  });
});

test("metadata changes recompute resolved fields and data cards", async () => {
  const store = createStore();
  const file = new File(["binary"], "photo.jpg", { type: "image/jpeg" });
  const extractMetadataMock = vi.mocked(metadataService.extractMetadata);
  extractMetadataMock.mockResolvedValue({
    camera: { make: null, model: null },
    exposure: {
      iso: null,
      aperture: null,
      shutterSeconds: null,
      focalLengthMm: null,
    },
    location: {
      latitude: null,
      longitude: null,
    },
    shotTime: null,
  } satisfies NormalizedMetadata);

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "classic-info-strip",
  });
  await store.set(editorDispatchAtom, { type: "import-image", sourceFile: file });

  expect(store.get(resolvedFieldsAtom).shootingParameters).toMatchObject({
    value: "Settings unavailable",
    mode: "placeholder",
  });

  await store.set(editorDispatchAtom, {
    type: "replace-metadata",
    metadata: {
      camera: { make: "Leica", model: "Q2" },
      exposure: {
        iso: 400,
        aperture: 1.7,
        shutterSeconds: 1 / 125,
        focalLengthMm: 28,
      },
      location: {
        latitude: null,
        longitude: null,
      },
      shotTime: null,
    },
  });

  expect(store.get(resolvedFieldsAtom).shootingParameters).toMatchObject({
    value: "28mm • f/1.7 • 1/125s • ISO 400",
    mode: "auto",
  });
  expect(store.get(dataCardsAtom).find((card) => card.id === "shooting-parameters")).toMatchObject({
    mode: "auto",
    previewValue: "28mm • f/1.7 • 1/125s • ISO 400",
  });
});

test("built-in shot-time field resolves from imported metadata for templates that request it", async () => {
  const store = createStore();
  const file = new File(["binary"], "photo.jpg", { type: "image/jpeg" });
  const extractMetadataMock = vi.mocked(metadataService.extractMetadata);
  extractMetadataMock.mockResolvedValue({
    camera: { make: "Leica", model: "Q2" },
    exposure: {
      iso: 400,
      aperture: 1.7,
      shutterSeconds: 1 / 125,
      focalLengthMm: 28,
    },
    location: {
      latitude: null,
      longitude: null,
    },
    shotTime: "2026-04-09T02:15:00.000Z",
  } satisfies NormalizedMetadata);

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "quiet-white-margin",
  });
  await store.set(editorDispatchAtom, { type: "import-image", sourceFile: file });

  expect(store.get(resolvedFieldsAtom).shotTime).toMatchObject({
    mode: "auto",
  });
  expect(store.get(resolvedFieldsAtom).shotTime.value).not.toBeNull();
  expect(store.get(dataCardsAtom).find((card) => card.id === "shot-time")).toMatchObject({
    enabled: true,
    mode: "auto",
  });
});

test("style control actions persist rail values in app state across later session updates", async () => {
  const store = createStore();
  const file = new File(["binary"], "photo.jpg", { type: "image/jpeg" });
  const extractMetadataMock = vi.mocked(metadataService.extractMetadata);
  extractMetadataMock.mockResolvedValue({
    camera: { make: "Leica", model: "Q2" },
    exposure: {
      iso: 400,
      aperture: 1.7,
      shutterSeconds: 1 / 125,
      focalLengthMm: 28,
    },
    location: {
      latitude: null,
      longitude: null,
    },
    shotTime: null,
  } satisfies NormalizedMetadata);

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "classic-info-strip",
  });
  await store.set(editorDispatchAtom, {
    type: "editor/set-control",
    payload: { id: "canvasPadding", value: 64 },
  });
  await store.set(editorDispatchAtom, {
    type: "editor/set-control",
    payload: { id: "imageFit", value: "contain" },
  });
  await store.set(editorDispatchAtom, { type: "import-image", sourceFile: file });
  await store.set(editorDispatchAtom, {
    type: "replace-metadata",
    metadata: {
      camera: { make: "Canon", model: "R5" },
      exposure: {
        iso: 100,
        aperture: 4,
        shutterSeconds: 1 / 250,
        focalLengthMm: 35,
      },
      location: {
        latitude: 22.302711,
        longitude: 114.177216,
      },
      shotTime: "2026-04-09T02:15:00.000Z",
    },
  });

  expect(store.get(editorControlsAtom)).toMatchObject({
    canvasPadding: 64,
    imageFit: "contain",
  });
  expect(store.get(editorControlsAtom)).not.toHaveProperty("metadataOrder");
});

test("editor ignores control ids that are outside the visible style contract", async () => {
  const store = createStore();

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "classic-info-strip",
  });

  const before = store.get(editorControlsAtom);

  await store.set(editorDispatchAtom, {
    type: "editor/set-control",
    payload: {
      id: "metadataOrder" as never,
      value: "brand-first" as never,
    },
  });

  expect(store.get(editorControlsAtom)).toEqual(before);
});

test("card enabled actions keep required cards visible in preview state", async () => {
  const store = createStore();

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "classic-info-strip",
  });
  await store.set(editorDispatchAtom, {
    type: "set-field-override",
    fieldId: "cameraModel",
    value: "Contax T3",
  });
  await store.set(editorDispatchAtom, {
    type: "editor/set-card-enabled",
    payload: { id: "camera-model", enabled: false },
  });

  expect(store.get(dataCardsAtom).find((card) => card.id === "camera-model")).toMatchObject({
    enabled: true,
    requiredByTemplate: true,
  });
  expect(store.get(editorPreviewResolvedFieldsAtom).cameraModel.value).toBe("Contax T3");
});

test("required placeholder cards stay enabled and expose missing-value state through app state", async () => {
  const store = createStore();
  const file = new File(["binary"], "photo.jpg", { type: "image/jpeg" });
  const extractMetadataMock = vi.mocked(metadataService.extractMetadata);
  extractMetadataMock.mockResolvedValue({
    camera: { make: "Leica", model: "Q2" },
    exposure: {
      iso: 400,
      aperture: 1.7,
      shutterSeconds: 1 / 125,
      focalLengthMm: 28,
    },
    location: {
      latitude: null,
      longitude: null,
    },
    shotTime: null,
  } satisfies NormalizedMetadata);

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "classic-info-strip",
  });
  await store.set(editorDispatchAtom, { type: "import-image", sourceFile: file });

  expect(store.get(dataCardsAtom).find((card) => card.id === "location")).toMatchObject({
    enabled: true,
    mode: "placeholder",
    previewValue: "Location unavailable",
    requiredByTemplate: true,
  });
});

test("required cards cannot be disabled through the reducer and stay visible in preview fields", async () => {
  const store = createStore();

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "classic-info-strip",
  });
  await store.set(editorDispatchAtom, {
    type: "set-field-override",
    fieldId: "cameraModel",
    value: "Contax T3",
  });

  expect(store.get(dataCardsAtom).find((card) => card.id === "camera-model")).toMatchObject({
    enabled: true,
    requiredByTemplate: true,
  });

  await store.set(editorDispatchAtom, {
    type: "editor/set-card-enabled",
    payload: { id: "camera-model", enabled: false },
  });

  expect(store.get(dataCardsAtom).find((card) => card.id === "camera-model")).toMatchObject({
    enabled: true,
    requiredByTemplate: true,
  });
  expect(store.get(editorPreviewResolvedFieldsAtom).cameraModel.value).toBe("Contax T3");
});

test("manual overrides and card visibility remain app-owned across later metadata updates", async () => {
  const store = createStore();
  const file = new File(["binary"], "photo.jpg", { type: "image/jpeg" });
  const extractMetadataMock = vi.mocked(metadataService.extractMetadata);
  extractMetadataMock.mockResolvedValue({
    camera: { make: "Leica", model: "Q2" },
    exposure: {
      iso: 400,
      aperture: 1.7,
      shutterSeconds: 1 / 125,
      focalLengthMm: 28,
    },
    location: {
      latitude: null,
      longitude: null,
    },
    shotTime: null,
  } satisfies NormalizedMetadata);

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "classic-info-strip",
  });
  await store.set(editorDispatchAtom, { type: "import-image", sourceFile: file });
  await store.set(editorDispatchAtom, {
    type: "set-field-override",
    fieldId: "authorLine",
    value: "By Harbor Studio",
  });
  await store.set(editorDispatchAtom, {
    type: "editor/set-card-enabled",
    payload: { id: "author", enabled: false },
  });
  await store.set(editorDispatchAtom, {
    type: "replace-metadata",
    metadata: {
      camera: { make: "Canon", model: "R5" },
      exposure: {
        iso: 100,
        aperture: 4,
        shutterSeconds: 1 / 250,
        focalLengthMm: 35,
      },
      location: {
        latitude: 22.302711,
        longitude: 114.177216,
      },
      shotTime: "2026-04-09T02:15:00.000Z",
    },
  });

  expect(store.get(resolvedFieldsAtom).authorLine).toMatchObject({
    mode: "manual",
    value: "By Harbor Studio",
  });
  expect(store.get(dataCardsAtom).find((card) => card.id === "author")).toMatchObject({
    enabled: true,
    requiredByTemplate: true,
    mode: "manual",
    previewValue: "By Harbor Studio",
  });
});

test("export option actions persist export settings in editor state", async () => {
  const store = createStore();

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "classic-info-strip",
  });
  await store.set(editorDispatchAtom, {
    type: "editor/set-export-option",
    payload: { id: "format", value: "webp" },
  });
  await store.set(editorDispatchAtom, {
    type: "editor/set-export-option",
    payload: { id: "multiplier", value: 3 },
  });

  expect(store.get(editorExportOptionsAtom)).toMatchObject({
    format: "webp",
    multiplier: 3,
  });
});
