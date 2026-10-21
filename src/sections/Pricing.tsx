import { CaretDown } from "@phosphor-icons/react";
import { useState } from "react";
import { ru } from "../content/ru";
import { SolidCta } from "../components/SolidCta";

// Цена — вариант А, пакеты (TZ.md §7.7; состав и цены — решение владельца 2026-10-21).
// Десктоп: имена пакетов крупно слева кнопками (выбранный в --ink с лаймовой точкой),
// справа сцена: огромная цена (tabular-nums, не прыгает), «для кого», что входит, срок, кнопка.
// Смена пакета — crossfade 200ms. Телефон: аккордеон без линий, EP открыт. Правки не указываем.
type Pkg = (typeof ru.pricing.packages)[number];

function Details({ pk, compact = false }: { pk: Pkg; compact?: boolean }) {
  const { pricing } = ru;
  return (
    <div className="flex flex-col gap-6">
      <p className="text-lead font-medium leading-lead">
        <span className="sr-only">{pricing.whoLabel}: </span>
        {pk.who}
      </p>
      <div>
        <h3 className="text-small text-muted">{pricing.includesLabel}</h3>
        <dl className="price-list mt-3">
          {pk.rows.map((r) => (
            <div key={r.label} className="price-row">
              <dt className="text-small text-muted">{r.label}</dt>
              <dd className="text-body">{r.value}</dd>
            </div>
          ))}
        </dl>
        {pk.extras.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {pk.extras.map((x) => (
              <li key={x} className="price-extra text-body">
                {x}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-body">
        <span className="text-muted">{pricing.daysLabel}: </span>
        <span className="tabular font-medium">{pk.days}</span>
      </p>
      <SolidCta
        label={pricing.cta(pk.name)}
        place="price"
        text={pricing.message(pk.name)}
        className={compact ? "w-full" : "self-start"}
      />
    </div>
  );
}

export function Pricing() {
  const { pricing } = ru;
  const [sel, setSel] = useState<number>(pricing.defaultIndex);
  const p = pricing.packages[sel];

  const onKey = (e: React.KeyboardEvent) => {
    const n = pricing.packages.length;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      setSel((v) => (v + 1) % n);
    }
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      setSel((v) => (v - 1 + n) % n);
    }
  };

  const notes = (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-body font-semibold">{pricing.affectsTitle}</h3>
        <p className="mt-1 text-body text-muted">{pricing.affects}</p>
      </div>
      <div>
        <h3 className="text-body font-semibold">{pricing.needTitle}</h3>
        <p className="mt-1 text-body text-muted">{pricing.need}</p>
      </div>
    </div>
  );

  return (
    <section id="price" className="section" aria-labelledby="price-h">
      <h2 id="price-h" className="sr-only">
        {pricing.h2}
      </h2>

      {/* Десктоп */}
      <div className="page-grid hidden lg:grid">
        <div className="col-span-6 flex flex-col gap-9" data-reveal>
          <div className="flex flex-col" role="radiogroup" aria-label={pricing.h2} onKeyDown={onKey}>
            {pricing.packages.map((pk, i) => (
              <button
                key={pk.name}
                type="button"
                role="radio"
                aria-checked={i === sel}
                tabIndex={i === sel ? 0 : -1}
                onClick={() => setSel(i)}
                className="price-name"
              >
                <span aria-hidden="true" className="work-dot" />
                <span className="text-head font-semibold leading-none tracking-head">{pk.name}</span>
              </button>
            ))}
          </div>
          {notes}
        </div>
        <div className="col-span-5 col-start-8" data-reveal>
          <p className="price-figure tabular" aria-live="polite">
            <span className="sr-only">{pk_label(p.name)}</span>
            {p.price}
          </p>
          <div key={p.name} className="price-swap mt-6">
            <Details pk={p} />
          </div>
        </div>
      </div>

      {/* Телефон: аккордеон без линий, EP открыт */}
      <div className="px-margin lg:hidden" data-reveal>
        <p className="mb-6 text-head font-semibold leading-head tracking-head" aria-hidden="true">
          {pricing.h2}
        </p>
        <div className="flex flex-col gap-2">
          {pricing.packages.map((pk, i) => (
            <details key={pk.name} className="faq-item" open={i === pricing.defaultIndex}>
              <summary className="faq-q">
                <span className="flex items-baseline gap-4">
                  <span className="text-lead font-semibold tracking-head">{pk.name}</span>
                  <span className="tabular text-lead font-semibold">{pk.price}</span>
                </span>
                <CaretDown aria-hidden="true" className="faq-chevron size-icon-md" />
              </summary>
              <div className="px-5 pb-6 pt-2">
                <Details pk={pk} compact />
              </div>
            </details>
          ))}
        </div>
        <div className="mt-9">{notes}</div>
      </div>
    </section>
  );
}

const pk_label = (name: string) => `Пакет «${name}», цена `;
