import { ArrowDown } from "@phosphor-icons/react";
import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ru } from "../content/ru";
import { GlassCta } from "../components/GlassCta";
import { Magnetic } from "../components/Magnetic";
import { canRunScene, isPhone, prefersReducedMotion } from "../lib/device";

// Three.js грузится отдельным чанком после первого рендера DOM (DESIGN.md §9)
const HeroScene = lazy(() => import("../three/HeroScene"));

// Первый экран «Стеклянная капля» (TZ.md §7.1, версия 3).
// Монумент «Press Kit / Motion» — обычный h1 (LCP, SEO, скринридеры). Когда WebGL готов,
// те же слова рисует сцена, чтобы капля могла их преломлять, а DOM-текст становится
// прозрачным, но держит место. Без WebGL — DOM-текст и статичный кадр капли над «Kit».
export function Hero() {
  const { hero } = ru;
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [scene, setScene] = useState<"still" | "webgl">("still");
  const [mount, setMount] = useState(false);
  const [opts] = useState(() => ({
    reduced: prefersReducedMotion(),
    phone: isPhone(),
  }));
  const [still, setStill] = useState<{ x: number; y: number } | null>(null);

  // Сцену монтируем, когда браузер свободен: текст первого экрана уже нарисован
  useEffect(() => {
    if (!canRunScene()) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(() => setMount(true), { timeout: 1200 });
    else setTimeout(() => setMount(true), 300);
  }, []);

  // Статичный кадр капли стоит над «Kit»
  useLayoutEffect(() => {
    const place = () => {
      const kit = titleRef.current?.querySelector<HTMLElement>('[data-word="Kit"]');
      const h = heroRef.current;
      if (!kit || !h) return;
      const range = document.createRange();
      range.selectNodeContents(kit);
      const r = range.getBoundingClientRect();
      const hr = h.getBoundingClientRect();
      setStill({ x: r.left + r.width / 2 - hr.left, y: r.top + r.height / 2 - hr.top });
    };
    place();
    document.fonts?.ready.then(place);
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, []);

  const onReady = useCallback(() => setScene("webgl"), []);
  const onLost = useCallback(() => {
    setScene("still");
    setMount(false);
  }, []);
  const base = import.meta.env.BASE_URL;

  return (
    <section id="top" ref={heroRef} className="hero" data-scene={scene}>
      <h1 ref={titleRef} className="hero-title">
        <span className="block">
          {ru.brandWords.map((w, i) => (
            <span key={w}>
              <span data-word={w} className={`hero-word${i === ru.brandWords.length - 1 ? " hero-word--break" : ""}`}>
                {w}
              </span>
              {i < ru.brandWords.length - 1 ? " " : null}
            </span>
          ))}
        </span>
        <span className="sr-only"> — {hero.h1Rest}</span>
      </h1>

      {still && (
        <picture>
          <source media="(max-width: 767px)" srcSet={`${base}media/drop/drop-phone.avif`} type="image/avif" />
          <source media="(max-width: 767px)" srcSet={`${base}media/drop/drop-phone.jpg`} />
          <source srcSet={`${base}media/drop/drop-desktop.avif`} type="image/avif" />
          <img
            className="hero-drop-still"
            src={`${base}media/drop/drop-desktop.jpg`}
            alt=""
            aria-hidden="true"
            width={640}
            height={640}
            decoding="async"
            {...{ fetchpriority: "low" }}
            style={{ left: still.x, top: still.y }}
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </picture>
      )}

      {mount && (
        <Suspense fallback={null}>
          <HeroScene heroRef={heroRef} titleRef={titleRef} onReady={onReady} onLost={onLost} {...opts} />
        </Suspense>
      )}

      <div className="hero-bottom">
        <div className="flex flex-col gap-3">
          <p className="hero-lead text-lead leading-lead font-medium">{hero.lead}</p>
          <p className="tabular text-body font-medium text-ink">
            {hero.factsTemplate(hero.facts.price, hero.facts.days)}
          </p>
          <p className="text-small text-muted">{hero.geo}</p>
        </div>
        <div className="hero-actions">
          <Magnetic className="w-full md:w-auto">
            <GlassCta label={hero.cta} place="hero" className="w-full md:w-auto" />
          </Magnetic>
          <a href="#work" className="inline-flex min-h-tap items-center gap-2 self-start text-small text-ink underline md:self-end">
            {hero.toWork}
            <ArrowDown weight="regular" aria-hidden="true" className="size-icon-sm" />
          </a>
        </div>
      </div>
    </section>
  );
}
