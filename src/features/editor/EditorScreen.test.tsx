import { cleanup, render, screen } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vite-plus/test";
import {
  editorCardEnabledAtom,
  editorControlsAtom,
  editorDispatchAtom,
  fieldOverridesAtom,
} from "../../app/app-state";
import { EditorScreen } from "./EditorScreen";
import { makeLoadedEditorProps, makePendingEditorProps } from "./test-fixtures";

afterEach(() => {
  cleanup();
});

test("shows an image importer before a photo is loaded", () => {
  render(<EditorScreen {...makePendingEditorProps()} />);

  expect(screen.getByRole("button", { name: /add photo/i })).toBeInTheDocument();
});

test("shows desktop style, preview, export, and data panels after a photo is loaded", () => {
  render(<EditorScreen {...makeLoadedEditorProps()} />);

  expect(screen.getByRole("region", { name: /style panel/i })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: /preview stage/i })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: /export panel/i })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: /data panel/i })).toBeInTheDocument();
  expect(screen.getByText(/current template/i)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /switch template/i })).not.toBeInTheDocument();
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
