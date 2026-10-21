#!/usr/bin/env node
// Снимок одного элемента: node scripts/el.mjs <selector> <out.png> [width] [wait-ms] [scrollWithin]
import { chromium } from "playwright";
const [sel, out, w = "1440", wait = "1500"] = process.argv.slice(2);
const mobile = +w < 768;
const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch());
const ctx = await browser.newContext({ viewport: { width: +w, height: mobile ? 844 : 900 }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
const page = await ctx.newPage();
page.on("console", (m) => m.type() === "error" && console.log("console error:", m.text()));
await page.goto(process.env.URL || "http://localhost:5173/", { waitUntil: "load" });
const el = page.locator(sel).first();
await el.scrollIntoViewIfNeeded();
await page.waitForTimeout(+wait);
await el.screenshot({ path: out });
console.log("ok", out);
await browser.close();
