import { useEffect, useId, useRef, useState } from "react";
import fontUrl from "@fontsource/onest/files/onest-latin-600-normal.woff?url";

// Неоновый огонёк по контуру букв заголовка (владелец 2026-10-22).
// Поверх (или под WebGL-сценой — см. .neon-trace в globals.css) лежит SVG с настоящими
// очертаниями букв того же шрифта Onest 600: глифы берутся из файла шрифта (opentype.js),
// а положение каждого слова — из его DOM-прямоугольника, поэтому контур совпадает с текстом
// на любой ширине и после догрузки шрифта (ResizeObserver + document.fonts.ready).
// 1) Интро: контур прорисовывается по всем буквам ~1.8 с, держится 0.3 с, гаснет за 0.6 с.
// 2) Искра: раз в 6–9 с короткий штрих (5% контура) пробегает ~1.4 с со случайного места.
// 3) Наведение (только hover-устройства): искра сразу, не чаще раза в 2 с.
// Маска вырезает внутренность букв: линия и свечение видны только снаружи контура, сами
// буквы остаются чёткими (без лаймовой «каши» поверх чёрного). Анимируются только stroke-dashoffset и opacity. Цикл идёт, только пока заголовок в кадре
// и вкладка активна. prefers-reduced-motion — эффекта нет. Слой декоративный: aria-hidden.
type Props = {
  /** Контейнер, относительно которого позиционируется SVG (position: relative) */
  frameRef: React.RefObject<HTMLElement>;
  /** Заголовок: слова в нём размечены [data-word] */
  titleRef: React.RefObject<HTMLElement>;
};

type Layout = { w: number; h: number; glyphs: string[]; all: string };

const INTRO_DRAW = 1800;
const INTRO_HOLD = 300;
const INTRO_FADE = 600;
const SPARK = 1400;
const SPARK_LEN = 5; // % длины контура
const SPARK_TRAVEL = 28; // % контура, которые искра проходит за одну пробежку
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
  return { w: fr.width, h: fr.height, glyphs, all: glyphs.join(" ") };
}

export function NeonTraceHeading({ frameRef, titleRef }: Props) {
  const [layout, setLayout] = useState<Layout | null>(null);
  const [reduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const introRef = useRef<SVGGElement>(null);
  const sparkRef = useRef<SVGPathElement>(null);
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

  // Искра: случайный интервал 6–9 с, только пока заголовок в кадре и вкладка активна; плюс наведение
  useEffect(() => {
    const spark = sparkRef.current;
    const frame = frameRef.current;
    const title = titleRef.current;
    if (!ready || !spark || !frame || !title) return;
    let timer = 0;
    let inView = false;
    let last = 0;
    const run = () => {
      last = performance.now();
      const from = Math.random() * 100;
      spark.animate(
        [
          { strokeDashoffset: from, opacity: 0 },
          { strokeDashoffset: from - SPARK_TRAVEL * 0.2, opacity: 1, offset: 0.2 },
          { strokeDashoffset: from - SPARK_TRAVEL * 0.75, opacity: 1, offset: 0.75 },
          { strokeDashoffset: from - SPARK_TRAVEL, opacity: 0 },
        ],
        { duration: SPARK, easing: "ease-in-out" },
      );
    };
    const schedule = (first = false) => {
      window.clearTimeout(timer);
      if (!inView || document.hidden) return;
      const wait = (first ? INTRO_DRAW + INTRO_HOLD + INTRO_FADE : 0) + 6000 + Math.random() * 3000;
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
        <path
          ref={sparkRef}
          className="neon-trace-line"
          d={layout.all}
          pathLength={100}
          strokeDasharray={`${SPARK_LEN} ${100 - SPARK_LEN}`}
          opacity={0}
        />
      </g>
    </svg>
  );
}
