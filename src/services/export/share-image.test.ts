import { beforeEach, expect, test, vi } from "vite-plus/test";
import { shareImage } from "./share-image";

let createObjectUrlSpy: ReturnType<typeof vi.spyOn>;

function mockShareEnvironment({
  shareImpl,
  canShareImpl,
}: {
  shareImpl?: (data?: ShareData) => Promise<void>;
  canShareImpl?: (data?: ShareData) => boolean;
}): void {
  Object.defineProperty(navigator, "share", {
    value: shareImpl,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(navigator, "canShare", {
    value: canShareImpl,
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
  createObjectUrlSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:quill");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
});

test("uses navigator.share when file sharing is supported", async () => {
  const shareSpy = vi.fn(async () => {});
  mockShareEnvironment({
    shareImpl: shareSpy,
    canShareImpl: () => true,
  });

  const result = await shareImage({
    blob: new Blob(["image"], { type: "image/png" }),
    fileName: "preview.png",
  });

  expect(result).toEqual({ method: "share" });
  expect(shareSpy).toHaveBeenCalledTimes(1);
});

test("falls back to download when navigator.share rejects unsupported file payload", async () => {
  const shareSpy = vi.fn(async () => {
    throw new TypeError("files are not supported");
  });
  mockShareEnvironment({
    shareImpl: shareSpy,
    canShareImpl: () => true,
  });

  const result = await shareImage({
    blob: new Blob(["image"], { type: "image/png" }),
    fileName: "preview.png",
  });

  expect(result).toEqual({ method: "download" });
  expect(shareSpy).toHaveBeenCalledTimes(1);
  expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
});

test("rethrows AbortError when user cancels share", async () => {
  const shareSpy = vi.fn(async () => {
    throw new DOMException("AbortError", "AbortError");
  });
  mockShareEnvironment({
    shareImpl: shareSpy,
    canShareImpl: () => true,
  });

  await expect(
    shareImage({
      blob: new Blob(["image"], { type: "image/png" }),
      fileName: "preview.png",
    }),
  ).rejects.toThrowError(DOMException);
});
