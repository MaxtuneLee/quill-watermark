import { registerSW } from "virtual:pwa-register";

type RegisterSW = typeof registerSW;

export function registerServiceWorker(register: RegisterSW = registerSW) {
  return register({
    immediate: true,
  });
}
