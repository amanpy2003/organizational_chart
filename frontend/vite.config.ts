import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    // A less common port than Vite's 5173 default, since that's frequently
    // already taken by other local projects — Vite silently picks the next
    // free port instead, which then fails CORS against the backend's
    // allow-list with a confusing generic upload error. strictPort makes
    // that failure mode loud (a clear "port in use" error) instead of silent.
    port: 5180,
    strictPort: true,
  },
});
