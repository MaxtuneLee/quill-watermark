import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vite-plus/test";

import { Drawer, DrawerContent, DrawerTitle } from "./drawer";

afterEach(() => {
  cleanup();
});

test("adds bottom safe area padding for bottom drawers", () => {
  render(
    <Drawer open direction="bottom">
      <DrawerContent>
        <DrawerTitle>Spacing</DrawerTitle>
      </DrawerContent>
    </Drawer>,
  );

  expect(screen.getByRole("dialog")).toHaveClass(
    "data-[vaul-drawer-direction=bottom]:pb-[env(safe-area-inset-bottom)]",
  );
});
