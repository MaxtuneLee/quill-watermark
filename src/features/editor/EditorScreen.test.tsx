import { cleanup, render, screen, within } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";
import {
  editorCardEnabledAtom,
  editorControlsAtom,
  editorDispatchAtom,
  fieldOverridesAtom,
} from "../../app/app-state";
import { Button } from "../../components/ui";
import * as metadataService from "../../services/metadata/extract-metadata";
import { loadImageAsset } from "../../template-engine/render/load-image-asset";
import { renderCanvas } from "../../template-engine/render/render-canvas";
import { EditorScreen } from "./EditorScreen";
import { makeLoadedEditorProps, makePendingEditorProps } from "./test-fixtures";

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

afterEach(() => {
  cleanup();
});

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
    roundRect: vi.fn(),
    clip: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (callback) {
    callback?.(new Blob(["image"], { type: "image/png" }));
  });
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

async function renderLoadedEditorScreen() {
  const props = makeLoadedEditorProps();
  const store = createStore();

  vi.mocked(metadataService.extractMetadata).mockResolvedValue(props.instance.metadata);

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: props.template.id,
  });
  await store.set(editorDispatchAtom, {
    type: "import-image",
    sourceFile: props.instance.sourceFile,
  });

  const view = render(
    <Provider store={store}>
      <EditorScreen
        {...props}
        dispatch={(action) => {
          void store.set(editorDispatchAtom, action);
        }}
      />
    </Provider>,
  );

  return { props, store, ...view };
}

test("shows an image importer before a photo is loaded", () => {
  render(<EditorScreen {...makePendingEditorProps()} />);

  expect(screen.getByRole("button", { name: /add photo/i })).toBeInTheDocument();
});

test("preserves function-valued button className while appending workspace variants", () => {
  render(
    <Button className={() => "from-fn"} size="compact" variant="workspace-primary">
      Export
    </Button>,
  );

  expect(screen.getByRole("button", { name: /export/i })).toHaveClass(
    "from-fn",
    "ui-button-workspace-primary",
    "ui-button-size-compact",
  );
});

test("renders the desktop workspace shell with rails, top export CTA, and library return path", async () => {
  await renderLoadedEditorScreen();

  const styleRail = screen.getByRole("region", { name: /style rail/i });
  const previewWorkspace = screen.getByRole("region", { name: /preview workspace/i });
  const rightRail = screen.getByRole("region", { name: /export and data rail/i });
  const exportHeading = within(rightRail).getByRole("heading", { name: /^export$/i });
  const dataHeading = within(rightRail).getByRole("heading", { name: /^data$/i });

  expect(styleRail).toBeInTheDocument();
  expect(previewWorkspace).toBeInTheDocument();
  expect(rightRail).toContainElement(exportHeading);
  expect(rightRail).toContainElement(dataHeading);
  expect(
    exportHeading.compareDocumentPosition(dataHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(screen.getByRole("button", { name: /export png/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /back to library/i })).toBeInTheDocument();
  expect(screen.getByText(/template locked/i)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /switch template/i })).not.toBeInTheDocument();
  expect(screen.queryByRole("combobox", { name: /template/i })).not.toBeInTheDocument();
});

test("renders desktop style rail sections and design-aligned control groups", async () => {
  await renderLoadedEditorScreen();

  const styleRail = screen.getByRole("region", { name: /style rail/i });

  expect(within(styleRail).getByRole("heading", { name: /^canvas$/i })).toBeInTheDocument();
  expect(within(styleRail).getByText(/aspect ratio/i)).toBeInTheDocument();
  expect(within(styleRail).getByText(/image fill/i)).toBeInTheDocument();
  expect(within(styleRail).getByText(/^padding$/i)).toBeInTheDocument();
  expect(within(styleRail).getByRole("heading", { name: /^finish$/i })).toBeInTheDocument();
  expect(within(styleRail).getByText(/frame style/i)).toBeInTheDocument();
  expect(within(styleRail).getByText(/corner radius/i)).toBeInTheDocument();
  expect(within(styleRail).getByRole("heading", { name: /^type$/i })).toBeInTheDocument();
  expect(within(styleRail).getByText(/font style/i)).toBeInTheDocument();
  expect(within(styleRail).getByRole("heading", { name: /^brand$/i })).toBeInTheDocument();
  expect(within(styleRail).getByText(/brand position/i)).toBeInTheDocument();
});

test("persists style-rail control updates through app state after a remount", async () => {
  const user = userEvent.setup();
  const { store, rerender, props } = await renderLoadedEditorScreen();

  const paddingInput = screen.getByLabelText(/^padding$/i);
  await user.clear(paddingInput);
  await user.type(paddingInput, "64");

  expect(store.get(editorControlsAtom).canvasPadding).toBe(64);

  rerender(
    <Provider store={store}>
      <EditorScreen
        {...props}
        dispatch={(action) => {
          void store.set(editorDispatchAtom, action);
        }}
      />
    </Provider>,
  );

  expect(screen.getByLabelText(/^padding$/i)).toHaveValue(64);
});

test("shows card state messaging for auto, placeholder, and required missing values", async () => {
  await renderLoadedEditorScreen();

  const autoCard = screen.getByRole("heading", { name: /camera model/i }).closest("article");
  const placeholderCard = screen.getByRole("heading", { name: /^location$/i }).closest("article");

  expect(autoCard).not.toBeNull();
  expect(placeholderCard).not.toBeNull();

  expect(within(autoCard!).getByText(/^auto$/i)).toBeInTheDocument();
  expect(within(autoCard!).getByText("Q2")).toBeInTheDocument();
  expect(within(placeholderCard!).getByText(/^placeholder$/i)).toBeInTheDocument();
  expect(within(placeholderCard!).getByText("Location unavailable")).toBeInTheDocument();
  expect(within(placeholderCard!).getByText(/missing from photo metadata/i)).toBeInTheDocument();
  expect(within(placeholderCard!).getByText(/required by template/i)).toBeInTheDocument();
  expect(
    within(autoCard!).queryByRole("switch", { name: /display camera model/i }),
  ).not.toBeInTheDocument();
  expect(within(autoCard!).getByText(/always shown in this template/i)).toBeInTheDocument();
});

test("required data cards are non-collapsible in the redesigned card ui", async () => {
  const user = userEvent.setup();
  const { store } = await renderLoadedEditorScreen();
  const cameraCard = screen.getByRole("heading", { name: /camera model/i }).closest("article");

  expect(cameraCard).not.toBeNull();
  expect(
    within(cameraCard!).queryByRole("switch", { name: /display camera model/i }),
  ).not.toBeInTheDocument();
  expect(store.get(editorCardEnabledAtom)["camera-model"]).toBe(true);

  await user.click(within(cameraCard!).getByLabelText(/manual value for camera model/i));

  expect(store.get(editorCardEnabledAtom)["camera-model"]).toBe(true);
});

test("accepts manual overrides through the wrapped input and surfaces manual card state", async () => {
  const user = userEvent.setup();
  const { store } = await renderLoadedEditorScreen();

  const card = screen.getByRole("heading", { name: /^author$/i }).closest("article");
  expect(card).not.toBeNull();

  const input = within(card!).getByLabelText(/manual value/i);
  await user.clear(input);
  await user.type(input, "By Harbor Studio");

  expect(store.get(fieldOverridesAtom).authorLine).toBe("By Harbor Studio");
  expect(within(card!).getByText(/^manual$/i)).toBeInTheDocument();
  expect(within(card!).getByText("By Harbor Studio")).toBeInTheDocument();
});

test("shows an explicit import error in pending-image state", () => {
  render(
    <EditorScreen {...makePendingEditorProps({ importError: "Could not read image metadata." })} />,
  );

  expect(screen.getByRole("alert")).toHaveTextContent("Could not read image metadata.");
});

test("disables export actions until preview render is ready", async () => {
  const store = createStore();
  const pendingLoad = new Promise<Awaited<ReturnType<typeof loadImageAsset>>>(() => {});
  vi.mocked(metadataService.extractMetadata).mockResolvedValue(
    makeLoadedEditorProps().instance!.metadata,
  );
  vi.mocked(loadImageAsset).mockReturnValue(pendingLoad);
  const file = new File(["binary"], "photo.jpg", { type: "image/jpeg" });

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: "classic-info-strip",
  });
  await store.set(editorDispatchAtom, { type: "import-image", sourceFile: file });

  render(
    <Provider store={store}>
      <EditorScreen
        {...makeLoadedEditorProps({
          instance: { ...makeLoadedEditorProps().instance!, sourceFile: file },
        })}
        dispatch={(action) => {
          void store.set(editorDispatchAtom, action);
        }}
      />
    </Provider>,
  );

  expect(screen.getByRole("button", { name: /export image/i })).toBeDisabled();
  expect(screen.getByRole("button", { name: /share or download/i })).toBeDisabled();
});
