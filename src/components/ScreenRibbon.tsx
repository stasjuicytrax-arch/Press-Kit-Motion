import { useEffect, useRef } from "react";
import { ru } from "../content/ru";
import { siteMedia } from "../lib/media";
import { tokenNumber } from "../lib/tokens";

// Лента экранов сайтов артистов: бесконечный изогнутый ряд (приём tilted-grid-hero,
// DESIGN.md §9). На десктопе края загибаются к зрителю, на телефоне уходят вглубь,
// чтобы центральный экран был крупнее (TZ.md §7.1). Это CSS-версия: первый экран до 3D
// и фолбэк для слабых устройств. Только transform и opacity.
//
// Каждый кадр лента ещё и отдаёт светлой копии строки-монумента (.mq-light) силуэты
// экранов как clip-path: над экранами строка светлая, над фоном чёрная.
const SETS = 2; // ряд повторяется, чтобы лента была бесконечной
const PRIORITY = 3; // первые экраны грузятся с высоким приоритетом

export function ScreenRibbon() {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const stage = stageRef.current;
    const cards = cardsRef.current.filter(Boolean);
    if (!stage || !cards.length) return;
    const light = stage.parentElement?.querySelector<HTMLElement>(".mq-light") ?? null;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    // Токены перечитываются при каждом ресайзе: на телефоне изгиб другой (tokens.css)
    let speed = 28; // px/с
    let bend = 40; // градусов на краю
    let lift = 220; // px к зрителю на краю (минус — вглубь)
    let step = 0, total = 0, W = 0;

    const measure = () => {
      speed = tokenNumber("--ribbon-speed", speed, true);
      bend = tokenNumber("--ribbon-bend", bend, true);
      lift = tokenNumber("--ribbon-lift", lift, true);
      step = cards[0].offsetWidth + tokenNumber("--ribbon-gap-px", 20, true);
      total = step * cards.length;
      W = stage.offsetWidth;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);

    let offset = 0;
    let last = performance.now();
    let raf = 0;
    let visible = true;

    const place = () => {
      const half = Math.max(W / 2, 1);
      for (let i = 0; i < cards.length; i++) {
        let x = (i * step - offset) % total;
        if (x < 0) x += total;
        x -= total / 2;
        const u = x / half;
        const a = Math.max(-1.35, Math.min(1.35, u));
        const z = lift * a * a;
        const ry = -bend * a;
        const fade = Math.min(1, Math.max(0, (1.32 - Math.abs(u)) / 0.32));
        const card = cards[i];
        card.style.transform = `translate3d(${x.toFixed(1)}px, -50%, ${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg)`;
        card.style.opacity = fade.toFixed(3);
      }
      if (!light) return;

      // Силуэты для светлой копии строки. При rotateY вертикальные края экрана остаются
      // вертикальными, поэтому горизонтальные границы реального бокса точны, а по высоте
      // строка всегда внутри экрана. Сначала все записи, потом все чтения — один пересчёт.
      const base = light.getBoundingClientRect();
      const h = base.height;
      let path = "";
      for (const card of cards) {
        if (parseFloat(card.style.opacity) < 0.6) continue;
        const r = card.getBoundingClientRect();
        const l = (r.left - base.left).toFixed(1);
        const rt = (r.right - base.left).toFixed(1);
        path += `M${l} 0L${rt} 0L${rt} ${h}L${l} ${h}Z`;
      }
      light.style.clipPath = path ? `path("${path}")` : "inset(100%)";
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // При скролле лента замедляется (TZ.md §7.1)
      const slow = 1 - 0.7 * Math.min(1, window.scrollY / Math.max(window.innerHeight, 1));
      offset += speed * slow * dt;
      place();
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      cancelAnimationFrame(raf);
      measure();
      if (reduced.matches || !visible || document.hidden) return place();
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      stage.closest(".hero")?.classList.toggle("is-offscreen", !visible);
      start();
    });
    io.observe(stage);
    document.addEventListener("visibilitychange", start);
    reduced.addEventListener("change", start);
    start();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", start);
      reduced.removeEventListener("change", start);
    };
  }, []);

  const artists = ru.work.artists;
  const items = Array.from({ length: SETS }, (_, s) => artists.map((a) => ({ ...a, copy: s }))).flat();

  return (
    <div ref={stageRef} className="ribbon" role="group" aria-label={ru.hero.ribbonLabel}>
      <div className="ribbon-scene">
        {items.map((a, i) => {
          const m = siteMedia(a.key, "mobile");
          return (
            <div
              key={`${a.key}-${a.copy}`}
              ref={(el) => {
                if (el) cardsRef.current[i] = el;
              }}
              className="ribbon-card"
              aria-hidden={a.copy > 0 || undefined}
            >
              <picture>
                <source srcSet={`${m.posterSmallAvif} 360w, ${m.posterAvif} 720w`} sizes="(max-width: 767px) 52vw, 18vw" type="image/avif" />
                <img
                  src={m.poster}
                  srcSet={`${m.posterSmall} 360w, ${m.poster} 720w`}
                  sizes="(max-width: 767px) 52vw, 18vw"
                  alt={a.copy > 0 ? "" : `${ru.hero.ribbonAlt} ${a.name}, первый экран`}
                  width={720}
                  height={1558}
                  decoding="async"
                  {...{ fetchpriority: i < PRIORITY ? "high" : "low" }}
                  draggable={false}
                />
              </picture>
            </div>
          );
        })}
      </div>
    </div>
  );
}
