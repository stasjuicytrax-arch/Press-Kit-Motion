import { useEffect, useRef } from "react";

type Props = {
  text: string;
  /** Две строки статичного монумента на телефоне */
  lines: readonly [string, string];
  /** Полная фраза для скринридеров: строка и есть видимый h1 (TZ.md §7.1) */
  label: string;
};

// Бегущая строка-монумент (DESIGN.md §8): линейно, 40px/с, копии для бесшовности,
// пауза при наведении. Цвет — второй вариант из TZ.md §7.1: чёрная строка на фоне и
// светлая копия поверх, вырезанная по силуэтам экранов ленты (clip-path ставит ScreenRibbon).
// Так каждое слово читается целиком и над светлым фоном, и над тёмными сайтами.
// При reduced-motion трек прячется, остаётся статичный монумент; h1 и его label на месте.
export function Marquee({ text, lines, label }: Props) {
  const inkRef = useRef<HTMLSpanElement>(null);
  const lightRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const tracks = [inkRef.current, lightRef.current].filter(Boolean) as HTMLSpanElement[];
    if (!tracks.length) return;
    const speed = parseFloat(getComputedStyle(tracks[0]).getPropertyValue("--marquee-speed")) || 40;
    const set = () => {
      const half = tracks[0].scrollWidth / 2;
      for (const t of tracks) t.style.setProperty("--marquee-duration", `${(half / speed).toFixed(2)}s`);
    };
    set();
    const ro = new ResizeObserver(set);
    ro.observe(tracks[0]);
    return () => ro.disconnect();
  }, []);

  const chunk = (
    <span className="marquee-chunk">
      {text}
      <span className="marquee-dot" />
    </span>
  );
  const layer = (ref: React.Ref<HTMLSpanElement>) => (
    <>
      <span ref={ref} className="marquee-track">
        {chunk}
        {chunk}
        {chunk}
        {chunk}
      </span>
      <span className="marquee-static px-margin">
        <span className="block whitespace-nowrap md:inline">{lines[0]}</span>{" "}
        <span className="block whitespace-nowrap md:inline">{lines[1]}</span>
      </span>
    </>
  );

  return (
    <h1 className="marquee">
      <span className="sr-only">{label}</span>
      <span className="mq-layer mq-ink" aria-hidden="true">
        {layer(inkRef)}
      </span>
      <span className="mq-layer mq-light" aria-hidden="true">
        {layer(lightRef)}
      </span>
    </h1>
  );
}
