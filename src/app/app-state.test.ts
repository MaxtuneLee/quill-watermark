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
  expect(store.get(dataCardsAtom).find((card) => card.id === "shooting-parameters")).toMatchObject({
    enabled: true,
    mode: "auto",
    previewValue: "28mm • f/1.7 • 1/125s • ISO 400",
  });
  expect(store.get(dataCardsAtom).find((card) => card.id === "camera-model")).toBeUndefined();
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

test("manual overrides recompute resolved fields even when the template does not expose that card", async () => {
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
  expect(store.get(dataCardsAtom).find((card) => card.id === "camera-model")).toBeUndefined();
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

test("template text control defaults hydrate matching schema-backed fields", async () => {
  const store = createStore();

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "centered-brand-meta",
  });

  expect(store.get(resolvedFieldsAtom).cameraModel).toMatchObject({
    value: "由 Camera unavailable 拍摄",
    mode: "auto",
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

test("switching templates keeps the current imported image and only resets template-scoped state", async () => {
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
  await store.set(editorDispatchAtom, {
    type: "set-field-override",
    fieldId: "cameraModel",
    value: "Manual Camera",
  });
  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "centered-brand-meta",
  });

  expect(store.get(selectedTemplateIdAtom)).toBe("centered-brand-meta");
  expect(store.get(appScreenAtom)).toBe("editor");
  expect(store.get(editorInstanceAtom)).toEqual({
    sourceFile: file,
    metadata,
  });
  expect(store.get(editorImportErrorAtom)).toBe(null);
  expect(store.get(resolvedFieldsAtom).cameraModel.value).toBe("由 Leica Q2 拍摄");
});

test("built-in shot-time field can resolve even when no current template layout renders that card", async () => {
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
    templateId: "classic-info-strip",
  });
  await store.set(editorDispatchAtom, { type: "import-image", sourceFile: file });

  expect(store.get(resolvedFieldsAtom).shotTime).toMatchObject({
    mode: "auto",
  });
  expect(store.get(resolvedFieldsAtom).shotTime.value).not.toBeNull();
  expect(store.get(dataCardsAtom).find((card) => card.id === "shot-time")).toBeUndefined();
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
    payload: { id: "canvasPaddingTop", value: 64 },
  });
  await store.set(editorDispatchAtom, {
    type: "editor/set-control",
    payload: { id: "canvasPaddingBottom", value: 12 },
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
    canvasPaddingTop: 64,
    canvasPaddingBottom: 12,
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

test("card enabled actions update optional card state and preview field visibility", async () => {
  const store = createStore();

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "classic-info-strip",
  });
  await store.set(editorDispatchAtom, {
    type: "set-field-override",
    fieldId: "signature",
    value: "Harbor Studio",
  });
  await store.set(editorDispatchAtom, {
    type: "editor/set-card-enabled",
    payload: { id: "brand-mark", enabled: false },
  });

  expect(store.get(dataCardsAtom).find((card) => card.id === "brand-mark")).toMatchObject({
    enabled: false,
    requiredByTemplate: false,
  });
  expect(store.get(editorPreviewResolvedFieldsAtom).signature.value).toBe(null);
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
    templateId: "minimal-info-strip",
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

test("manual overrides and optional card visibility remain app-owned across later metadata updates", async () => {
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
    fieldId: "signature",
    value: "Harbor Studio",
  });
  await store.set(editorDispatchAtom, {
    type: "editor/set-card-enabled",
    payload: { id: "brand-mark", enabled: false },
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

  expect(store.get(resolvedFieldsAtom).signature).toMatchObject({
    mode: "manual",
    value: "Harbor Studio",
  });
  expect(store.get(dataCardsAtom).find((card) => card.id === "brand-mark")).toMatchObject({
    enabled: false,
    requiredByTemplate: false,
    mode: "manual",
  });
  expect(store.get(editorPreviewResolvedFieldsAtom).signature.value).toBe(null);
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
