import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";
import * as metadataService from "../../services/metadata/extract-metadata";
import * as layoutService from "../../template-engine/layout/resolve-layout";
import { editorDispatchAtom } from "../../app/app-state";
import { loadImageAsset } from "../../template-engine/render/load-image-asset";
import { renderCanvas } from "../../template-engine/render/render-canvas";
import type { TemplateLayoutNode } from "../../template-engine/types";
import { PreviewStage } from "./PreviewStage";

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

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

afterEach(() => {
  cleanup();
});

function findImageNode(
  layout: TemplateLayoutNode,
  predicate: (node: Extract<TemplateLayoutNode, { type: "image" }>) => boolean,
): Extract<TemplateLayoutNode, { type: "image" }> | undefined {
  if (layout.type === "image") {
    return predicate(layout) ? layout : undefined;
  }

  if (layout.type === "text" || layout.type === "rect") {
    return undefined;
  }

  for (const child of layout.children) {
    const match = findImageNode(child, predicate);
    if (match) {
      return match;
    }
  }

  return undefined;
}

function findSceneLogoNode(scene: Parameters<typeof renderCanvas>[1] | undefined) {
  const imageNodes = (scene?.nodes ?? []).filter((node) => node.type === "image");
  return imageNodes
    .slice()
    .sort(
      (left, right) =>
        left.frame.width * left.frame.height - right.frame.width * right.frame.height,
    )
    .at(0);
}

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
    location: { latitude: 30.7629, longitude: 120.7476 },
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
    expect(renderCanvas).toHaveBeenCalled();
  });
  const initialRenderCount = vi.mocked(renderCanvas).mock.calls.length;

  await store.set(editorDispatchAtom, {
    type: "set-field-override",
    fieldId: "shootingParameters",
    value: "35mm • f/2 • ISO 200",
  });

  await waitFor(() => {
    expect(vi.mocked(renderCanvas).mock.calls.length).toBeGreaterThan(initialRenderCount);
  });
  expect(vi.mocked(loadImageAsset).mock.calls.some(([input]) => input === file)).toBe(true);
});

test("renders an explicit empty state when no instance is active", () => {
  const store = createStore();

  void store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "classic-info-strip",
  });

  render(
    <Provider store={store}>
      <PreviewStage />
    </Provider>,
  );

  expect(
    screen.getByRole("img", { name: /classic info strip template preview/i }),
  ).toBeInTheDocument();
  expect(screen.queryByText(/add an image above to start editing/i)).not.toBeInTheDocument();
});

test("renders the empty preview frame without rounded corners and keeps the cover image fully visible", () => {
  const store = createStore();

  void store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "classic-info-strip",
  });

  const { container } = render(
    <Provider store={store}>
      <PreviewStage />
    </Provider>,
  );

  const placeholderFrame = container.querySelector(".editor-preview-placeholder-frame");
  const placeholderImage = container.querySelector(".editor-preview-placeholder-image");

  expect(placeholderFrame).toHaveClass("rounded-none");
  expect(placeholderFrame).toHaveClass("min-[781px]:max-w-[min(64vw,50rem)]");
  expect(placeholderImage).toHaveClass("object-contain");
});

test("renders the placeholder preview without overlay copy and keeps the full cover image visible on mobile", () => {
  const store = createStore();

  void store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "classic-info-strip",
  });

  const { container } = render(
    <Provider store={store}>
      <PreviewStage />
    </Provider>,
  );

  const placeholderFrame = container.querySelector(".editor-preview-placeholder-frame");
  const placeholderImage = container.querySelector(".editor-preview-placeholder-image");
  const placeholderOverlayCopy = container.querySelector(".editor-preview-placeholder-copy");

  expect(screen.queryByText(/add an image above to start editing/i)).not.toBeInTheDocument();
  expect(placeholderOverlayCopy).toBeNull();
  expect(placeholderFrame).not.toHaveClass("aspect-[4/5]");
  expect(placeholderImage).toHaveClass("object-contain");
  expect(placeholderImage).not.toHaveClass("object-cover");
});

test("renders the placeholder preview edge-to-edge with a transparent frame and translucent cover image", () => {
  const store = createStore();

  void store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "classic-info-strip",
  });

  const { container } = render(
    <Provider store={store}>
      <PreviewStage />
    </Provider>,
  );

  const previewStage = screen.getByRole("region", { name: /preview stage/i });
  const placeholderWrap = container.querySelector(".editor-preview-placeholder-wrap");
  const placeholderFrame = container.querySelector(".editor-preview-placeholder-frame");
  const placeholderImage = container.querySelector(".editor-preview-placeholder-image");

  expect(previewStage).not.toHaveClass("px-5");
  expect(previewStage).not.toHaveClass("min-[781px]:px-8");
  expect(placeholderWrap).toHaveClass("w-full");
  expect(placeholderFrame).toHaveClass("max-w-full");
  expect(placeholderFrame).not.toHaveClass("bg-[#0d0d0d]");
  expect(placeholderImage).toHaveClass("w-full");
  expect(placeholderImage).toHaveClass("opacity-60");
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
    location: { latitude: 30.7629, longitude: 120.7476 },
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

test("renders centered device mark as a logo-only lockup", async () => {
  const store = createStore();
  const file = new File(["binary"], "photo.jpg", { type: "image/jpeg" });
  vi.mocked(metadataService.extractMetadata).mockResolvedValue({
    camera: { make: "Apple", model: "iPhone 15 Pro" },
    exposure: {
      iso: 100,
      aperture: 1.8,
      shutterSeconds: 1 / 500,
      focalLengthMm: 24,
    },
    location: { latitude: null, longitude: null },
    shotTime: null,
  });

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "centered-device-mark",
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
  const imageNodes = (latestScene?.nodes ?? []).filter((node) => node.type === "image");
  const logoNode = findSceneLogoNode(latestScene);

  expect(textNodes).toHaveLength(0);
  expect(imageNodes.length).toBeGreaterThan(1);
  expect(logoNode).toBeTruthy();
});

test("renders centered brand meta as a centered logo with a single device line below it", async () => {
  const store = createStore();
  const file = new File(["binary"], "photo.jpg", { type: "image/jpeg" });
  vi.mocked(metadataService.extractMetadata).mockResolvedValue({
    camera: { make: "Apple", model: "iPhone 15 Pro" },
    exposure: {
      iso: 100,
      aperture: 1.8,
      shutterSeconds: 1 / 500,
      focalLengthMm: 24,
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
  const logoNode = findSceneLogoNode(latestScene);
  const brandNode = textNodes.find((node) => node.value === "由 Apple iPhone 15 Pro 拍摄");

  expect(textNodes).toHaveLength(1);
  expect(logoNode).toBeTruthy();
  expect(brandNode).toBeTruthy();

  if (!logoNode || !brandNode) {
    throw new Error("Expected centered logo and brand line in centered brand meta scene.");
  }

  expect(brandNode.frame.y).toBeGreaterThan(logoNode.frame.y + logoNode.frame.height);
});

test("applies style color controls to canvas, text, and logo rendering", async () => {
  const store = createStore();
  const file = new File(["binary"], "photo.jpg", { type: "image/jpeg" });
  vi.mocked(metadataService.extractMetadata).mockResolvedValue({
    camera: { make: "Nikon", model: "Z 6_2" },
    exposure: {
      iso: 125,
      aperture: 3.5,
      shutterSeconds: 1 / 1600,
      focalLengthMm: 50,
    },
    location: { latitude: null, longitude: null },
    shotTime: null,
  });

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "classic-info-strip",
  });
  await store.set(editorDispatchAtom, {
    type: "editor/set-control",
    payload: { id: "canvasBackground", value: "#123456" },
  });
  await store.set(editorDispatchAtom, {
    type: "editor/set-control",
    payload: { id: "textColor", value: "#fedcba" },
  });
  await store.set(editorDispatchAtom, {
    type: "editor/set-control",
    payload: { id: "logoColor", value: "#00ff00" },
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
  expect(latestScene?.canvas.background).toBe("#123456");
  const textNodes = (latestScene?.nodes ?? []).filter((node) => node.type === "text");
  expect(textNodes.length).toBeGreaterThan(0);
  expect(textNodes.every((node) => node.color === "#fedcba")).toBe(true);
  const logoAssetCall = vi.mocked(loadImageAsset).mock.calls.find(([input]) => {
    return typeof input === "string" && input.includes("#00ff00");
  });
  expect(logoAssetCall).toBeTruthy();
});

test("uses canvas background color for the minimal info strip footer background", async () => {
  const store = createStore();
  const file = new File(["binary"], "photo.jpg", { type: "image/jpeg" });
  vi.mocked(metadataService.extractMetadata).mockResolvedValue({
    camera: { make: "Apple", model: "iPhone 14 Pro" },
    exposure: {
      iso: 32,
      aperture: 2.8,
      shutterSeconds: 1 / 630,
      focalLengthMm: 9,
    },
    location: { latitude: null, longitude: null },
    shotTime: null,
  });

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "minimal-info-strip",
  });
  await store.set(editorDispatchAtom, {
    type: "editor/set-control",
    payload: { id: "canvasBackground", value: "#123456" },
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
  expect(latestScene?.canvas.background).toBe("#123456");

  const footerBackgroundNode = (latestScene?.nodes ?? []).find(
    (node) => node.type === "rect" && node.frame.height > 0,
  );
  expect(footerBackgroundNode).toBeTruthy();

  if (!footerBackgroundNode || footerBackgroundNode.type !== "rect") {
    throw new Error("Expected a footer background rect in minimal info strip scene.");
  }

  expect(footerBackgroundNode.fill).toBe("#123456");
});

test("keeps wide camera brand wordmarks from being stretched into square boxes", async () => {
  const store = createStore();
  const file = new File(["binary"], "photo.jpg", { type: "image/jpeg" });
  vi.mocked(metadataService.extractMetadata).mockResolvedValue({
    camera: { make: "Canon", model: "R5" },
    exposure: {
      iso: 100,
      aperture: 4,
      shutterSeconds: 1 / 250,
      focalLengthMm: 35,
    },
    location: { latitude: null, longitude: null },
    shotTime: null,
  });
  vi.mocked(loadImageAsset).mockImplementation(async (input) => {
    if (input instanceof File) {
      return {
        source: {} as CanvasImageSource,
        width: 1600,
        height: 900,
        dispose: vi.fn(),
      };
    }

    return {
      source: {} as CanvasImageSource,
      width: 320,
      height: 64,
      dispose: vi.fn(),
    };
  });

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "centered-device-mark",
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

  expect(
    vi
      .mocked(loadImageAsset)
      .mock.calls.some(
        ([input]) => typeof input === "string" && input.includes('viewBox="0 0 1000.04 209.153"'),
      ),
  ).toBe(true);

  const latestScene = vi.mocked(renderCanvas).mock.calls.at(-1)?.[1];
  const imageNodes = (latestScene?.nodes ?? []).filter((node) => node.type === "image");
  const logoNode = imageNodes
    .slice()
    .sort(
      (left, right) =>
        left.frame.width * left.frame.height - right.frame.width * right.frame.height,
    )
    .at(0);

  expect(logoNode?.type).toBe("image");
  if (!logoNode || logoNode.type !== "image") {
    throw new Error("Expected logo node in centered device mark scene.");
  }

  expect(logoNode.frame.width).toBeGreaterThan(logoNode.frame.height * 2);
});

test("scales camera brand logos with the logo size control while keeping them vertically centered", async () => {
  const store = createStore();
  const file = new File(["binary"], "photo.jpg", { type: "image/jpeg" });
  vi.mocked(metadataService.extractMetadata).mockResolvedValue({
    camera: { make: "Canon", model: "R5" },
    exposure: {
      iso: 100,
      aperture: 4,
      shutterSeconds: 1 / 250,
      focalLengthMm: 35,
    },
    location: { latitude: null, longitude: null },
    shotTime: null,
  });
  vi.mocked(loadImageAsset).mockImplementation(async (input) => {
    if (input instanceof File) {
      return {
        source: {} as CanvasImageSource,
        width: 1600,
        height: 900,
        dispose: vi.fn(),
      };
    }

    return {
      source: {} as CanvasImageSource,
      width: 320,
      height: 64,
      dispose: vi.fn(),
    };
  });

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "centered-device-mark",
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

  const initialScene = vi.mocked(renderCanvas).mock.calls.at(-1)?.[1];
  const initialLogoNode = findSceneLogoNode(initialScene);
  expect(initialLogoNode?.type).toBe("image");
  if (!initialLogoNode || initialLogoNode.type !== "image") {
    throw new Error("Expected initial logo node.");
  }
  expect(initialLogoNode.frame.width).toBeCloseTo(110, 5);
  expect(initialLogoNode.frame.height).toBeCloseTo(52, 5);

  await store.set(editorDispatchAtom, {
    type: "editor/set-control",
    payload: { id: "logoScale", value: 2 },
  });

  await waitFor(() => {
    const nextScene = vi.mocked(renderCanvas).mock.calls.at(-1)?.[1];
    const nextLogoNode = findSceneLogoNode(nextScene);
    expect(nextLogoNode?.type).toBe("image");
    if (!nextLogoNode || nextLogoNode.type !== "image") {
      throw new Error("Expected scaled logo node.");
    }
    expect(nextLogoNode.frame.width).toBeGreaterThan(initialLogoNode.frame.width);
    expect(nextLogoNode.frame.height).toBeGreaterThan(initialLogoNode.frame.height);
    expect(nextLogoNode.frame.y).toBeLessThan(initialLogoNode.frame.y);
  });
});

test("uses noto sans by default and updates text font family when typography theme changes", async () => {
  const store = createStore();
  const file = new File(["binary"], "photo.jpg", { type: "image/jpeg" });
  vi.mocked(metadataService.extractMetadata).mockResolvedValue({
    camera: { make: "Nikon", model: "Z 6_2" },
    exposure: {
      iso: 125,
      aperture: 3.5,
      shutterSeconds: 1 / 1600,
      focalLengthMm: 50,
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

  await waitFor(() => {
    expect(renderCanvas).toHaveBeenCalled();
  });

  const defaultScene = vi.mocked(renderCanvas).mock.calls.at(-1)?.[1];
  const defaultTextNode = (defaultScene?.nodes ?? []).find((node) => node.type === "text");
  expect(defaultTextNode?.type).toBe("text");
  if (!defaultTextNode || defaultTextNode.type !== "text") {
    throw new Error("Expected a text node in default scene.");
  }
  expect(defaultTextNode.font).toContain('"Noto Sans Variable"');

  await store.set(editorDispatchAtom, {
    type: "editor/set-control",
    payload: { id: "typographyTheme", value: "editorial" },
  });

  await waitFor(() => {
    const editorialScene = vi.mocked(renderCanvas).mock.calls.at(-1)?.[1];
    const editorialTextNode = (editorialScene?.nodes ?? []).find((node) => node.type === "text");
    expect(editorialTextNode?.type).toBe("text");
    if (!editorialTextNode || editorialTextNode.type !== "text") {
      throw new Error("Expected a text node in editorial scene.");
    }
    expect(editorialTextNode.font).toContain('"Noto Serif Variable"');
  });

  await store.set(editorDispatchAtom, {
    type: "editor/set-control",
    payload: { id: "typographyTheme", value: "mono" },
  });

  await waitFor(() => {
    const monoScene = vi.mocked(renderCanvas).mock.calls.at(-1)?.[1];
    const monoTextNode = (monoScene?.nodes ?? []).find((node) => node.type === "text");
    expect(monoTextNode?.type).toBe("text");
    if (!monoTextNode || monoTextNode.type !== "text") {
      throw new Error("Expected a text node in mono scene.");
    }
    expect(monoTextNode.font).toContain('"JetBrains Mono Variable"');
  });
});

test("includes schema-backed metadata fields in the classic info strip render scene", async () => {
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

  await waitFor(() => {
    expect(renderCanvas).toHaveBeenCalled();
  });

  const latestScene = vi.mocked(renderCanvas).mock.calls.at(-1)?.[1];
  expect(latestScene).toBeTruthy();
  const textValues = (latestScene?.nodes ?? [])
    .filter((node) => node.type === "text")
    .map((node) => node.value);
  const imageNodes = (latestScene?.nodes ?? []).filter((node) => node.type === "image");
  const imageNodeCount = imageNodes.length;
  const metadataNode = (latestScene?.nodes ?? []).find((node) => {
    return node.type === "text" && node.value.includes("28mm");
  });
  const logoNode = findSceneLogoNode(latestScene);

  expect(textValues).toContain("28mm • f/1.7 • 1/125s • ISO 400");
  expect(textValues).not.toContain("Q2");
  expect(imageNodeCount).toBeGreaterThan(1);
  expect(metadataNode).toBeTruthy();
  expect(logoNode).toBeTruthy();

  if (!metadataNode || !logoNode) {
    throw new Error("Expected logo and metadata nodes in classic info strip scene.");
  }

  expect(logoNode.frame.x).toBeGreaterThan(metadataNode.frame.x + metadataNode.frame.width);
});

test("keeps minimal info strip metadata below the photo content", async () => {
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
    templateId: "minimal-info-strip",
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

  const photoNode = latestScene?.nodes.find(
    (node) => node.type === "image" && node.frame.width > 100,
  );
  const cameraNode = latestScene?.nodes.find(
    (node) => node.type === "text" && node.value.includes("Q2"),
  );
  const logoNode = findSceneLogoNode(latestScene);
  const footerBackgroundNode = latestScene?.nodes.find((node) => node.type === "rect");

  expect(photoNode).toBeTruthy();
  expect(cameraNode).toBeTruthy();
  expect(logoNode).toBeTruthy();
  expect(footerBackgroundNode).toBeTruthy();

  if (!photoNode || !cameraNode || !logoNode || !footerBackgroundNode) {
    throw new Error(
      "Expected photo, footer background, camera text, and logo nodes in minimal info strip scene.",
    );
  }

  expect(photoNode.frame.x).toBe(0);
  expect(photoNode.frame.y).toBe(0);
  expect(footerBackgroundNode.frame.y).toBe(photoNode.frame.y + photoNode.frame.height);
  expect(cameraNode.frame.y).toBeGreaterThanOrEqual(footerBackgroundNode.frame.y);
  expect(cameraNode.frame.y + cameraNode.frame.height).toBeLessThanOrEqual(
    footerBackgroundNode.frame.y + footerBackgroundNode.frame.height,
  );
  expect(logoNode.frame.x).toBeGreaterThan(cameraNode.frame.x + cameraNode.frame.width);
  expect(logoNode.frame.x + logoNode.frame.width).toBeLessThanOrEqual(
    footerBackgroundNode.frame.x + footerBackgroundNode.frame.width - 22,
  );
  expect(logoNode.frame.y).toBeGreaterThanOrEqual(footerBackgroundNode.frame.y);
  expect(logoNode.frame.y + logoNode.frame.height).toBeLessThanOrEqual(
    footerBackgroundNode.frame.y + footerBackgroundNode.frame.height,
  );
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
  const imageNode = findImageNode(resolveLayoutInput.layout, (node) => node.binding === "photo");
  expect(imageNode).toBeDefined();
  if (imageNode === undefined) {
    throw new Error("Expected a photo image node in the layout tree.");
  }
  expect(imageNode.intrinsicSize).toEqual({ width: 900, height: 1600 });
});

test("uses preset-synced control state when output ratio changes before preview layout resolves", async () => {
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
  const resolveLayoutSpy = vi.spyOn(layoutService, "resolveLayout");

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "classic-info-strip",
  });
  await store.set(editorDispatchAtom, { type: "import-image", sourceFile: file });
  await store.set(editorDispatchAtom, {
    type: "editor/set-control",
    payload: { id: "canvasPaddingTop", value: 64 },
  });
  await store.set(editorDispatchAtom, {
    type: "editor/set-control",
    payload: { id: "canvasPaddingRight", value: 52 },
  });
  await store.set(editorDispatchAtom, {
    type: "editor/set-control",
    payload: { id: "canvasPaddingBottom", value: 20 },
  });
  await store.set(editorDispatchAtom, {
    type: "editor/set-control",
    payload: { id: "canvasPaddingLeft", value: 36 },
  });
  await store.set(editorDispatchAtom, {
    type: "editor/set-control",
    payload: { id: "imageFit", value: "contain" },
  });
  await store.set(editorDispatchAtom, {
    type: "editor/set-control",
    payload: { id: "outputRatio", value: "1:1" },
  });

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

  expect(resolveLayoutInput.canvas.padding).toEqual({
    top: 24,
    right: 24,
    bottom: 0,
    left: 24,
  });
  expect(resolveLayoutInput.canvas.width).toBe(1200);
  expect(resolveLayoutInput.canvas.height).toBe(1200);
  const imageNode = findImageNode(resolveLayoutInput.layout, (node) => node.binding === "photo");
  expect(imageNode).toBeDefined();
  if (imageNode === undefined) {
    throw new Error("Expected a photo image node in the layout tree.");
  }
  expect(imageNode.fit).toBe("cover");
});

test("treats non-original output ratio as preset selection and applies preset overrides within preview sizing", async () => {
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
  const resolveLayoutSpy = vi.spyOn(layoutService, "resolveLayout");

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "classic-info-strip",
  });
  await store.set(editorDispatchAtom, { type: "import-image", sourceFile: file });
  await store.set(editorDispatchAtom, {
    type: "editor/set-control",
    payload: { id: "outputRatio", value: "4:5" },
  });

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
    throw new Error("Expected captured resolveLayout input.");
  }

  expect(resolveLayoutInput.canvas.width).toBe(960);
  expect(resolveLayoutInput.canvas.height).toBe(1200);
  const imageNode = findImageNode(resolveLayoutInput.layout, (node) => node.binding === "photo");
  expect(imageNode).toBeDefined();
  if (imageNode === undefined) {
    throw new Error("Expected a photo image node in the layout tree.");
  }
  expect(imageNode.width).toBe("fill");
});

test("renders preview scene without finish controls", async () => {
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

  await waitFor(() => {
    expect(renderCanvas).toHaveBeenCalled();
  });

  const latestScene = vi.mocked(renderCanvas).mock.calls.at(-1)?.[1];
  expect(latestScene?.canvas.cornerRadius).toBeUndefined();
  expect(latestScene?.canvas.surfaceStyle).toBeUndefined();
  expect(latestScene?.canvas.surfaceInset).toBeUndefined();
});

test("removes the preview toolbar and uses the full viewport for the canvas", async () => {
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

  const { container } = render(
    <Provider store={store}>
      <PreviewStage />
    </Provider>,
  );

  await waitFor(() => {
    expect(renderCanvas).toHaveBeenCalled();
  });

  expect(container.querySelector(".editor-preview-toolbar")).toBeNull();
  expect(container.querySelector(".editor-preview-zoom")).toBeNull();
  expect(container.querySelector(".editor-preview-canvas-wrap-live")).not.toHaveClass("pb-14");
  expect(container.querySelector(".editor-preview-canvas-wrap-live")).not.toHaveClass(
    "min-[781px]:pb-18",
  );
});

test("fit mode keeps the preview centered at 90 percent of the mobile viewport", async () => {
  const store = createStore();
  const file = new File(["binary"], "photo.jpg", { type: "image/jpeg" });
  const sourceContext = {
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    fillText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
  const previewDrawImage = vi.fn();
  const previewContext = {
    clearRect: vi.fn(),
    drawImage: previewDrawImage,
    scale: vi.fn(),
    setTransform: vi.fn(),
  } as unknown as CanvasRenderingContext2D;

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

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    function getContext(this: HTMLCanvasElement) {
      return this.isConnected ? previewContext : sourceContext;
    },
  );
  vi.spyOn(HTMLDivElement.prototype, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    bottom: 720,
    right: 960,
    width: 960,
    height: 720,
    toJSON: () => ({}),
  });
  globalThis.ResizeObserver = class ResizeObserver {
    private readonly callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }

    disconnect() {}

    observe() {
      this.callback([], this);
    }

    unobserve() {}
  } as typeof ResizeObserver;

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
    expect(previewDrawImage).toHaveBeenCalled();
  });

  const latestCall = previewDrawImage.mock.calls.at(-1);
  expect(latestCall).toBeDefined();
  expect(latestCall?.[1]).toBeCloseTo(144, 5);
  expect(latestCall?.[2]).toBeCloseTo(171, 5);
  expect(latestCall?.[3]).toBeCloseTo(672, 5);
  expect(latestCall?.[4]).toBeCloseTo(378, 5);
});

test("re-renders brand text when a schema-backed template control changes", async () => {
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

  await store.set(editorDispatchAtom, {
    type: "editor/set-template-control",
    payload: { id: "cameraModel", value: "Desk Proof" },
  });

  await waitFor(() => {
    const latestScene = vi.mocked(renderCanvas).mock.calls.at(-1)?.[1];
    const textValues = latestScene?.nodes
      .filter((node) => node.type === "text")
      .map((node) => node.value);

    expect(textValues).toContain("Desk Proof");
  });
});

test("keeps the previous preview frame visible while a settings-triggered repaint is still pending", async () => {
  const store = createStore();
  const file = new File(["binary"], "photo.jpg", { type: "image/jpeg" });
  const previewClearRect = vi.fn();
  const previewDrawImage = vi.fn();
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

  const previewContext = {
    setTransform: vi.fn(),
    clearRect: previewClearRect,
    scale: vi.fn(),
    drawImage: previewDrawImage,
  } as unknown as CanvasRenderingContext2D;
  const sourceContext = {
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
  } as unknown as CanvasRenderingContext2D;

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    function getContext(this: HTMLCanvasElement) {
      return this.isConnected ? previewContext : sourceContext;
    },
  );
  vi.spyOn(HTMLDivElement.prototype, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    bottom: 720,
    right: 960,
    width: 960,
    height: 720,
    toJSON: () => ({}),
  });
  const resizeObserverCallback: { current: ResizeObserverCallback | null } = { current: null };
  globalThis.ResizeObserver = class ResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      resizeObserverCallback.current = callback;
    }

    disconnect() {}

    observe() {
      resizeObserverCallback.current?.([], this);
    }

    unobserve() {}
  } as typeof ResizeObserver;

  const pendingRepaint = createDeferred<void>();
  vi.mocked(renderCanvas)
    .mockResolvedValueOnce(undefined)
    .mockImplementationOnce(() => pendingRepaint.promise)
    .mockResolvedValue(undefined);

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
    expect(renderCanvas).toHaveBeenCalledTimes(1);
    expect(previewDrawImage).toHaveBeenCalled();
  });

  const clearCountBeforeControlChange = previewClearRect.mock.calls.length;

  await store.set(editorDispatchAtom, {
    type: "editor/set-control",
    payload: { id: "textColor", value: "#ffffff" },
  });

  await waitFor(() => {
    expect(renderCanvas).toHaveBeenCalledTimes(2);
  });

  expect(previewClearRect).toHaveBeenCalledTimes(clearCountBeforeControlChange);

  pendingRepaint.resolve();

  await waitFor(() => {
    expect(previewDrawImage.mock.calls.length).toBeGreaterThan(1);
  });
});
