import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.PORT || "5173"),
    host: true,
    watch: {
      usePolling: true,
      interval: 300,
    },
    hmr: {
      clientPort: parseInt(process.env.HMR_CLIENT_PORT || process.env.PORT || "5173"),
    },
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
