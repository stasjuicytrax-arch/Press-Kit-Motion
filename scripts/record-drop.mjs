#!/usr/bin/env node
// Видео капли для телефона (2026-10-22): живая WebGL-капля слишком тяжёлая для телефонов,
// поэтому там играет запись той же сцены в телефонной раскладке.
//   node scripts/record-drop.mjs [url]   (нужен запущенный dev/preview сервер)
// Открывает страницу с ?drop-rec (сцена на телефонной ширине 390, DPR 2), время ведёт page.clock:
// кадр = +1/30 с, скриншот области надписи. Два ролика:
//   drop-fall — падение и выход на траекторию (до wander = LOOP_START),
//   drop-loop — бесшовный цикл плавания (ровно REC_LOOP = 10 с «восьмёрки»).
// Результат: public/media/drop/drop-{fall,loop}.{mp4,webm}, постер drop-poster.{avif,jpg}
// (первый кадр: надпись без капли) и drop-video.json с областью кадра в CSS-пикселях 390.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const url = (process.argv[2] ?? "http://localhost:5173/") + "?drop-rec";
const ROOT = resolve(import.meta.dirname, "..");
const OUT = join(ROOT, "public", "media", "drop");
const RAW = join(ROOT, ".cache", "drop-rec");
const FPS = 30;
const LOOP = 10; // = REC_LOOP в HeroScene.tsx
const LOOP_START = 4; // с траектории: переход от «Kit» к восьмёрке (3 с) уже закончился
rmSync(RAW, { recursive: true, force: true });
mkdirSync(RAW, { recursive: true });
const ff = (a) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...a], { stdio: "inherit" });

const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=default", "--ignore-gpu-blocklist", "--enable-gpu"] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "load" });
await page.waitForFunction(() => document.querySelector(".hero")?.dataset.scene === "webgl", null, { timeout: 60000 });
await page.waitForTimeout(1500);
await page.addStyleTag({ content: ".nav-shell, .hero-bottom, .sticky-cta { visibility: hidden !important; }" });
// Область кадра: надпись с запасом под каплю, на всю ширину
const clip = await page.evaluate(() => {
  const r = document.querySelector(".hero-title").getBoundingClientRect();
  const pad = Math.round(window.innerWidth * 0.2);
  const y = Math.max(0, Math.round(r.top - pad));
  return { x: 0, y, width: window.innerWidth, height: Math.round(r.bottom + pad - y) };
});
// Привязка к блоку текста, а не к h1: h1 тянется на высоту экрана, текст в нём по центру
const titleTop = await page.evaluate(() => document.querySelector(".hero-title > .block").getBoundingClientRect().top);
await page.evaluate(() => ((window).__dropGo = true));
// Сцена в режиме frameloop "never": каждый кадр рисуем сами через advance(k / FPS) —
// ровно 1/FPS секунды сцены на кадр видео, цикл замыкается ровно на +LOOP секунд траектории
let i = 0;
let loopFrom = -1;
let loopW = 0;
const shot = async () => page.screenshot({ path: join(RAW, `f${String(i++).padStart(4, "0")}.png`), clip });
const read = () => page.evaluate(() => ({ t: (window).__dropT ?? 0, w: (window).__dropW ?? 0 }));
await shot(); // кадр 0 (до первой отрисовки, в ролики не идёт)
let k = 0;
for (;;) {
  await page.evaluate((s) => (window).__dropAdvance(s), ++k / FPS);
  const { w } = await read();
  await shot();
  if (loopFrom < 0 && w >= LOOP_START) {
    loopFrom = i - 1;
    loopW = w;
  }
  if (loopFrom >= 0 && w >= loopW + LOOP) break;
  if (i > 40 * FPS) throw new Error("капля не вышла на траекторию");
}
const loopFrames = i - 1 - loopFrom;
await browser.close();

// Явная разметка bt709: иначе браузер может по-другому перевести цвета, и фон ролика
// на пару оттенков разойдётся с фоном страницы
const COLOR = ["-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv"];
const enc = (name, start, count) => {
  const input = ["-framerate", String(FPS), "-start_number", String(start), "-i", join(RAW, "f%04d.png"), "-frames:v", String(count), ...COLOR];
  ff([...input, "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-tune", "animation", "-movflags", "+faststart", "-an", join(OUT, `${name}.mp4`)]);
  ff([...input, "-c:v", "libvpx-vp9", "-crf", "32", "-b:v", "0", "-row-mt", "1", "-an", join(OUT, `${name}.webm`)]);
};
// Кадр 0 снят до первой отрисовки сцены (пустой фон) — ролики и постер начинаются с кадра 1.
// Последний кадр цикла совпадает с первым — в ролик не берём, чтобы на стыке не было паузы
enc("drop-fall", 1, loopFrom - 1);
enc("drop-loop", loopFrom, loopFrames - 1);
ff(["-i", join(RAW, "f0001.png"), "-q:v", "3", join(OUT, "drop-poster.jpg")]);
ff(["-i", join(RAW, "f0001.png"), "-vf", "format=yuv420p", "-c:v", "libaom-av1", "-still-picture", "1", "-crf", "30", "-cpu-used", "4", join(OUT, "drop-poster.avif")]);
// Где кадр стоит относительно верха надписи (CSS px при ширине 390) — для позиционирования на странице
writeFileSync(join(OUT, "drop-video.json"), JSON.stringify({ width: clip.width, height: clip.height, offsetFromText: +(clip.y - titleTop).toFixed(1) }, null, 2));
const kb = (f) => `${Math.round(statSync(join(OUT, f)).size / 1024)} КБ`;
console.log(`кадров: падение ${loopFrom + 1}, цикл ${loopFrames}; область ${clip.width}×${clip.height}, от надписи ${clip.y - titleTop}px`);
for (const f of ["drop-fall.mp4", "drop-fall.webm", "drop-loop.mp4", "drop-loop.webm", "drop-poster.jpg", "drop-poster.avif"]) console.log(" ", f, kb(f));
