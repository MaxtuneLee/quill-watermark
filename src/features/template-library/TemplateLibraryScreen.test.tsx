import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vite-plus/test";
import { templates } from "../../template-engine/templates";
import { TemplateLibraryScreen } from "./TemplateLibraryScreen";

test("groups templates by family and emits selection", async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();

  render(<TemplateLibraryScreen templates={templates} onSelect={onSelect} />);

  await user.click(screen.getByRole("button", { name: /use template classic info strip/i }));

  expect(screen.getByRole("heading", { name: /info bar/i })).toBeInTheDocument();
  expect(onSelect).toHaveBeenCalledWith("classic-info-strip");
});

test("sidebar cards are dimmed by default and fully opaque when selected", () => {
  render(
    <TemplateLibraryScreen
      templates={templates}
      onSelect={vi.fn()}
      selectedTemplateId="classic-info-strip"
      layout="sidebar"
    />,
  );

  const selectedCard = screen
    .getByRole("button", { name: /apply template classic info strip/i })
    .closest("article");
  const unselectedCard = screen
    .getByRole("button", { name: /apply template centered brand \+ meta/i })
    .closest("article");

  expect(selectedCard).toHaveClass("opacity-100");
  expect(unselectedCard).toHaveClass("opacity-55");
  expect(unselectedCard).toHaveClass("hover:opacity-100");
});
