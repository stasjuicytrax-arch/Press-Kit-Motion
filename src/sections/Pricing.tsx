import { CaretDown } from "@phosphor-icons/react";
import { useState } from "react";
import { ru } from "../content/ru";
import { SolidCta } from "../components/SolidCta";

// Цена — вариант А, пакеты (TZ.md §7.7). Десктоп: имена пакетов крупно слева кнопками,
// справа сцена с ценой, составом и кнопкой. Смена 200ms crossfade. Телефон: аккордеон без линий.
// Цены и состав — заглушки TODO-OWNER.
export function Pricing() {
  const { pricing } = ru;
  const [sel, setSel] = useState<number>(pricing.defaultIndex);
  const p = pricing.packages[sel];

  const extra = (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-body font-semibold">{pricing.affectsTitle}</h3>
        <p className="mt-1 text-body text-muted">{pricing.affects}</p>
      </div>
      <div>
        <h3 className="text-body font-semibold">{pricing.needTitle}</h3>
        <p className="mt-1 text-body text-muted">{pricing.need}</p>
      </div>
      <p className="text-small text-muted">{pricing.promo}</p>
    </div>
  );

  return (
    <section id="price" className="section" aria-labelledby="price-h">
      <h2 id="price-h" className="sr-only">
        {pricing.h2}
      </h2>

      {/* Десктоп */}
      <div className="page-grid hidden lg:grid">
        <div className="col-span-6 flex flex-col" role="radiogroup" aria-label={pricing.h2} data-reveal>
          {pricing.packages.map((pk, i) => (
            <button
              key={pk.name}
              type="button"
              role="radio"
              aria-checked={i === sel}
              onClick={() => setSel(i)}
              className="price-name"
            >
              <span aria-hidden="true" className="work-dot" />
              <span className="text-head font-semibold leading-none tracking-head">{pk.name}</span>
            </button>
          ))}
        </div>
        <div className="col-span-5 col-start-8 flex flex-col gap-7" data-reveal>
          <div key={p.name} className="price-swap flex flex-col gap-4" aria-live="polite">
            <span className="text-small text-muted">{pricing.priceLabel}</span>
            <span className="price-figure tabular">{p.price}</span>
            <p className="text-body">{p.includes}</p>
            <SolidCta label={pricing.cta(p.name)} place="price" text={pricing.message(p.name)} className="self-start" />
          </div>
          {extra}
        </div>
      </div>

      {/* Телефон: аккордеон */}
      <div className="px-margin lg:hidden" data-reveal>
        <p className="mb-5 text-head font-semibold leading-head tracking-head" aria-hidden="true">
          {pricing.h2}
        </p>
        <div className="flex flex-col gap-2">
          {pricing.packages.map((pk, i) => (
            <details key={pk.name} className="faq-item" open={i === pricing.defaultIndex}>
              <summary className="faq-q">
                <span className="text-lead font-semibold tracking-head">{pk.name}</span>
                <CaretDown aria-hidden="true" className="faq-chevron size-icon-md" />
              </summary>
              <div className="flex flex-col gap-4 px-5 pb-5">
                <span className="price-figure tabular">{pk.price}</span>
                <p className="text-body">{pk.includes}</p>
                <SolidCta label={pricing.cta(pk.name)} place="price" text={pricing.message(pk.name)} className="w-full" />
              </div>
            </details>
          ))}
        </div>
        <div className="mt-8">{extra}</div>
      </div>
    </section>
  );
}
