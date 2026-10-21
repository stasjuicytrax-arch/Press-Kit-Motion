import { forwardRef } from "react";
import { LiquidGlass } from "./ui/apple-tahoe-liquid-glass-button";

// Стеклянный телефон с двойным безелем (DESIGN.md §6, §7): стеклянный корпус, внутри экран
// --field с концентрическим радиусом. Используется в «Работах» и в конструкторе.
type Props = { children: React.ReactNode; className?: string; style?: React.CSSProperties };

export const GlassPhone = forwardRef<HTMLDivElement, Props>(function GlassPhone({ children, className = "", style }, ref) {
  return (
    <LiquidGlass ref={ref} refraction={24} className={`glass-phone ${className}`} style={style}>
      <div className="glass-phone-screen">{children}</div>
    </LiquidGlass>
  );
});
