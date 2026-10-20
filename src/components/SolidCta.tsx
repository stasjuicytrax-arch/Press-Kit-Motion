import { ArrowUpRight } from "@phosphor-icons/react";
import { telegramUrl } from "../lib/telegram";

type Props = {
  label: string;
  place: string;
  text?: string;
  className?: string;
  onClick?: () => void;
};

// Главная сплошная кнопка (DESIGN.md §7): лаймовая капсула и вложенный кружок со стрелкой.
export function SolidCta({ label, place, text, className = "", onClick }: Props) {
  return (
    <a
      href={telegramUrl(text)}
      target="_blank"
      rel="noopener"
      data-place={place}
      onClick={onClick}
      className={`group inline-flex h-button items-center justify-between gap-4 rounded-pill bg-accent pl-6 pr-inset font-medium text-accent-ink no-underline transition-transform duration-fast ease-spring hover:scale-hover active:scale-press ${className}`}
    >
      {label}
      <ArrowChip />
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
