// Простое появление секций (DESIGN.md §8): заголовок, текст, картинка по очереди,
// подъём 24px + opacity + blur, один раз. Контент виден и без скрипта: скрытое состояние
// включается только классом js-motion на <html>.
export function startReveal() {
  const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }
    },
    { rootMargin: "0px 0px -12% 0px" },
  );
  els.forEach((el) => io.observe(el));
}
