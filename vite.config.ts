import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "path";

export default defineConfig({
  plugins: [
    tanstackRouter({ routesDirectory: "./src/routes" }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "node:crypto": path.resolve(__dirname, "./src/lib/crypto-stub.ts"),
    },
  },
  build: {
    outDir: "dist",
  },
});
