import { useEffect, useState } from "react";
import { ru } from "../content/ru";
import { GlassCta } from "./GlassCta";
import { inert } from "../lib/inert";

// Липкая стеклянная кнопка на телефоне (TZ.md §7.0): появляется после первого экрана,
// прячется, когда видны свои кнопки блока: конструктор, цены, финальный CTA, подвал (data-hide-sticky)
// и пока открыто полноэкранное меню (класс menu-open на <html>).
export function StickyCta() {
  const [pastHero, setPastHero] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const hero = document.getElementById("top");
    const visible = new Set<Element>();
    const watched = new Set<Element>();

    const heroObs = new IntersectionObserver(([e]) => setPastHero(!e.isIntersecting));
    if (hero) heroObs.observe(hero);

    const blockObs = new IntersectionObserver((entries) => {
      for (const e of entries) e.isIntersecting ? visible.add(e.target) : visible.delete(e.target);
      setBlocked(visible.size > 0);
    });
    // Нижние секции грузятся отдельным чанком позже — подхватываем блоки по мере появления
    const watch = () =>
      document.querySelectorAll("[data-hide-sticky]").forEach((b) => {
        if (!watched.has(b)) {
          watched.add(b);
          blockObs.observe(b);
        }
      });
    watch();
    const domObs = new MutationObserver(watch);
    domObs.observe(document.body, { childList: true, subtree: true });

    const menuObs = new MutationObserver(() => setMenuOpen(root.classList.contains("menu-open")));
    menuObs.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => {
      heroObs.disconnect();
      blockObs.disconnect();
      domObs.disconnect();
      menuObs.disconnect();
    };
  }, []);

  const shown = pastHero && !blocked && !menuOpen;

  return (
    <div className="sticky-cta md:hidden" data-shown={shown} aria-hidden={!shown} {...inert(!shown)}>
      <GlassCta label={ru.sticky.cta} place="sticky" className="w-full" />
    </div>
  );
}
