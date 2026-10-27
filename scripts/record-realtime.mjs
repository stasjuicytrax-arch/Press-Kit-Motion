#!/usr/bin/env node
// Запись сайта-слайдера в реальном времени (DJ Nagoo, 2026-10-27): покадровая съёмка с управляемым
// временем ломает его собственные переходы между слайдами — ролик «дёргается». Здесь браузер пишет
// видео сам (recordVideo), жест колеса раз в STEP мс, сайт анимирует переход как у живого человека.
//   node scripts/record-realtime.mjs <ключ> [desktop|mobile]
// Результат: public/media/sites/<ключ>/<device>.{mp4,webm} + постеры, как у record-sites.mjs.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, readdirSync, statSync, renameSync } from "node:fs";
import { join, resolve } from "node:path";
import { SITES } from "./sites.mjs";

const [key = "nagoo", only] = process.argv.slice(2);
const site = SITES[key];
const ROOT = resolve(import.meta.dirname, "..");
const OUT = join(ROOT, "public", "media", "sites", key);
const TMP = join(ROOT, ".cache", "rt", key);
const ff = (a) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...a], { stdio: "inherit" });
const DEV = {
  desktop: { viewport: { width: 1440, height: 900 }, scale: 1.5, out: 1920, mobile: false, budget: 6 },
  mobile: { viewport: { width: 390, height: 844 }, scale: 2, out: 780, mobile: true, budget: 4 },
};
const STEP = 1700; // мс между жестами: переход сайта успевает доиграть
const GESTURES = 5;
const HOLD = 1200; // мс на первом экране

const browser = await chromium.launch({ channel: "chrome", args: ["--autoplay-policy=no-user-gesture-required", "--hide-scrollbars", "--use-angle=default", "--ignore-gpu-blocklist", "--enable-gpu"] });
for (const [kind, d] of Object.entries(DEV)) {
  if (only && only !== kind) continue;
  rmSync(join(TMP, kind), { recursive: true, force: true });
  mkdirSync(join(TMP, kind), { recursive: true });
  const size = { width: d.viewport.width * d.scale, height: d.viewport.height * d.scale };
  const ctx = await browser.newContext({
    viewport: d.viewport, deviceScaleFactor: d.scale, isMobile: d.mobile, hasTouch: d.mobile,
    recordVideo: { dir: join(TMP, kind), size },
  });
  const page = await ctx.newPage();
  const t0 = Date.now();
  await page.goto(site.url, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(3500); // интро сайта
  const start = (Date.now() - t0) / 1000;
  await page.mouse.move(d.viewport.width / 2, d.viewport.height / 2);
  await page.waitForTimeout(HOLD);
  for (let g = 0; g < GESTURES; g++) {
    if (d.mobile) await page.evaluate((h) => window.dispatchEvent(new WheelEvent("wheel", { deltaY: h, bubbles: true })), d.viewport.height);
    await page.mouse.wheel(0, d.viewport.height);
    await page.waitForTimeout(STEP);
  }
  const end = (Date.now() - t0) / 1000;
  await ctx.close();
  const webmIn = join(TMP, kind, readdirSync(join(TMP, kind)).find((n) => n.endsWith(".webm")));
  const len = (end - start).toFixed(2);
  const vf = `fps=30,scale=${d.out}:-2:flags=lanczos,format=yuv420p`;
  const mp4 = join(OUT, `${kind}.mp4`);
  const webm = join(OUT, `${kind}.webm`);
  let crf = 20;
  const enc = () => {
    ff(["-ss", start.toFixed(2), "-t", len, "-i", webmIn, "-vf", vf, "-c:v", "libx264", "-preset", "slow", "-crf", String(crf), "-tune", "animation", "-movflags", "+faststart", "-an", mp4]);
  };
  enc();
  while (statSync(mp4).size > d.budget * 1024 * 1024 && crf < 36) { crf += 2; enc(); }
  ff(["-ss", start.toFixed(2), "-t", len, "-i", webmIn, "-vf", vf, "-c:v", "libvpx-vp9", "-crf", "32", "-b:v", "0", "-row-mt", "1", "-an", webm]);
  ff(["-ss", start.toFixed(2), "-i", webmIn, "-frames:v", "1", "-vf", `scale=${d.out}:-2`, "-q:v", "2", join(OUT, `${kind}-poster.jpg`)]);
  ff(["-ss", start.toFixed(2), "-i", webmIn, "-frames:v", "1", "-vf", `scale=${d.out}:-2,format=yuv420p`, "-c:v", "libaom-av1", "-still-picture", "1", "-crf", "28", "-cpu-used", "4", join(OUT, `${kind}-poster.avif`)]);
  console.log(`${kind}: ${len} с, CRF ${crf}, mp4 ${(statSync(mp4).size / 1048576).toFixed(2)} МБ, webm ${(statSync(webm).size / 1048576).toFixed(2)} МБ`);
}
await browser.close();
