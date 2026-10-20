# Press Kit Motion — инструкция для Claude Code

Продающий лендинг услуги «анимированный сайт-пресс-кит для диджеев и артистов».

Перед любой работой прочитай по порядку:
1. `PRODUCT.md` — продукт и ограничения.
2. `DESIGN.md` — дизайн-система. Единственный источник стилей, хардкод цветов и размеров запрещён.
3. `TZ.md` — техническое задание: секции, тексты, стек, порядок работы.

Правила:
- Стек: Vite + React + TypeScript + Tailwind + Three.js (@react-three/fiber). Светлая тема, палитра «Кислота».
- Скиллы: Impeccable, design-taste-frontend, high-end-visual-design (установка и порядок в `TZ.md` §4).
- После каждого блока: `/impeccable critique`, `inspect.mjs --allow glass`, исправить FAIL. Перед пушем: slop-проверка (`lint.mjs` + `/impeccable audit`) и `/impeccable polish`.
- После каждого блока коммит и `git push` в https://github.com/stasjuicytrax-arch/Press-Kit-Motion.git — владелец смотрит процесс.
- Тексты только из `src/content/ru.ts`. Не выдумывать отзывы, клиентов и цифры. Неизвестное помечать `TODO-OWNER`.
- Компоненты 21st.dev: Liquid Glass Button (обязательно), Circular Carousel, Tilted Grid Hero — см. `TZ.md` §5.
- Окружение владельца: Windows, PowerShell.
