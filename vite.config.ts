import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  base: "./", // 상대 경로로 설정
  build: {
    outDir: "dist",
    assetsDir: "assets",
    chunkSizeWarningLimit: 1500,
  },
});
