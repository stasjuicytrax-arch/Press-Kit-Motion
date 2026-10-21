import { useEffect, useRef } from "react";
import { ru } from "../content/ru";

// Как это работает — колонка с врезками (TZ.md §7.6). Колонка 560px с 5-й колонки сетки,
// после каждого абзаца кроп реального сайта. Слева липкий лаймовый прогресс чтения —
// единственная линия на странице, она несёт информацию. Без номеров шагов.
export function Process() {
  const { process } = ru;
  const sectionRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const base = import.meta.env.BASE_URL;

  useEffect(() => {
    const s = sectionRef.current;
    const bar = barRef.current;
    if (!s || !bar) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = s.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.5 - r.top) / Math.max(1, r.height - vh * 0.5)));
      bar.style.transform = `scaleY(${p.toFixed(3)})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={sectionRef} className="section" aria-labelledby="process-h">
      <div className="page-grid">
        <div className="hidden lg:col-span-1 lg:col-start-4 lg:flex lg:justify-end" aria-hidden="true">
          <div className="process-rail">
            <span ref={barRef} className="process-bar" />
          </div>
        </div>
        <div className="col-span-full lg:col-span-6 lg:col-start-5">
          <div className="process-col">
            <h2 id="process-h" className="text-head font-semibold leading-head tracking-head" data-reveal>
              {process.h2}
            </h2>
            {process.steps.map((s) => (
              <div key={s.lead} className="mt-9 flex flex-col gap-6" data-reveal>
                <p className="text-body text-muted">
                  <strong className="font-semibold text-ink">{s.lead}</strong> {s.text}
                </p>
                <div className="process-shot">
                  <img src={`${base}media/sites/${s.shot}.jpg`} alt={s.alt} loading="lazy" decoding="async" width={780} height={1688} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
