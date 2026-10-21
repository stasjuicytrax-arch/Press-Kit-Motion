---
target: первый экран без 3D
total_score: 17
max_score: 24
na_heuristics: 5,7,9,10
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\G13\\Desktop\\CLAUDE\\Press Kit Motion\\src\\sections\\Hero.tsx"
target_fingerprint: "sha256:abd31150b1588cc437e3ba9a568305f7d43c658667c291ca9d89c40e7e4ea3b2"
target_path: "C:\\Users\\G13\\Desktop\\CLAUDE\\Press Kit Motion\\src\\sections\\Hero.tsx"
timestamp: 2026-10-21T07-54-13Z
slug: src-sections-hero-tsx
---
Method: dual-agent (A: design review · B: detector)
Target: первый экран без 3D (TZ §13 п.4). Score 17/24 (n/a: 5, 7, 9, 10).
Detector: CLI 0; browser: low-contrast и text-occlusion на строке (из-за blend-mode) — ушли после перехода на две копии; clip-path у .lg-lens — форма стекла, ложное. taste lint 0.
Priority issues:
- [P1] Reduced motion убирал единственный h1 -> FIXED: прячется только трек, h1 и label на месте.
- [P1] Difference-blend давал голубые/серые буквы -> FIXED: второй вариант ТЗ — чёрная копия + светлая, вырезанная по реальным границам экранов каждый кадр.
- [P2] Лента мелкая и плоская, пустая полоса на планшете -> FIXED: --screen-w больше, изгиб 50°/300px, отдельный размер на планшете.
- [P2] Постеры поздно на телефоне -> FIXED: 360px AVIF/JPG через srcset, fetchpriority у первых трёх.
- [P3] Центр на телефоне почти не крупнее -> FIXED: края уходят вглубь (-230px), экран 52vw.
Open: подзаголовок 3 строки (ТЗ просит 2 по 36 символов — фраза длиннее), 18 vs 20px на телефоне; WCAG 2.2.2 пауза строки (сейчас hover и офскрин).
