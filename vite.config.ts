import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { reactClickToComponent } from "vite-plugin-react-click-to-component";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "quill-logo.ico",
        "apple-touch-icon-180x180.png",
        "pwa-64x64.png",
        "pwa-192x192.png",
        "pwa-512x512.png",
        "maskable-icon-512x512.png",
      ],
      manifest: {
        name: "Quill Watermark",
        short_name: "Quill",
        description: "Create branded photo watermarks and export them offline.",
        theme_color: "#1f1b12",
        background_color: "#0d0b07",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}"],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "app-shell",
              networkTimeoutSeconds: 3,
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
          {
            urlPattern: ({ request, url }) =>
              request.destination === "image" && url.pathname.startsWith("/templates/"),
            handler: "CacheFirst",
            options: {
              cacheName: "template-images",
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 32,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: ({ request, url }) =>
              url.origin === location.origin &&
              (url.pathname.startsWith("/assets/") ||
                request.destination === "style" ||
                request.destination === "script" ||
                request.destination === "worker" ||
                request.destination === "font" ||
                request.destination === "image"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-assets",
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
        ],
      },
    }),
    reactClickToComponent()
  ],
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
  },
  staged: {
    "*": "vp check --fix",
  },
  lint: { options: { typeAware: true, typeCheck: true } },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0"
  }
  // experimental: {
  //   bundledDev: true,
  // },
  // build: {
  //   rolldownOptions: {
  //     experimental: {
  //       lazyBarrel: true,
  //     },
  //   },
  // },
});
