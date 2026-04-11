import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
import { getCameraBrandIcon, renderSimpleIconSvg } from "../../icons/camera-brand-icons";
import * as metadataService from "../../services/metadata/extract-metadata";
import { shareImage } from "../../services/export/share-image";
import { loadImageAsset } from "../../template-engine/render/load-image-asset";
import { renderCanvas } from "../../template-engine/render/render-canvas";
import { templates } from "../../template-engine/templates";
import { EditorScreen } from "./EditorScreen";
import { makeLoadedEditorProps, makePendingEditorProps } from "./test-fixtures";

vi.mock("../../services/metadata/extract-metadata", () => ({
  extractMetadata: vi.fn(),
}));

vi.mock("../../services/export/share-image", () => ({
  shareImage: vi.fn(async () => ({ method: "share" as const })),
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
  vi.mocked(shareImage).mockReset();
  vi.mocked(shareImage).mockResolvedValue({ method: "share" });
  vi.mocked(loadImageAsset).mockReset();
  vi.mocked(loadImageAsset).mockResolvedValue({
    source: {} as CanvasImageSource,
    width: 1600,
    height: 900,
    dispose: vi.fn(),
  });
  vi.mocked(renderCanvas).mockReset();
});

async function renderLoadedEditorScreen(
  overrides: Parameters<typeof makeLoadedEditorProps>[0] = {},
) {
  const props = makeLoadedEditorProps(overrides);
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

async function renderPendingEditorScreen(
  overrides: Parameters<typeof makePendingEditorProps>[0] = {},
) {
  const props = makePendingEditorProps(overrides);
  const store = createStore();

  await store.set(editorDispatchAtom, {
    type: "select-template",
    templateId: props.template.id,
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

test("shows the full workspace shell with a media placeholder before a photo is loaded", async () => {
  await renderPendingEditorScreen();

  expect(screen.getByRole("region", { name: /template and style rail/i })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: /preview workspace/i })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: /export and data rail/i })).toBeInTheDocument();
  expect(
    screen.getByRole("tab", { name: /preset templates/i, selected: true }),
  ).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: /detailed settings/i })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: /data panel/i })).toBeInTheDocument();
  expect(
    screen.getByRole("img", { name: /classic info strip template preview/i }),
  ).toBeInTheDocument();
  expect(screen.getByText(/add an image above to start editing/i)).toBeInTheDocument();
  expect(screen.getByText(/import a photo to review the template fields/i)).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: /camera model/i })).not.toBeInTheDocument();
});

test("preserves function-valued button className while appending workspace variants", () => {
  render(
    <Button className={() => "from-fn"} size="sm" variant="default">
      Export
    </Button>,
  );

  expect(screen.getByRole("button", { name: /export/i })).toHaveClass(
    "from-fn",
    "group/button",
    "h-7",
  );
});

test("renders the desktop workspace shell with rails, top export CTA, and library return path", async () => {
  await renderLoadedEditorScreen();

  const styleRail = screen.getByRole("region", { name: /template and style rail/i });
  const previewWorkspace = screen.getByRole("region", { name: /preview workspace/i });
  const rightRail = screen.getByRole("region", { name: /export and data rail/i });
  const exportPanel = within(rightRail).getByRole("region", { name: /export panel/i });
  const dataPanel = within(rightRail).getByRole("region", { name: /data panel/i });

  expect(styleRail).toBeInTheDocument();
  expect(previewWorkspace).toBeInTheDocument();
  expect(exportPanel).toBeInTheDocument();
  expect(dataPanel).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /export png/i })).toBeInTheDocument();
  expect(screen.queryByText(/template locked/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/awaiting photo/i)).not.toBeInTheDocument();
  expect(screen.getByRole("tab", { name: /preset templates/i })).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: /detailed settings/i })).toBeInTheDocument();
});

test("defaults to the dark editor theme", async () => {
  const { container } = await renderLoadedEditorScreen();

  const editor = container.querySelector(".editor-screen");
  expect(editor).not.toBeNull();
  expect(editor).toHaveAttribute("data-theme", "dark");
});

test("renders desktop style rail sections and design-aligned control groups", async () => {
  await renderLoadedEditorScreen();

  await userEvent.setup().click(screen.getByRole("tab", { name: /detailed settings/i }));
  const styleRail = screen.getByRole("region", { name: /template and style rail/i });

  expect(within(styleRail).getByRole("heading", { name: /^canvas$/i })).toBeInTheDocument();
  expect(within(styleRail).getByRole("button", { name: /^original$/i })).toBeInTheDocument();
  expect(within(styleRail).getByRole("button", { name: /^fit$/i })).toBeInTheDocument();
  expect(within(styleRail).getByLabelText(/^padding top$/i)).toBeInTheDocument();
  expect(within(styleRail).getByLabelText(/^padding right$/i)).toBeInTheDocument();
  expect(within(styleRail).getByLabelText(/^padding bottom$/i)).toBeInTheDocument();
  expect(within(styleRail).getByLabelText(/^padding left$/i)).toBeInTheDocument();
  expect(within(styleRail).getByLabelText(/^canvas background$/i)).toBeInTheDocument();
  expect(within(styleRail).getByLabelText(/^text color$/i)).toBeInTheDocument();
  expect(within(styleRail).getByLabelText(/^logo color$/i)).toBeInTheDocument();
  expect(within(styleRail).getByLabelText(/^logo size$/i)).toBeInTheDocument();
  expect(within(styleRail).getByRole("heading", { name: /^type$/i })).toBeInTheDocument();
  expect(within(styleRail).getByRole("heading", { name: /^brand$/i })).toBeInTheDocument();
  expect(
    within(styleRail).queryByText(/set the export ratio and how the photo sits inside the frame/i),
  ).not.toBeInTheDocument();
  expect(
    within(styleRail).queryByText(/choose the font treatment used by the template family/i),
  ).not.toBeInTheDocument();
  expect(
    within(styleRail).queryByText(
      /adjust the brand anchor without changing which template is loaded/i,
    ),
  ).not.toBeInTheDocument();
});

test("switching templates from the preset tab activates the detailed settings tab", async () => {
  const user = userEvent.setup();
  await renderPendingEditorScreen();

  await user.click(screen.getByRole("button", { name: /apply template centered brand \+ meta/i }));

  expect(
    screen.getByRole("tab", { name: /detailed settings/i, selected: true }),
  ).toBeInTheDocument();
});

test("persists style-rail control updates through app state after a remount", async () => {
  const user = userEvent.setup();
  const { store, rerender, props } = await renderLoadedEditorScreen();

  await user.click(screen.getByRole("tab", { name: /detailed settings/i }));
  const paddingInput = screen.getByLabelText(/^padding top$/i);
  await user.clear(paddingInput);
  await user.type(paddingInput, "64");

  expect(store.get(editorControlsAtom).canvasPaddingTop).toBe(64);

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

  expect(screen.getByLabelText(/^padding top$/i)).toHaveValue(64);
});

test("persists color control updates through app state after a remount", async () => {
  const user = userEvent.setup();
  const { store, rerender, props } = await renderLoadedEditorScreen();

  await user.click(screen.getByRole("tab", { name: /detailed settings/i }));
  const backgroundInput = screen.getByLabelText(/^canvas background$/i);
  fireEvent.change(backgroundInput, { target: { value: "#123456" } });

  expect(store.get(editorControlsAtom).canvasBackground).toBe("#123456");

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

  expect(screen.getByLabelText(/^canvas background$/i)).toHaveValue("#123456");
});

test("initial canvas background comes from the template canvas definition", async () => {
  const template = templates.find((entry) => entry.id === "classic-info-strip")!;
  const { store } = await renderLoadedEditorScreen({ template });

  expect(store.get(editorControlsAtom).canvasBackground).toBe(template.canvas.background);
});

test("initial text and logo colors come from template node definitions", async () => {
  const template = templates.find((entry) => entry.id === "classic-info-strip")!;
  const { store } = await renderLoadedEditorScreen({ template });

  expect(store.get(editorControlsAtom).textColor).toBe("#000000");
  expect(store.get(editorControlsAtom).logoColor).toBe("#000000");
});

test("shows card state messaging only for fields used by the selected template", async () => {
  await renderLoadedEditorScreen();

  const placeholderCard = screen.getByRole("heading", { name: /^location$/i }).closest("article");
  const brandCard = screen.getByRole("heading", { name: /brand mark/i }).closest("article");

  expect(placeholderCard).not.toBeNull();
  expect(brandCard).not.toBeNull();

  expect(screen.getByRole("heading", { name: /shooting parameters/i })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: /camera model/i })).not.toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: /^author$/i })).not.toBeInTheDocument();
  expect(within(placeholderCard!).getByText(/^missing$/i)).toBeInTheDocument();
  expect(within(placeholderCard!).queryByText(/required by template/i)).not.toBeInTheDocument();
  expect(
    within(brandCard!).getByRole("combobox", { name: /camera brand logo/i }),
  ).toBeInTheDocument();
});

test("required data cards are non-collapsible in the redesigned card ui", async () => {
  const { store } = await renderLoadedEditorScreen();
  const parametersCard = screen
    .getByRole("heading", { name: /shooting parameters/i })
    .closest("article");

  expect(parametersCard).not.toBeNull();
  expect(
    within(parametersCard!).queryByRole("switch", { name: /display shooting parameters/i }),
  ).not.toBeInTheDocument();
  expect(store.get(editorCardEnabledAtom)["shooting-parameters"]).toBe(true);
});

test("renders a brand selector for camera brand logo cards and stores the manual selection", async () => {
  const user = userEvent.setup();
  const centeredBrandMetaTemplate = templates.find(
    (template) => template.id === "centered-brand-meta",
  );
  if (!centeredBrandMetaTemplate) {
    throw new Error("Expected centered-brand-meta template fixture.");
  }

  const { store } = await renderLoadedEditorScreen({
    template: centeredBrandMetaTemplate,
  });

  const brandCard = screen.getByRole("heading", { name: /brand mark/i }).closest("article");
  expect(brandCard).not.toBeNull();

  const selector = within(brandCard!).getByRole("combobox", { name: /camera brand logo/i });
  expect(selector).toBeInTheDocument();

  await user.click(selector);
  await user.click(screen.getByText(/^sony$/i));

  expect(store.get(fieldOverridesAtom).cameraBrandLogo).toBe("sony");
});

test("uses the selected camera brand logo in preview rendering", async () => {
  const user = userEvent.setup();
  const centeredBrandMetaTemplate = templates.find(
    (template) => template.id === "centered-brand-meta",
  );
  if (!centeredBrandMetaTemplate) {
    throw new Error("Expected centered-brand-meta template fixture.");
  }

  const { store } = await renderLoadedEditorScreen({
    template: centeredBrandMetaTemplate,
  });

  const sonyIcon = getCameraBrandIcon("Sony");
  if (!sonyIcon) {
    throw new Error("Expected Sony icon to exist.");
  }

  const selector = screen.getByRole("combobox", { name: /camera brand logo/i });
  await user.click(selector);
  await user.click(screen.getByText(/^sony$/i));

  await waitFor(() => {
    expect(vi.mocked(loadImageAsset)).toHaveBeenCalledWith(
      renderSimpleIconSvg(sonyIcon, 64, store.get(editorControlsAtom).logoColor),
    );
  });
});

test("shows the brand selector on classic info strip templates that render camera logos", async () => {
  await renderLoadedEditorScreen();

  const brandCard = screen.getByRole("heading", { name: /brand mark/i }).closest("article");
  expect(brandCard).not.toBeNull();
  expect(
    within(brandCard!).getByRole("combobox", { name: /camera brand logo/i }),
  ).toBeInTheDocument();
});

test("shows an explicit import error in pending-image state", async () => {
  await renderPendingEditorScreen({ importError: "Could not read image metadata." });

  expect(screen.getByText("Could not read image metadata.")).toBeInTheDocument();
});

test("shows binding expressions as the default manual value and preserves freeform input", async () => {
  const user = userEvent.setup();
  await renderLoadedEditorScreen();

  const input = screen.getByRole("textbox", {
    name: /manual value for shooting parameters/i,
  }) as HTMLInputElement;
  expect(input).toHaveValue("{shootingParameters}");

  await user.type(input, " custom intro");
  expect(input).toHaveValue("{shootingParameters} custom intro");

  await user.tab();
  expect(input).toHaveValue("{shootingParameters} custom intro");
});

test("typing an opening brace auto-opens field suggestions and replaces the active token query", async () => {
  const user = userEvent.setup();
  const { store } = await renderLoadedEditorScreen();

  const input = screen.getByRole("textbox", {
    name: /manual value for shooting parameters/i,
  }) as HTMLInputElement;

  fireEvent.change(input, {
    target: { value: "prefix {sh", selectionStart: 10, selectionEnd: 10 },
  });

  expect(screen.getByRole("option", { name: "{shootingParameters}" })).toBeInTheDocument();

  await user.click(screen.getByRole("option", { name: "{shootingParameters}" }));

  expect(store.get(fieldOverridesAtom).shootingParameters).toBe("prefix {shootingParameters}");
  expect(input).toHaveValue("prefix {shootingParameters}");
});

test("token search matches field ids without requiring braces", async () => {
  await renderLoadedEditorScreen();

  const input = screen.getByRole("textbox", {
    name: /manual value for shooting parameters/i,
  }) as HTMLInputElement;
  fireEvent.change(input, {
    target: { value: "{shooti", selectionStart: 7, selectionEnd: 7 },
  });

  expect(screen.getByRole("option", { name: "{shootingParameters}" })).toBeInTheDocument();
});

test("does not render a separate token insert button", async () => {
  await renderLoadedEditorScreen();

  expect(
    screen.queryByRole("button", { name: /insert field token for shooting parameters/i }),
  ).not.toBeInTheDocument();
});

test("keyboard navigation can tab into suggestions, move selection, and confirm with enter", async () => {
  const user = userEvent.setup();
  const { store } = await renderLoadedEditorScreen();

  const input = screen.getByRole("textbox", {
    name: /manual value for shooting parameters/i,
  }) as HTMLInputElement;

  fireEvent.change(input, {
    target: { value: "{", selectionStart: 1, selectionEnd: 1 },
  });
  input.focus();

  const options = screen.getAllByRole("option");
  expect(options.length).toBeGreaterThan(1);

  await user.tab();
  expect(options[0]).toHaveFocus();

  await user.keyboard("{ArrowDown}");
  expect(options[1]).toHaveFocus();

  await user.keyboard("{Enter}");

  const insertedValue = options[1].textContent;
  expect(insertedValue).toBeTruthy();
  expect(store.get(fieldOverridesAtom).shootingParameters).toBe(insertedValue);
  expect(input).toHaveValue(insertedValue);
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

  expect(screen.getByRole("button", { name: /export png/i })).toBeDisabled();
  expect(screen.getByRole("button", { name: /share image/i })).toBeDisabled();
});

test("clicking the share button directly invokes sharing without opening a popover", async () => {
  const user = userEvent.setup();

  await renderLoadedEditorScreen();

  await waitFor(() => {
    expect(screen.getByRole("button", { name: /share image/i })).toBeEnabled();
  });

  await user.click(screen.getByRole("button", { name: /share image/i }));

  await waitFor(() => {
    expect(vi.mocked(shareImage)).toHaveBeenCalledTimes(1);
  });
  expect(screen.queryByRole("button", { name: /share or download/i })).not.toBeInTheDocument();
});

test("keeps the export button label unchanged when the share sheet is canceled", async () => {
  const user = userEvent.setup();
  vi.mocked(shareImage).mockRejectedValueOnce(new DOMException("Share canceled", "AbortError"));

  await renderLoadedEditorScreen();

  await waitFor(() => {
    expect(screen.getByRole("button", { name: /share image/i })).toBeEnabled();
  });

  const exportButton = screen.getByRole("button", { name: /export png/i });
  expect(exportButton).toHaveTextContent("Export PNG · 1x");

  await user.click(screen.getByRole("button", { name: /share image/i }));

  await waitFor(() => {
    expect(vi.mocked(shareImage)).toHaveBeenCalledTimes(1);
  });

  expect(exportButton).toHaveTextContent("Export PNG · 1x");
  expect(exportButton).not.toHaveTextContent("Share canceled");
});

test("exports by re-rendering at the requested output size instead of scaling the preview bitmap", async () => {
  const user = userEvent.setup();
  const { store } = await renderLoadedEditorScreen();

  await store.set(editorDispatchAtom, {
    type: "editor/set-export-option",
    payload: { id: "multiplier", value: 3 },
  });

  await waitFor(() => {
    expect(screen.getByRole("button", { name: /export png/i })).toBeEnabled();
  });

  const previewRenderCount = vi.mocked(renderCanvas).mock.calls.length;

  await user.click(screen.getByRole("button", { name: /export png/i }));

  await waitFor(() => {
    expect(vi.mocked(renderCanvas).mock.calls.length).toBeGreaterThan(previewRenderCount);
  });

  const latestCall = vi.mocked(renderCanvas).mock.calls.at(-1);
  if (!latestCall) {
    throw new Error("Expected export render call.");
  }

  expect(latestCall[1].canvas.width).toBe(3600);
  expect(latestCall[1].canvas.height).toBe(2025);
  const textNode = latestCall[1].nodes.find((node) => node.type === "text");
  expect(textNode?.font).toContain("51px");
  expect(textNode?.lineHeight).toBe(66);
});
