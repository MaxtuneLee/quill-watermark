import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vite-plus/test";
import { TemplateLibraryScreen } from "./TemplateLibraryScreen";
import { templates } from "../../template-engine/templates";

test("groups templates by family and emits selection", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();

  render(<TemplateLibraryScreen templates={templates} onSelect={onSelect} />);

  await user.click(screen.getByRole("button", { name: /use template classic info strip/i }));

  expect(screen.getByRole("heading", { name: /info bar/i })).toBeInTheDocument();
  expect(onSelect).toHaveBeenCalledWith("classic-info-strip");
});
