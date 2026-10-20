// Числовые токены из tokens.css для компонентов, которым нужно число, а не CSS
// (например, сила преломления стекла). Читаются один раз после загрузки стилей.
const cache = new Map<string, number>();

export function tokenNumber(name: string, fallback: number): number {
  if (cache.has(name)) return cache.get(name)!;
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
  const n = parseFloat(raw);
  const value = Number.isFinite(n) ? n : fallback;
  cache.set(name, value);
  return value;
}
