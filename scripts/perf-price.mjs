#!/usr/bin/env node
// Замер плавности секции «Цена»: node scripts/perf-price.mjs [url] [width]
// Chrome, CPU ×4 медленнее (CDP), 5 с плавной прокрутки через #price. Считает кадры по rAF,
// длинные кадры > 50 мс и long-animation-frame (если браузер их отдаёт).
import { chromium } from "playwright";
const [url = "http://localhost:5173/", w = "1440"] = process.argv.slice(2);
const mobile = +w < 768;
const browser = await chromium.launch({ channel: "chrome", headless: false, args: ["--window-position=-2400,0"] });
const ctx = await browser.newContext({ viewport: { width: +w, height: mobile ? 844 : 900 }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(2500);
const top = await page.evaluate(() => document.getElementById("price").getBoundingClientRect().top + scrollY);
await page.evaluate((y) => window.scrollTo(0, y - innerHeight), top);
await page.waitForTimeout(1500);
const cdp = await ctx.newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: +(process.env.CPU || 4) });
const res = await page.evaluate(async (top) => {
  const loaf = [];
  try {
    new PerformanceObserver((l) => l.getEntries().forEach((e) => loaf.push(e.duration))).observe({ type: "long-animation-frame", buffered: false });
  } catch {}
  const start = scrollY;
  const end = top + document.getElementById("price").offsetHeight;
  const frames = [];
  let prev = performance.now();
  const t0 = prev;
  await new Promise((done) => {
    const f = (t) => {
      frames.push(t - prev);
      prev = t;
      const p = Math.min(1, (t - t0) / 5000);
      window.scrollTo(0, start + (end - start) * p);
      if (p < 1) requestAnimationFrame(f);
      else done();
    };
    requestAnimationFrame(f);
  });
  frames.shift();
  const sorted = [...frames].sort((a, b) => a - b);
  return {
    frames: frames.length,
    fps: +(frames.length / 5).toFixed(1),
    p50: +sorted[Math.floor(sorted.length / 2)].toFixed(1),
    p95: +sorted[Math.floor(sorted.length * 0.95)].toFixed(1),
    max: +sorted[sorted.length - 1].toFixed(1),
    over50: frames.filter((d) => d > 50).length,
    loaf: loaf.length,
    loafMax: loaf.length ? +Math.max(...loaf).toFixed(0) : 0,
  };
}, top);
console.log(`${url} @${w}, CPU×${process.env.CPU || 4}:`, JSON.stringify(res));
await browser.close();
