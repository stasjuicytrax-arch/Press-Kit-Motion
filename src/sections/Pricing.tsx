import { ru } from "../content/ru";
import { SolidCta } from "../components/SolidCta";

// Цена — три пакета сразу, без переключателя (TZ.md §7.7, версия 2).
// Десктоп: три карточки по 4 колонки, одинаковой высоты; строки (подпись, название, цена,
// «для кого», список, срок, кнопка) выровнены по общим линиям через subgrid.
// Средняя «Букинг» выделена: --field, лаймовая кнопка, подпись «Чаще всего выбирают».
// Крайние на --surface-2 с чёрной капсулой. Телефон: карточки одна под другой, «Букинг» первой.
export function Pricing() {
  const { pricing } = ru;

  return (
    <section id="price" className="section" aria-labelledby="price-h">
      <div className="page-grid">
        <h2 id="price-h" className="col-span-full text-head font-semibold leading-head tracking-head" data-reveal>
          {pricing.h2}
        </h2>
      </div>

      <ul className="price-cards page-grid mt-8" data-reveal>
        {pricing.packages.map((pk) => (
          <li key={pk.name} className={`price-card${pk.featured ? " price-card--featured surface-field" : ""}`}>
            <p className="price-badge text-small font-medium">{pk.featured ? pricing.badge : ""}</p>
            <h3 className="text-lead font-semibold leading-lead tracking-head">{pk.name}</h3>
            <p className="price-figure tabular">{pk.price}</p>
            <p className="price-who text-body font-medium">{pk.who}</p>
            <ul className="price-items">
              {pk.items.map((it) => (
                <li key={it} className="price-item text-body">
                  {it}
                </li>
              ))}
            </ul>
            <p className="price-days text-body">
              <span className="price-muted">{pricing.daysLabel}: </span>
              <span className="tabular font-medium">{pk.days}</span>
            </p>
            <SolidCta
              label={pk.cta}
              place="price"
              text={pricing.message(pk.name)}
              variant={pk.featured ? "accent" : "ink"}
              className="w-full self-end"
            />
          </li>
        ))}
      </ul>

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
