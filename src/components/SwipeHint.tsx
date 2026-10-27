import { ArrowRight } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { ru } from "../content/ru";

// Подсказка «Листай» над горизонтальными лентами на телефоне (владелец 2026-10-27).
// Стрелка мягко покачивается вправо; как только ленту сдвинули — подсказка гаснет.
// Ищет ленту — следующий соседний элемент (div с горизонтальной прокруткой).
export function SwipeHint({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const row = ref.current?.nextElementSibling as HTMLElement | null;
    if (!row) return;
    const onScroll = () => {
      if (row.scrollLeft > 24) setGone(true);
    };
    row.addEventListener("scroll", onScroll, { passive: true });
    return () => row.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div ref={ref} className={`swipe-hint lg:hidden ${className}`} data-gone={gone} aria-hidden="true">
      {ru.swipeHint}
      <ArrowRight weight="bold" className="swipe-hint-arrow" />
    </div>
  );
}
