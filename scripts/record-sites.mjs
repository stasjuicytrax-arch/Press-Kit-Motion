#!/usr/bin/env node
// Запись сайтов артистов для лендинга (TZ.md §6.1).
//
//   node scripts/record-sites.mjs [ключ ...] [--only mobile|desktop] [--keep-raw]
//
// Для каждого сайта и каждого устройства:
//   1. Открывает сайт в Chromium (Playwright), ждёт интро.
//   2. Пишет экран через CDP-скринкаст (кадры JPEG с метками времени), пока колесо мыши
//      плавно прокручивает первые 3–4 экрана. Колесо, а не scrollTo: так срабатывают
//      Lenis и анимации по скроллу, как у живого посетителя.
//   3. Собирает ролик ffmpeg: MP4 H.264 + WebM VP9, без звука, до 1.5 МБ.
//   4. Постер: первый кадр ролика, JPG + AVIF.
//   5. Снимки экранов по ходу прокрутки (shots/) — из них режутся кропы для карусели «Что внутри».
//   6. meta.json: title, h1 и первые строки текста, чтобы сверить подписи с сайтом.
//
// Результат: public/media/sites/<ключ>/. Сырые кадры: .cache/record/ (не в git).
// Нужны: Playwright (devDependency), ffmpeg и ffprobe в PATH, установленный Chrome или Edge.

import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync, statSync, existsSync, copyFileSync } from "node:fs";
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
    outWidth: 720,
    screens: 3.5,
  },
  desktop: {
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    outWidth: 1280,
    screens: 3.2,
  },
};

const INTRO_WAIT = 2500; // мс после загрузки: интро и прелоадеры
const HOLD_START = 1500; // мс стоим на первом экране
const SCROLL_TIME = 8500; // мс плавной прокрутки
const SCROLL_FRACTION = 0.45; // доля высоты страницы (можно переопределить в sites.mjs)
const HOLD_END = 1200; // мс в конце
const FPS = 30;
const MAX_BYTES = 1.5 * 1024 * 1024;
const SHOT_STEPS = 6; // снимков экранов по ходу страницы

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

async function launch() {
  // Сначала браузер Playwright, затем установленные Chrome и Edge.
  for (const channel of [undefined, "chrome", "msedge"]) {
    try {
      return await chromium.launch({ channel, args: ["--autoplay-policy=no-user-gesture-required", "--hide-scrollbars"] });
    } catch {}
  }
  throw new Error("Не нашёл Chromium, Chrome или Edge. Поставь: npx playwright install chromium");
}

async function smoothWheel(page, distance, duration) {
  // Колесо небольшими шагами с easeInOut по скорости. Позиция считается от реального
  // времени, поэтому медленный шаг не растягивает запись, а просто делает следующий шаг крупнее.
  let done = 0;
  const t0 = Date.now();
  for (;;) {
    const p = Math.min((Date.now() - t0) / duration, 1);
    const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const target = Math.round(distance * eased);
    if (target !== done) await page.mouse.wheel(0, target - done);
    done = target;
    if (p >= 1) break;
    await sleep(16);
  }
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
  console.log(`  ${kind}: открываю ${site.url}`);
  await page.goto(site.url, { waitUntil: "load", timeout: 60000 });
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await sleep(INTRO_WAIT);
  await page.mouse.move(dev.viewport.width / 2, dev.viewport.height / 2);

  // Подписи сверяем с самим сайтом
  if (kind === "desktop") {
    const meta = await page.evaluate(() => ({
      title: document.title,
      h1: [...document.querySelectorAll("h1")].map((h) => h.innerText.trim()).slice(0, 3),
      text: document.body.innerText.replace(/\s+/g, " ").trim().slice(0, 1200),
      height: document.documentElement.scrollHeight,
    }));
    writeFileSync(join(dir, "meta.json"), JSON.stringify({ key, url: site.url, ...meta }, null, 2));
  }

  // Скринкаст: каждый кадр с меткой времени
  const cdp = await context.newCDPSession(page);
  const frames = [];
  cdp.on("Page.screencastFrame", async (f) => {
    const file = join(raw, `f${String(frames.length).padStart(5, "0")}.jpg`);
    frames.push({ file, t: f.metadata.timestamp });
    writeFileSync(file, Buffer.from(f.data, "base64"));
    await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", {
    format: "jpeg",
    quality: 92,
    maxWidth: dev.viewport.width * dev.deviceScaleFactor,
    maxHeight: dev.viewport.height * dev.deviceScaleFactor,
    everyNthFrame: 1,
  });
  // Длина прокрутки: не меньше dev.screens экранов и не меньше доли страницы.
  // Доля нужна сайтам с закреплённым интро: там первые экраны скролла уходят на анимацию.
  const pageH = await page.evaluate(() => document.documentElement.scrollHeight);
  const room = Math.max(pageH - dev.viewport.height, 0);
  const distance = Math.min(room, Math.max(dev.viewport.height * dev.screens, room * (site.scrollFraction ?? SCROLL_FRACTION)));
  const tStart = Date.now() / 1000;
  await sleep(HOLD_START);
  if (site.wheel === "gestures") {
    // Сайт-слайдер: экраны листаются по жесту, мелкие шаги колеса он игнорирует.
    const n = site.gestures ?? 4;
    for (let i = 0; i < n; i++) {
      await smoothWheel(page, dev.viewport.height, 180);
      await sleep(SCROLL_TIME / n - 180);
    }
  } else {
    await smoothWheel(page, distance, SCROLL_TIME);
  }
  await sleep(HOLD_END);
  const tEnd = Date.now() / 1000;
  await cdp.send("Page.stopScreencast");
  await sleep(300);

  if (frames.length < 10) throw new Error(`слишком мало кадров (${frames.length})`);

  // Скринкаст шлёт кадры неравномерно. Раскладываем их по сетке 30 к/с по реальным меткам времени:
  // в каждый слот идёт последний кадр, пришедший к этому моменту. Так ролик идёт в реальном времени.
  const first = frames[0].t;
  const total = Math.floor((tEnd - tStart) * FPS);
  const seq = join(raw, "seq");
  mkdirSync(seq, { recursive: true });
  for (let i = 0, j = 0; i < total; i++) {
    const t = first + i / FPS;
    while (j + 1 < frames.length && frames[j + 1].t <= t) j++;
    copyFileSync(frames[j].file, join(seq, `s${String(i).padStart(5, "0")}.jpg`));
  }
  const input = ["-framerate", String(FPS), "-i", join(seq, "s%05d.jpg")];

  // Ширина и чётная высота
  const scale = `scale=${dev.outWidth}:-2:flags=lanczos,format=yuv420p`;
  const mp4 = join(dir, `${kind}.mp4`);
  const webm = join(dir, `${kind}.webm`);

  const x264 = [...input, "-vf", scale, "-an", "-c:v", "libx264", "-preset", "slow", "-profile:v", "high"];
  for (const crf of [28, 31, 34]) {
    ff([...x264, "-crf", String(crf), "-movflags", "+faststart", mp4]);
    if (size(mp4) <= MAX_BYTES) break;
  }
  if (size(mp4) > MAX_BYTES) {
    // Насыщенные кадры (дым, свет, видео на сайте): CRF не укладывается, ставим потолок битрейта под бюджет.
    const kbps = Math.floor((MAX_BYTES * 8 * 0.9) / (tEnd - tStart) / 1000);
    ff([...x264, "-b:v", `${kbps}k`, "-maxrate", `${kbps}k`, "-bufsize", `${kbps}k`, "-movflags", "+faststart", mp4]);
  }
  for (const crf of [40, 44, 48, 52]) {
    ff([...input, "-vf", scale, "-an", "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", String(crf), "-deadline", "good", "-cpu-used", "2", "-row-mt", "1", webm]);
    if (size(webm) <= MAX_BYTES) break;
  }

  // Постер: первый кадр
  const jpg = join(dir, `${kind}-poster.jpg`);
  const avif = join(dir, `${kind}-poster.avif`);
  ff(["-i", frames[0].file, "-vf", `scale=${dev.outWidth}:-2:flags=lanczos`, "-q:v", "3", jpg]);
  ff(["-i", frames[0].file, "-vf", `scale=${dev.outWidth}:-2:flags=lanczos,format=yuv420p`, "-c:v", "libaom-av1", "-still-picture", "1", "-crf", "32", "-cpu-used", "4", avif]);

  // Снимки экранов по ходу страницы (после прокрутки ждём появления анимаций)
  await page.mouse.wheel(0, -100000);
  await sleep(1500);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const stepPx = Math.max(dev.viewport.height, Math.floor((height - dev.viewport.height) / (SHOT_STEPS - 1)));
  for (let i = 0; i < SHOT_STEPS; i++) {
    if (i) await smoothWheel(page, stepPx, 600);
    await sleep(1200);
    await page.screenshot({ path: join(dir, "shots", `${kind}-${String(i + 1).padStart(2, "0")}.jpg`), type: "jpeg", quality: 82 });
  }

  await context.close();
  if (!keepRaw) rmSync(raw, { recursive: true, force: true });
  const dur = (tEnd - tStart).toFixed(1);
  console.log(`  ${kind}: ${frames.length} кадров, ${dur} с · mp4 ${mb(size(mp4))} · webm ${mb(size(webm))}`);
  return { kind, frames: frames.length, seconds: Number(dur), mp4: size(mp4), webm: size(webm) };
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
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
writeFileSync(join(RAW, "..", "record-report.json"), JSON.stringify(report, null, 2));
process.exit(failed ? 1 : 0);
