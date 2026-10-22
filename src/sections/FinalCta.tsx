import { ru } from "../content/ru";
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
    <section className="final surface-field" aria-labelledby="final-h" data-hide-sticky data-theme="dark">
      <div className="final-drift" aria-hidden="true" data-pause-offscreen>
        <div className="final-drift-track">
          {posters.map((a, i) => (
            <img key={`${a.key}-${i}`} src={siteMedia(a.key, "mobile").poster} alt="" loading="lazy" decoding="async" width={780} height={1688} />
          ))}
        </div>
      </div>
      <h2 id="final-h" className="final-title" data-reveal>
        <span className="block">{final.h2Lines[0]}</span>
        <span className="block">{final.h2Lines[1]}</span>
      </h2>
      <div className="final-bottom" data-reveal>
        <p className="max-w-[40ch] text-lead leading-lead">{final.text}</p>
        <SolidCta label={final.cta} place="cta" className="w-full md:w-auto" />
      </div>
    </section>
  );
}
