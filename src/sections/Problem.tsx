import { useEffect, useRef } from "react";
import { ru } from "../content/ru";
import { DisplayHeading } from "../components/DisplayHeading";
import { SiteVideo } from "../components/SiteVideo";
import { SwipeHint } from "../components/SwipeHint";

// Проблема — «Заголовок как подпись к панораме» (TZ.md §7.2).
// Лента из записей всех сайтов — прокручивается вбок сама (свайп, тачпад, перетаскивание мышью).
// Десктоп — десктопные записи 16:10, телефон — мобильные в рамке 4:5.
export function Problem() {
  const { problem, work } = ru;
  const trackRef = useRef<HTMLDivElement>(null);

  // Лента — обычная горизонтальная прокрутка (владелец 2026-10-27: «не работает скролл»):
  // свайп и тачпад/Shift+колесо нативно, мышью — перетаскиванием
  useEffect(() => {
    const row = trackRef.current;
    if (!row || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let down = false;
    let x0 = 0;
    let s0 = 0;
    let moved = false;
    const onDown = (e: PointerEvent) => {
      down = true;
      moved = false;
      x0 = e.clientX;
      s0 = row.scrollLeft;
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 4) moved = true;
      row.scrollLeft = s0 - dx;
    };
    const onUp = () => (down = false);
    const onClick = (e: MouseEvent) => {
      if (moved) e.preventDefault();
    };
    row.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    row.addEventListener("click", onClick, true);
    return () => {
      row.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      row.removeEventListener("click", onClick, true);
    };
  }, []);

  return (
    <section className="problem section scene-dark" data-theme="dark" aria-labelledby="problem-h">
      <div className="relative px-margin" data-reveal>
        <DisplayHeading id="problem-h" text={problem.h2} accent={problem.h2Accent} className="max-w-[14ch]" />
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:gap-6">
          {problem.captions.map((c) => (
            <p key={c} className="problem-caption text-body">
              {c}
            </p>
          ))}
        </div>
      </div>

      <SwipeHint className="mt-7 problem-hint" />
      <div ref={trackRef} className="problem-pan" aria-label={problem.videoLabel} role="group" data-theme="dark">
        <div className="problem-track">
          {work.artists.map((a) => (
            <figure key={a.key} className="problem-item">
              {/* Экран меньше и аккуратнее (владелец 2026-10-27): компьютер — окно 16:10, телефон — телефон */}
              <div className="problem-shot">
                <div className="hidden h-full md:block">
                  <SiteVideo site={a.key} device="desktop" label={`Сайт-пресс-кит ${a.name}`} />
                </div>
                <div className="h-full md:hidden">
                  <SiteVideo site={a.key} device="mobile" label={`Сайт-пресс-кит ${a.name}`} />
                </div>
              </div>
              <figcaption className="problem-name">{a.name}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
