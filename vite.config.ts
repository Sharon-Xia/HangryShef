import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// PWA config so the app is installable on your phone via "Add to Home Screen".
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Grocery Shelf-Life",
        short_name: "Shelf-Life",
        description:
          "Track groceries by how soon they go bad. Local FoodKeeper data + Claude fallback.",
        theme_color: "#16a34a",
        background_color: "#0b0f0e",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  server: {
    host: true, // expose on your LAN so your phone can reach the dev server
  },
});
