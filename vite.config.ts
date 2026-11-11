import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["icons/*.png"],
      manifest: {
        id: "/",
        name: "Peramax — Daily expenses",
        short_name: "Peramax",
        description: "Your everyday expenses, allowance, and savings.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#1d392b",
        background_color: "#f5f4ef",
        lang: "en-PH",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,webmanifest}"],
        globIgnores: ["downloads/**"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/downloads\//, /^\/api\//],
        cleanupOutdatedCaches: true,
        skipWaiting: false,
        clientsClaim: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    restoreMocks: true,
  },
});
