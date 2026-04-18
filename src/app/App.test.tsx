import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider, createStore } from "jotai";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";
import * as metadataService from "../services/metadata/extract-metadata";
import { appRoutes } from "./App";
import { appScreenAtom, editorImportErrorAtom, selectedTemplateIdAtom } from "./app-state";

vi.mock("../services/metadata/extract-metadata", () => ({
  extractMetadata: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.restoreAllMocks();
  vi.mocked(metadataService.extractMetadata).mockReset();
});

function renderApp(initialEntries: string[] = ["/"]) {
  const store = createStore();
  const router = createMemoryRouter(
    [
      {
        children: appRoutes,
      },
    ],
    { initialEntries },
  );

  const view = render(
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>,
  );

  return { store, router, ...view };
}

test("shows the template library before a template is selected", async () => {
  const { store, router } = renderApp();

  expect(await screen.findByRole("region", { name: /preview workspace/i })).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: /preset templates/i })).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: /detailed settings/i })).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/");
  expect(store.get(appScreenAtom)).toBe("editor-pending-image");
  expect(store.get(selectedTemplateIdAtom)).toBe("classic-info-strip");
});

test("selecting a template keeps the editor route and switches the current workspace template", async () => {
  const user = userEvent.setup();
  const { store, router } = renderApp();

  await screen.findByRole("region", { name: /preview workspace/i });
  await user.click(screen.getByRole("tab", { name: /preset templates/i }));
  await user.click(screen.getByRole("button", { name: /apply template centered brand \+ meta/i }));

  expect(store.get(appScreenAtom)).toBe("editor-pending-image");
  expect(store.get(selectedTemplateIdAtom)).toBe("centered-brand-meta");
  expect(router.state.location.pathname).toBe("/");
  expect(screen.getByRole("region", { name: /preview workspace/i })).toBeInTheDocument();
  expect(
    screen.getByRole("tab", { name: /detailed settings/i, selected: true }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("img", { name: /centered brand \+ meta template preview/i }),
  ).toBeInTheDocument();
});

test("editor workspace uses a full-bleed shell instead of a centered app box", async () => {
  const { container } = renderApp();

  await screen.findByRole("region", { name: /preview workspace/i });

  const editorShell = container.querySelector("main.app-shell-editor");

  expect(editorShell).not.toBeNull();
  expect(editorShell).toHaveAttribute("data-layout", "full-bleed");
  expect(editorShell?.className).not.toContain("pt-[env(safe-area-inset-top)]");
});

test("legacy editor routes redirect to the single editor entry while keeping the requested template", async () => {
  const { store, router } = renderApp(["/editor/classic-info-strip"]);

  expect(await screen.findByRole("region", { name: /preview workspace/i })).toBeInTheDocument();
  expect(screen.getByRole("img", { name: /classic info strip template preview/i })).toBeInTheDocument();
  expect(store.get(appScreenAtom)).toBe("editor-pending-image");
  expect(store.get(selectedTemplateIdAtom)).toBe("classic-info-strip");
  expect(router.state.location.pathname).toBe("/");
});

test("unknown routes redirect back to the editor entry", async () => {
  const { store, router } = renderApp(["/missing"]);

  expect(await screen.findByRole("region", { name: /preview workspace/i })).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/");
  expect(store.get(appScreenAtom)).toBe("editor-pending-image");
});

test("imports a remote image from the imageUrl query parameter on first load", async () => {
  const metadata = {
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
  };
  vi.mocked(metadataService.extractMetadata).mockResolvedValue(metadata);
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(new Blob(["binary"], { type: "image/jpeg" }), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
      },
    }),
  );
  vi.stubGlobal("fetch", fetchMock);

  const { store } = renderApp([
    "/?imageUrl=https%3A%2F%2Fcdn.example.com%2Fphotos%2Fremote-shot.jpg",
  ]);

  await screen.findByRole("region", { name: /preview workspace/i });

  expect(fetchMock).toHaveBeenCalledWith("https://cdn.example.com/photos/remote-shot.jpg", {
    mode: "cors",
  });
  expect(store.get(appScreenAtom)).toBe("editor");
  expect(store.get(selectedTemplateIdAtom)).toBe("classic-info-strip");
  expect(store.get(editorImportErrorAtom)).toBe(null);
});

test("keeps the editor pending state when imageUrl fetch fails", async () => {
  vi.mocked(metadataService.extractMetadata).mockResolvedValue({
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
  });
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network failed")));

  const { store } = renderApp(["/?imageUrl=https%3A%2F%2Fcdn.example.com%2Fphotos%2Fmissing.jpg"]);

  await screen.findByRole("region", { name: /preview workspace/i });

  expect(store.get(appScreenAtom)).toBe("editor-pending-image");
  expect(store.get(editorImportErrorAtom)).toBe(
    "Could not import photo. Please try a different image.",
  );
});
