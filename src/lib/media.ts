// Пути к записям сайтов артистов (public/media/sites/<ключ>/, делает scripts/record-sites.mjs).
// Через BASE_URL, чтобы работало и на Vercel (/), и на GitHub Pages (/Press-Kit-Motion/).
// В <video> первым <source> ставить mp4 (H.264), вторым webm: на iPhone так стабильнее (TZ.md §6.1).
export type Device = "mobile" | "desktop";

export function siteMedia(key: string, device: Device) {
  const dir = `${import.meta.env.BASE_URL}media/sites/${key}/`;
  return {
    mp4: `${dir}${device}.mp4`,
    webm: `${dir}${device}.webm`,
    poster: `${dir}${device}-poster.jpg`,
    posterAvif: `${dir}${device}-poster.avif`,
  };
}
