import { ArrowUpRight } from "@phosphor-icons/react";
import { telegramUrl } from "../lib/telegram";

type Props = {
  label: string;
  place: string;
  text?: string;
  className?: string;
  onClick?: () => void;
  /** accent — лаймовая (главная), ink — чёрная капсула для второстепенных карточек цены */
  variant?: "accent" | "ink";
};

// Главная сплошная кнопка (DESIGN.md §7): капсула и вложенный кружок со стрелкой.
export function SolidCta({ label, place, text, className = "", onClick, variant = "accent" }: Props) {
  const tone = variant === "accent" ? "bg-accent text-accent-ink" : "bg-ink text-bg";
  return (
    <a
      href={telegramUrl(text)}
      target="_blank"
      rel="noopener"
      data-place={place}
      onClick={onClick}
      className={`group inline-flex h-button items-center justify-between gap-4 rounded-pill ${tone} pl-6 pr-inset font-medium no-underline transition-transform duration-fast ease-spring hover:scale-hover active:scale-press ${className}`}
    >
      {label}
      <ArrowChip tone={variant === "accent" ? "ink" : "accent"} />
    </a>
  );
}

/** Кружок со стрелкой внутри кнопки (button-in-button). */
export function ArrowChip({ tone = "ink" }: { tone?: "ink" | "accent" }) {
  return (
    <span
      className={`grid size-tap shrink-0 place-items-center rounded-pill ${
        tone === "ink" ? "bg-ink text-accent" : "bg-accent text-accent-ink"
      }`}
    >
      <ArrowUpRight
        weight="regular"
        aria-hidden="true"
        className="size-icon-md transition-transform duration-fast ease-spring group-hover:translate-x-nudge group-hover:-translate-y-nudge"
      />
    </span>
  );
}
