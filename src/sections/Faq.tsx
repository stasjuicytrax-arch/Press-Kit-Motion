import { CaretDown } from "@phosphor-icons/react";
import { ru } from "../content/ru";
import { DisplayHeading } from "../components/DisplayHeading";

// Вопросы (TZ.md §7.8): широкий заголовок от поля, вопросы с 5-й по 12-ю колонку,
// <details> без линий, открытый получает подложку --surface (DESIGN.md §7).
export function Faq() {
  const { faq } = ru;
  return (
    <section id="faq" className="section" aria-labelledby="faq-h">
      <div className="page-grid gap-y-8">
        <DisplayHeading id="faq-h" text={faq.h2} accent={faq.h2Accent} className="col-span-full lg:col-span-4" />
        <div className="col-span-full flex flex-col gap-2 lg:col-span-8 lg:col-start-5" data-reveal>
          {faq.items.map((it) => (
            <details key={it.q} className="faq-item">
              <summary className="faq-q">
                <span className="text-lead font-medium leading-lead">{it.q}</span>
                <CaretDown aria-hidden="true" className="faq-chevron size-icon-md" />
              </summary>
              <p className="max-w-body px-5 pb-5 text-body text-muted">{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
