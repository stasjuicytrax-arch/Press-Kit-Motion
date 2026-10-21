import { useEffect, useRef } from "react";

// Магнитная обёртка (DESIGN.md §8): содержимое тянется за курсором на 6–10px на пружине.
// Только устройства с наведением; при reduced-motion выключено.
export function Magnetic({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const hover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!hover.matches || reduced.matches) return;

    const MAX = 10; // px
    const RADIUS = 140; // px вокруг центра, где кнопка «чувствует» курсор
    let tx = 0, ty = 0, x = 0, y = 0, vx = 0, vy = 0, raf = 0, last = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000 || 0.016);
      last = now;
      // Пружина stiffness 220, damping 18 (DESIGN.md §8)
      vx += (220 * (tx - x) - 18 * vx) * dt;
      vy += (220 * (ty - y) - 18 * vy) * dt;
      x += vx * dt;
      y += vy * dt;
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      if (Math.abs(x - tx) + Math.abs(y - ty) + Math.abs(vx) + Math.abs(vy) > 0.05) raf = requestAnimationFrame(tick);
      else raf = 0;
    };
    const kick = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy);
      const reach = Math.max(r.width, r.height) / 2 + RADIUS;
      if (d < reach) {
        const f = (1 - d / reach) * MAX;
        tx = (dx / (d || 1)) * f;
        ty = (dy / (d || 1)) * f;
      } else {
        tx = ty = 0;
      }
      kick();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
