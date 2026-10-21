#!/usr/bin/env node
// Снимки блоков сайтов артистов для карусели «Из чего собран пресс-кит» (правки владельца 2026-10-21).
//
//   node scripts/capture-blocks.mjs [slug ...]
//
// Мобильная версия сайта (390×844, DPR 2). Кадр 9:16 (390×693) от верхнего края нужного блока:
// блок на всю ширину, без полей; если блок короче кадра — дальше идёт следующее содержимое сайта.
// Перед снимком страница пролистывается через блок (появления, счётчики, lazy-картинки),
// закреплённые шапки и кнопки сайта вне блока прячутся. offset — сдвиг кадра вниз от верха блока.
// Результат: public/media/blocks/<slug>.{avif,jpg}, 720×1280.
// Нужны: Playwright, ffmpeg в PATH, установленный Chrome или Edge.

import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { SITES } from "./sites.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = join(ROOT, "public", "media", "blocks");
const RAW = join(ROOT, ".cache", "blocks");

// slug карточки → сайт и блок. Порядок и подписи карточек — в src/content/ru.ts (inside.cards).
const BLOCKS = {
  hero: { site: "lolly", sel: "#top" },
  stats: { site: "toropov", sel: "#stats" },
  video: { site: "kingdom", sel: "#live" },
  music: { site: "lolly", sel: "#music", offset: -24 },
  tours: { site: "lolly", sel: "#tours" },
  press: { site: "lolly", sel: "#press" },
  booking: { site: "sunrise", sel: "#contact" },
};

const want = process.argv.slice(2);
const list = Object.entries(BLOCKS).filter(([slug]) => !want.length || want.includes(slug));
mkdirSync(OUT, { recursive: true });
mkdirSync(RAW, { recursive: true });

const ff = (a) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...a], { stdio: "inherit" });
let browser;
for (const channel of ["chrome", "msedge", undefined]) {
  try {
    browser = await chromium.launch({ channel });
    break;
  } catch {}
}

for (const [slug, b] of list) {
  const site = SITES[b.site];
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  });
  const page = await ctx.newPage();
  await page.goto(site.url, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(2500);
  const png = join(RAW, `${slug}.png`);

  const el = page.locator(b.sel).first();
  const top = await el.evaluate((n) => n.getBoundingClientRect().top + scrollY);
  const h = await el.evaluate((n) => n.getBoundingClientRect().height);
  // Пролистать через блок и чуть дальше: появления, счётчики, lazy-картинки
  for (let y = top - 844; y < top + Math.max(h, 693) + 200; y += 260) {
    await page.evaluate((y) => window.scrollTo({ top: Math.max(0, y), behavior: "instant" }), y);
    await page.waitForTimeout(220);
  }
  const want = top + (b.offset || 0);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), want);
  await page.waitForTimeout(2400);
  // Закреплённые элементы сайта вне блока не должны попадать в кадр
  await el.evaluate((target) => {
    for (const n of document.querySelectorAll("body *")) {
      const p = getComputedStyle(n).position;
      if ((p === "fixed" || p === "sticky") && !target.contains(n) && !n.contains(target)) n.style.visibility = "hidden";
    }
  });
  await page.waitForTimeout(300);
  // Где блок оказался на экране (плавный скролл сайта может не доехать)
  const y = await el.evaluate((n, off) => Math.max(0, n.getBoundingClientRect().top + off), b.offset || 0);
  await page.screenshot({ path: png, clip: { x: 0, y: Math.min(y, 844 - 693), width: 390, height: 693 } });

  const jpg = join(OUT, `${slug}.jpg`);
  const avif = join(OUT, `${slug}.avif`);
  ff(["-i", png, "-vf", "scale=720:1280:flags=lanczos", "-q:v", "3", jpg]);
  ff(["-i", png, "-vf", "scale=720:1280:flags=lanczos,format=yuv420p", "-c:v", "libaom-av1", "-still-picture", "1", "-crf", "30", "-cpu-used", "4", avif]);
  const kb = (f) => `${Math.round(statSync(f).size / 1024)} КБ`;
  console.log(`${slug}: ${b.site} ${b.sel} → jpg ${kb(jpg)} · avif ${kb(avif)}`);
  await ctx.close();
}
await browser.close();
rmSync(RAW, { recursive: true, force: true });
