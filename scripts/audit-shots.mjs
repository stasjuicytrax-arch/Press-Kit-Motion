#!/usr/bin/env node
// Скриншоты каждого блока лендинга для аудита: node scripts/audit-shots.mjs [prefix]
// 1440×900 и 390×844 (DPR 2), каждая секция отдельным файлом .cache/<prefix>-<w>-<NN>-<id>.png
import { chromium } from "playwright";
const prefix = process.argv[2] || "audit";
const b = await chromium.launch({ channel: "chrome", args: ["--use-angle=default", "--ignore-gpu-blocklist", "--enable-gpu"] });
for (const [w, h, m] of [[1440, 900, false], [390, 844, true]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: m ? 2 : 1, isMobile: m, hasTouch: m })).newPage();
  await p.addInitScript(() => localStorage.setItem("pkm-consent", "necessary"));
  await p.goto(process.env.URL || "http://localhost:5173/", { waitUntil: "load" });
  await p.waitForTimeout(3000);
  const end = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < end; y += 500) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(120); }
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(800);
  const ids = await p.evaluate(() => [...document.querySelectorAll("main > section, main > div > section, footer")].map((s, i) => s.id || s.getAttribute("aria-labelledby") || s.tagName.toLowerCase() + i));
  for (let i = 0; i < ids.length; i++) {
    const el = p.locator("main > section, main > div > section, footer").nth(i);
    await el.scrollIntoViewIfNeeded();
    await p.waitForTimeout(900);
    const box = await el.boundingBox();
    const clip = { x: 0, y: Math.max(0, box.y), width: w, height: Math.min(h, box.height) };
    await p.screenshot({ path: `.cache/${prefix}-${w}-${String(i).padStart(2, "0")}-${ids[i]}.png`, clip });
  }
  console.log(w, ids.join(" "));
}
await b.close();
