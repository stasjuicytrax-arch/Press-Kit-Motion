import { useEffect, useRef } from "react";
import { ru } from "../content/ru";
import { DisplayHeading } from "../components/DisplayHeading";
import { SiteVideo } from "../components/SiteVideo";

// Проблема — «Заголовок как подпись к панораме» (TZ.md §7.2).
// Панорама из записей всех сайтов подряд, при скролле едет влево (transform, scroll-linked).
// Десктоп — десктопные записи 16:10, телефон — мобильные в рамке 4:5.
export function Problem() {
  const { problem, work } = ru;
  const trackRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const section = sectionRef.current;
    if (!track || !section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Размеры меряем только при ресайзе, в кадре — одно чтение позиции и transform без CSS-переменной
    // (переменная пересчитывала стили всех роликов ленты); пока секция вне экрана — не слушаем скролл
    let raf = 0;
    let room = 0;
    let vh = 0;
    let top = 0;
    let height = 0;
    const measure = () => {
      vh = window.innerHeight;
      room = Math.max(0, track.scrollWidth - track.clientWidth);
      height = section.offsetHeight;
      top = section.getBoundingClientRect().top + window.scrollY;
    };
    const update = () => {
      raf = 0;
      // 0, когда секция входит снизу, 1, когда уходит вверх
      const p = Math.min(1, Math.max(0, (window.scrollY + vh - top) / (vh + height)));
      track.style.transform = `translate3d(${(-p * room).toFixed(1)}px,0,0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      onScroll();
    };
    measure();
    update();
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        onResize();
        window.addEventListener("scroll", onScroll, { passive: true });
      } else window.removeEventListener("scroll", onScroll);
    });
    io.observe(section);
    window.addEventListener("resize", onResize);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={sectionRef} className="problem section scene-dark" data-theme="dark" aria-labelledby="problem-h">
      <div className="relative px-margin" data-reveal>
        <DisplayHeading id="problem-h" text={problem.h2} accent={problem.h2Accent} className="max-w-[14ch]" />
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:gap-6">
          {problem.captions.map((c) => (
            <p key={c} className="problem-caption text-body">
              {c}
            </p>
          ))}
        </div>
      </div>

      <div className="problem-pan" aria-label={problem.videoLabel} role="group" data-theme="dark">
        <div ref={trackRef} className="problem-track">
          {work.artists.map((a) => (
            <figure key={a.key} className="problem-item">
              {/* Экран меньше и аккуратнее (владелец 2026-10-27): компьютер — окно 16:10, телефон — телефон */}
              <div className="problem-shot">
                <div className="hidden h-full md:block">
                  <SiteVideo site={a.key} device="desktop" label={`Сайт-пресс-кит ${a.name}`} />
                </div>
                <div className="h-full md:hidden">
                  <SiteVideo site={a.key} device="mobile" label={`Сайт-пресс-кит ${a.name}`} />
                </div>
              </div>
              <figcaption className="problem-name">{a.name}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
