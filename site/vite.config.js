import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Portable static build: relative asset URLs so dist/ works on any host,
// domain, or subfolder (Cloudflare Pages included).
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    assetsInlineLimit: 4096,
  },
});
