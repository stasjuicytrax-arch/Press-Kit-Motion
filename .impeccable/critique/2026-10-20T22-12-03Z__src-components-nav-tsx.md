---
target: навигация и стекло
total_score: 20
max_score: 24
na_heuristics: 5,7,9,10
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\G13\\Desktop\\CLAUDE\\Press Kit Motion\\src\\components\\Nav.tsx"
target_fingerprint: "sha256:eb2f065df585b0239f7bed59ab07fedf8d3d5966c553d1862e0ea6b556f67a2b"
target_path: "C:\\Users\\G13\\Desktop\\CLAUDE\\Press Kit Motion\\src\\components\\Nav.tsx"
timestamp: 2026-10-20T22-12-03Z
slug: src-components-nav-tsx
---
Method: dual-agent (A: design review · B: detector)
Target: навигация, мобильное меню, липкая CTA, Liquid Glass (TZ §13 п.3). Score 20/24 (n/a: 5, 7, 9, 10).
Detector: CLI 0; browser 2 (tight-leading на подзаголовке — исправлено, 1.3; clip-path polygon у .lg-lens — форма стекла компонента, ложное); taste lint 0 FAIL.
Priority issues:
- [P1] Фокус попадал в спрятанную липкую кнопку при открытом меню -> FIXED (MutationObserver на menu-open, inert).
- [P1] Липкая стеклянная кнопка бледная над светлым -> FIXED: --glass-fill-strong + лаймовый кружок со стрелкой; та же заливка у капсулы (читается над тёмными сайтами).
- [P2] Токены стекла не использовались -> FIXED: --glass-refraction-nav/-cta через lib/tokens.ts.
- [P2] Лайм просвечивал сквозь меню -> FIXED: вуаль 0.88.
- [P3] Знак в навигации < 44px -> FIXED (min-h-tap).
Minor fixed: --stagger-menu 0 при reduced-motion, фокус ссылок меню капсулой, кнопка меню = SolidCta со стрелкой, цена и срок над кнопкой в меню.
