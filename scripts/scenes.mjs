#!/usr/bin/env node
// Кадры живых сцен «Как появляется сайт» на заданном времени цикла:
// node scripts/scenes.mjs <width> <prefix> <ms,ms,...>
import { chromium } from "playwright";
const [w = "1440", prefix = ".cache/ps", times = "1500,6000"] = process.argv.slice(2);
const mobile = +w < 768;
const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
const ctx = await browser.newContext({ viewport: { width: +w, height: mobile ? 844 : 900 }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
const page = await ctx.newPage();
await page.goto(process.env.URL || "http://localhost:5173/", { waitUntil: "load" });
const n = await page.locator(".pscene").count();
for (let k = 0; k < n; k++) {
  const el = page.locator(".pscene").nth(k);
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  for (const t of times.split(",").map(Number)) {
    await el.evaluate((node, t) => node.getAnimations({ subtree: true }).forEach((a) => { a.pause(); a.currentTime = t; }), t);
    await el.screenshot({ path: `${prefix}-${w}-${k}-${t}.png` });
  }
}
console.log("ok", n);
await browser.close();
