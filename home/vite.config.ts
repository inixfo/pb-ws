import react from "@vitejs/plugin-react";
import tailwind from "tailwindcss";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  css: {
    postcss: {
      plugins: [tailwind()],
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',  // Use local Django server for development
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      },
      // Fallback to production server if local isn't available
      '/api-prod': {
        target: 'http://3.25.95.103/',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-prod/, '/api')
      }
    }
  },
});
