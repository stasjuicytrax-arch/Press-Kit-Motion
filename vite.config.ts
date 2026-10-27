import { defineConfig } from "vite";
import { resolve, join } from "node:path";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import react from "@vitejs/plugin-react";

// Версия каждой записи сайта = хэш содержимого mp4 (меняется только при перезаписи). Добавляется к
// адресу ролика (?v=…), чтобы браузер не показывал старое видео из кэша (владелец 2026-10-27).
function mediaVersions() {
  const root = resolve(__dirname, "public/media/sites");
  const out: Record<string, string> = {};
  if (!existsSync(root)) return out;
  for (const key of readdirSync(root)) {
    for (const device of ["desktop", "mobile"]) {
      const f = join(root, key, `${device}.mp4`);
      if (existsSync(f)) {
        out[`${key}/${device}`] = createHash("md5").update(readFileSync(f)).digest("hex").slice(0, 8);
      }
    }
  }
  return out;
}

// base: "/" для Vercel. Для GitHub Pages собрать с VITE_BASE=/Press-Kit-Motion/
export default defineConfig({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react()],
  define: { __MEDIA_V__: JSON.stringify(mediaVersions()) },
  server: { port: 5173, strictPort: true },
  // Две страницы: лендинг и политика конфиденциальности (/privacy/)
  build: {
    rollupOptions: {
      input: { main: resolve(__dirname, "index.html"), privacy: resolve(__dirname, "privacy/index.html") },
    },
  },
});
