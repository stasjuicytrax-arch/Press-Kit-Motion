#!/usr/bin/env node
// Снимок одной секции после прокрутки к ней: node scripts/sec.mjs <selector> <name> [wait]
import { chromium } from "playwright";
const [sel, name, wait = "1600"] = process.argv.slice(2);
const b = await chromium.launch({ channel: "chrome", args: ["--use-angle=default", "--ignore-gpu-blocklist", "--enable-gpu"] });
for (const [w, h, m] of [[1440, 900, false], [390, 844, true]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: m ? 2 : 1, isMobile: m, hasTouch: m })).newPage();
  await p.addInitScript(() => { localStorage.setItem("pkm-consent", "necessary"); sessionStorage.setItem("pkm-intro", "1"); });
  await p.goto(process.env.URL || "http://localhost:5173/", { waitUntil: "load" });
  await p.waitForTimeout(1200);
  const y = await p.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY, sel);
  for (let yy = 0; yy <= y; yy += 400) { await p.evaluate((v) => scrollTo(0, v), yy); await p.waitForTimeout(60); }
  await p.evaluate((v) => scrollTo(0, v), y);
  await p.waitForTimeout(+wait);
  await p.screenshot({ path: `.cache/${name}-${w}.png` });
}
await b.close();
console.log("ok");
