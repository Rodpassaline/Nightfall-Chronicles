import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "./",
  resolve: { tsconfigPaths: true },
  build: {
    outDir: "dist-mobile",
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
  plugins: [tailwindcss(), viteReact()],
});
