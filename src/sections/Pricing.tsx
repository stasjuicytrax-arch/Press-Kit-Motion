import { useEffect, useRef } from "react";
import { ru } from "../content/ru";
import { SolidCta } from "../components/SolidCta";
import { GlassCta } from "../components/GlassCta";
import { LiquidGlass } from "../components/ui/apple-tahoe-liquid-glass-button";
import { startPriceMarquee } from "../lib/priceMarquee";

// Цена — три пакета из жидкого стекла над бегущей надписью (TZ.md §7.7, правки владельца 2026-10-21).
// За карточками через всю секцию медленно едет «Старт · Букинг · Хедлайнер ·» сплошным --ink.
// Производительность (п. 10): внутри карточки нет живого backdrop-filter — там своя заранее
// размытая копия надписи, которую двигает общий цикл (lib/priceMarquee.ts). Преломление
// с displacement только на тонкой кромке (--price-rim) из четырёх полос жидкого стекла.
// Блики статичные; наклон (±4°) и блик за курсором — только transform/opacity, раз в кадр,
// на тач-устройствах выключены. «Букинг» — дымчатое тёмное стекло с лаймовой кромкой.
type Pkg = (typeof ru.pricing.packages)[number];

const GLARE = 260; // радиус блика, px

function useTilt() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    const glare = el?.querySelector<HTMLElement>(".price-glare");
    if (!el || !glare) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let px = 0;
    let py = 0;
    const apply = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const x = (px - r.left) / r.width;
      const y = (py - r.top) / r.height;
      el.style.transform = `perspective(1200px) rotateX(${((0.5 - y) * 8).toFixed(2)}deg) rotateY(${((x - 0.5) * 8).toFixed(2)}deg)`;
      glare.style.transform = `translate3d(${(x * el.offsetWidth - GLARE).toFixed(1)}px,${(y * el.offsetHeight - GLARE).toFixed(1)}px,0)`;
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onEnter = () => {
      el.dataset.hover = "true";
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      el.style.transform = "";
      delete el.dataset.hover;
    };
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);
  return ref;
}

// Кромка: четыре тонкие полосы жидкого стекла по контуру (живое преломление только здесь)
// Полосы шире кромки и заходят под панель: их внутренний край (с бликом линзы) прячется под ней
const RIM_W = "calc(var(--price-rim) * 2.5)";
const RIM: React.CSSProperties[] = [
  { inset: "0 0 auto 0", height: RIM_W },
  { inset: "auto 0 0 0", height: RIM_W },
  { top: "var(--price-rim)", bottom: "var(--price-rim)", left: 0, width: RIM_W },
  { top: "var(--price-rim)", bottom: "var(--price-rim)", right: 0, width: RIM_W },
];

function Rim({ dark }: { dark: boolean }) {
  return (
    <span aria-hidden="true" className="price-rim">
      {RIM.map((st, i) => (
        <LiquidGlass
          key={i}
          refraction={10}
          bezel={6}
          blur={2}
          dispersion={0.2}
          appearance={dark ? "dark" : "light"}
          fallbackBlur={8}
          className="absolute !rounded-none"
          style={{ ...st, boxShadow: "none" }}
        />
      ))}
    </span>
  );
}

function Card({ pk }: { pk: Pkg }) {
  const { pricing } = ru;
  const ref = useTilt();
  const amount = pk.price.replace("$", "");
  return (
    <li className={`price-card${pk.featured ? " price-card--featured" : ""}`}>
      <div ref={ref} className="price-tilt">
        <div className="price-glass">
          <Rim dark={pk.featured} />
          <div className="price-panel" data-theme={pk.featured ? "dark" : undefined}>
            <span aria-hidden="true" className="price-ghost" />
            <span aria-hidden="true" className="price-tint" />
            <span aria-hidden="true" className="price-glare" />
            <p className="price-name">{pk.name}</p>
            <p className="price-figure tabular">
              <span className="price-cur">$</span>
              {amount}
            </p>
            <p className="price-who">{pk.who}</p>
            <ul className="price-items">
              {pk.items.map((it) => (
                <li key={it} className="price-item">
                  {it}
                </li>
              ))}
            </ul>
            <div className="price-actions">
              {pk.featured ? (
                <SolidCta label={pk.cta} place="price" text={pricing.message(pk.name)} className="price-cta !pl-4 !text-small" />
              ) : (
                <GlassCta label={pk.cta} place="price" text={pricing.message(pk.name)} className="price-cta !pl-4 !text-small" />
              )}
              <LiquidGlass refraction={8} bezel={10} blur={4} className="price-days tabular" aria-label={`${pricing.daysLabel}: ${pk.days}`}>
                {pk.days}
              </LiquidGlass>
            </div>
          </div>
        </div>
      </div>
      {pk.featured && (
        <LiquidGlass refraction={10} bezel={12} blur={6} appearance="dark" className="price-badge" style={{ color: "var(--accent)" }}>
          {pricing.badge}
        </LiquidGlass>
      )}
    </li>
  );
}

export function Pricing() {
  const { pricing } = ru;
  const words = pricing.packages.map((p) => p.name).join(" · ") + " · ";
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => (stageRef.current ? startPriceMarquee(stageRef.current) : undefined), []);

  return (
    <section id="price" className="section price" aria-labelledby="price-h">
      <div className="page-grid">
        <h2 id="price-h" className="col-span-full text-head font-semibold leading-head tracking-head" data-reveal>
          {pricing.h2}
        </h2>
      </div>

      <div ref={stageRef} className="price-stage">
        <div className="price-marquee" aria-hidden="true">
          <div className="price-marquee-track">
            <span>{words}</span>
            <span>{words}</span>
            <span>{words}</span>
            <span>{words}</span>
          </div>
        </div>
        <ul className="price-cards" data-reveal data-hide-sticky>
          {pricing.packages.map((pk) => (
            <Card key={pk.name} pk={pk} />
          ))}
        </ul>
      </div>

      <div className="page-grid mt-9 gap-y-6" data-reveal>
        <div className="col-span-full md:col-span-3 lg:col-span-5">
          <h3 className="text-body font-semibold">{pricing.affectsTitle}</h3>
          <p className="mt-1 text-body text-muted">{pricing.affects}</p>
        </div>
        <div className="col-span-full md:col-span-3 lg:col-span-5 lg:col-start-7">
          <h3 className="text-body font-semibold">{pricing.needTitle}</h3>
          <p className="mt-1 text-body text-muted">{pricing.need}</p>
        </div>
      </div>
    </section>
  );
}
