#!/usr/bin/env node
// Запись сайтов артистов (TZ.md §6.1, качество v2).
//
//   node scripts/record-sites.mjs [ключ ...] [--only mobile|desktop] [--keep-raw]
//
// Без recordVideo: каждый кадр — PNG-скриншот (30 к/с), скролл детерминированный
// (window.scrollTo по easing-кривой на каждый кадр). Телефон 390×844 при DPR 2 → 780×1688,
// десктоп 1440×900 при DPR 1.5 → 2160×1350, итог 1920 по ширине.
// Кодирование из PNG: H.264 CRF 18 -tune animation (MP4, первым <source>) + VP9 CRF 30 (WebM).
// Бюджет: телефон до 4 МБ, десктоп до 6 МБ. Не влезает — сначала 8 секунд, потом CRF +2.
// Разрешение не снижаем. Постеры: первый кадр, AVIF (качество ~60) + JPG (85).
//
// Сайты-слайдеры (wheel: "gestures" в sites.mjs) не листаются scrollTo: им между кадрами
// отправляется жест колеса.
//
// Время управляемое: скриншот DPR 2 идёт ~0.3 с, а кадр видео 1/30 с. Без этого анимации
// сайта убегают в 8–10 раз быстрее, ролик мелькает и не влезает в бюджет. JS-время (rAF,
// таймеры, Date — GSAP, Lenis) ведёт page.clock: +1/30 с на кадр. CSS-анимации и <video>
// замедляются через CDP под измеренную скорость съёмки.
//
// Результат: public/media/sites/<ключ>/. Кадры: .cache/record/ (не в git).
// Нужны: Playwright, ffmpeg в PATH, установленный Chrome или Edge.

import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync, statSync, readdirSync, renameSync } from "node:fs";
import { join, resolve } from "node:path";
import { SITES } from "./sites.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = join(ROOT, "public", "media", "sites");
const RAW = join(ROOT, ".cache", "record");

const DEVICES = {
  mobile: {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    outWidth: 780,
    budget: 4 * 1024 * 1024,
    screens: 3.5,
  },
  desktop: {
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
    isMobile: false,
    hasTouch: false,
    outWidth: 1920,
    budget: 6 * 1024 * 1024,
    screens: 3.2,
  },
};

const FPS = 30;
const INTRO_WAIT = 2500; // мс: шрифты, картинки, анимации первого экрана
const HOLD_START = 1.5; // с на первом экране
const SCROLL = 8.5; // с прокрутки
const HOLD_END = 1.0; // с в конце
const SHORT = 8; // с — укороченная версия, если не влезли в бюджет
const SCROLL_FRACTION = 0.45; // доля высоты страницы (сайты с закреплённым интро)
const SHOT_STEPS = 6; // снимки экранов по ходу страницы для кропов карусели

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return undefined;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return false;
  args.splice(i, 1);
  return true;
};
const only = opt("only");
const keepRaw = flag("keep-raw");
const keys = args.length ? args : Object.keys(SITES);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ff = (argv) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...argv], { stdio: "inherit" });
const size = (f) => statSync(f).size;
const mb = (n) => (n / 1024 / 1024).toFixed(2) + " МБ";
const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

async function launch() {
  for (const channel of [undefined, "chrome", "msedge"]) {
    try {
      return await chromium.launch({ channel, args: ["--autoplay-policy=no-user-gesture-required", "--hide-scrollbars"] });
    } catch {}
  }
  throw new Error("Не нашёл Chromium, Chrome или Edge. Поставь: npx playwright install chromium");
}

/** Ждём шрифты и картинки первого экрана, затем интро (время сайта идёт через clock). */
async function settle(page) {
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  // Шрифты и картинки первого экрана, но не дольше 8 с: ленивые картинки могут не загрузиться
  // никогда. Таймер на стороне Node — часы страницы под управлением page.clock.
  await Promise.race([
    page.evaluate(async () => {
      await document.fonts?.ready;
      const imgs = [...document.images].filter((i) => i.loading !== "lazy" && i.getBoundingClientRect().top < innerHeight * 1.5);
      await Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
    }),
    sleep(8000),
  ]);
  // Курсор не нужен ни в кадре, ни для hover-эффектов
  await page.addStyleTag({ content: "*, *::before, *::after { cursor: none !important; }" });
  await page.clock.runFor(INTRO_WAIT);
  await sleep(INTRO_WAIT);
}

/** Замедлить CSS-анимации и видео сайта: rate = длительность кадра видео / время съёмки кадра. */
async function slowDown(page, cdp, rate) {
  const r = Math.max(0.0625, Math.min(1, rate));
  await cdp.send("Animation.setPlaybackRate", { playbackRate: r }).catch(() => {});
  await page.evaluate((v) => document.querySelectorAll("video").forEach((el) => { el.playbackRate = v; }), r).catch(() => {});
}

async function record(browser, key, site, kind) {
  const dev = DEVICES[kind];
  const dir = join(OUT, key);
  const raw = join(RAW, key, kind);
  rmSync(raw, { recursive: true, force: true });
  mkdirSync(raw, { recursive: true });
  mkdirSync(join(dir, "shots"), { recursive: true });

  const context = await browser.newContext({
    viewport: dev.viewport,
    deviceScaleFactor: dev.deviceScaleFactor,
    isMobile: dev.isMobile,
    hasTouch: dev.hasTouch,
    userAgent: dev.userAgent,
    locale: "ru-RU",
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  await page.clock.install();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Animation.enable").catch(() => {});
  console.log(`  ${kind}: открываю ${site.url}`);
  await page.goto(site.url, { waitUntil: "load", timeout: 60000 });
  await settle(page);

  if (kind === "desktop") {
    const meta = await page.evaluate(() => ({
      title: document.title,
      h1: [...document.querySelectorAll("h1")].map((h) => h.innerText.trim()).slice(0, 3),
      text: document.body.innerText.replace(/\s+/g, " ").trim().slice(0, 1200),
      height: document.documentElement.scrollHeight,
    }));
    writeFileSync(join(dir, "meta.json"), JSON.stringify({ key, url: site.url, ...meta }, null, 2));
  }

  const pageH = await page.evaluate(() => document.documentElement.scrollHeight);
  const room = Math.max(pageH - dev.viewport.height, 0);
  const distance = Math.min(room, Math.max(dev.viewport.height * dev.screens, room * (site.scrollFraction ?? SCROLL_FRACTION)));

  const total = Math.round((HOLD_START + SCROLL + HOLD_END) * FPS);
  const startScroll = Math.round(HOLD_START * FPS);
  const scrollFrames = Math.round(SCROLL * FPS);
  const gestures = site.wheel === "gestures" ? site.gestures ?? 4 : 0;
  const gestureAt = new Set(Array.from({ length: gestures }, (_, g) => startScroll + Math.round((g * scrollFrames) / gestures)));
  if (gestures) await page.mouse.move(dev.viewport.width / 2, dev.viewport.height / 2);

  const t0 = Date.now();
  let lastFrameMs = 300;
  await slowDown(page, cdp, 1000 / FPS / lastFrameMs);
  for (let f = 0; f < total; f++) {
    const tf = Date.now();
    if (gestures) {
      if (gestureAt.has(f)) await page.mouse.wheel(0, dev.viewport.height);
    } else {
      const p = Math.min(1, Math.max(0, (f - startScroll) / scrollFrames));
      const y = Math.round(distance * easeInOut(p));
      await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
    }
    // Даём странице отрисовать кадр после скролла (анимации по скроллу, параллакс)
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.screenshot({ path: join(raw, `f_${String(f).padStart(4, "0")}.png`), type: "png" });
    // Время сайта: ровно один кадр видео
    await page.clock.runFor(1000 / FPS);
    // Скорость CSS-анимаций и видео подстраиваем под реальное время съёмки кадра
    const ms = Date.now() - tf;
    lastFrameMs = lastFrameMs * 0.8 + ms * 0.2;
    if (f % 15 === 0) await slowDown(page, cdp, 1000 / FPS / lastFrameMs);
  }
  const secs = ((Date.now() - t0) / 1000).toFixed(0);

  // Сайты-слайдеры (cleanup: true): между слайдами сайт на миг становится чёрным, а между жестами
  // кадр подолгу стоит — ролик выглядит «тормозящим» (владелец 2026-10-27, DJ Nagoo).
  // Чёрные кадры (PNG в разы меньше среднего) выкидываем, кадры перенумеровываем; долгие
  // стоп-кадры сжимает mpdecimate при кодировании.
  if (site.cleanup) {
    const names = readdirSync(raw).filter((n) => n.endsWith(".png")).sort();
    const sizes = names.map((n) => statSync(join(raw, n)).size);
    const median = [...sizes].sort((a, b) => a - b)[Math.floor(sizes.length / 2)];
    const keep = names.filter((_, i) => sizes[i] > median * 0.35);
    names.forEach((n) => renameSync(join(raw, n), join(raw, "o_" + n)));
    keep.forEach((n, i) => renameSync(join(raw, "o_" + n), join(raw, `f_${String(i).padStart(4, "0")}.png`)));
    readdirSync(raw).filter((n) => n.startsWith("o_")).forEach((n) => rmSync(join(raw, n)));
    console.log(`  ${kind}: убрано чёрных кадров ${names.length - keep.length} из ${names.length}`);
  }

  // Кодирование
  const dedupe = site.cleanup ? "mpdecimate=hi=768:lo=320:frac=0.5:max=10,setpts=N/FRAME_RATE/TB," : "";
  const scale = `${dedupe}scale=${dev.outWidth}:-2:flags=lanczos,format=yuv420p`;
  const input = ["-framerate", String(FPS), "-i", join(raw, "f_%04d.png")];
  const mp4 = join(dir, `${kind}.mp4`);
  const webm = join(dir, `${kind}.webm`);
  const encodeMp4 = (seconds, c) =>
    ff([...input, "-t", String(seconds), "-vf", scale, "-c:v", "libx264", "-preset", "slow", "-crf", String(c), "-tune", "animation", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", mp4]);
  const encodeWebm = (seconds, c) =>
    ff([...input, "-t", String(seconds), "-vf", scale, "-c:v", "libvpx-vp9", "-crf", String(c), "-b:v", "0", "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", "-pix_fmt", "yuv420p", "-an", webm]);
  const full = total / FPS;
  let seconds = full, crf = 18, crfW = 30;
  encodeMp4(seconds, crf);
  encodeWebm(seconds, crfW);
  // Бюджет: сначала короче (для обоих форматов), потом CRF +2 у того, кто не влез
  if (size(mp4) > dev.budget || size(webm) > dev.budget) {
    seconds = SHORT;
    encodeMp4(seconds, crf);
    encodeWebm(seconds, crfW);
  }
  // Сайты с анимированным зерном почти не сжимаются: потолок CRF 40, разрешение не трогаем
  while (size(mp4) > dev.budget && crf < 40) encodeMp4(seconds, (crf += 2));
  while (size(webm) > dev.budget && crfW < 50) encodeWebm(seconds, (crfW += 2));

  // Постеры: первый кадр в том же разрешении
  const first = join(raw, "f_0000.png");
  ff(["-i", first, "-vf", `scale=${dev.outWidth}:-2:flags=lanczos`, "-q:v", "2", join(dir, `${kind}-poster.jpg`)]);
  ff(["-i", first, "-vf", `scale=${dev.outWidth}:-2:flags=lanczos,format=yuv420p`, "-c:v", "libaom-av1", "-still-picture", "1", "-crf", "28", "-cpu-used", "4", join(dir, `${kind}-poster.avif`)]);

  // Снимки экранов по ходу страницы (для кропов карусели «Что внутри»)
  await slowDown(page, cdp, 1);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.clock.runFor(800);
  const stepPx = Math.max(dev.viewport.height, Math.floor(room / (SHOT_STEPS - 1)));
  for (let i = 0; i < SHOT_STEPS; i++) {
    if (gestures) {
      if (i) await page.mouse.wheel(0, dev.viewport.height);
    } else {
      await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), Math.min(room, i * stepPx));
    }
    await page.clock.runFor(1200);
    await sleep(300);
    await page.screenshot({ path: join(dir, "shots", `${kind}-${String(i + 1).padStart(2, "0")}.jpg`), type: "jpeg", quality: 85 });
  }

  await context.close();
  const frames = readdirSync(raw).filter((n) => n.endsWith(".png")).length;
  if (!keepRaw) rmSync(raw, { recursive: true, force: true });
  const note = seconds < full ? ` (укорочен до ${seconds} с)` : "";
  console.log(`  ${kind}: ${frames} кадров за ${secs} с съёмки · ${seconds} с видео${note}, CRF ${crf}/${crfW} · mp4 ${mb(size(mp4))} · webm ${mb(size(webm))}`);
  return { kind, seconds, crf, crfWebm: crfW, mp4: size(mp4), webm: size(webm) };
}

const browser = await launch();
const report = {};
let failed = 0;
for (const key of keys) {
  const site = SITES[key];
  if (!site) {
    console.error(`Нет сайта с ключом ${key}. Есть: ${Object.keys(SITES).join(", ")}`);
    failed++;
    continue;
  }
  console.log(`${key} — ${site.url}`);
  report[key] = [];
  for (const kind of only ? [only] : ["mobile", "desktop"]) {
    try {
      report[key].push(await record(browser, key, site, kind));
    } catch (e) {
      failed++;
      console.error(`  ${kind}: ошибка — ${e.message}`);
    }
  }
}
await browser.close();
mkdirSync(RAW, { recursive: true });
writeFileSync(join(RAW, "..", "record-report.json"), JSON.stringify(report, null, 2));
process.exit(failed ? 1 : 0);
