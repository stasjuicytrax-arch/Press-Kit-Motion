#!/usr/bin/env node
// Снимки блоков сайтов артистов для карусели «Из чего собран пресс-кит» (правки владельца 2026-10-21).
//
//   node scripts/capture-blocks.mjs [slug ...]
//
// Каждый блок снимается целиком по CSS-селектору (element screenshot), телефон 390×844 при DPR 2.
// Перед снимком страница пролистывается через блок, чтобы сработали появления, счётчики и ленивые
// картинки, и закреплённые шапки/кнопки сайта прячутся. Вместо селектора "viewport" — первый экран.
// Результат: public/media/blocks/<slug>.{avif,jpg}, ширина 640. Подложку и поля рисует CSS карточки.
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
  music: { site: "lolly", sel: "#music" },
  tours: { site: "lolly", sel: "#tours" },
  press: { site: "lolly", sel: "#press" },
  booking: { site: "sunrise", sel: "#contact" },
  phone: { site: "nagoo", sel: "viewport" },
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

  if (b.sel === "viewport") {
    await page.screenshot({ path: png });
  } else {
    const el = page.locator(b.sel).first();
    // Пролистать через блок: появления, счётчики, lazy-картинки
    const box = await el.evaluate((n) => {
      const r = n.getBoundingClientRect();
      return { top: r.top + scrollY, h: r.height };
    });
    for (let y = box.top - 844; y < box.top + box.h; y += 260) {
      await page.evaluate((y) => window.scrollTo(0, Math.max(0, y)), y);
      await page.waitForTimeout(220);
    }
    await page.evaluate((y) => window.scrollTo(0, Math.max(0, y)), box.top - 120);
    await page.waitForTimeout(2200);
    // Закреплённые элементы сайта вне блока не должны попадать в кадр
    await el.evaluate((target) => {
      for (const n of document.querySelectorAll("body *")) {
        const p = getComputedStyle(n).position;
        if ((p === "fixed" || p === "sticky") && !target.contains(n) && !n.contains(target)) n.style.visibility = "hidden";
      }
    });
    await page.waitForTimeout(300);
    await el.screenshot({ path: png, animations: "allow" });
  }

  const jpg = join(OUT, `${slug}.jpg`);
  const avif = join(OUT, `${slug}.avif`);
  ff(["-i", png, "-vf", "scale=640:-2:flags=lanczos", "-q:v", "3", jpg]);
  ff(["-i", png, "-vf", "scale=640:-2:flags=lanczos,format=yuv420p", "-c:v", "libaom-av1", "-still-picture", "1", "-crf", "30", "-cpu-used", "4", avif]);
  const kb = (f) => `${Math.round(statSync(f).size / 1024)} КБ`;
  console.log(`${slug}: ${b.site} ${b.sel} → jpg ${kb(jpg)} · avif ${kb(avif)}`);
  await ctx.close();
}
await browser.close();
rmSync(RAW, { recursive: true, force: true });
