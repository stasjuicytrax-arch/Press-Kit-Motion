import { useEffect, useRef } from "react";
import { ru } from "../content/ru";

// Кастомный курсор (дизайн v2, 2026-10-27), только мышь/тачпад, без reduced-motion.
// Лаймовая точка идёт за курсором мгновенно, кольцо — с мягким запаздыванием.
// Состояния: над ссылкой или кнопкой кольцо растёт; над работой ([data-portfolio], экраны
// сайтов) — заливается лаймом с подписью «Смотреть»; над полем ввода прячется. Системный
// курсор остаётся (для доступности), кольцо идёт поверх. Только transform/opacity, один rAF.
const LERP = 0.18;

export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const d = dot.current;
    const r = ring.current;
    if (!d || !r) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.documentElement.classList.add("has-cursor");
    let mx = -100;
    let my = -100;
    let rx = mx;
    let ry = my;
    let raf = 0;
    const tick = () => {
      rx += (mx - rx) * LERP;
      ry += (my - ry) * LERP;
      r.style.transform = `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0)`;
      raf = Math.abs(mx - rx) + Math.abs(my - ry) > 0.2 ? requestAnimationFrame(tick) : 0;
    };
    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      d.style.transform = `translate3d(${mx}px,${my}px,0)`;
      if (!raf) raf = requestAnimationFrame(tick);
      const t = e.target as Element;
      const state = t.closest("input, textarea, select")
        ? "hide"
        : t.closest("[data-portfolio], .problem-shot, .work-browser, .work-phone, .carousel-card")
          ? "view"
          : t.closest("a, button, summary, label, [role='tab']")
            ? "link"
            : "";
      if (r.dataset.state !== state) {
        r.dataset.state = state;
        d.dataset.state = state;
      }
    };
    const onLeave = () => {
      r.dataset.state = "hide";
      d.dataset.state = "hide";
    };
    const onDown = () => r.classList.add("cursor-press");
    const onUp = () => r.classList.remove("cursor-press");
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden="true">
        <span>{ru.cursor.view}</span>
      </div>
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
