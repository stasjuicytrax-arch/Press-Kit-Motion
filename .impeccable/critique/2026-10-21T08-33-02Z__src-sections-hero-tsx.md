---
target: первый экран стеклянная капля
total_score: 24
max_score: 32
na_heuristics: 7,10
p0_count: 1
p1_count: 2
target_identity: "file:C:\\Users\\G13\\Desktop\\CLAUDE\\Press Kit Motion\\src\\sections\\Hero.tsx"
target_fingerprint: "sha256:aa140970146602f58071b0a57bfe2faade5ac134d560c2af1182f7f37cee2e68"
target_path: "C:\\Users\\G13\\Desktop\\CLAUDE\\Press Kit Motion\\src\\sections\\Hero.tsx"
timestamp: 2026-10-21T08-33-02Z
slug: src-sections-hero-tsx
---
Method: dual-agent (A: design review · B: detector)
Target: первый экран «Стеклянная капля» (TZ §7.1 v3). Score 24/32 (n/a: 7, 10).
Detector: CLI 0; browser: oversized-h1 (монумент по ТЗ), clip-path у стекла кнопки — ложные; taste lint 0. Чанки: main 61.6 KB gz, HeroScene (three) 294 KB gz отдельно.
Priority issues:
- [P0] Линза «съедала» буквы, тело стекла невидимо -> FIXED: капля ближе к надписи (z 0.4r), приплюснута по глубине (0.55), оттенок #F2F2EE по ТЗ.
- [P1] Статичный кадр видят многие телефоны, буквы не совпадали -> FIXED: порог устройства мягче (<4), кадр переснят, учёт хвостового трекинга.
- [P1] Риск пустого h1 -> FIXED: DOM гаснет после onSync всех слов; webglcontextlost возвращает фолбэк.
- [P2] Сдвиг 5–7px и двойной контур при подмене -> FIXED: +0.03em к центру, подмена мгновенная.
- [P2] Нет строки географии, цена тихая, бесконечное самодвижение -> FIXED: geo, цена ink/500, восьмёрка садится на «Kit» через 12 с.
- [P3] grow мёртв, хардкод цветов, уход при скролле в reduced-motion, forced-colors -> FIXED.
Open: параметры материала отличаются от ТЗ (thickness 0.45 vs 1.2, distortion 0.07 vs 0.25, anisotropicBlur 0.02 vs 0.1) — значения ТЗ съедали буквы; монумент 17vw занимает ~60% ширины.
