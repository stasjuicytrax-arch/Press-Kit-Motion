#!/usr/bin/env node
// Полная страница на 1440 и 390: прокрутка до конца (срабатывают появления), снимок целиком
// и проверка горизонтального скролла.   node scripts/fullpage.mjs [url] [out-prefix]
import { chromium } from "playwright";
const [url = "http://localhost:5173/", prefix = ".cache/full"] = process.argv.slice(2);
let browser;
for (const channel of ["chrome", "msedge", undefined]) {
  try { browser = await chromium.launch({ channel }); break; } catch {}
}
let bad = 0;
for (const [name, vp, mobile] of [["1440", { width: 1440, height: 900 }, false], ["390", { width: 390, height: 844 }, true]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += vp.height * 0.6) {
    await page.evaluate((t) => window.scrollTo(0, t), y);
    await page.waitForTimeout(160);
  }
  await page.waitForTimeout(900);
  const info = await page.evaluate(() => {
    const W = document.documentElement.clientWidth;
    const wide = [...document.querySelectorAll("body *")]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0) return false;
        // элементы внутри намеренно скроллящихся/обрезанных лент не считаем
        if (el.closest(".work-swipe, .inside-swipe, .problem-pan, .final-drift, .carousel-stage, .footer-mark, .hero-canvas")) return false;
        return r.right > W + 1 || r.left < -1;
      })
      .slice(0, 8)
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]} ${Math.round(el.getBoundingClientRect().left)}…${Math.round(el.getBoundingClientRect().right)}`);
    return { scrollW: document.documentElement.scrollWidth, W, height: document.documentElement.scrollHeight, wide };
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${prefix}-${name}.png`, fullPage: true });
  const overflow = info.scrollW > info.W;
  if (overflow || errors.length) bad++;
  console.log(`${name}: высота ${info.height}px · scrollWidth ${info.scrollW} / ${info.W} ${overflow ? "ГОРИЗОНТАЛЬНЫЙ СКРОЛЛ" : "ок"}`);
  if (info.wide.length) console.log(`  выходят за край: ${info.wide.join(" | ")}`);
  if (errors.length) console.log(`  ошибки: ${[...new Set(errors)].slice(0, 5).join(" | ")}`);
  await ctx.close();
}
await browser.close();
process.exit(bad ? 1 : 0);
