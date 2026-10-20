import { ArrowDown, ArrowUpRight } from "@phosphor-icons/react";
import { ru } from "./content/ru";
import { telegramUrl } from "./lib/telegram";

// Каркас (TZ.md §13, пункт 1): статичный текстовый слой первого экрана на токенах.
// Статичный монумент — это и будущее состояние reduced-motion / без JS: имя читается целиком.
// Бегущая строка, 3D-лента и стеклянная CTA появятся в пунктах 3–5.
export default function App() {
  const { hero } = ru;

  return (
    <main className="flex min-h-[100dvh] flex-col">
      <section className="flex flex-1 flex-col justify-center gap-7 py-9">
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
          <a
            href={telegramUrl()}
            target="_blank"
            rel="noopener"
            className="group inline-flex h-button w-full items-center justify-between gap-4 rounded-pill bg-accent pl-6 pr-inset font-medium text-accent-ink no-underline transition-transform duration-fast ease-spring hover:scale-hover active:scale-press sm:w-auto"
          >
            {hero.cta}
            <span className="grid size-tap place-items-center rounded-pill bg-ink text-accent">
              <ArrowUpRight
                weight="regular"
                aria-hidden="true"
                className="size-icon-md transition-transform duration-fast ease-spring group-hover:translate-x-nudge group-hover:-translate-y-nudge"
              />
            </span>
          </a>
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
  );
}
