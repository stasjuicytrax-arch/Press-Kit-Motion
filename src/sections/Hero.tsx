import { ArrowDown } from "@phosphor-icons/react";
import { ru } from "../content/ru";
import { GlassCta } from "../components/GlassCta";
import { SolidCta } from "../components/SolidCta";
import { Marquee } from "../components/Marquee";
import { ScreenRibbon } from "../components/ScreenRibbon";

// Первый экран «Монумент сквозь ленту» (TZ.md §7.1).
// Лента экранов сайтов, сквозь неё едет строка «Press Kit Motion», стеклянная CTA
// на нижнем краю ленты (десктоп) — стекло преломляет экраны. На телефоне сплошная
// лаймовая кнопка у нижнего края: под ней светлый фон, стеклу там нечего преломлять.
// Текст стоит на месте сразу, лента выплывает из глубины, потом стартует строка.
export function Hero() {
  const { hero } = ru;

  return (
    <section id="top" className="hero">
      <div className="hero-stage">
        <ScreenRibbon />
        <Marquee text={ru.brand} lines={ru.brandLines} label={`${ru.brand} — ${hero.h1Rest}`} />
      </div>

      <div className="hero-cta hidden md:flex">
        <GlassCta label={hero.cta} place="hero" />
      </div>

      <div className="hero-copy">
        <p className="max-w-lead text-lead leading-lead font-medium">{hero.lead}</p>
        <p className="tabular text-body text-muted">
          {hero.factsTemplate(hero.facts.price, hero.facts.days)}
        </p>
      </div>

      <div className="hero-foot">
        <p className="text-small text-muted">{hero.geo}</p>
        <a href="#work" className="hidden min-h-tap items-center gap-2 text-small text-ink underline md:inline-flex">
          {hero.toWork}
          <ArrowDown weight="regular" aria-hidden="true" className="size-icon-sm" />
        </a>
        <SolidCta label={hero.cta} place="hero" className="w-full md:hidden" />
      </div>
    </section>
  );
}
