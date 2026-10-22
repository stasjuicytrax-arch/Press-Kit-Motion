import { useEffect, useState } from "react";
import { ru } from "../content/ru";
import { getConsent, loadMetrika, setConsent, type Consent } from "../lib/consent";

// Плашка согласия на cookie (152-ФЗ, 2026-10-22): появляется при первом заходе, пока нет ответа.
// «Принять» включает Яндекс Метрику, «Только необходимые» — нет. Если согласие уже было — Метрика
// грузится сразу при открытии страницы. Пока плашка открыта, на <html> висит cookie-open:
// липкая кнопка Телеграма спрятана, чтобы не лечь поверх плашки.
const initial = getConsent();
if (initial === "all") loadMetrika();

export function CookieBanner() {
  const { cookie } = ru;
  const [open, setOpen] = useState(initial === null);
  useEffect(() => {
    document.documentElement.classList.toggle("cookie-open", open);
  }, [open]);
  if (!open) return null;
  const answer = (v: Consent) => {
    setConsent(v);
    setOpen(false);
  };
  return (
    <div className="cookie" role="dialog" aria-label={cookie.label}>
      <p className="text-small">
        {cookie.text}{" "}
        <a href={`${import.meta.env.BASE_URL}privacy/`} className="underline underline-offset-2">
          {cookie.policy}
        </a>
        .
      </p>
      <div className="cookie-actions">
        <button type="button" className="cookie-btn cookie-btn--accept" onClick={() => answer("all")}>
          {cookie.accept}
        </button>
        <button type="button" className="cookie-btn" onClick={() => answer("necessary")}>
          {cookie.necessary}
        </button>
      </div>
    </div>
  );
}
