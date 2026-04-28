import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tenant } from "./src/tenant.generated";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: tenant.apiBaseUrl,
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});