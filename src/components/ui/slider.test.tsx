import { cleanup, fireEvent, render } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vite-plus/test";

import { Slider } from "./slider";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-04-18T09:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

function TestSlider({
  defaultValue = 5,
  hapticEnabled = true,
  onHaptic,
}: {
  defaultValue?: number;
  hapticEnabled?: boolean;
  onHaptic?: (detail: { index: number; stepIndex: number; value: number }) => void;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <Slider
      aria-label="Opacity"
      min={0}
      max={10}
      step={1}
      value={value}
      hapticEnabled={hapticEnabled}
      onHaptic={onHaptic}
      onValueChange={(nextValue) => {
        setValue(Array.isArray(nextValue) ? (nextValue[0] ?? value) : nextValue);
      }}
    />
  );
}

test("fires haptic when the slider crosses into a new step", async () => {
  const onHaptic = vi.fn();

  const { container } = render(<TestSlider onHaptic={onHaptic} />);

  const slider = container.querySelector('input[type="range"]');

  expect(slider).not.toBeNull();
  fireEvent.change(slider as HTMLInputElement, { target: { value: "6" } });

  expect(onHaptic).toHaveBeenCalledTimes(1);
  expect(onHaptic).toHaveBeenCalledWith({
    index: 0,
    stepIndex: 6,
    value: 6,
  });
});

test("does not fire haptic when disabled", async () => {
  const onHaptic = vi.fn();

  const { container } = render(<TestSlider hapticEnabled={false} onHaptic={onHaptic} />);

  const slider = container.querySelector('input[type="range"]');

  expect(slider).not.toBeNull();
  fireEvent.change(slider as HTMLInputElement, { target: { value: "6" } });

  expect(onHaptic).not.toHaveBeenCalled();
});

test("throttles haptic when step changes happen too close together", async () => {
  const onHaptic = vi.fn();

  const { container } = render(<TestSlider onHaptic={onHaptic} />);

  const slider = container.querySelector('input[type="range"]');

  expect(slider).not.toBeNull();
  fireEvent.change(slider as HTMLInputElement, { target: { value: "6" } });
  fireEvent.change(slider as HTMLInputElement, { target: { value: "7" } });

  expect(onHaptic).toHaveBeenCalledTimes(1);
});

test("fires haptic again after the minimum interval passes", async () => {
  const onHaptic = vi.fn();

  const { container } = render(<TestSlider onHaptic={onHaptic} />);

  const slider = container.querySelector('input[type="range"]');

  expect(slider).not.toBeNull();
  fireEvent.change(slider as HTMLInputElement, { target: { value: "6" } });
  vi.advanceTimersByTime(90);
  fireEvent.change(slider as HTMLInputElement, { target: { value: "7" } });

  expect(onHaptic).toHaveBeenCalledTimes(2);
});
