import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "/" для Vercel. Для GitHub Pages собрать с VITE_BASE=/Press-Kit-Motion/
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react()],
  server: { port: 5173, strictPort: true },
});
