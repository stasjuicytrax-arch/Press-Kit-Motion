import { ArrowUp } from "@phosphor-icons/react";
import { ru } from "../content/ru";
import { telegramUrl } from "../lib/telegram";

// Подвал (TZ.md §7.10): Телеграм крупно, колонки мелких ссылок, имя «Press Kit Motion»
// целиком ровно от поля до поля (размер от ширины экрана), под ним юридическая строка.
// Буквы имени поднимаются снизу по очереди при появлении. data-hide-sticky прячет липкую кнопку.
export function Footer() {
  const { footer } = ru;
  const base = import.meta.env.BASE_URL;
  const href = (h: string) => (h.startsWith("#") || h.startsWith("http") ? h : `${base}${h}`);
  return (
    <footer className="footer" data-hide-sticky data-theme="light">
      <div className="page-grid gap-y-8">
        <a href={telegramUrl()} target="_blank" rel="noopener" data-place="footer" className="col-span-full text-lead font-semibold tracking-head underline lg:col-span-5">
          {footer.telegram}
        </a>
        <nav aria-label="Ссылки в подвале" className="col-span-full grid grid-cols-1 gap-6 sm:grid-cols-3 lg:col-span-6 lg:col-start-7">
          {footer.columns.map((col, i) => (
            <ul key={i} className="flex flex-col gap-2">
              {col.map((l) => (
                <li key={l.label}>
                  <a href={href(l.href)} {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})} className="footer-link">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          ))}
        </nav>
      </div>
      <p className="footer-mark" aria-hidden="true" data-reveal>
        {[...ru.brand].map((ch, i) => (
          <span key={i} className="footer-char" style={{ "--i": i } as React.CSSProperties}>
            {ch === " " ? " " : ch}
          </span>
        ))}
      </p>
      <div className="footer-legal">
        <span>{footer.legal}</span>
        <a href="#top" className="inline-flex min-h-tap items-center gap-2 underline">
          {footer.top}
          <ArrowUp aria-hidden="true" className="size-icon-sm" />
        </a>
      </div>
    </footer>
  );
}
