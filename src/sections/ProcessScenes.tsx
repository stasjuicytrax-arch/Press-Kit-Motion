import { Checks, CursorClick, Play, User } from "@phosphor-icons/react";
import type { CSSProperties } from "react";
import { ru } from "../content/ru";

// Живые сцены «Как появляется сайт», нарисованные кодом (правки владельца 2026-10-21, TZ.md §7.6).
// Всё в палитре сайта: тёмное поле, лайм, светлый текст. Анимации на CSS, стартуют, когда
// шаг попадает в экран (класс .is-in от reveal), при reduced-motion — сразу финальный кадр.
const sc = ru.process.scene;
const i = (n: number) => ({ "--i": n }) as CSSProperties;

function Brief() {
  return (
    <div className="ps-chat">
      <div className="ps-chat-head">
        <span className="ps-ava" aria-hidden="true">
          <User weight="fill" />
        </span>
        <span>
          <b>{sc.artist}</b>
          <small>{sc.online}</small>
        </span>
      </div>
      <div className="ps-chat-body">
        <div className="ps-msg ps-album" style={i(0)}>
          {[0, 1, 2].map((n) => (
            <span key={n} className="ps-photo" style={i(n)}>
              <User weight="fill" aria-hidden="true" />
            </span>
          ))}
        </div>
        <p className="ps-msg ps-bubble" style={i(1)}>
          {sc.bio}
          <time>{sc.time[0]}</time>
        </p>
        <p className="ps-msg ps-bubble ps-link" style={i(2)}>
          <span className="ps-play" aria-hidden="true">
            <Play weight="fill" />
          </span>
          <u>{sc.link}</u>
          <time>{sc.time[1]}</time>
        </p>
        <p className="ps-msg ps-bubble ps-out" style={i(3)}>
          {sc.reply}
          <time>
            {sc.time[2]} <Checks aria-hidden="true" />
          </time>
        </p>
      </div>
    </div>
  );
}

function Concept() {
  return (
    <div className="ps-board">
      <div className="ps-board-side">
        <small>{sc.concept}</small>
        <div className="ps-swatches">
          <span style={{ background: "var(--field-ink)" }} />
          <span style={{ background: "var(--muted)" }} />
          <span className="ps-swatch-hit" style={{ background: "var(--accent)" }}>
            <span className="ps-cursor" aria-hidden="true">
              <CursorClick weight="fill" />
            </span>
          </span>
        </div>
        <p className="ps-sample">
          {sc.sample}
          <small>{sc.font}</small>
        </p>
      </div>
      <div className="ps-sketch">
        <span className="ps-sketch-glow" aria-hidden="true" />
        <span className="ps-sketch-person" aria-hidden="true">
          <User weight="fill" />
        </span>
        <p className="ps-sketch-name">
          {[...sc.artist].map((ch, n) => (
            <span key={n} style={i(n)}>
              {ch === " " ? " " : ch}
            </span>
          ))}
        </p>
        <span className="ps-sketch-btn">{sc.booking}</span>
      </div>
    </div>
  );
}

function Build() {
  return (
    <div className="ps-build">
      <div className="ps-timeline">
        <div className="ps-ruler" aria-hidden="true">
          {Array.from({ length: 9 }, (_, n) => (
            <span key={n} />
          ))}
        </div>
        {sc.tracks.map((t, n) => (
          <div key={t} className="ps-track">
            <small>{t}</small>
            <span className="ps-lane" style={i(n)}>
              <i style={{ left: `${8 + n * 14}%` }} />
              <i style={{ left: `${30 + n * 14}%` }} />
              <span className="ps-clip" style={{ left: `${8 + n * 14}%`, width: "22%" }} />
            </span>
          </div>
        ))}
        <span className="ps-playhead" aria-hidden="true" />
      </div>
      <div className="ps-page">
        {sc.blocks.map((b, n) => (
          <span key={b} className="ps-block" style={i(n)} data-first={n === 0 || undefined}>
            {b}
          </span>
        ))}
      </div>
    </div>
  );
}

function Launch() {
  return (
    <div className="ps-launch">
      <div className="ps-phone">
        <div className="ps-url">
          <span className="ps-dot" aria-hidden="true" />
          {sc.url}
        </div>
        <div className="ps-site">
          <span className="ps-sketch-glow" aria-hidden="true" />
          <p className="ps-site-name">{sc.artist}</p>
          <span className="ps-sketch-btn">{sc.booking}</span>
        </div>
      </div>
      <div className="ps-preview">
        <u>{sc.url}</u>
        <span className="ps-preview-card">
          <span className="ps-preview-img">
            <span className="ps-sketch-glow" aria-hidden="true" />
            <b>{sc.artist}</b>
          </span>
          <b>{sc.previewTitle}</b>
          <small>{sc.previewText}</small>
        </span>
      </div>
    </div>
  );
}

const scenes = { brief: Brief, concept: Concept, build: Build, launch: Launch };

export function ProcessScene({ kind, label }: { kind: string; label: string }) {
  const Scene = scenes[kind as keyof typeof scenes] ?? Brief;
  return (
    <div className="pscene" data-theme="dark" role="img" aria-label={label}>
      <div className="pscene-in" aria-hidden="true">
        <Scene />
      </div>
    </div>
  );
}
