import { Plus } from "@phosphor-icons/react";
import { ru } from "../content/ru";
import { DisplayHeading } from "../components/DisplayHeading";

// Вопросы (TZ.md §7.8): широкий заголовок от поля, вопросы с 5-й по 12-ю колонку.
// Дизайн v2: строки «афиши» — номер и вопрос дисплейным шрифтом, тонкие линии между ними,
// плюс поворачивается в крестик, открытый вопрос целиком заливается лаймом.
export function Faq() {
  const { faq } = ru;
  return (
    <section id="faq" className="section" aria-labelledby="faq-h">
      <div className="page-grid gap-y-8">
        <DisplayHeading id="faq-h" text={faq.h2} accent={faq.h2Accent} className="col-span-full lg:col-span-4" />
        <div className="faq-list col-span-full lg:col-span-8 lg:col-start-5" data-reveal>
          {faq.items.map((it, i) => (
            <details key={it.q} className="faq-item">
              <summary className="faq-q">
                <span className="faq-num tabular" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="faq-text">{it.q}</span>
                <Plus aria-hidden="true" weight="bold" className="faq-chevron size-icon-md" />
              </summary>
              <p className="faq-a max-w-body text-body">{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
