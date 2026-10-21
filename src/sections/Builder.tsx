import { UploadSimple, User } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ru } from "../content/ru";
import { GlassPhone } from "../components/GlassPhone";
import { SolidCta } from "../components/SolidCta";
import { reachGoal } from "../lib/metrika";

// «Собери свой первый экран» (правки владельца 2026-10-21, TZ.md §7.5).
// Имя, город, год, своё фото (FileReader, никуда не отправляется; без фото — силуэт),
// цвет подсветки, анимация имени (выезжает / мерцает / собирается из букв) и стиль, который
// меняет начертание имени и характер анимации. В стеклянном телефоне — мини-сайт, который
// сам медленно прокручивается: первый экран, цифры, плеер с волной, букинг.
// Всё выбранное уходит в Телеграм. Цвета подсветки живут только внутри экрана телефона.
export function Builder() {
  const { builder: b } = ru;
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [since, setSince] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [color, setColor] = useState(0);
  const [anim, setAnim] = useState(0);
  const [style, setStyle] = useState(0);
  const [replay, setReplay] = useState(0);
  const used = useRef(false);
  const phoneRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const shownName = name.trim() || b.defaultName;
  const shownCity = city.trim() || b.defaultCity;
  const year = /^\d{4}$/.test(since.trim()) ? since.trim() : "";
  const years = year ? Math.max(1, new Date().getFullYear() - Number(year)) : 0;
  const c = b.colors[color];
  const st = b.styles[style];
  const an = b.anims[anim];

  // Имя сразу проигрывает эффект при смене текста, анимации или стиля
  useEffect(() => setReplay((r) => r + 1), [shownName, anim, style]);

  const touched = () => {
    if (!used.current) {
      used.current = true;
      reachGoal("builder_used");
    }
  };

  const onFile = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(String(reader.result));
      touched();
    };
    reader.readAsDataURL(file);
  };

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

  const letters = useMemo(() => [...shownName], [shownName]);
  const message = b.message({ name: shownName, city: shownCity, style: st.name, color: c.name, anim: an.name });

  return (
    <section className="section" aria-labelledby="builder-h">
      <div className="builder px-margin">
        <div className="builder-form" data-reveal data-hide-sticky>
          <h2 id="builder-h" className="text-head font-semibold leading-head tracking-head">
            {b.h2}
          </h2>
          <p className="text-body text-muted">{b.lead}</p>

          <div className="builder-fields">
            <label className="builder-field builder-field--wide">
              <span className="text-small text-muted">{b.nameLabel}</span>
              <input className="builder-input" type="text" value={name} maxLength={28} placeholder={b.namePlaceholder} autoComplete="off" onChange={(e) => (setName(e.target.value), touched())} />
            </label>
            <label className="builder-field">
              <span className="text-small text-muted">{b.cityLabel}</span>
              <input className="builder-input" type="text" value={city} maxLength={24} placeholder={b.cityPlaceholder} autoComplete="off" onChange={(e) => (setCity(e.target.value), touched())} />
            </label>
            <label className="builder-field">
              <span className="text-small text-muted">{b.sinceLabel}</span>
              <input className="builder-input tabular" type="text" inputMode="numeric" value={since} maxLength={4} placeholder={b.sincePlaceholder} autoComplete="off" onChange={(e) => (setSince(e.target.value.replace(/\D/g, "")), touched())} />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="builder-upload" onClick={() => fileRef.current?.click()}>
              <UploadSimple aria-hidden="true" className="size-icon-md" />
              {photo ? b.photoChange : b.photo}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => onFile(e.target.files?.[0])} />
            <span className="text-small text-muted">{b.photoNote}</span>
          </div>

          <fieldset className="builder-group">
            <legend className="text-small text-muted">{b.colorLabel}</legend>
            <div className="flex gap-3">
              {b.colors.map((x, i) => (
                <label key={x.key} className="builder-swatch" data-checked={i === color} style={{ "--sw": x.value } as React.CSSProperties}>
                  <input type="radio" name="builder-color" className="sr-only" checked={i === color} onChange={() => setColor(i)} />
                  <span className="sr-only">{x.name}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="builder-group">
            <legend className="text-small text-muted">{b.animLabel}</legend>
            <div className="flex flex-wrap gap-2">
              {b.anims.map((x, i) => (
                <label key={x.key} className="builder-chip" data-checked={i === anim}>
                  <input type="radio" name="builder-anim" className="sr-only" checked={i === anim} onChange={() => setAnim(i)} />
                  {x.name}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="builder-group">
            <legend className="text-small text-muted">{b.stylesLabel}</legend>
            <div className="flex flex-wrap gap-2">
              {b.styles.map((x, i) => (
                <label key={x.key} className="builder-chip" data-checked={i === style}>
                  <input type="radio" name="builder-style" className="sr-only" checked={i === style} onChange={() => setStyle(i)} />
                  {x.name}
                </label>
              ))}
            </div>
            <p className="text-small text-muted">{b.note}</p>
          </fieldset>

          <SolidCta label={b.cta} place="builder" text={message} className="w-full sm:w-auto sm:self-start" />
        </div>

        <div className="builder-phone-wrap" data-reveal>
          <GlassPhone ref={phoneRef} className="builder-phone">
            <div className="mini" data-style={st.key} style={{ "--mc": c.value, "--mc-ink": c.ink } as React.CSSProperties}>
              <div className="mini-scroll">
                {/* Первый экран */}
                <div className="mini-hero">
                  {photo ? (
                    <img className="mini-photo" src={photo} alt="" />
                  ) : (
                    <div className="mini-silhouette" aria-hidden="true">
                      <User weight="fill" />
                    </div>
                  )}
                  <div className="mini-glow" aria-hidden="true" />
                  <div className="mini-hero-copy">
                    <p className="mini-tag">
                      {shownCity}
                      {year ? ` · ${b.phone.since(year)}` : ""}
                    </p>
                    <p key={replay} className="mini-name" data-anim={an.key} aria-label={shownName}>
                      {an.key === "letters"
                        ? letters.map((ch, i) => (
                            <span key={i} className="mini-ch" style={{ "--i": i } as React.CSSProperties} aria-hidden="true">
                              {ch === " " ? " " : ch}
                            </span>
                          ))
                        : shownName}
                    </p>
                    <span className="mini-book">{b.phone.booking}</span>
                  </div>
                </div>
                {/* Цифры */}
                <div className="mini-block mini-stats">
                  <p>
                    <b className="tabular">{years || "—"}</b>
                    <span>{years ? b.phone.years(years).replace(/^\d+\s/, "") : "лет на сцене"}</span>
                  </p>
                  <p>
                    <b>{b.phone.langs}</b>
                    <span>{b.phone.langsLabel}</span>
                  </p>
                </div>
                {/* Плеер с бегущей волной */}
                <div className="mini-block mini-player">
                  <span className="mini-play" aria-hidden="true" />
                  <div className="flex-1">
                    <p className="mini-track">{b.phone.track}</p>
                    <div className="mini-wave" aria-hidden="true">
                      {Array.from({ length: 28 }, (_, i) => (
                        <i key={i} style={{ "--i": i } as React.CSSProperties} />
                      ))}
                    </div>
                  </div>
                </div>
                {/* Букинг */}
                <div className="mini-block mini-booking">
                  <p className="mini-track">{b.phone.contact}</p>
                  <span className="mini-book mini-book--wide">{b.phone.booking}</span>
                </div>
              </div>
            </div>
          </GlassPhone>
        </div>
      </div>
    </section>
  );
}
