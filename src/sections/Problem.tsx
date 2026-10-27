import { ru } from "../content/ru";
import { DisplayHeading } from "../components/DisplayHeading";
import { SiteVideo } from "../components/SiteVideo";

// Проблема — «Заголовок как подпись к панораме» (TZ.md §7.2).
// Лента из записей всех сайтов медленно и бесконечно плывёт влево, как афиши в финале
// (владелец 2026-10-27). Две одинаковые половины, CSS-анимация translateX(−50%) — шов не виден.
// При наведении на компьютере стоит; вне экрана стоит (data-pause-offscreen).
// Десктоп — десктопные записи 16:10, телефон — мобильные 9:16.
export function Problem() {
  const { problem, work } = ru;

  return (
    <section className="problem section scene-dark" data-theme="dark" aria-labelledby="problem-h">
      <div className="relative px-margin" data-reveal>
        <DisplayHeading id="problem-h" text={problem.h2} accent={problem.h2Accent} className="max-w-[14ch]" />
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:gap-6">
          {problem.captions.map((c) => (
            <p key={c} className="problem-caption text-body">
              {c}
            </p>
          ))}
        </div>
      </div>

      <div className="problem-pan" aria-label={problem.videoLabel} role="group" data-theme="dark" data-pause-offscreen>
        <div className="problem-track">
          <div className="problem-half">
            {work.artists.map((a) => (
              <figure key={a.key} className="problem-item">
                <div className="problem-shot">
                  <div className="hidden h-full md:block">
                    <SiteVideo site={a.key} device="desktop" label={`Сайт-пресс-кит ${a.name}`} />
                  </div>
                  <div className="h-full md:hidden">
                    <SiteVideo site={a.key} device="mobile" label={`Сайт-пресс-кит ${a.name}`} />
                  </div>
                </div>
                <figcaption className="problem-name">{a.name}</figcaption>
              </figure>
            ))}
          </div>
          <div className="problem-half" aria-hidden="true">
            {work.artists.map((a) => (
              <figure key={a.key} className="problem-item">
                <div className="problem-shot">
                  <div className="hidden h-full md:block">
                    <SiteVideo site={a.key} device="desktop" label={`Сайт-пресс-кит ${a.name}`} />
                  </div>
                  <div className="h-full md:hidden">
                    <SiteVideo site={a.key} device="mobile" label={`Сайт-пресс-кит ${a.name}`} />
                  </div>
                </div>
                <figcaption className="problem-name">{a.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
