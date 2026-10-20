import { LiquidGlassButton } from "./ui/apple-tahoe-liquid-glass-button";
import { ArrowChip } from "./SolidCta";
import { telegramUrl } from "../lib/telegram";
import { tokenNumber } from "../lib/tokens";

type Props = {
  label: string;
  /** Место клика для цели Метрики tg_click (TZ.md §8) */
  place: string;
  text?: string;
  className?: string;
};

// Главная кнопка из жидкого стекла (DESIGN.md §7). Преломление на краях, внутри плотная
// светлая заливка --glass-fill-strong: текст читается и над светлым фоном, и над тёмными
// видео сайтов. Справа лаймовый кружок со стрелкой — тот же жест, что у сплошной кнопки.
export function GlassCta({ label, place, text, className = "" }: Props) {
  return (
    <LiquidGlassButton
      asChild
      interactive
      refraction={tokenNumber("--glass-refraction-cta", 18)}
      className={`group justify-between bg-glass-fill pl-6 pr-inset ${className}`}
    >
      <a href={telegramUrl(text)} target="_blank" rel="noopener" data-place={place}>
        {label}
        <ArrowChip tone="accent" />
      </a>
    </LiquidGlassButton>
  );
}
