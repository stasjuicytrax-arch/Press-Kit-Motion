#!/usr/bin/env node
// Снимки страницы для проверки WebGL-сцен: node scripts/shot.mjs <url> <out-prefix> [wait-ms]
// Снимает 1440×900 и 390×844 в установленном Chrome/Edge (с GPU, если есть).
import { chromium } from "playwright";
const [url = "http://localhost:5173/", prefix = ".cache/shot", wait = "4500"] = process.argv.slice(2);
let browser;
for (const channel of ["chrome", "msedge", undefined]) {
  try { browser = await chromium.launch({ channel, args: ["--use-angle=default", "--ignore-gpu-blocklist"] }); break; } catch {}
}
for (const [name, vp, mobile] of [["1440", { width: 1440, height: 900 }, false], ["390", { width: 390, height: 844 }, true]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && console.log(`[${name}] console error: ${m.text()}`));
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(+wait);
  const scene = await page.evaluate(() => document.querySelector(".hero")?.dataset.scene);
  await page.screenshot({ path: `${prefix}-${name}.png` });
  console.log(`${name}: scene=${scene} → ${prefix}-${name}.png`);
  await ctx.close();
}
await browser.close();
