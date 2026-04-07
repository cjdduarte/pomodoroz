import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    svgr({
      include: "**/*.svg",
      svgrOptions: {
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  server: {
    host: "localhost",
    port: 3000,
    strictPort: true,
  },
  resolve: {
    tsconfigPaths: true,
    alias: {
      "styled-components/macro": "styled-components",
      "@pomodoroz/shareables": fileURLToPath(
        new URL("../shareables/src/index.ts", import.meta.url)
      ),
    },
  },
  build: {
    outDir: "build",
    emptyOutDir: true,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }

          if (id.includes("@dnd-kit")) {
            return "vendor-dnd";
          }

          if (id.includes("i18next") || id.includes("react-i18next")) {
            return "vendor-i18n";
          }

          if (
            id.includes("@reduxjs") ||
            id.includes("react-redux") ||
            id.includes("/redux")
          ) {
            return "vendor-state";
          }

          if (id.includes("react-router")) {
            return "vendor-router";
          }

          if (id.includes("styled-components")) {
            return "vendor-styled";
          }

          if (id.includes("react-markdown")) {
            return "vendor-markdown";
          }

          if (id.includes("react-dom") || id.includes("/react/")) {
            return "vendor-react";
          }

          return "vendor";
        },
      },
    },
  },
});
