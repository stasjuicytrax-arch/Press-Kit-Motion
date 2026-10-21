#!/usr/bin/env node
// Статичный кадр капли для фолбэка первого экрана (TZ.md §7.1, п. 5).
//   node scripts/capture-drop.mjs [url]
// Открывает страницу в reduced-motion: капля неподвижно стоит над «Kit». Снимает квадрат
// 1.2 × диаметр капли вокруг центра «Kit» для десктопа (1440) и телефона (390),
// кладёт JPG + AVIF в public/media/drop/. На странице кадр вырезается по кругу (globals.css).
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const url = process.argv[2] ?? "http://localhost:5173/";
const OUT = resolve(import.meta.dirname, "..", "public", "media", "drop");
mkdirSync(OUT, { recursive: true });

let browser;
for (const channel of ["chrome", "msedge", undefined]) {
  try {
    browser = await chromium.launch({ channel, args: ["--ignore-gpu-blocklist"] });
    break;
  } catch {}
}

const ff = (a) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...a], { stdio: "inherit" });

for (const [name, viewport, dpr, mobile] of [
  ["desktop", { width: 1440, height: 900 }, 1.5, false],
  ["phone", { width: 390, height: 844 }, 3, true],
]) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: dpr, isMobile: mobile, hasTouch: mobile, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "load" });
  await page.waitForFunction(() => document.querySelector(".hero")?.dataset.scene === "webgl", null, { timeout: 30000 });
  await page.waitForTimeout(2500);
  // Только надпись и капля: навигацию и нижний блок прячем на время съёмки
  await page.addStyleTag({ content: ".nav-shell, .hero-bottom, .sticky-cta { visibility: hidden !important; }" });
  const clip = await page.evaluate(() => {
    const kit = document.querySelector('[data-word="Kit"]');
    const range = document.createRange();
    range.selectNodeContents(kit);
    const r = range.getBoundingClientRect();
    const drop = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--drop-size")) / 100) * innerWidth;
    const side = drop * 1.2;
    return { x: r.left + r.width / 2 - side / 2, y: r.top + r.height / 2 - side / 2, width: side, height: side };
  });
  const png = join(OUT, `drop-${name}.png`);
  await page.screenshot({ path: png, clip });
  ff(["-i", png, "-q:v", "3", join(OUT, `drop-${name}.jpg`)]);
  ff(["-i", png, "-vf", "format=yuv420p", "-c:v", "libaom-av1", "-still-picture", "1", "-crf", "30", "-cpu-used", "4", join(OUT, `drop-${name}.avif`)]);
  execFileSync(process.platform === "win32" ? "cmd" : "rm", process.platform === "win32" ? ["/c", "del", png] : [png]);
  console.log(`${name}: ${Math.round(clip.width)}px css → public/media/drop/drop-${name}.{jpg,avif}`);
  await ctx.close();
}
await browser.close();
