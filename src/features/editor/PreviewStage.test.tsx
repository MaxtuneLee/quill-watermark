import { render, screen, waitFor } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { beforeEach, expect, test, vi } from "vite-plus/test";
import * as metadataService from "../../services/metadata/extract-metadata";
import * as layoutService from "../../template-engine/layout/resolve-layout";
import { editorDispatchAtom } from "../../app/app-state";
import { loadImageAsset } from "../../template-engine/render/load-image-asset";
import { renderCanvas } from "../../template-engine/render/render-canvas";
import { PreviewStage } from "./PreviewStage";

vi.mock("../../services/metadata/extract-metadata", () => ({
  extractMetadata: vi.fn(),
}));

vi.mock("../../template-engine/render/load-image-asset", () => ({
  loadImageAsset: vi.fn(async () => ({
    source: {} as CanvasImageSource,
    width: 1600,
    height: 900,
    dispose: vi.fn(),
  })),
}));

vi.mock("../../template-engine/render/render-canvas", () => ({
  renderCanvas: vi.fn(async () => {}),
}));

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    fillText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.mocked(metadataService.extractMetadata).mockReset();
  vi.mocked(loadImageAsset).mockReset();
  vi.mocked(loadImageAsset).mockResolvedValue({
    source: {} as CanvasImageSource,
    width: 1600,
    height: 900,
    dispose: vi.fn(),
  });
  vi.mocked(renderCanvas).mockReset();
});

test("renders a preview canvas and repaints when resolved fields change", async () => {
  const store = createStore();
  const file = new File(["binary"], "photo.jpg", { type: "image/jpeg" });
  vi.mocked(metadataService.extractMetadata).mockResolvedValue({
    camera: { make: "Leica", model: "Q2" },
    exposure: {
      iso: 400,
      aperture: 1.7,
      shutterSeconds: 1 / 125,
      focalLengthMm: 28,
    },
    location: { latitude: null, longitude: null },
    shotTime: null,
  });

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "classic-info-strip",
  });
  await store.set(editorDispatchAtom, { type: "import-image", sourceFile: file });

  render(
    <Provider store={store}>
      <PreviewStage />
    </Provider>,
  );

  expect(screen.getByRole("img", { name: /template preview/i })).toBeInTheDocument();
  await waitFor(() => {
    expect(renderCanvas).toHaveBeenCalledTimes(1);
  });

  await store.set(editorDispatchAtom, {
    type: "set-field-override",
    fieldId: "shootingParameters",
    value: "35mm • f/2 • ISO 200",
  });

  await waitFor(() => {
    expect(renderCanvas).toHaveBeenCalledTimes(2);
  });
  expect(loadImageAsset).toHaveBeenCalledTimes(1);
});

test("renders an explicit empty state when no instance is active", () => {
  const store = createStore();

  render(
    <Provider store={store}>
      <PreviewStage />
    </Provider>,
  );

  expect(screen.getByText(/import an image to preview this template/i)).toBeInTheDocument();
});

test("preserves text alignment from resolved layout nodes when building render scene", async () => {
  const store = createStore();
  const file = new File(["binary"], "photo.jpg", { type: "image/jpeg" });
  vi.mocked(metadataService.extractMetadata).mockResolvedValue({
    camera: { make: "Leica", model: "Q2" },
    exposure: {
      iso: 400,
      aperture: 1.7,
      shutterSeconds: 1 / 125,
      focalLengthMm: 28,
    },
    location: { latitude: null, longitude: null },
    shotTime: null,
  });

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "centered-brand-meta",
  });
  await store.set(editorDispatchAtom, { type: "import-image", sourceFile: file });

  render(
    <Provider store={store}>
      <PreviewStage />
    </Provider>,
  );

  await waitFor(() => {
    expect(renderCanvas).toHaveBeenCalled();
  });

  const latestScene = vi.mocked(renderCanvas).mock.calls.at(-1)?.[1];
  expect(latestScene).toBeTruthy();
  const textNodes = (latestScene?.nodes ?? []).filter((node) => node.type === "text");
  expect(textNodes.length).toBeGreaterThan(0);
  expect(textNodes.every((node) => node.align === "center")).toBe(true);
});

test("injects decoded photo intrinsic dimensions into resolveLayout input", async () => {
  const store = createStore();
  const file = new File(["binary"], "photo.jpg", { type: "image/jpeg" });
  vi.mocked(metadataService.extractMetadata).mockResolvedValue({
    camera: { make: "Leica", model: "Q2" },
    exposure: {
      iso: 400,
      aperture: 1.7,
      shutterSeconds: 1 / 125,
      focalLengthMm: 28,
    },
    location: { latitude: null, longitude: null },
    shotTime: null,
  });
  vi.mocked(loadImageAsset).mockResolvedValueOnce({
    source: {} as CanvasImageSource,
    width: 900,
    height: 1600,
    dispose: vi.fn(),
  });
  const resolveLayoutSpy = vi.spyOn(layoutService, "resolveLayout");

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "classic-info-strip",
  });
  await store.set(editorDispatchAtom, { type: "import-image", sourceFile: file });

  render(
    <Provider store={store}>
      <PreviewStage />
    </Provider>,
  );

  await waitFor(() => {
    expect(resolveLayoutSpy).toHaveBeenCalled();
  });

  const resolveLayoutInput = resolveLayoutSpy.mock.calls.at(-1)?.[0];
  expect(resolveLayoutInput).toBeTruthy();
  if (resolveLayoutInput === undefined) {
    throw new Error("resolveLayout input was not captured.");
  }
  if (resolveLayoutInput.layout.type !== "stack") {
    throw new Error("Expected a stack root layout.");
  }
  const imageNode = resolveLayoutInput.layout.children.find((child) => child.type === "image");
  expect(imageNode).toBeDefined();
  if (imageNode === undefined || imageNode.type !== "image") {
    throw new Error("Expected an image node in root children.");
  }
  expect(imageNode.intrinsicSize).toEqual({ width: 900, height: 1600 });
});
