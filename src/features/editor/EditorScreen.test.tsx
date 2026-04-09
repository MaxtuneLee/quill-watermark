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

test("shows an image importer before a photo is loaded", () => {
  render(<EditorScreen {...makePendingEditorProps()} />);

  expect(screen.getByRole("button", { name: /add photo/i })).toBeInTheDocument();
});

test("renders the desktop workspace shell with rails, top export CTA, and library return path", () => {
  render(<EditorScreen {...makeLoadedEditorProps()} />);

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

test("updates canvas padding from the style panel", async () => {
  const user = userEvent.setup();
  const props = makeLoadedEditorProps();
  const store = createStore();

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: props.template.id,
  });

  render(
    <Provider store={store}>
      <EditorScreen
        {...props}
        dispatch={(action) => {
          void store.set(editorDispatchAtom, action);
        }}
      />
    </Provider>,
  );

  const input = screen.getByLabelText(/canvas padding/i);
  await user.clear(input);
  await user.type(input, "64");

  expect(store.get(editorControlsAtom).canvasPadding).toBe(64);
});

test("toggles a data card from the data panel", async () => {
  const user = userEvent.setup();
  const props = makeLoadedEditorProps();
  const store = createStore();

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: props.template.id,
  });

  render(
    <Provider store={store}>
      <EditorScreen
        {...props}
        dispatch={(action) => {
          void store.set(editorDispatchAtom, action);
        }}
      />
    </Provider>,
  );

  await user.click(screen.getByRole("switch", { name: /show camera model/i }));

  expect(store.get(editorCardEnabledAtom)["camera-model"]).toBe(false);
});

test("updates a manual override from the data panel", async () => {
  const user = userEvent.setup();
  const props = makeLoadedEditorProps();
  const store = createStore();

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: props.template.id,
  });

  render(
    <Provider store={store}>
      <EditorScreen
        {...props}
        dispatch={(action) => {
          void store.set(editorDispatchAtom, action);
        }}
      />
    </Provider>,
  );

  const input = screen.getByLabelText(/author override/i);
  await user.clear(input);
  await user.type(input, "By Harbor Studio");

  expect(store.get(fieldOverridesAtom).authorLine).toBe("By Harbor Studio");
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
