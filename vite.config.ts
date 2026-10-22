import { defineConfig } from "vite";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";

// base: "/" для Vercel. Для GitHub Pages собрать с VITE_BASE=/Press-Kit-Motion/
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  // Две страницы: лендинг и политика конфиденциальности (/privacy/)
  build: {
    rollupOptions: {
      input: { main: resolve(__dirname, "index.html"), privacy: resolve(__dirname, "privacy/index.html") },
    },
  },
});
