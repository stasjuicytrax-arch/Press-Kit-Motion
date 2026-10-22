import { useEffect, useId, useRef, useState } from "react";
import fontUrl from "@fontsource/onest/files/onest-latin-600-normal.woff?url";

// Неоновый огонёк по контуру букв заголовка (владелец 2026-10-22).
// Поверх (или под WebGL-сценой — см. .neon-trace в globals.css) лежит SVG с настоящими
// очертаниями букв того же шрифта Onest 600: глифы берутся из файла шрифта (opentype.js),
// а положение каждого слова — из его DOM-прямоугольника, поэтому контур совпадает с текстом
// на любой ширине и после догрузки шрифта (ResizeObserver + document.fonts.ready).
// 1) Интро: контур прорисовывается по всем буквам ~1.8 с, держится 0.3 с, гаснет за 0.6 с.
// 2) Молния (владелец 2026-10-22: «чтобы огонёк изредка пробегал на всю, как молния»):
//    каждые 4–6 с весь контур коротко мигает разрядом (~0.45 с), и следом яркая «комета»
//    с затухающим хвостом за 1.6 с пробегает по контуру всех букв подряд.
// 3) Наведение (только hover-устройства): молния сразу, не чаще раза в 2 с.
// Маска вырезает внутренность букв: линия и свечение видны только снаружи контура, сами
// буквы остаются чёткими (без лаймовой «каши» поверх чёрного). Анимируются только stroke-dashoffset и opacity. Цикл идёт, только пока заголовок в кадре
// и вкладка активна. prefers-reduced-motion — эффекта нет. Слой декоративный: aria-hidden.
type Props = {
  /** Контейнер, относительно которого позиционируется SVG (position: relative) */
  frameRef: React.RefObject<HTMLElement>;
  /** Заголовок: слова в нём размечены [data-word] */
  titleRef: React.RefObject<HTMLElement>;
};

// glyphs — по пути на букву (интро, вспышка); contours — каждый замкнутый контур отдельно
// (комета: Chrome начинает узор штриха заново на каждом подконтуре, поэтому один штрих
// по всей надписи ведём сами — по контурам подряд, в пикселях)
type Layout = { w: number; h: number; glyphs: string[]; contours: string[]; all: string };

const INTRO_DRAW = 1800;
const INTRO_HOLD = 300;
const INTRO_FADE = 600;
const FLASH = 450; // мс, вспышка всего контура
const BOLT = 1600; // мс, пробег кометы по всем буквам
const BOLT_GAP: [number, number] = [4000, 6000]; // пауза между молниями
// Комета: голова и два слоя хвоста (длина в % всего контура надписи, яркость). Голова впереди, хвост за ней
const COMET = [
  { len: 2.5, opacity: 1, cls: "neon-trace-head" },
  { len: 7, opacity: 0.7, cls: "" },
  { len: 16, opacity: 0.35, cls: "" },
] as const;
const HOVER_GAP = 2000;

type OtFont = import("opentype.js").Font;
let fontPromise: Promise<OtFont> | null = null;
const loadFont = () =>
  (fontPromise ??= Promise.all([import("opentype.js"), fetch(fontUrl).then((r) => r.arrayBuffer())]).then(([ot, buf]) =>
    (ot.default ?? ot).parse(buf),
  ));

// Контуры глифов одного слова с тем же кернингом и letter-spacing, что у DOM-текста
function wordGlyphs(font: OtFont, text: string, x: number, baseline: number, size: number, tracking: number, fit: number) {
  const scale = size / font.unitsPerEm;
  const glyphs = font.stringToGlyphs(text);
  const out: string[] = [];
  let pen = x;
  glyphs.forEach((g, i) => {
    out.push(g.getPath(pen, baseline, size).toPathData(2));
    const kern = i < glyphs.length - 1 ? font.getKerningValue(g, glyphs[i + 1]) * scale : 0;
    pen += ((g.advanceWidth ?? 0) * scale + kern + tracking) * fit;
  });
  return out;
}

function measure(font: OtFont, frame: HTMLElement, title: HTMLElement): Layout | null {
  const fr = frame.getBoundingClientRect();
  const cs = getComputedStyle(title);
  const size = parseFloat(cs.fontSize);
  const tracking = cs.letterSpacing === "normal" ? 0 : parseFloat(cs.letterSpacing);
  const scale = size / font.unitsPerEm;
  // Базовая линия: верх строчного бокса + подъём шрифта (как его считает браузер)
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return null;
  ctx.font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`;
  const glyphs: string[] = [];
  for (const el of title.querySelectorAll<HTMLElement>("[data-word]")) {
    const text = el.textContent ?? "";
    const range = document.createRange();
    range.selectNodeContents(el);
    const r = range.getBoundingClientRect();
    const ascent = ctx.measureText(text).fontBoundingBoxAscent;
    // Ширина по шрифту против ширины в DOM: поправка в доли процента, если движки разошлись
    let natural = 0;
    const gs = font.stringToGlyphs(text);
    gs.forEach((g, i) => {
      natural += (g.advanceWidth ?? 0) * scale + tracking + (i < gs.length - 1 ? font.getKerningValue(g, gs[i + 1]) * scale : 0);
    });
    const fit = natural > 0 ? r.width / natural : 1;
    glyphs.push(...wordGlyphs(font, text, r.left - fr.left, r.top - fr.top + ascent, size, tracking, fit));
  }
  const contours = glyphs.flatMap((d) => d.split(/(?=M)/).map((c) => c.trim()).filter(Boolean));
  return { w: fr.width, h: fr.height, glyphs, contours, all: glyphs.join(" ") };
}

export function NeonTraceHeading({ frameRef, titleRef }: Props) {
  const [layout, setLayout] = useState<Layout | null>(null);
  const [reduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const introRef = useRef<SVGGElement>(null);
  const cometRef = useRef<SVGGElement>(null);
  const maskId = useId();

  // Раскладка: после загрузки шрифта и при любом изменении размера заголовка
  useEffect(() => {
    const frame = frameRef.current;
    const title = titleRef.current;
    if (reduced || !frame || !title) return;
    let alive = true;
    let font: OtFont | null = null;
    const update = () => {
      if (alive && font) setLayout(measure(font, frame, title));
    };
    Promise.all([loadFont(), document.fonts.ready]).then(([f]) => {
      font = f;
      update();
    });
    const ro = new ResizeObserver(update);
    ro.observe(title);
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, [frameRef, titleRef, reduced]);

  const ready = layout !== null;

  // Интро — один раз, когда контур впервые построен
  useEffect(() => {
    const g = introRef.current;
    if (!ready || !g) return;
    const paths = [...g.querySelectorAll("path")];
    const total = INTRO_DRAW + INTRO_HOLD + INTRO_FADE;
    const anims = paths.map((p) =>
      p.animate(
        [
          { strokeDashoffset: 100, opacity: 1, offset: 0, easing: "ease-in-out" },
          { strokeDashoffset: 0, opacity: 1, offset: INTRO_DRAW / total },
          { strokeDashoffset: 0, opacity: 1, offset: (INTRO_DRAW + INTRO_HOLD) / total },
          { strokeDashoffset: 0, opacity: 0, offset: 1 },
        ],
        { duration: total, fill: "forwards" },
      ),
    );
    return () => anims.forEach((a) => a.cancel());
    // интро только при первом построении
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Молния: каждые 4–6 с, только пока заголовок в кадре и вкладка активна; плюс наведение
  useEffect(() => {
    const comet = cometRef.current;
    const glyphs = introRef.current;
    const frame = frameRef.current;
    const title = titleRef.current;
    if (!ready || !comet || !glyphs || !frame || !title) return;
    let timer = 0;
    let inView = false;
    let last = 0;
    let cometRaf = 0;
    const run = () => {
      last = performance.now();
      // Вспышка: весь контур мигает разрядом
      glyphs.querySelectorAll("path").forEach((p) =>
        p.animate([{ opacity: 0 }, { opacity: 0.9, offset: 0.15 }, { opacity: 0.15, offset: 0.35 }, { opacity: 0.75, offset: 0.55 }, { opacity: 0 }], {
          duration: FLASH,
          easing: "linear",
        }),
      );
      // Комета: голова бежит по всем контурам подряд (от «P» до «n»), хвост тянется за ней.
      // Для каждого контура штрих — его участок общего отрезка [h − L, h]; кадр = только dashoffset
      const layers = [...comet.querySelectorAll<SVGGElement>(":scope > g")];
      const lens = [...layers[0].querySelectorAll<SVGPathElement>("path")].map((p) => p.getTotalLength());
      const starts: number[] = [];
      let total = 0;
      for (const l of lens) {
        starts.push(total);
        total += l;
      }
      const L = COMET.map((c) => (c.len / 100) * total);
      layers.forEach((g, k) => g.querySelectorAll("path").forEach((p) => p.setAttribute("stroke-dasharray", `${L[k].toFixed(1)} ${(total * 2).toFixed(0)}`)));
      const paths = layers.map((g) => [...g.querySelectorAll<SVGPathElement>("path")]);
      const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
      const t0 = performance.now() + FLASH * 0.6;
      cancelAnimationFrame(cometRaf);
      const frameFn = (now: number) => {
        const t = Math.min(1, Math.max(0, (now - t0) / BOLT));
        const h = ease(t) * (total + L[2]); // голова проходит весь контур, хвост успевает уйти
        const env = Math.min(1, t / 0.08, (1 - t) / 0.12);
        layers.forEach((g, k) => {
          g.style.opacity = String(env * COMET[k].opacity);
          paths[k].forEach((p, i) => (p.style.strokeDashoffset = (-(h - L[k] - starts[i])).toFixed(1)));
        });
        if (t < 1) cometRaf = requestAnimationFrame(frameFn);
      };
      cometRaf = requestAnimationFrame(frameFn);
    };
    const schedule = (first = false) => {
      window.clearTimeout(timer);
      if (!inView || document.hidden) return;
      const wait = (first ? INTRO_DRAW + INTRO_HOLD + INTRO_FADE + 800 : 0) + BOLT_GAP[0] + Math.random() * (BOLT_GAP[1] - BOLT_GAP[0]);
      timer = window.setTimeout(() => {
        run();
        schedule();
      }, wait);
    };
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      schedule(last === 0);
    });
    io.observe(title);
    const onVis = () => schedule();
    document.addEventListener("visibilitychange", onVis);
    // Наведение: заголовок под WebGL-сценой, события ловит секция — проверяем попадание сами
    const hover = window.matchMedia("(hover: hover)").matches;
    const onMove = (e: PointerEvent) => {
      if (performance.now() - last < HOVER_GAP) return;
      const r = title.querySelector(".block")?.getBoundingClientRect() ?? title.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
        run();
        schedule();
      }
    };
    if (hover) frame.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(cometRaf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      frame.removeEventListener("pointermove", onMove);
    };
  }, [ready, frameRef, titleRef]);

  if (reduced || !layout) return null;
  return (
    <svg
      className="neon-trace"
      width={layout.w}
      height={layout.h}
      viewBox={`0 0 ${layout.w} ${layout.h}`}
      aria-hidden="true"
      focusable="false"
    >
      <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={layout.w} height={layout.h}>
        <rect width={layout.w} height={layout.h} fill="#fff" />
        <path d={layout.all} fill="#000" />
      </mask>
      <g mask={`url(#${maskId})`}>
        <g ref={introRef} className="neon-trace-line">
          {layout.glyphs.map((d, i) => (
            <path key={i} d={d} pathLength={100} strokeDasharray="100 100" strokeDashoffset={100} opacity={0} />
          ))}
        </g>
        <g ref={cometRef} className="neon-trace-line neon-trace-comet">
          {COMET.map((c) => (
            <g key={c.len} className={c.cls} opacity={0}>
              {layout.contours.map((d, i) => (
                <path key={i} d={d} strokeDasharray="0 1" />
              ))}
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}
