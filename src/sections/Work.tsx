import { ArrowUpRight } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ru } from "../content/ru";
import { SiteVideo } from "../components/SiteVideo";
import { LiquidGlassButton } from "../components/ui/apple-tahoe-liquid-glass-button";

// Работы — «шоурум» (правки владельца 2026-10-21, TZ.md §7.3).
// Десктоп: секция в один экран. Сверху переключатель из 5 имён (активное с лаймовой полосой
// прогресса, автосмена 8 с, пауза при наведении, стрелки). По центру сцена: окно браузера 16:10
// с десктопной записью и телефон 9:16 с мобильной записью поверх правого нижнего угла.
// Слева, по низу сцены: имя, город · жанр · год, стеклянная кнопка «Открыть сайт».
// Смена артиста — въезд с лёгким 3D-поворотом; под курсором сцена наклоняется (±3°).
// Телефон: свайп карточек со scroll-snap и точками.
const AUTOPLAY = 8000;

type Artist = (typeof ru.work.artists)[number];

const domain = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");
const meta = (a: Artist) => [a.place, a.genre, a.since ? ru.work.sinceLabel(a.since) : ""].filter(Boolean).join(" · ");

function OpenSite({ a }: { a: Artist }) {
  return (
    <LiquidGlassButton asChild interactive refraction={18} className="bg-glass-fill pl-6 pr-inset">
      <a href={a.url} target="_blank" rel="noopener" data-portfolio={a.key}>
        {ru.work.open}
        <span className="grid size-tap place-items-center rounded-pill bg-accent text-accent-ink">
          <ArrowUpRight aria-hidden="true" className="size-icon-md" />
        </span>
      </a>
    </LiquidGlassButton>
  );
}

export function Work() {
  const { work } = ru;
  const n = work.artists.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const sceneRef = useRef<HTMLDivElement>(null);
  const swipeRef = useRef<HTMLDivElement>(null);
  const [dot, setDot] = useState(0);
  const a = work.artists[active];

  const go = useCallback((i: number) => setActive(((i % n) + n) % n), [n]);

  // Автосмена каждые 8 с; пауза при наведении и при reduced-motion
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => go(active + 1), AUTOPLAY);
    return () => window.clearTimeout(id);
  }, [active, paused, go]);

  // Наклон сцены за курсором (±3°), только устройства с наведением
  useEffect(() => {
    const el = sceneRef.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--srx", `${(-y * 6).toFixed(2)}deg`);
      el.style.setProperty("--sry", `${(x * 6).toFixed(2)}deg`);
    };
    const onLeave = () => {
      el.style.setProperty("--srx", "0deg");
      el.style.setProperty("--sry", "0deg");
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  // Точки свайпа на телефоне
  useEffect(() => {
    const el = swipeRef.current;
    if (!el) return;
    const onScroll = () => {
      const card = el.firstElementChild as HTMLElement | null;
      if (!card) return;
      setDot(Math.round(el.scrollLeft / (card.offsetWidth + 12)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") go(active + 1);
    if (e.key === "ArrowLeft") go(active - 1);
  };

  return (
    <section id="work" className="work section" aria-labelledby="work-h">
      <h2 id="work-h" className="px-margin text-head font-semibold leading-head tracking-head" data-reveal>
        {work.h2}
      </h2>

      {/* Десктоп: шоурум */}
      <div className="work-room hidden lg:flex" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div className="work-tabs" role="tablist" aria-label={work.tabsLabel} onKeyDown={onKey}>
          {work.artists.map((x, i) => (
            <button
              key={x.key}
              type="button"
              role="tab"
              aria-selected={i === active}
              tabIndex={i === active ? 0 : -1}
              onClick={() => go(i)}
              className="work-tab"
            >
              {x.name}
              <span aria-hidden="true" className="work-tab-bar">
                {i === active && <span key={active} className="work-tab-fill" data-paused={paused} />}
              </span>
            </button>
          ))}
        </div>

        <div className="work-stage page-grid">
          <div className="work-info col-span-4" aria-live="polite">
            <div key={a.key} className="work-fade flex flex-col gap-4">
              <p className="text-head font-semibold leading-head tracking-head">{a.name}</p>
              <p className="text-body">{meta(a)}</p>
              <div className="mt-2">
                <OpenSite a={a} />
              </div>
            </div>
          </div>

          <div ref={sceneRef} className="work-scene col-span-8">
            <div key={a.key} className="work-scene-in">
              <div className="work-browser">
                <div className="work-browser-bar" aria-hidden="true">
                  <span className="work-dots">
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="work-url">{domain(a.url)}</span>
                </div>
                <div className="work-browser-screen">
                  <SiteVideo site={a.key} device="desktop" label={`Сайт-пресс-кит ${a.name}, версия для компьютера`} />
                </div>
              </div>
              <div className="work-phone">
                <SiteVideo site={a.key} device="mobile" label={`Сайт-пресс-кит ${a.name}, версия для телефона`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Телефон и планшет: свайп */}
      <div ref={swipeRef} className="work-swipe mt-7 lg:hidden" data-reveal>
        {work.artists.map((x) => (
          <figure key={x.key} className="work-card">
            <div className="work-card-screen" data-theme="dark">
              <SiteVideo site={x.key} device="mobile" label={`Сайт-пресс-кит ${x.name}`} />
            </div>
            <figcaption className="mt-4 flex flex-col gap-2">
              <span className="text-lead font-semibold tracking-head">{x.name}</span>
              <span className="text-body">{meta(x)}</span>
              <div className="mt-2">
                <OpenSite a={x} />
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="work-dots-nav lg:hidden" aria-hidden="true">
        {work.artists.map((x, i) => (
          <span key={x.key} data-active={i === dot} />
        ))}
      </div>
    </section>
  );
}
