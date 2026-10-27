// Пути к записям сайтов артистов (public/media/sites/<ключ>/, делает scripts/record-sites.mjs).
// Через BASE_URL, чтобы работало и на Vercel (/), и на GitHub Pages (/Press-Kit-Motion/).
// В <video> первым <source> ставить mp4 (H.264), вторым webm: на iPhone так стабильнее (TZ.md §6.1).
// ?v=… — версия файла из vite.config.ts: после перезаписи ролика браузер не возьмёт старый из кэша.
export type Device = "mobile" | "desktop";

declare const __MEDIA_V__: Record<string, string>;

export function siteMedia(key: string, device: Device) {
  const dir = `${import.meta.env.BASE_URL}media/sites/${key}/`;
  const v = typeof __MEDIA_V__ !== "undefined" && __MEDIA_V__[`${key}/${device}`] ? `?v=${__MEDIA_V__[`${key}/${device}`]}` : "";
  return {
    mp4: `${dir}${device}.mp4${v}`,
    webm: `${dir}${device}.webm${v}`,
    poster: `${dir}${device}-poster.jpg${v}`,
    posterAvif: `${dir}${device}-poster.avif${v}`,
  };
}
