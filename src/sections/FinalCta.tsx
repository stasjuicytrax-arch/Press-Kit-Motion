import { ru } from "../content/ru";
import { Magnetic } from "../components/Magnetic";
import { DisplayHeading } from "../components/DisplayHeading";
import { SolidCta } from "../components/SolidCta";
import { siteMedia } from "../lib/media";

// Финальный призыв — инверсия (TZ.md §7.9): единственный тёмный блок, 90svh. Заголовок
// 9–11vw в две строки, внизу на одной линии фраза и сплошная лаймовая кнопка (на тёмном лайм
// светится сам). На фоне медленно и тускло проплывают экраны сайтов (CSS, opacity 0.25).
// data-hide-sticky прячет липкую мобильную кнопку, пока блок в кадре.
export function FinalCta() {
  const { final, work } = ru;
  const posters = [...work.artists, ...work.artists];
  return (
    <section className="final scene-dark" aria-labelledby="final-h" data-hide-sticky data-theme="dark">
      <div className="final-drift" aria-hidden="true" data-pause-offscreen>
        <div className="final-drift-track">
          {posters.map((a, i) => (
            <img key={`${a.key}-${i}`} src={siteMedia(a.key, "mobile").poster} alt="" loading="lazy" decoding="async" width={780} height={1688} />
          ))}
        </div>
      </div>
      <DisplayHeading id="final-h" text={final.h2Lines.join(" ")} lines={final.h2Lines} accent={final.h2Accent} className="final-title" />
      <div className="final-bottom" data-reveal>
        <p className="max-w-[40ch] text-lead leading-lead">{final.text}</p>
        <Magnetic className="w-full md:w-auto">
          <SolidCta label={final.cta} place="cta" className="w-full md:w-auto" />
        </Magnetic>
      </div>
    </section>
  );
}
