// Цели Яндекс Метрики (TZ.md §8). Сам счётчик подключается на шаге 14 по VITE_YM_ID;
// до этого вызовы тихо ничего не делают.
type Ym = (id: number, method: "reachGoal", goal: string, params?: Record<string, unknown>) => void;

export function reachGoal(goal: "tg_click" | "portfolio_open" | "builder_used", params?: Record<string, unknown>) {
  const id = Number(import.meta.env.VITE_YM_ID);
  const ym = (window as Window & { ym?: Ym }).ym;
  if (!id || !ym) return;
  try {
    ym(id, "reachGoal", goal, params);
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
