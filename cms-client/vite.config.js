import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const cmsApiTarget = "http://localhost:3001";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/auth": cmsApiTarget,
      "/users": cmsApiTarget,
      "/files": cmsApiTarget,
      "/collections": cmsApiTarget,
      "/api-keys": cmsApiTarget,
    },
  },
});
