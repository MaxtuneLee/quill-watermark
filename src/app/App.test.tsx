import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, createStore } from "jotai";
import { afterEach, expect, test } from "vite-plus/test";
import { App } from "./App";
import { appScreenAtom, selectedTemplateIdAtom } from "./app-state";

afterEach(() => {
  cleanup();
});

test("shows the template library before a template is selected", () => {
  const store = createStore();

  render(
    <Provider store={store}>
      <App />
    </Provider>,
  );

  expect(screen.getByRole("heading", { name: /template library/i })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: /editor/i })).not.toBeInTheDocument();
  expect(store.get(appScreenAtom)).toBe("library");
  expect(store.get(selectedTemplateIdAtom)).toBe(null);
});

test("selecting a template moves app state to editor-pending-image with selected id", async () => {
  const user = userEvent.setup();
  const store = createStore();

  render(
    <Provider store={store}>
      <App />
    </Provider>,
  );

  const [useTemplateButton] = screen.getAllByRole("button", {
    name: /use template classic info strip/i,
  });
  await user.click(useTemplateButton);

  expect(store.get(appScreenAtom)).toBe("editor-pending-image");
  expect(store.get(selectedTemplateIdAtom)).toBe("classic-info-strip");
});
