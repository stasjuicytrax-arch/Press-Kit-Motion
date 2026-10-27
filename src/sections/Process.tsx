import { useEffect, useRef } from "react";
import { ru } from "../content/ru";
import { DisplayHeading } from "../components/DisplayHeading";
import { ProcessScene } from "./ProcessScenes";

// Как появляется сайт (TZ.md §7.6). Колонка 560px с 5-й колонки сетки, после каждого абзаца —
// живая сцена, нарисованная кодом (ProcessScenes). Слева липкий лаймовый прогресс чтения.
export function Process() {
  const { process } = ru;
  const sectionRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  
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
    <section ref={sectionRef} className="section scene-dark" data-theme="dark" data-panel aria-labelledby="process-h">
      <div className="page-grid">
        <div className="hidden lg:col-span-1 lg:col-start-1 lg:flex lg:justify-start" aria-hidden="true">
          <div className="process-rail">
            <span ref={barRef} className="process-bar" />
          </div>
        </div>
        {/* v2: шахматка — текст шага с одной стороны, живая сцена с другой, стороны чередуются */}
        <div className="col-span-full lg:col-span-11 lg:col-start-2">
          <DisplayHeading id="process-h" text={process.h2} accent={process.h2Accent} />
          {process.steps.map((s, i) => (
            <div key={s.lead} className={`process-step${i % 2 ? " process-step--flip" : ""}`} data-reveal>
              <p className="process-text text-body text-muted">
                <strong className="process-lead">{s.lead}</strong> {s.text}
              </p>
              <ProcessScene kind={s.key} label={s.alt} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
