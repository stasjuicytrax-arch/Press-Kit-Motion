import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

// Движение сайта, дизайн v2 (2026-10-27). Один источник кривых и длительностей для JS —
// те же значения, что --ease-expo / --dur-* в tokens.css.
//  · Lenis — плавный скролл только на компьютере (мышь/тачпад); на телефоне нативная прокрутка.
//  · Заголовки [data-split]: слова поднимаются из-под маски по очереди с лёгким наклоном.
//  · Тёмные сцены [data-panel]: «наезжают» на светлый блок — масштаб 0.94 → 1 по скроллу.
// prefers-reduced-motion: ничего из этого не включается, всё стоит на месте.
export const EASE = "expo.out";
export const DUR = { fast: 0.2, base: 0.45, slow: 0.8, reveal: 1.1 };
export const STAGGER = 0.07;

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
export const getLenis = () => lenis;

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

function startLenis() {
  if (!finePointer()) return;
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis?.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  // Якорные ссылки (#work, #price…) — плавно через Lenis
  document.addEventListener("click", (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    const id = a?.getAttribute("href");
    if (!a || !id || id === "#") return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    lenis?.scrollTo(target as HTMLElement, { offset: 0, duration: 1.4 });
  });
}

function revealHeadings() {
  document.querySelectorAll<HTMLElement>("[data-split]").forEach((h) => {
    const words = h.querySelectorAll<HTMLElement>(".dh-i");
    gsap.set(words, { yPercent: 115, rotate: 4 });
    gsap.to(words, {
      yPercent: 0,
      rotate: 0,
      duration: DUR.reveal,
      ease: EASE,
      stagger: STAGGER,
      scrollTrigger: { trigger: h, start: "top 88%", once: true },
    });
  });
}

function panels() {
  // Только компьютер. Только transform (scale) — композитинг без пересчёта стилей и раскладки;
  // скругление верхних углов у сцены статичное (globals.css .scene-dark)
  if (!finePointer()) return;
  document.querySelectorAll<HTMLElement>("[data-panel]").forEach((p) => {
    gsap.fromTo(
      p,
      { scale: 0.94, transformOrigin: "50% 0%" },
      { scale: 1, ease: "none", scrollTrigger: { trigger: p, start: "top bottom", end: "top 30%", scrub: true } },
    );
  });
}

function parallax() {
  if (!finePointer()) return;
  document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
    const k = Number(el.dataset.parallax) || 0;
    gsap.fromTo(
      el,
      { y: () => -k * window.innerHeight * 0.5 },
      {
        y: () => k * window.innerHeight * 0.5,
        ease: "none",
        scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true },
      },
    );
  });
}

export function startMotion() {
  if (reduced()) return;
  startLenis();
  revealHeadings();
  panels();
  parallax();
  // Видео, шрифты и картинки меняют высоту блоков — пересчитать триггеры после загрузки
  window.addEventListener("load", () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
