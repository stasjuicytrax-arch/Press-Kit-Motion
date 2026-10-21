import { useEffect, useRef } from "react";
import { ru } from "../content/ru";
import { SolidCta } from "../components/SolidCta";
import { GlassCta } from "../components/GlassCta";
import { LiquidGlass } from "../components/ui/apple-tahoe-liquid-glass-button";

// Цена — три пакета из жидкого стекла над бегущей надписью (TZ.md §7.7, правки владельца 2026-10-21).
// За карточками через всю секцию медленно едет «Старт · Букинг · Хедлайнер ·» сплошным --ink
// размером с монумент; карточки — стекло, буквы за ними преломляются (как капля на первом экране).
// Двойной безель: стеклянный контур + внутренняя панель с бликом по верхнему краю.
// Крайние — светлое прозрачное стекло и стеклянная кнопка; «Букинг» — дымчатое тёмное стекло
// с лаймовой кромкой и лаймовой кнопкой, чуть крупнее и приподнята, сверху стеклянный чип.
// Под курсором карточка наклоняется (±4°), блик бежит за курсором; на телефоне без наклона.
type Pkg = (typeof ru.pricing.packages)[number];

function useTilt() {
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--rx", `${((0.5 - y) * 8).toFixed(2)}deg`);
        el.style.setProperty("--ry", `${((x - 0.5) * 8).toFixed(2)}deg`);
        el.style.setProperty("--gx", `${(x * 100).toFixed(1)}%`);
        el.style.setProperty("--gy", `${(y * 100).toFixed(1)}%`);
        el.dataset.hover = "true";
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
      delete el.dataset.hover;
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);
  return ref;
}

function Card({ pk }: { pk: Pkg }) {
  const { pricing } = ru;
  const ref = useTilt();
  const amount = pk.price.replace("$", "");
  return (
    <li ref={ref} className={`price-card${pk.featured ? " price-card--featured" : ""}`}>
      <LiquidGlass
        refraction={pk.featured ? 28 : 34}
        bezel={26}
        blur={12}
        dispersion={0.2}
        appearance={pk.featured ? "dark" : "light"}
        fallbackBlur={18}
        backdropExtra="saturate(160%)"
        className="price-glass"
        style={{ boxShadow: "var(--price-glass-shadow)" }}
      >
        <div className="price-panel" data-theme={pk.featured ? "dark" : undefined}>
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
      </LiquidGlass>
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

  return (
    <section id="price" className="section price" aria-labelledby="price-h">
      <div className="page-grid">
        <h2 id="price-h" className="col-span-full text-head font-semibold leading-head tracking-head" data-reveal>
          {pricing.h2}
        </h2>
      </div>

      <div className="price-stage">
        <div className="price-marquee" aria-hidden="true">
          <div className="price-marquee-track">
            <span>{words}</span>
            <span>{words}</span>
            <span>{words}</span>
            <span>{words}</span>
          </div>
        </div>
        <ul className="price-cards" data-reveal>
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
