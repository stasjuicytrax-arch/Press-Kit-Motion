import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, MeshTransmissionMaterial, Text } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import fontUrl from "@fontsource/onest/files/onest-latin-600-normal.woff?url";
import { injectDropNoise, makeDropUniforms } from "./dropShader";
import { tokenNumber } from "../lib/tokens";

// Сцена первого экрана «Стеклянная капля» (TZ.md §7.1, версия 3).
// Мир в CSS-пикселях: камера стоит так, что на плоскости z=0 одна единица = 1px,
// поэтому слова монумента рисуются ровно поверх своих DOM-двойников.

type Props = {
  /** h1 с тремя словами-спанами (data-word); сцена берёт их положения и размер шрифта */
  titleRef: React.RefObject<HTMLElement>;
  heroRef: React.RefObject<HTMLElement>;
  reduced: boolean;
  phone: boolean;
  onReady: () => void;
  /** WebGL потерял контекст — вернуть DOM-текст и статичный кадр */
  onLost: () => void;
};

type Word = { text: string; x: number; y: number; size: number };

// Цвета сцены — из токенов DESIGN.md (читаются один раз при загрузке чанка)
const css = (name: string, fallback: string) =>
  (typeof window !== "undefined" && getComputedStyle(document.documentElement).getPropertyValue(name).trim()) || fallback;
const INK = css("--ink", "#111111");
const BG = css("--bg", "#F2F2EE");
const LIME = css("--glow-1", "#C6F135");
const FOV = 30;
const FALL_KEY = "pkm-drop-fell";

function readWords(hero: HTMLElement, title: HTMLElement, vw: number, vh: number): { words: Word[]; kit: { x: number; y: number }; bounds: DOMRect; W: number; H: number; navBottom: number; textHalf: number; boundsOriginX: number; boundsOriginY: number } {
  // Координаты слов относительно холста, который занимает весь первый экран
  const hr = hero.getBoundingClientRect();
  const W = vw;
  const H = vh;
  const size = parseFloat(getComputedStyle(title).fontSize);
  const words: Word[] = [];
  let kit = { x: 0, y: 0 };
  let textHalf = 0;
  let top = Infinity, bottom = -Infinity;
  title.querySelectorAll<HTMLElement>("[data-word]").forEach((el) => {
    // Range даёт бокс самого текста, а не блока на всю ширину
    const range = document.createRange();
    range.selectNodeContents(el);
    const r = range.getBoundingClientRect();
    // CSS ставит трекинг -0.06em и после последней буквы: бокс короче на 0.06em справа,
    // поэтому центр самих глифов правее центра бокса на 0.03em
    const x = r.left + r.width / 2 + size * 0.03 - hr.left - W / 2;
    const y = H / 2 - (r.top + r.height / 2 - hr.top);
    words.push({ text: el.dataset.word!, x, y, size });
    textHalf = Math.max(textHalf, Math.abs(x) + r.width / 2);
    top = Math.min(top, r.top);
    bottom = Math.max(bottom, r.bottom);
    if (el.dataset.word === "Kit") kit = { x, y };
  });
  // Низ навигации-капсулы в координатах секции: капля под неё не заходит
  const nav = document.querySelector(".nav-shell > nav")?.getBoundingClientRect();
  // Навигация фиксирована, а первый экран стоит в начале документа: считаем от верха документа,
  // иначе при пересчёте на прокрученной странице капля сползала бы вниз
  const navBottom = nav ? nav.bottom - (hr.top + window.scrollY) : 0;
  // Границы самих букв (не блока h1 на всю ширину): над ними капля чуть крупнее
  const cx = hr.left + W / 2;
  const bounds = new DOMRect(cx - textHalf, top, textHalf * 2, bottom - top);
  return { words, kit, bounds, W, H, navBottom, textHalf, boundsOriginX: hr.left, boundsOriginY: hr.top };
}

function CameraRig() {
  const { camera, size } = useThree();
  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = FOV;
    cam.near = 10;
    cam.far = 20000;
    cam.position.set(0, 0, size.height / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
    cam.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

function Drop({ heroRef, titleRef, reduced, phone, onReady }: Omit<Props, "onLost">) {
  const { size, invalidate } = useThree();
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.Material>(null);
  const uniforms = useMemo(() => makeDropUniforms(0.07), []);
  const [layout, setLayout] = useState<ReturnType<typeof readWords> | null>(null);

  // Положения слов и «Kit» при каждом ресайзе
  useLayoutEffect(() => {
    if (!heroRef.current || !titleRef.current) return;
    setLayout(readWords(heroRef.current, titleRef.current, size.width, size.height));
  }, [size, heroRef, titleRef]);

  useLayoutEffect(() => {
    if (matRef.current) injectDropNoise(matRef.current, uniforms);
  }, [uniforms]);

  // Состояние движения живёт в ref: 60 раз в секунду без ререндеров
  const st = useRef({
    x: 0, y: 0, vx: 0, vy: 0,
    sq: 1, sqv: 0, grow: 1,
    phase: "idle" as "fall" | "idle" | "follow",
    fallT: 0, startY: 0,
    tx: 0, ty: 0, lastPointer: -10, touching: false,
    tiltX: 0, tiltY: 0, t: 0, ready: false, wander: 0, pullW: 0, angle: 0, stretch: 0,
  });

  const radius = (size.width * tokenNumber("--drop-size", phone ? 42 : 26, true)) / 100 / 2;

  // Первый кадр: падение один раз за визит, иначе капля сразу над «Kit»
  useEffect(() => {
    if (!layout) return;
    const s = st.current;
    if (s.ready) return;
    s.ready = true;
    let fell = false;
    try {
      fell = sessionStorage.getItem(FALL_KEY) === "1";
    } catch {}
    s.x = layout.kit.x;
    s.y = layout.kit.y;
    if (!reduced && !fell) {
      s.phase = "fall";
      s.startY = layout.H / 2 + radius * 1.4;
      s.y = s.startY;
      try {
        sessionStorage.setItem(FALL_KEY, "1");
      } catch {}
    }
    invalidate();
  }, [layout, reduced, radius, invalidate]);

  // DOM-текст гаснет только когда troika сгенерировала все слова (иначе мелькнёт пустой h1)
  const synced = useRef(new Set<string>());
  const onSync = (word: string) => {
    synced.current.add(word);
    if (layout && synced.current.size === layout.words.length) requestAnimationFrame(() => onReady());
  };

  // Курсор, касания, всплеск, наклон телефона
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || reduced) return;
    const s = st.current;
    const toLocal = (cx: number, cy: number) => {
      const r = hero.getBoundingClientRect();
      return { x: cx - r.left - r.width / 2, y: r.height / 2 - (cy - r.top) };
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch" && !s.touching) return;
      const p = toLocal(e.clientX, e.clientY);
      s.tx = p.x;
      s.ty = p.y;
      s.lastPointer = s.t;
      if (s.phase === "idle") s.phase = "follow";
    };
    const onDown = (e: PointerEvent) => {
      if ((e.target as Element).closest("a, button")) return;
      if (e.pointerType === "touch") {
        s.touching = true;
        enableTilt();
      }
      onMove(e);
      uniforms.uRipple.value = 1; // всплеск
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === "touch") s.touching = false;
    };
    let tiltOn = false;
    const onTilt = (e: DeviceOrientationEvent) => {
      s.tiltX = Math.max(-1, Math.min(1, (e.gamma ?? 0) / 30));
      s.tiltY = Math.max(-1, Math.min(1, ((e.beta ?? 45) - 45) / 30));
    };
    // Наклон только после жеста; на iOS без запроса разрешения не включаем (TZ.md §7.1)
    const enableTilt = () => {
      const D = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> } | undefined;
      if (tiltOn || !D || typeof D.requestPermission === "function") return;
      tiltOn = true;
      window.addEventListener("deviceorientation", onTilt);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    hero.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, [heroRef, reduced, uniforms]);

  // Капля живёт только на первом экране (решение владельца 2026-10-21: в угол не улетать).
  // При уходе с первого экрана улетает вниз-вправо и исчезает (масштаб → 0), затем сцена
  // засыпает: frameloop "demand", пока первый экран снова не вернётся в кадр.
  const exit = useRef(0);
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || reduced) return;
    // Режим меняем только при переходе: раньше каждый scroll ниже первого экрана звал invalidate()
    // и перерисовывал дорогое стекло на каждый шаг прокрутки по всей странице (п. 10)
    let asleep: boolean | null = null;
    const onScroll = () => {
      const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.6)));
      exit.current = p;
      const sleep = p >= 1;
      if (sleep === asleep) return;
      asleep = sleep;
      if (sleep) invalidate(); // последний кадр: капля скрыта (сам режим сна — в frameloop у Canvas)
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reduced, heroRef, invalidate]);

  const k = tokenNumber("--drop-spring-k", 90);
  const c = tokenNumber("--drop-spring-c", 14);

  useFrame((_, delta) => {
    const g = outer.current;
    const i = inner.current;
    if (!g || !i || !layout) return;
    const s = st.current;
    const dt = Math.min(delta, 1 / 30);
    s.t += dt;
    if (!reduced) uniforms.uNoiseTime.value += dt;
    uniforms.uRipple.value = Math.max(0, uniforms.uRipple.value - dt * 2.4);

    if (!reduced) {
      if (s.phase === "fall") {
        // Падение 0.7с с ускорением, удар о «Kit»: расплющивание и волна
        s.fallT += dt;
        const p = Math.min(1, s.fallT / 0.7);
        s.y = s.startY + (layout.kit.y - s.startY) * p * p;
        if (p >= 1) {
          s.phase = "idle";
          s.sq = 0.55;
          s.sqv = 0;
          uniforms.uRipple.value = 1;
          s.vx = s.vy = 0;
        }
      } else {
        // Капля сама медленно плавает по всей надписи (восьмёрка по ширине «Press Kit Motion»),
        // а мышь или палец мягко притягивают её, но не дальше 0.6 радиуса — не «прилипает»
        // (решения владельца 2026-10-21: не прилипать к курсору, не застывать, летать по надписи).
        const moving = s.t - s.lastPointer < 0.6 || s.touching;
        // Вес притяжения к курсору нарастает и спадает плавно (~0.5 с): цель не прыгает,
        // когда мышь останавливается или трогается
        s.pullW += ((moving ? 1 : 0) - s.pullW) * Math.min(1, dt * 3);
        const re = radius * 1.08; // видимый радиус (перспектива увеличивает каплю)
        s.wander += dt;
        const midY = (layout.words[0].y + layout.words[layout.words.length - 1].y) / 2;
        const spanX = Math.max(0, layout.textHalf - re * 0.6);
        const spanY = Math.abs(layout.words[0].y - layout.words[layout.words.length - 1].y) / 2;
        // Старт траектории в «Kit», затем плавный переход на восьмёрку за ~3 с
        const blend = Math.min(1, s.wander / 3);
        const wx = Math.sin(s.wander * 0.28) * spanX;
        const wy = midY + Math.sin(s.wander * 0.45 + 0.9) * spanY;
        let tx = layout.kit.x + (wx - layout.kit.x) * blend;
        let ty = layout.kit.y + (wy - layout.kit.y) * blend;
        if (s.pullW > 0.001) {
          const dx = s.tx - tx;
          const dy = s.ty - ty;
          const d = Math.hypot(dx, dy) || 1;
          // Мягкое насыщение: чем дальше курсор, тем меньше прирост, максимум 0.6 радиуса
          const pull = re * 0.6 * Math.tanh(d / (re * 4));
          tx += (dx / d) * pull * s.pullW;
          ty += (dy / d) * pull * s.pullW;
        }
        const xLim = size.width / 2 - re * 0.75;
        const yTop = size.height / 2 - layout.navBottom - re - 12;
        const cx = Math.max(-xLim, Math.min(xLim, tx + s.tiltX * size.width * 0.15));
        const cy = Math.min(yTop, ty - s.tiltY * size.height * 0.1);
        const ax2 = k * (cx - s.x) - c * s.vx;
        const ay2 = k * (cy - s.y) - c * s.vy;
        s.vx += ax2 * dt;
        s.vy += ay2 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
      }
      // Пружина расплющивания: после удара капля дрожит и собирается
      const sa = 180 * (1 - s.sq) - 8 * s.sqv;
      s.sqv += sa * dt;
      s.sq += s.sqv * dt;
    }

    // Над буквами капля чуть крупнее (в координатах сцены, без чтения раскладки в кадре)
    const b = layout.bounds;
    const left = b.left - (layout.boundsOriginX ?? 0);
    const top = b.top - (layout.boundsOriginY ?? 0);
    const px = s.x + layout.W / 2;
    const py = layout.H / 2 - s.y;
    const over = px > left && px < left + b.width && py > top && py < top + b.height;
    s.grow += ((over ? 1.08 : 1) - s.grow) * Math.min(1, dt * 6);

    // Капля целиком перед надписью: стекло преломляет буквы, а не режется ими
    // Уход: капля улетает вниз-вправо и уменьшается до нуля
    const e = exit.current * exit.current;
    const fade = 1 - e;
    g.visible = fade > 0.001;
    g.position.set(s.x + e * size.width * 0.3, s.y - e * size.height * 0.35, radius * 0.4);
    // По глубине капля приплюснута (0.55): край меньше уводит лучи за пределы букв
    g.scale.set((1 / Math.sqrt(s.sq)) * radius * s.grow * fade, s.sq * radius * s.grow * fade, 0.55 * radius * s.grow * fade);

    // Растяжение по скорости: вдоль движения длиннее. Направление обновляется только на заметной
    // скорости и сглаженно — на почти нулевой скорости atan2 скачет, и капля дрожала
    const speed = Math.hypot(s.vx, s.vy);
    if (speed > 40) {
      const target = Math.atan2(s.vy, s.vx);
      let d = target - s.angle;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      s.angle += d * Math.min(1, dt * 8);
    }
    s.stretch += (Math.min(0.18, speed / 1800) - s.stretch) * Math.min(1, dt * 6);
    i.rotation.z = s.angle;
    i.scale.set(1 + s.stretch, 1 - s.stretch * 0.5, 1 - s.stretch * 0.5);
  });

  if (!layout) return null;

  return (
    <>
      {layout.words.map((w) => (
          <Text
            key={w.text}
            font={fontUrl}
            fontSize={w.size}
            letterSpacing={-0.06}
            anchorX="center"
            anchorY="middle"
            position={[w.x, w.y, 0]}
            color={INK}
            onSync={() => onSync(w.text)}
          >
            {w.text}
          </Text>
      ))}
      <group ref={outer}>
        <group ref={inner}>
          <mesh>
            <icosahedronGeometry args={[1, phone ? 32 : 48]} />
            <MeshTransmissionMaterial
              ref={matRef as never}
              transmission={1}
              thickness={0.45}

              ior={1.25}
              roughness={0.04}
              chromaticAberration={0.05}
              anisotropicBlur={0.02}
              distortion={0.07}
              distortionScale={0.4}
              temporalDistortion={reduced ? 0 : 0.08}
              backside={false}
              color={BG}
              background={new THREE.Color(BG)}
              samples={phone ? 3 : 4}
            />
          </mesh>
        </group>
      </group>
      <Environment resolution={256} frames={1}>
        {/* Светлое окружение: стекло отражает свет студии, а не пустоту */}
        <color attach="background" args={[BG]} />
        <Lightformer form="rect" intensity={2.4} position={[0, 4, -6]} scale={[12, 1.2, 1]} />
        <Lightformer form="rect" intensity={1.6} position={[-6, 1, -2]} rotation-y={Math.PI / 2} scale={[8, 1, 1]} />
        <Lightformer form="rect" intensity={1.2} position={[6, -1, -2]} rotation-y={-Math.PI / 2} scale={[8, 0.8, 1]} />
        <Lightformer form="rect" intensity={1.4} color={LIME} position={[5, 2, 2]} rotation-y={-Math.PI / 2} scale={[3, 3, 1]} />
        <Lightformer form="ring" intensity={1.2} position={[0, 0, 8]} scale={4} />
      </Environment>
    </>
  );
}

// Сон сцены ниже первого экрана держим в самом frameloop Canvas: ручной setFrameloop
// перебивался пропсом при любой перерисовке, и стекло капли снова считалось каждый кадр (п. 10)
function useAsleep(reduced: boolean) {
  const [asleep, setAsleep] = useState(false);
  useEffect(() => {
    if (reduced) return;
    let last: boolean | null = null;
    const onScroll = () => {
      const v = window.scrollY >= window.innerHeight * 0.6;
      if (v !== last) setAsleep((last = v));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reduced]);
  return asleep;
}

export default function HeroScene(props: Props) {
  const asleep = useAsleep(props.reduced);
  return (
    <Canvas
      className="hero-canvas"
      aria-hidden="true"
      flat
      dpr={[1, 1.25]}
      frameloop={props.reduced || asleep ? "demand" : "always"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: FOV, position: [0, 0, 1000] }}
      onCreated={({ gl }) => gl.domElement.addEventListener("webglcontextlost", () => props.onLost(), { once: true })}
      style={{ position: "absolute" }}
      resize={{ scroll: false }}
    >
      <CameraRig />
      <Drop heroRef={props.heroRef} titleRef={props.titleRef} reduced={props.reduced} phone={props.phone} onReady={props.onReady} />
    </Canvas>
  );
}
