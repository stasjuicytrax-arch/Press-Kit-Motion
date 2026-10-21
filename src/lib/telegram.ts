import { TELEGRAM_HANDLE, ru } from "../content/ru";
import { utmSource } from "./utm";

// Ссылка в чат с заготовленным текстом (TZ.md §8): текст места клика + источник из UTM.
export function telegramUrl(text: string = ru.telegram.defaultText): string {
  const source = ru.telegram.sources[utmSource() ?? ""];
  const full = source ? `${text} ${source}.` : text;
  return `https://t.me/${TELEGRAM_HANDLE}?text=${encodeURIComponent(full)}`;
}
