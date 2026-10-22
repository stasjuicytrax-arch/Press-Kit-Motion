// Цели Яндекс Метрики (TZ.md §8). Счётчик владельца — YM_ID; грузится только после согласия
// на cookie (lib/consent.ts). Пока его нет (не согласились), вызовы тихо ничего не делают.
export const YM_ID = Number(import.meta.env.VITE_YM_ID) || 113732990;
type Ym = (id: number, method: "reachGoal", goal: string, params?: Record<string, unknown>) => void;

export function reachGoal(goal: "tg_click" | "portfolio_open" | "builder_used", params?: Record<string, unknown>) {
  const ym = (window as Window & { ym?: Ym }).ym;
  if (!ym) return;
  try {
    ym(YM_ID, "reachGoal", goal, params);
  } catch {}
}

/** Один слушатель на документ: любая ссылка с data-place — клик по Телеграму, с data-portfolio — открытие работы. */
export function trackClicks() {
  document.addEventListener("click", (e) => {
    const a = (e.target as Element).closest<HTMLElement>("[data-place], [data-portfolio]");
    if (!a) return;
    if (a.dataset.place) reachGoal("tg_click", { place: a.dataset.place });
    if (a.dataset.portfolio) reachGoal("portfolio_open", { artist: a.dataset.portfolio });
  });
}
