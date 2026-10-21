import { useEffect, useRef, useState } from "react";
import { ru } from "../content/ru";
import { telegramUrl } from "../lib/telegram";
import { LiquidGlass } from "./ui/apple-tahoe-liquid-glass-button";
import { inert } from "../lib/inert";
import { tokenNumber } from "../lib/tokens";
import { SolidCta } from "./SolidCta";

// Плавающая стеклянная капсула (DESIGN.md §7, TZ.md §7.0).
// Десктоп: знак, три ссылки, лаймовая «Написать». Телефон: знак и «Меню»,
// меню раскрывается на весь экран, ссылки поднимаются снизу по очереди.
export function Nav() {
  const { nav } = ru;
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const main = document.querySelector("main");
    root.classList.toggle("menu-open", open);
    main?.toggleAttribute("inert", open);
    if (open) firstLinkRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Меню телефонное: на широком экране закрываем само
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Читаемость над любым фоном: какая секция сейчас под капсулой (data-theme="dark" у тёмных
  // блоков и видео) — такой и цвет текста меню, смена 200ms. Лаймовая «Написать» не меняется.
  const [tone, setTone] = useState<"light" | "dark">("light");
  useEffect(() => {
    const dark = new Set<Element>();
    let io: IntersectionObserver | null = null;
    const setup = () => {
      io?.disconnect();
      dark.clear();
      const shell = document.querySelector(".nav-shell > nav")?.getBoundingClientRect();
      const top = Math.round(shell?.top ?? 20);
      const bottom = Math.round(window.innerHeight - (shell?.bottom ?? 76));
      // Полоса наблюдения — ровно высота капсулы
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) e.isIntersecting ? dark.add(e.target) : dark.delete(e.target);
          setTone(dark.size ? "dark" : "light");
        },
        { rootMargin: `-${top}px 0px -${bottom}px 0px` },
      );
      document.querySelectorAll('[data-theme="dark"]').forEach((el) => io!.observe(el));
    };
    setup();
    window.addEventListener("resize", setup);
    return () => {
      io?.disconnect();
      window.removeEventListener("resize", setup);
    };
  }, []);

  const close = () => setOpen(false);

  return (
    <>
      <div className="nav-shell" data-tone={tone}>
        {/* Настоящее жидкое стекло: заливка почти прозрачная, сильное преломление у кромки
            (карта смещения затухает к центру), дисперсия по краю, блики через box-shadow */}
        <LiquidGlass
          asChild
          refraction={tokenNumber("--glass-refraction-nav", 34)}
          bezel={22}
          blur={7}
          dispersion={0.25}
          backdropExtra="saturate(180%) brightness(1.05)"
          fallbackBlur={16}
          saturation={1.8}
          className="nav-glass pointer-events-auto rounded-pill"
          style={{ boxShadow: "var(--nav-glass-shadow)" }}
        >
          <nav aria-label={nav.label} className="flex min-h-button items-center justify-between gap-5 py-inset pl-5 pr-inset md:justify-start">
            <a href="#top" aria-label={nav.home} onClick={close} className="inline-flex min-h-tap items-center whitespace-nowrap rounded-pill text-body font-bold tracking-head no-underline">
              {ru.brand}
            </a>

            <ul className="hidden items-center gap-1 md:flex">
              {nav.links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="nav-link">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>

            <a
              href={telegramUrl()}
              target="_blank"
              rel="noopener"
              data-place="nav"
              className="hidden min-h-tap items-center rounded-pill bg-accent px-5 font-medium text-accent-ink no-underline transition-transform duration-fast ease-spring hover:scale-hover active:scale-press md:inline-flex"
            >
              {nav.write}
            </a>

            <button
              ref={toggleRef}
              type="button"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
              className="burger md:hidden"
              data-open={open}
            >
              <span className="burger-label">{open ? nav.close : nav.menu}</span>
              <span aria-hidden="true" className="burger-icon">
                <span />
                <span />
              </span>
            </button>
          </nav>
        </LiquidGlass>
      </div>

      {/* Меню на весь экран — плотная вуаль без backdrop-filter (большая площадь над видео, п. 10) */}
      <div
        id="mobile-menu"
        className="mobile-menu md:hidden"
        data-open={open}
        aria-hidden={!open}
        {...inert(!open)}
      >
        <ul className="flex flex-col gap-2">
          {nav.links.map((l, i) => (
            <li key={l.href} className="menu-item" style={{ "--i": i } as React.CSSProperties}>
              <a ref={i === 0 ? firstLinkRef : undefined} href={l.href} onClick={close} className="block w-fit rounded-panel py-2 text-head font-semibold leading-head tracking-head no-underline">
                {l.label}
              </a>
            </li>
          ))}
          <li className="menu-item mt-6 flex flex-col gap-4" style={{ "--i": nav.links.length } as React.CSSProperties}>
            <p className="tabular text-body text-muted">
              {ru.hero.factsTemplate(ru.hero.facts.price, ru.hero.facts.days)}
            </p>
            <SolidCta label={ru.sticky.cta} place="nav" onClick={close} className="w-full" />
          </li>
        </ul>
      </div>
    </>
  );
}
