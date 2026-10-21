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
export function SiteVideo({ site, device, label, className = "" }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const m = siteMedia(site, device);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (reduced || saveData) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { rootMargin: "120px" },
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
