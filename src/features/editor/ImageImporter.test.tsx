import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vite-plus/test";
import { ImageImporter } from "./ImageImporter";

test("dispatches the selected file to the app state layer", async () => {
  const file = new File(["binary"], "photo.jpg", { type: "image/jpeg" });
  const dispatch = vi.fn().mockResolvedValue(undefined);

  render(<ImageImporter dispatch={dispatch} importError={null} />);

  const input = screen.getByLabelText(/photo file input/i);
  fireEvent.change(input, {
    target: {
      files: [file],
    },
  });

  expect(dispatch).toHaveBeenCalledWith({
    type: "import-image",
    sourceFile: file,
  });
});
