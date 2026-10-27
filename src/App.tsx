import { Suspense, lazy, useEffect } from "react";
import { Nav } from "./components/Nav";
import { StickyCta } from "./components/StickyCta";
import { CookieBanner } from "./components/CookieBanner";
import { Cursor } from "./components/Cursor";
import { Hero } from "./sections/Hero";
import { MarqueeBand } from "./components/MarqueeBand";
import { startReveal } from "./lib/reveal";
import { startOffscreenPause } from "./lib/offscreen";

// Всё ниже первого экрана — отдельным чанком: первый экран рисуется и становится интерактивным
// быстрее (Lighthouse: меньше стартового JS и блокировки потока). GSAP и Lenis — тоже отдельно,
// после первой отрисовки.
const Below = lazy(() => import("./sections/Below"));
const Footer = lazy(() => import("./sections/Footer").then((m) => ({ default: m.Footer })));

// Порядок секций — TZ.md §7: утверждение → доказательство.
export default function App() {
  // Появления, пауза вне экрана и движение стартуют, когда нижние секции уже в DOM (onReady)
  const onBelowReady = () => {
    startReveal();
    startOffscreenPause();
    const go = () => import("./lib/motion").then((m) => m.startMotion());
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void };
    if (w.requestIdleCallback) w.requestIdleCallback(go, { timeout: 1500 });
    else setTimeout(go, 200);
  };
  useEffect(() => {
    document.documentElement.classList.add("app-ready");
  }, []);

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <MarqueeBand />
        <Suspense fallback={<div className="below-placeholder" />}>
          <Below onReady={onBelowReady} />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
      <StickyCta />
      <CookieBanner />
      <Cursor />
    </>
  );
}
