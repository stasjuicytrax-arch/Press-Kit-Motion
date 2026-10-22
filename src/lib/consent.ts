// Согласие на cookie (2026-10-22). Ответ хранится в localStorage (это «необходимое» хранение).
// Яндекс Метрика загружается только после «Принять» и только если задан VITE_YM_ID.
export type Consent = "all" | "necessary";
const KEY = "pkm-consent";

export function getConsent(): Consent | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "all" || v === "necessary" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(v: Consent) {
  try {
    localStorage.setItem(KEY, v);
  } catch {}
  if (v === "all") loadMetrika();
}

let loaded = false;
export function loadMetrika() {
  const id = Number(import.meta.env.VITE_YM_ID);
  if (loaded || !id) return;
  loaded = true;
  type YmQueue = ((...a: unknown[]) => void) & { a?: unknown[][]; l?: number };
  const w = window as Window & { ym?: YmQueue };
  const ym: YmQueue = w.ym ?? (function (...a: unknown[]) {
    (ym.a = ym.a || []).push(a);
  } as YmQueue);
  ym.l = Date.now();
  w.ym = ym;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://mc.yandex.ru/metrika/tag.js";
  document.head.appendChild(s);
  ym(id, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true });
}
