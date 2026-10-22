// Бесконечные CSS-анимации (сцены процесса, мини-сайт конструктора, афиши финала) крутились
// и вне экрана — на телефоне это лишняя работа на каждом кадре прокрутки (2026-10-22).
// Элементы с data-pause-offscreen получают data-offscreen, пока их не видно; CSS ставит их
// анимации на паузу. Вид не меняется: в кадре всё движется как раньше.
export function startOffscreenPause() {
  const els = document.querySelectorAll<HTMLElement>("[data-pause-offscreen]");
  if (!els.length || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) delete (e.target as HTMLElement).dataset.offscreen;
        else (e.target as HTMLElement).dataset.offscreen = "";
      }
    },
    { rootMargin: "100px 0px" },
  );
  els.forEach((el) => io.observe(el));
}
