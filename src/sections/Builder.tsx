import { useEffect, useRef, useState } from "react";
import { ru } from "../content/ru";
import { GlassPhone } from "../components/GlassPhone";
import { SolidCta } from "../components/SolidCta";
import { reachGoal } from "../lib/metrika";

// Примерь на себя — живой конструктор (TZ.md §7.5). Состояние в React, без бэкенда.
// Цвета стилей живут только внутри экрана телефона (это «сайт артиста»), интерфейс в палитре.
const STYLE_KEYS = ["techno", "house", "bass", "hiphop", "host"] as const;

export function Builder() {
  const { builder } = ru;
  const [name, setName] = useState("");
  const [style, setStyle] = useState(0);
  const used = useRef(false);
  const phoneRef = useRef<HTMLDivElement>(null);
  const shown = name.trim() || builder.defaultName;
  const styleName = builder.styles[style];

  // Телефон слегка поворачивается за курсором (CSS 3D, ±8°)
  useEffect(() => {
    const el = phoneRef.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)));
      const y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)));
      el.style.setProperty("--tilt-x", `${(-y * 8).toFixed(2)}deg`);
      el.style.setProperty("--tilt-y", `${(x * 8).toFixed(2)}deg`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const onName = (v: string) => {
    setName(v);
    if (!used.current && v.trim()) {
      used.current = true;
      reachGoal("builder_used");
    }
  };

  return (
    <section className="section" aria-labelledby="builder-h">
      <div className="page-grid items-center gap-y-8">
        <div className="col-span-full order-2 flex flex-col gap-6 lg:order-1 lg:col-span-5" data-reveal>
          <h2 id="builder-h" className="text-head font-semibold leading-head tracking-head">
            {builder.h2}
          </h2>
          <label className="flex flex-col gap-2">
            <span className="text-small text-muted">{builder.label}</span>
            <input
              className="builder-input"
              type="text"
              value={name}
              maxLength={28}
              placeholder={builder.placeholder}
              onChange={(e) => onName(e.target.value)}
              autoComplete="off"
            />
          </label>
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-small text-muted">{builder.stylesLabel}</legend>
            <div className="flex flex-wrap gap-2">
              {builder.styles.map((s, i) => (
                <label key={s} className="builder-chip" data-checked={i === style}>
                  <input type="radio" name="builder-style" className="sr-only" checked={i === style} onChange={() => setStyle(i)} />
                  {s}
                </label>
              ))}
            </div>
            <p className="text-small text-muted">{builder.note}</p>
          </fieldset>
          <SolidCta label={builder.cta} place="builder" text={builder.message(shown, styleName)} className="w-full sm:w-auto sm:self-start" />
        </div>

        <div className="col-span-full order-1 flex justify-center lg:order-2 lg:col-span-6 lg:col-start-7" data-reveal>
          <GlassPhone ref={phoneRef} className="builder-phone">
            <div className="builder-screen" data-style={STYLE_KEYS[style]}>
              <span className="builder-screen-tag">{styleName}</span>
              <span className="builder-screen-name">{shown}</span>
              <span className="builder-screen-book">{builder.booking}</span>
            </div>
          </GlassPhone>
        </div>
      </div>
    </section>
  );
}
