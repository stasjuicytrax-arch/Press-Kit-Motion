// Можно ли показывать WebGL-сцену первого экрана (DESIGN.md §9, TZ.md §7.1).
// Слабое устройство, экономия трафика или нет WebGL2 → статичный кадр капли.
type NavigatorExtra = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
};

export function canRunScene(): boolean {
  if (typeof window === "undefined") return false;
  // ?still — принудительный фолбэк для проверки статичного кадра
  if (new URLSearchParams(location.search).has("still")) return false;
  const nav = navigator as NavigatorExtra;
  if (nav.connection?.saveData) return false;
  // Порог мягче, чем «≤ 4» из DESIGN.md §9: 4 ГБ и 4 ядра — это обычные Android среднего класса
  if (nav.hardwareConcurrency && nav.hardwareConcurrency < 4) return false;
  if (nav.deviceMemory && nav.deviceMemory < 4) return false;
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return false;
  } catch {
    return false;
  }
  return true;
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const isPhone = () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
