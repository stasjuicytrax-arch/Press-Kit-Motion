import { ArrowUpRight } from "@phosphor-icons/react";
import { useState } from "react";
import { ru } from "../content/ru";
import { GlassPhone } from "../components/GlassPhone";
import { SiteVideo } from "../components/SiteVideo";

// Работы — «Большие имена, липкое превью» (TZ.md §7.3).
// Десктоп: имена крупно слева, справа липкий стеклянный телефон с записью активного сайта;
// наведение и фокус переключают сайт. Телефон: горизонтальный свайп по записям со scroll-snap.
export function Work() {
  const { work } = ru;
  const [active, setActive] = useState(0);
  const current = work.artists[active];

  return (
    <section id="work" className="section" aria-labelledby="work-h">
      <h2 id="work-h" className="max-w-[18ch] px-margin text-head font-semibold leading-head tracking-head" data-reveal>
        {work.h2}
      </h2>

      {/* Десктоп */}
      <div className="page-grid mt-9 hidden lg:grid">
        <ul className="col-span-8 flex flex-col" data-reveal>
          {work.artists.map((a, i) => (
            <li key={a.key}>
              <a
                href={a.url}
                target="_blank"
                rel="noopener"
                data-portfolio={a.key}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className="work-name group"
                data-active={i === active}
              >
                <span aria-hidden="true" className="work-dot" />
                <span className="text-head font-semibold leading-none tracking-head">{a.name}</span>
                <span className="text-small text-muted">
                  {a.place} · {a.genre}
                </span>
              </a>
            </li>
          ))}
        </ul>
        <div className="col-span-4">
          <div className="work-sticky">
            <GlassPhone className="w-full">
              <div key={current.key} className="work-swap h-full">
                <SiteVideo site={current.key} device="mobile" label={`Сайт-пресс-кит ${current.name}`} />
              </div>
            </GlassPhone>
            <a href={current.url} target="_blank" rel="noopener" data-portfolio={current.key} className="work-open mt-5">
              {work.open}
              <ArrowUpRight aria-hidden="true" className="size-icon-sm" />
            </a>
          </div>
        </div>
      </div>

      {/* Телефон и планшет */}
      <div className="work-swipe mt-7 lg:hidden" data-reveal>
        {work.artists.map((a) => (
          <figure key={a.key} className="work-card">
            <div className="work-card-screen">
              <SiteVideo site={a.key} device="mobile" label={`Сайт-пресс-кит ${a.name}`} />
            </div>
            <figcaption className="mt-4 flex flex-col gap-1">
              <span className="text-lead font-semibold tracking-head">{a.name}</span>
              <span className="text-small text-muted">
                {a.place} · {a.genre}
              </span>
              <a href={a.url} target="_blank" rel="noopener" data-portfolio={a.key} className="work-open mt-2">
                {work.open}
                <ArrowUpRight aria-hidden="true" className="size-icon-sm" />
              </a>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
