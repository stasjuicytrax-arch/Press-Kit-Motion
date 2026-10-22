import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ArrowLeft } from "@phosphor-icons/react";
import { ru } from "./content/ru";
import { CookieBanner } from "./components/CookieBanner";
import "./styles/globals.css";

// Страница «Политика конфиденциальности» (/privacy/, 2026-10-22). Оператор — физическое лицо.
// Тексты — ru.privacy; {operator} подставляется из operatorName.
function Privacy() {
  const { privacy } = ru;
  const home = import.meta.env.BASE_URL;
  return (
    <>
      <main className="privacy px-margin">
        <a href={home} className="privacy-back text-small no-underline">
          <ArrowLeft aria-hidden="true" className="size-icon-sm" />
          {privacy.back}
        </a>
        <h1 className="mt-7 text-head font-semibold leading-head tracking-head">{privacy.title}</h1>
        <p className="mt-3 text-small text-muted">{privacy.updated}</p>
        {privacy.sections.map((s) => (
          <section key={s.h} className="mt-8">
            <h2 className="text-lead font-semibold leading-lead tracking-head">{s.h}</h2>
            {s.p.map((t) => (
              <p key={t} className="mt-3 text-body text-muted">
                {t.replace("{operator}", privacy.operatorName)}
              </p>
            ))}
          </section>
        ))}
      </main>
      <CookieBanner />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Privacy />
  </StrictMode>,
);
