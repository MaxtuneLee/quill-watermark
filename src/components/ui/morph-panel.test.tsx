import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";
import { useState } from "react";
import { MorphPanel } from "./morph-panel";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  class ResizeObserverMock {
    observe() {}
    disconnect() {}
  }

  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function () {
    if (this.textContent?.includes("Toggle settings")) {
      return {
        width: 36,
        height: 36,
        top: 0,
        right: 0,
        bottom: 36,
        left: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } satisfies DOMRect;
    }

    if (this.textContent?.includes("Panel content")) {
      return {
        width: 220,
        height: 160,
        top: 0,
        right: 0,
        bottom: 160,
        left: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } satisfies DOMRect;
    }

    return {
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } satisfies DOMRect;
  });
});

function TestHarness() {
  const [open, setOpen] = useState(false);

  return (
    <MorphPanel
      open={open}
      onOpenChange={setOpen}
      trigger={({ open: isOpen, panelId, toggle }) => (
        <button type="button" aria-controls={panelId} aria-expanded={isOpen} onClick={toggle}>
          Toggle settings
        </button>
      )}
    >
      <div>Panel content</div>
    </MorphPanel>
  );
}

test("animates closed state back to the trigger footprint", async () => {
  render(<TestHarness />);

  const trigger = screen.getByRole("button", { name: "Toggle settings" });
  const panel = document.getElementById(trigger.getAttribute("aria-controls") ?? "");

  expect(panel).not.toBeNull();

  await waitFor(() => {
    const panelBody = panel?.firstElementChild;

    expect(panel).toHaveStyle({
      width: "36px",
      height: "36px",
      top: "0px",
    });
    expect(panel).not.toHaveClass("-translate-y-1");
    expect(panelBody).not.toHaveClass("-translate-y-1");
  });

  fireEvent.click(trigger);

  await waitFor(() => {
    const panelBody = panel?.firstElementChild;

    expect(panel).toHaveStyle({
      width: "220px",
      height: "160px",
      top: "calc(100% + 8px)",
    });
    expect(panelBody).not.toHaveClass("-translate-y-1");
  });

  fireEvent.click(trigger);

  await waitFor(() => {
    const panelBody = panel?.firstElementChild;

    expect(panel).toHaveStyle({
      width: "36px",
      height: "36px",
      top: "0px",
    });
    expect(panel).not.toHaveClass("-translate-y-1");
    expect(panelBody).not.toHaveClass("-translate-y-1");
  });
});

test("fades panel content in shortly after the opening animation begins", async () => {
  vi.useFakeTimers();
  render(<TestHarness />);

  const trigger = screen.getByRole("button", { name: "Toggle settings" });
  const panel = document.getElementById(trigger.getAttribute("aria-controls") ?? "");

  expect(panel).not.toBeNull();

  fireEvent.click(trigger);

  const panelBody = panel?.firstElementChild;

  expect(panel).toHaveClass("opacity-0");
  expect(panelBody).toHaveClass("opacity-0");

  act(() => {
    vi.advanceTimersByTime(80);
  });

  expect(panel).toHaveClass("opacity-100");
  expect(panelBody).toHaveClass("opacity-100");
  vi.useRealTimers();
});

test("fades panel content out when the closing animation begins", async () => {
  vi.useFakeTimers();
  render(<TestHarness />);

  const trigger = screen.getByRole("button", { name: "Toggle settings" });
  const panel = document.getElementById(trigger.getAttribute("aria-controls") ?? "");

  expect(panel).not.toBeNull();

  fireEvent.click(trigger);

  act(() => {
    vi.advanceTimersByTime(80);
  });

  const panelBody = panel?.firstElementChild;
  expect(panel).toHaveClass("opacity-100");
  expect(panelBody).toHaveClass("opacity-100");

  fireEvent.click(trigger);

  expect(panel).toHaveClass("opacity-0");
  expect(panelBody).toHaveClass("opacity-0");
  vi.useRealTimers();
});
