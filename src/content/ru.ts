// Все тексты лендинга. Компоненты берут строки только отсюда (позже рядом встанет en.ts).
// Всё, что ждёт решения владельца, помечено TODO-OWNER.

export const TELEGRAM_HANDLE = "stasjuicytrax";

export const ru = {
  meta: {
    title: "Press Kit Motion — анимированные сайты-пресс-киты для артистов",
    description:
      "Анимированный сайт-пресс-кит для диджея и артиста. Одна ссылка вместо PDF. Примеры работ, цена, сроки.",
  },
  brand: "Press Kit Motion",
  // Монумент первого экрана по словам: десктоп «Press Kit / Motion», телефон в три строки
  brandWords: ["Press", "Kit", "Motion"] as const,
  nav: {
    label: "Основная навигация",
    home: "Press Kit Motion, наверх",
    links: [
      { href: "#work", label: "Работы" },
      { href: "#price", label: "Цена" },
      { href: "#faq", label: "Вопросы" },
    ],
    write: "Написать",
    menu: "Меню",
    close: "Закрыть",
  },
  sticky: {
    cta: "Написать в Телеграм",
  },
  hero: {
    // h1: визуально монумент + подзаголовок, семантически одна фраза
    h1Rest: "анимированные сайты-пресс-киты для диджеев и артистов",
    lead: "Анимированный сайт вместо PDF. Промоутер открывает одну ссылку и сразу видит, как ты звучишь и выглядишь.",
    // TODO-OWNER: цена и срок (черновик из мини-ТЗ: от 10 000 ₽, 7 дней)
    // Неразрывные пробелы: U+202F внутри числа, U+00A0 перед единицами
    facts: { price: "10 000", days: 7 },
    factsTemplate: (price: string, days: number) =>
      `От ${price} ₽ · готово за ${days} дней`,
    cta: "Написать в Телеграм",
    geo: "Сайты для артистов из Петербурга, Перми, Бангкока и Янгона",
    toWork: "Смотреть работы",
  },
  work: {
    h2: "Пять сайтов, которые можно открыть прямо сейчас",
    open: "Открыть сайт",
    // TODO-OWNER: подтвердить разрешение артистов на показ работ.
    // Подписи сверены с сайтами 2026-10-21.
    artists: [
      {
        key: "nagoo",
        name: "DJ Nagoo",
        // TODO-OWNER: в ТЗ «Санкт-Петербург», на сайте «Live from Bahrain»
        // («Best DJ Saint Petersburg — 2018» там только награда). Сейчас по сайту.
        place: "Бахрейн",
        genre: "DJ и продюсер с 2005 года",
        url: "https://djnagoo.site",
      },
      {
        key: "lolly",
        name: "Lolly",
        place: "Янгон",
        genre: "bass и drum & bass",
        url: "https://djlolly.site/",
      },
      {
        key: "kingdom",
        name: "39 Kingdom",
        place: "дуэт",
        genre: "melodic techno",
        url: "https://stasjuicytrax-arch.github.io/39Kingdom/",
      },
      {
        key: "sunrise",
        name: "Sunrise",
        place: "Бангкок и Паттайя",
        genre: "резидент клубов DJ Mag Top 100",
        url: "https://stasjuicytrax-arch.github.io/djsunrise/",
      },
      {
        key: "toropov",
        name: "Стас Торопов",
        place: "Пермь",
        genre: "ведущий мероприятий",
        url: "https://stastoropov-site.vercel.app/",
      },
    ],
  },
  telegram: {
    defaultText: "Привет! Хочу сайт-пресс-кит.",
  },
} as const;

export type Content = typeof ru;
