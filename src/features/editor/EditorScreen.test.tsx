import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vite-plus/test";
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

  render(<EditorScreen {...props} />);

  const input = screen.getByLabelText(/canvas padding/i);
  await user.clear(input);
  await user.type(input, "64");

  expect(props.dispatch).toHaveBeenCalledWith({
    type: "editor/set-control",
    payload: { id: "canvasPadding", value: 64 },
  });
});

test("toggles a data card from the data panel", async () => {
  const user = userEvent.setup();
  const props = makeLoadedEditorProps();

  render(<EditorScreen {...props} />);

  await user.click(screen.getByRole("switch", { name: /show camera model/i }));

  expect(props.dispatch).toHaveBeenCalledWith({
    type: "editor/set-card-enabled",
    payload: { id: "camera-model", enabled: false },
  });
});

test("updates a manual override from the data panel", async () => {
  const user = userEvent.setup();
  const props = makeLoadedEditorProps();

  render(<EditorScreen {...props} />);

  const input = screen.getByLabelText(/author override/i);
  await user.clear(input);
  await user.type(input, "By Harbor Studio");

  expect(props.dispatch).toHaveBeenCalledWith({
    type: "set-field-override",
    fieldId: "authorLine",
    value: "By Harbor Studio",
  });
});

test("shows an explicit import error in pending-image state", () => {
  render(
    <EditorScreen {...makePendingEditorProps({ importError: "Could not read image metadata." })} />,
  );

  expect(screen.getByRole("alert")).toHaveTextContent("Could not read image metadata.");
});
