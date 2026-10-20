import { TELEGRAM_HANDLE, ru } from "../content/ru";

// Ссылка в чат с заготовленным текстом (TZ.md §8). UTM-источник добавится на шаге 14.
export function telegramUrl(text: string = ru.telegram.defaultText): string {
  return `https://t.me/${TELEGRAM_HANDLE}?text=${encodeURIComponent(text)}`;
}
