import { useEffect, useLayoutEffect, useRef, useState } from "react";
import meta from "../../public/media/drop/drop-video.json";

// Капля на телефоне (2026-10-22): живая WebGL-капля для телефонов слишком тяжёлая, поэтому
// здесь играет запись той же сцены (scripts/record-drop.mjs): падение на «Kit», затем
// бесшовный цикл плавания по надписи с настоящим преломлением букв. Один аппаратно
// декодируемый ролик — почти бесплатно для телефона. Ролик снят при ширине 390 и
// масштабируется по ширине экрана (надпись на телефоне задана во vw, совпадает на любой ширине);
// по вертикали привязан к блоку текста. Вне экрана цикл на паузе. Если автоплей запрещён
// (режим энергосбережения) — onFail, и Hero показывает статичный кадр капли.
type Props = {
  heroRef: React.RefObject<HTMLElement>;
  titleRef: React.RefObject<HTMLElement>;
  onFail: () => void;
};

export function PhoneDrop({ heroRef, titleRef, onFail }: Props) {
  const fallRef = useRef<HTMLVideoElement>(null);
  const loopRef = useRef<HTMLVideoElement>(null);
  const [box, setBox] = useState<{ top: number; height: number } | null>(null);
  const [looping, setLooping] = useState(false);
  const base = import.meta.env.BASE_URL;

  useLayoutEffect(() => {
    const place = () => {
      const text = titleRef.current?.querySelector<HTMLElement>(".block");
      const hero = heroRef.current;
      if (!text || !hero) return;
      const k = hero.clientWidth / meta.width;
      const top = text.getBoundingClientRect().top - hero.getBoundingClientRect().top + meta.offsetFromText * k;
      setBox({ top, height: meta.height * k });
    };
    place();
    document.fonts?.ready.then(place);
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [heroRef, titleRef]);

  // Падение стартует сразу; не дал браузер автоплей — статичный кадр
  const placed = box !== null;
  useEffect(() => {
    if (placed) fallRef.current?.play().catch(onFail);
  }, [placed, onFail]);

  // Цикл играет, только пока первый экран виден
  useEffect(() => {
    const hero = heroRef.current;
    const loop = loopRef.current;
    if (!hero || !loop || !looping) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) loop.play().catch(() => {});
      else loop.pause();
    });
    io.observe(hero);
    return () => io.disconnect();
  }, [heroRef, looping]);

  if (!box) return null;
  return (
    <div className="hero-drop-video" style={{ top: box.top, height: box.height }} aria-hidden="true">
      <video
        ref={fallRef}
        muted
        playsInline
        preload="auto"
        poster={`${base}media/drop/drop-poster.jpg`}
        onEnded={() => setLooping(true)}
      >
        <source src={`${base}media/drop/drop-fall.mp4`} type="video/mp4" />
        <source src={`${base}media/drop/drop-fall.webm`} type="video/webm" />
      </video>
      <video ref={loopRef} muted playsInline loop preload="auto" data-on={looping}>
        <source src={`${base}media/drop/drop-loop.mp4`} type="video/mp4" />
        <source src={`${base}media/drop/drop-loop.webm`} type="video/webm" />
      </video>
    </div>
  );
}
