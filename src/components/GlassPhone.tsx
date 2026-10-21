import { forwardRef } from "react";

// Стеклянный телефон с двойным безелем (DESIGN.md §6, §7): стеклянный корпус, внутри экран
// --field с концентрическим радиусом. Используется в конструкторе.
// Корпус — статичное стекло (градиент, блик, тень), без backdrop-filter: телефон большой и
// наклоняется за курсором, живой фильтр пересчитывался бы каждый кадр (правки 2026-10-21, п. 10).
type Props = { children: React.ReactNode; className?: string; style?: React.CSSProperties };

export const GlassPhone = forwardRef<HTMLDivElement, Props>(function GlassPhone({ children, className = "", style }, ref) {
  return (
    <div ref={ref} className={`glass-phone glass-static ${className}`} style={style}>
      <div className="glass-phone-screen">{children}</div>
    </div>
  );
});
