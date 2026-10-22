import { useEffect, useRef } from "react";
import { siteMedia, type Device } from "../lib/media";

type Props = {
  site: string;
  device: Device;
  label: string;
  className?: string;
};

// Запись сайта артиста (TZ.md §6.1, §10): preload="none", играет только в кадре, MP4 первым
// источником (на iPhone стабильнее), WebM вторым. При reduced-motion и Save-Data — только постер.
// На телефоне одновременно играет только один ролик — тот, что виден хотя бы наполовину:
// несколько декодеров сразу давали рывки прокрутки (2026-10-22).
let playing: HTMLVideoElement | null = null;
const isPhoneNow = () => window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
export function SiteVideo({ site, device, label, className = "" }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const m = siteMedia(site, device);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (reduced || saveData) return;
    const phone = isPhoneNow();
    const io = new IntersectionObserver(
      ([e]) => {
        const show = phone ? e.intersectionRatio >= 0.5 : e.isIntersecting;
        if (show) {
          if (phone && playing && playing !== v) playing.pause();
          playing = v;
          v.play().catch(() => {});
        } else {
          v.pause();
          if (playing === v) playing = null;
        }
      },
      phone ? { threshold: [0, 0.5] } : { rootMargin: "120px" },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [site, device]);

  return (
    <video
      ref={ref}
      key={`${site}-${device}`}
      className={`block h-full w-full object-cover object-top ${className}`}
      muted
      loop
      playsInline
      preload="none"
      poster={m.poster}
      aria-label={label}
    >
      <source src={m.mp4} type="video/mp4" />
      <source src={m.webm} type="video/webm" />
    </video>
  );
}
