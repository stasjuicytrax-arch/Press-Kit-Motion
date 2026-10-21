import { useEffect, useRef } from "react";
import { ru } from "../content/ru";
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
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = section.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0, когда секция входит снизу, 1, когда уходит вверх
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      const room = Math.max(0, track.scrollWidth - track.clientWidth);
      track.style.setProperty("--pan", `${(-p * room).toFixed(1)}px`);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={sectionRef} className="problem section" aria-labelledby="problem-h">
      <div className="px-margin" data-reveal>
        <h2 id="problem-h" className="max-w-[16ch] text-head font-semibold leading-head tracking-head">
          {problem.h2}
        </h2>
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
            <figure key={a.key} className="problem-shot">
              <div className="hidden h-full md:block">
                <SiteVideo site={a.key} device="desktop" label={`Сайт-пресс-кит ${a.name}`} />
              </div>
              <div className="h-full md:hidden">
                <SiteVideo site={a.key} device="mobile" label={`Сайт-пресс-кит ${a.name}`} />
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
