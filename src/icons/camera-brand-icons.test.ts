import { expect, test } from "vite-plus/test";
import {
  commonCameraBrandIconMap,
  getCameraBrandIcon,
  getCameraBrandName,
  renderCameraBrandSvgByName,
  renderSimpleIconSvg,
} from "./camera-brand-icons";

test("resolves supported camera brands from a maintained brand map", () => {
  expect(getCameraBrandName("SONY")).toBe("sony");
  expect(getCameraBrandName("Leica Camera AG")).toBe("leica");
  expect(getCameraBrandName("FUJI PHOTO FILM CO., LTD.")).toBe("fujifilm");
  expect(getCameraBrandName("LUMIX")).toBe("panasonic");
  expect(getCameraBrandName("Apple")).toBe("apple");
  expect(getCameraBrandName("DJI")).toBe("dji");
  expect(getCameraBrandName("OLYMPLUS")).toBe("olympus");
});

test("keeps unsupported but common camera brands in the map", () => {
  expect(getCameraBrandName("SIGMA")).toBe("sigma");
  expect(getCameraBrandName("Canon")).toBe("canon");
  expect(getCameraBrandName("RICOH IMAGING COMPANY, LTD.")).toBe("ricoh");
  expect(commonCameraBrandIconMap.sigma).toBeNull();
  expect(commonCameraBrandIconMap.canon).toBeNull();
  expect(commonCameraBrandIconMap.ricoh).toBeNull();
});

test("returns icons only for brands with a configured component", () => {
  expect(getCameraBrandIcon("Nikon")).toBeTruthy();
  expect(getCameraBrandIcon("FUJI PHOTO FILM CO., LTD.")).toBeTruthy();
  expect(getCameraBrandIcon("SIGMA")).toBeNull();
});

test("renders simple icons with an explicit override color", () => {
  const icon = getCameraBrandIcon("Nikon");
  expect(icon).toBeTruthy();
  if (!icon) {
    throw new Error("Expected Nikon icon to exist.");
  }

  expect(renderSimpleIconSvg(icon, 64, "#ffcc00")).toContain('fill="#ffcc00"');
});

test("renders a custom canon wordmark svg", () => {
  const svg = renderCameraBrandSvgByName("canon", 64, "#ff0000");

  expect(svg).toContain('viewBox="0 0 1000.04 209.153"');
  expect(svg).toContain('fill="#ff0000"');
  expect(svg).toContain("<path");
});

test("renders a custom sigma wordmark svg", () => {
  const svg = renderCameraBrandSvgByName("sigma", 64, "#101010");

  expect(svg).toContain('viewBox="0 0 1058 225"');
  expect(svg).toContain('fill="#101010"');
  expect(svg).toContain("<rect");
  expect(svg).toContain("<polygon");
});

test("renders a custom olympus wordmark svg", () => {
  const svg = renderCameraBrandSvgByName("olympus", 64);

  expect(svg).toContain('viewBox="0 0 240 50.9091"');
  expect(svg).toContain('fill="#F6D900"');
  expect(svg).toContain('fill="#343E8B"');
});

test("renders a custom ricoh wordmark svg", () => {
  const svg = renderCameraBrandSvgByName("ricoh", 64);

  expect(svg).toContain('viewBox="0 0 200 36.093304"');
  expect(svg).toContain('fill="#d7063b"');
  expect(svg).toContain("<path");
});
