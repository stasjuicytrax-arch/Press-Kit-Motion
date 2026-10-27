import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ru } from "../content/ru";
import { DisplayHeading } from "../components/DisplayHeading";
import { LiquidGlassButton } from "../components/ui/apple-tahoe-liquid-glass-button";

// Что внутри — круговая карусель (TZ.md §7.4, приём circular-carousel nexus-ui).
// Все карточки — один кадр 9:16 с блоком сайта по центру тёмной подложки; боковые отличаются
// только наклоном, масштабом и прозрачностью. Подпись под центральной карточкой крупно, по центру.
// Десктоп: карточки по дуге в CSS-3D, активная в центре, стеклянные кнопки и лаймовые точки,
// автопрокрутка 4 с с паузой при наведении, фокусе и reduced-motion, стрелки клавиатуры.
// Телефон: горизонтальный свайп со scroll-snap, карточка 80vw.
const AUTOPLAY = 4000;

// Кадр 9:16 мобильной версии сайта от верха блока, на всю карточку; вместо рамки — тонкая
// стеклянная кромка, как у телефона в конструкторе (статичное стекло без backdrop-filter:
// карточки большие и крутятся в 3D, п. 10). Снимки — scripts/capture-blocks.mjs
function Shot({ base, shot, title, lazy }: { base: string; shot: string; title: string; lazy?: boolean }) {
  return (
    <div className="carousel-glass glass-static">
      <picture className="carousel-shot">
        <source srcSet={`${base}media/blocks/${shot}.avif`} type="image/avif" />
        <img src={`${base}media/blocks/${shot}.jpg`} alt={`${title}: блок с сайта артиста`} loading={lazy ? "lazy" : undefined} decoding="async" width={720} height={1280} />
      </picture>
    </div>
  );
}

export function Inside() {
  const { inside } = ru;
  const n = inside.cards.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const base = import.meta.env.BASE_URL;
  const stageRef = useRef<HTMLDivElement>(null);

  const go = useCallback((d: number) => setActive((a) => (a + d + n) % n), [n]);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => go(1), AUTOPLAY);
    return () => window.clearInterval(id);
  }, [paused, go]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
  };


  return (
    <section className="section scene-dark" data-theme="dark" data-panel aria-labelledby="inside-h">
      <div className="page-grid" data-reveal>
        <DisplayHeading id="inside-h" text={inside.h2} accent={inside.h2Accent} className="col-span-full lg:col-span-7" />
        <div className="col-span-full flex max-w-body flex-col gap-3 self-end text-body text-muted lg:col-span-4 lg:col-start-8">
          <p>{inside.lead}</p>
          <p className="text-ink">{inside.phoneNote}</p>
        </div>
      </div>

      {/* Десктоп: дуга */}
      <div
        ref={stageRef}
        className="carousel mt-9 hidden lg:block"
        role="region"
        aria-roledescription="карусель"
        aria-label={inside.h2}
        tabIndex={0}
        onKeyDown={onKey}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div className="carousel-stage">
          {inside.cards.map((c, i) => {
            let o = i - active;
            if (o > n / 2) o -= n;
            if (o < -n / 2) o += n;
            const hidden = Math.abs(o) > 2;
            return (
              <figure
                key={c.title}
                className="carousel-card"
                style={{ "--o": o, "--abs": Math.abs(o) } as React.CSSProperties}
                aria-hidden={o !== 0}
                data-hidden={hidden}
                onClick={() => setActive(i)}
              >
                <Shot base={base} shot={c.shot} title={c.title} />
                <figcaption className="carousel-caption">
                  <span className="block font-semibold leading-head tracking-head">{c.title}</span>
                  <span className="mt-2 block text-body text-muted">{c.text}</span>
                </figcaption>
              </figure>
            );
          })}
        </div>
        <div className="mt-7 flex items-center justify-center gap-5">
          <LiquidGlassButton size="icon" interactive aria-label={inside.prev} onClick={() => go(-1)} className="bg-glass-fill">
            <CaretLeft aria-hidden="true" className="size-icon-md" />
          </LiquidGlassButton>
          <div className="flex gap-2" role="tablist" aria-label={inside.dots}>
            {inside.cards.map((c, i) => (
              <button
                key={c.title}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={c.title}
                onClick={() => setActive(i)}
                className="carousel-dot"
              />
            ))}
          </div>
          <LiquidGlassButton size="icon" interactive aria-label={inside.next} onClick={() => go(1)} className="bg-glass-fill">
            <CaretRight aria-hidden="true" className="size-icon-md" />
          </LiquidGlassButton>
        </div>
        <p className="sr-only" aria-live="polite">
          {inside.cards[active].title}: {inside.cards[active].text}
        </p>
      </div>

      {/* Телефон: свайп */}
      <div className="inside-swipe mt-7 lg:hidden">
        {inside.cards.map((c) => (
          <figure key={c.title} className="inside-card">
            <Shot base={base} shot={c.shot} title={c.title} lazy />
            <figcaption className="mt-4">
              <span className="block text-lead font-semibold leading-lead tracking-head">{c.title}</span>
              <span className="mt-1 block text-small text-muted">{c.text}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
