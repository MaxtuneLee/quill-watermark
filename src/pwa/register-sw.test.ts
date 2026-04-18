import { expect, test, vi } from "vite-plus/test";
import { registerServiceWorker } from "./register-sw";

test("registers the service worker with auto update enabled", () => {
  const register = vi.fn();

  registerServiceWorker(register);

  expect(register).toHaveBeenCalledWith({
    immediate: true,
  });
});
