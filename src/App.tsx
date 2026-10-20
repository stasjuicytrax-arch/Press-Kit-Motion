import { ArrowDown } from "@phosphor-icons/react";
import { ru } from "./content/ru";
import { Nav } from "./components/Nav";
import { StickyCta } from "./components/StickyCta";
import { SolidCta } from "./components/SolidCta";

// Статичный текстовый слой первого экрана на токенах (TZ.md §13, пункты 1 и 3).
// Статичный монумент — это и будущее состояние reduced-motion / без JS: имя читается целиком.
// Бегущая строка, 3D-лента и стеклянная CTA первого экрана появятся в пунктах 4–5.
export default function App() {
  const { hero } = ru;

  return (
    <>
    <Nav />
    <main className="flex min-h-[100dvh] flex-col">
      <section id="top" className="flex flex-1 flex-col justify-center gap-7 py-9">
        <h1 className="px-margin text-mono-static font-semibold leading-mono tracking-mono">
          {/* Настоящий пробел между строками, чтобы скринридер прочёл «Press Kit Motion» */}
          <span className="block whitespace-nowrap md:inline">{ru.brandLines[0]}</span>{" "}
          <span className="block whitespace-nowrap md:inline">{ru.brandLines[1]}</span>
          <span className="sr-only"> — {hero.h1Rest}</span>
        </h1>

        <div className="flex flex-col items-center gap-6 px-margin text-center">
          <p className="max-w-lead text-lead leading-lead font-medium">
            {hero.lead}
          </p>
          <p className="tabular text-body text-muted">
            {hero.factsTemplate(hero.facts.price, hero.facts.days)}
          </p>
          <SolidCta label={hero.cta} place="hero" className="w-full sm:w-auto" />
        </div>
      </section>

      <div className="flex flex-col gap-3 px-margin pb-6 text-small text-muted md:flex-row md:items-center md:justify-between">
        <p>{hero.geo}</p>
        {/* TODO: якорь #work оживёт с секцией «Работы» (TZ.md §13, пункт 7) */}
        <a href="#work" className="inline-flex min-h-tap items-center gap-2 text-ink underline">
          {hero.toWork}
          <ArrowDown weight="regular" aria-hidden="true" className="size-icon-sm" />
        </a>
      </div>
    </main>
    <StickyCta />
    </>
  );
}
