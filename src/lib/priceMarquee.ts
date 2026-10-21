// Бегущая надпись секции «Цена» и её копии внутри стеклянных карточек (правки владельца 2026-10-21, п. 10).
//
// Живой backdrop-filter на больших карточках поверх движущейся надписи пересчитывался каждый кадр
// и тормозил. Теперь внутри каждой карточки лежит своя копия надписи: один период полосы
// отрисован один раз в canvas с blur(14px) и лёгкой волной, дальше браузер только сдвигает картинку.
// Один requestAnimationFrame на всё: общий сдвиг для основной надписи и всех копий, только
// transform: translate3d. Цикл стоит, когда секция вне экрана, вкладка скрыта или reduced-motion.

const LOOP_S = 70; // как было у CSS-анимации: половина дорожки (2 периода) за 70 с
const BLUR = 14;
const PAD = BLUR * 3; // запас по высоте под размытие
const WAVE = 4; // px, амплитуда лёгкого искажения
const SLICE = 3; // px, ширина вертикального среза для волны

type Ghost = { el: HTMLElement; dx: number; dy: number };

// Смещение элемента внутри предка по offset-цепочке (без учёта transform: наклон и подъём карточек не мешают)
function offsetWithin(el: HTMLElement, anc: HTMLElement) {
  let x = 0;
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== anc) {
    x += n.offsetLeft;
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return { x, y };
}

// Один период полосы: текст → волна по вертикальным срезам → размытие
function renderStrip(span: HTMLElement, period: number, color: string) {
  const cs = getComputedStyle(span);
  const size = parseFloat(cs.fontSize);
  const lineH = span.offsetHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2) * 0.5; // размытая картинка: половинного разрешения хватает
  const w = Math.ceil(period);
  const h = Math.ceil(lineH + PAD * 2);

  const src = document.createElement("canvas");
  src.width = Math.ceil(w * dpr);
  src.height = Math.ceil(h * dpr);
  const s = src.getContext("2d");
  if (!s) return null;
  s.scale(dpr, dpr);
  s.font = `${cs.fontWeight} ${size}px ${cs.fontFamily}`;
  (s as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
  s.fillStyle = color;
  s.textBaseline = "middle";
  s.fillText(span.textContent ?? "", 0, PAD + lineH / 2);

  const out = document.createElement("canvas");
  out.width = src.width;
  out.height = src.height;
  const o = out.getContext("2d");
  if (!o) return null;
  o.filter = `blur(${BLUR * dpr}px)`;
  const step = SLICE * dpr;
  for (let x = 0; x < src.width; x += step) {
    const dy = Math.sin((x / dpr / w) * Math.PI * 2 * 6) * WAVE * dpr;
    o.drawImage(src, x, 0, step, src.height, x, dy, step, src.height);
  }
  return { url: out.toDataURL("image/png"), w, h };
}

export function startPriceMarquee(stage: HTMLElement) {
  const track = stage.querySelector<HTMLElement>(".price-marquee-track");
  const first = track?.firstElementChild as HTMLElement | null;
  if (!track || !first) return () => {};

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let period = 0;
  let speed = 0;
  let x = 0;
  let last = 0;
  let raf = 0;
  let inView = false;
  let ghosts: Ghost[] = [];
  let fontKey = "";

  const paint = () => {
    track.style.transform = `translate3d(${-x}px,0,0)`;
    for (const g of ghosts) g.el.style.transform = `translate3d(${-x - g.dx}px,${g.dy}px,0)`;
  };

  const measure = () => {
    period = first.offsetWidth;
    speed = (period * 2) / LOOP_S;
    const key = `${getComputedStyle(first).fontSize}|${period}`;
    if (key !== fontKey) {
      fontKey = key;
      const strip = renderStrip(first, period, getComputedStyle(stage).getPropertyValue("--ink").trim() || "#111");
      if (strip) {
        stage.style.setProperty("--price-ghost-img", `url("${strip.url}")`);
        stage.style.setProperty("--price-ghost-w", `${strip.w}px`);
        stage.style.setProperty("--price-ghost-h", `${strip.h}px`);
      }
    }
    const trackTop = offsetWithin(track, stage).y;
    ghosts = [...stage.querySelectorAll<HTMLElement>(".price-ghost")].map((el) => {
      const p = offsetWithin(el.parentElement as HTMLElement, stage);
      const panelW = (el.parentElement as HTMLElement).offsetWidth;
      el.style.width = `${Math.ceil(period * 2 + p.x + panelW)}px`;
      return { el, dx: p.x, dy: trackTop - p.y - PAD };
    });
    x %= period || 1;
    paint();
  };

  const frame = (t: number) => {
    const dt = last ? Math.min(0.1, (t - last) / 1000) : 0;
    last = t;
    x = (x + speed * dt) % (period || 1);
    paint();
    raf = requestAnimationFrame(frame);
  };
  const run = () => {
    if (raf || reduce || !inView || document.hidden) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  const io = new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    if (inView) run();
    else stop();
  });
  const onVis = () => (document.hidden ? stop() : run());
  const ro = new ResizeObserver(() => measure());

  let alive = true;
  document.fonts.ready.then(() => {
    if (!alive) return;
    measure();
    ro.observe(stage);
    io.observe(stage);
    document.addEventListener("visibilitychange", onVis);
  });

  return () => {
    alive = false;
    stop();
    io.disconnect();
    ro.disconnect();
    document.removeEventListener("visibilitychange", onVis);
  };
}
