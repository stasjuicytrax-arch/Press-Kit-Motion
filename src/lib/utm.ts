// utm_source при входе сохраняется в sessionStorage и переживает навигацию по якорям (TZ.md §8).
const KEY = "pkm-utm-source";

export function captureUtm() {
  try {
    const src = new URLSearchParams(location.search).get("utm_source");
    if (src) sessionStorage.setItem(KEY, src.toLowerCase());
  } catch {}
}

export function utmSource(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}
