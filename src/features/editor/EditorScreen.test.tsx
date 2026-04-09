import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vite-plus/test";
import { EditorScreen } from "./EditorScreen";
import { templates } from "../../template-engine/templates";

test("shows an image importer before a photo is loaded", () => {
  render(
    <EditorScreen template={templates[0]} instance={null} importError={null} dispatch={vi.fn()} />,
  );
  expect(screen.getByRole("button", { name: /add photo/i })).toBeInTheDocument();
});

test("shows preview and panel placeholders after a photo is loaded", () => {
  const file = new File(["binary"], "photo.jpg", { type: "image/jpeg" });

  render(
    <EditorScreen
      template={templates[0]}
      instance={{
        sourceFile: file,
        metadata: {
          camera: { make: "Leica", model: "Q2" },
          exposure: {
            iso: 400,
            aperture: 1.7,
            shutterSeconds: 1 / 125,
            focalLengthMm: 28,
          },
          location: { latitude: null, longitude: null },
          shotTime: null,
        },
      }}
      importError={null}
      dispatch={vi.fn()}
    />,
  );

  expect(screen.getByRole("region", { name: /preview stage/i })).toBeInTheDocument();
  expect(screen.getByRole("complementary", { name: /editor panels/i })).toBeInTheDocument();
});

test("shows an explicit import error in pending-image state", () => {
  render(
    <EditorScreen
      template={templates[0]}
      instance={null}
      importError="Could not read image metadata."
      dispatch={vi.fn()}
    />,
  );

  expect(screen.getByRole("alert")).toHaveTextContent("Could not read image metadata.");
});
