import { Fragment, type ElementType } from "react";

// Заголовок секции, дизайн v2 (2026-10-27): дисплейный Unbounded крупным кеглем, одно слово —
// курсив Playfair как акцент (на светлом — на лаймовой плашке, на тёмном — светящийся лайм).
// Каждое слово в маске: lib/motion.ts поднимает слова из-под маски по очереди при входе в экран.
// Без JS и при reduced-motion текст просто стоит на месте.
type Props = {
  text: string;
  accent?: string;
  /** Строки, если перенос должен быть фиксированным (например, финальный блок) */
  lines?: readonly string[];
  id?: string;
  as?: ElementType;
  className?: string;
};

function Words({ text, accent }: { text: string; accent?: string }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="dh-w">
            <span className="dh-i">{w === accent ? <em className="dh-accent">{w}</em> : w}</span>
          </span>
          {/* пробел снаружи маски: внутри inline-block он схлопывается */}
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}

export function DisplayHeading({ text, accent, lines, id, as: Tag = "h2", className = "" }: Props) {
  return (
    <Tag id={id} className={`display-heading ${className}`} data-split aria-label={lines ? lines.join(" ") : text}>
      <span aria-hidden="true">
        {lines
          ? lines.map((l) => (
              <span key={l} className="block">
                <Words text={l} accent={accent} />
              </span>
            ))
          : <Words text={text} accent={accent} />}
      </span>
    </Tag>
  );
}
