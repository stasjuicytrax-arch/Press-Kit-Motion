#!/usr/bin/env node
// Замер мобильной версии: node scripts/perf-mobile.mjs [url] [cpu]
// 390×844, DPR 2, тач, CPU медленнее в [cpu] раз (по умолчанию 4). Плавная прокрутка всей страницы
// за 12 с: кадры по секциям (медиана, доля кадров > 50 мс) и что ест главный поток (трассировка).
import { chromium } from "playwright";
const [url = "http://localhost:4173/", cpu = "4"] = process.argv.slice(2);
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=default", "--ignore-gpu-blocklist", "--enable-gpu"] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(4000);
const cdp = await ctx.newCDPSession(page);
await cdp.send("Emulation.setCPUThrottlingRate", { rate: +cpu });
await browser.startTracing(page, { categories: ["devtools.timeline", "disabled-by-default-devtools.timeline"] });
const res = await page.evaluate(async () => {
  const secs = [...document.querySelectorAll("main > section, main > div > section, section")].filter((s, i, a) => a.indexOf(s) === i);
  // Границы секций меряем один раз: замер на каждом кадре сам форсировал раскладку и занижал цифры
  const marks = secs.map((s) => [s.getBoundingClientRect().top + scrollY, s.id || s.getAttribute("aria-labelledby") || s.className.split(" ")[0]]);
  const name = (y) => {
    let n = "?";
    for (const [top, id] of marks) if (top <= y + innerHeight / 2) n = id;
    return n;
  };
  const end = document.documentElement.scrollHeight - innerHeight;
  const by = {};
  let prev = performance.now();
  const t0 = prev;
  await new Promise((done) => {
    const f = (t) => {
      const d = t - prev; prev = t;
      const k = name(scrollY); (by[k] ||= []).push(d);
      const p = Math.min(1, (t - t0) / 12000);
      window.scrollTo(0, end * p);
      p < 1 ? requestAnimationFrame(f) : done();
    };
    requestAnimationFrame(f);
  });
  const out = {};
  for (const [k, a] of Object.entries(by)) { const s = [...a].sort((x, y) => x - y); out[k] = `${a.length} кадров, медиана ${s[s.length >> 1].toFixed(0)} мс, >50мс: ${a.filter((d) => d > 50).length}`; }
  return out;
});
const ev = JSON.parse((await browser.stopTracing()).toString()).traceEvents;
const main = ev.find((e) => e.name === "thread_name" && e.args?.name === "CrRendererMain");
const sum = {}, fns = {};
for (const e of ev) {
  if (e.ph !== "X" || !e.dur || e.pid !== main?.pid || e.tid !== main?.tid) continue;
  sum[e.name] = (sum[e.name] || 0) + e.dur / 1000;
  if (e.name === "FunctionCall") { const d = e.args?.data || {}; const k = (d.url || "").split("/").pop() + ":" + (d.functionName || "?") + "@" + d.lineNumber + ":" + d.columnNumber; fns[k] = (fns[k] || 0) + e.dur / 1000; }
}
console.log(`${url} · 390 · CPU×${cpu}`);
for (const [k, v] of Object.entries(res)) console.log("  ", k.padEnd(14), v);
console.log("Главный поток:", Object.entries(sum).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `${k} ${v.toFixed(0)}`).join(" · "));
console.log("JS:", Object.entries(fns).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k} ${v.toFixed(0)}`).join(" · "));
await browser.close();
