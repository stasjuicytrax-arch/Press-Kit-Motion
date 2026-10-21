// Пути к записям сайтов артистов (public/media/sites/<ключ>/, делает scripts/record-sites.mjs).
// Через BASE_URL, чтобы работало и на Vercel (/), и на GitHub Pages (/Press-Kit-Motion/).
export type Device = "mobile" | "desktop";

export function siteMedia(key: string, device: Device) {
  const dir = `${import.meta.env.BASE_URL}media/sites/${key}/`;
  return {
    mp4: `${dir}${device}.mp4`,
    webm: `${dir}${device}.webm`,
    poster: `${dir}${device}-poster.jpg`,
    posterAvif: `${dir}${device}-poster.avif`,
    /** Лёгкий постер 360px для экранов ленты на телефоне (только mobile) */
    posterSmall: `${dir}${device}-poster-360.jpg`,
    posterSmallAvif: `${dir}${device}-poster-360.avif`,
  };
}
