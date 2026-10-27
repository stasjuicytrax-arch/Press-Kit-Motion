import { useEffect, useRef } from "react";
import { ru } from "../content/ru";

// Одна горизонтальная лаймовая полоса с приветствиями на разных языках (владелец 2026-10-27).
// Скорость постоянная — от скролла не ускоряется (владелец 2026-10-27). Только transform: translate3d; вне экрана и во скрытой вкладке цикл стоит;
// prefers-reduced-motion — ленты стоят.
const BASE = 40; // px/с

function Row({ words, className }: { words: readonly string[]; className: string }) {
  const half = (
    <>
      {words.map((w, i) => (
        <span key={i} className="band-item">
          {w}
          <i aria-hidden="true">//</i>
        </span>
      ))}
    </>
  );
  return (
    <div className={`band-row ${className}`}>
      <div className="band-track">
        <div className="band-half">{half}</div>
        <div className="band-half" aria-hidden="true">{half}</div>
      </div>
    </div>
  );
}

export function MarqueeBand() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tracks = [...root.querySelectorAll<HTMLElement>(".band-track")];
    const widths = tracks.map((t) => (t.firstElementChild as HTMLElement).offsetWidth);
    const x = tracks.map(() => 0);
    let last = 0;
    let raf = 0;
    let visible = false;
    const frame = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      const v = BASE * dt;
      tracks.forEach((tr, i) => {
        x[i] = (x[i] + v) % widths[i];
        tr.style.transform = `translate3d(${-x[i]}px,0,0)`;
      });
      raf = requestAnimationFrame(frame);
    };
    const run = () => {
      if (raf || !visible || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      visible ? run() : stop();
    });
    io.observe(root);
    const onVis = () => (document.hidden ? stop() : run());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div ref={ref} className="band" aria-hidden="true">
      <Row words={ru.band} className="band-row--lime" />
    </div>
  );
}
