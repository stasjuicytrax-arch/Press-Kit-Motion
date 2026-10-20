import type { Config } from "tailwindcss";

// Тема целиком читает CSS-переменные из src/styles/tokens.css.
// Своих значений здесь нет: стандартные шкалы Tailwind заменены токенами DESIGN.md.
const v = (name: string) => `var(--${name})`;

const space = Object.fromEntries(
  Array.from({ length: 12 }, (_, i) => [String(i + 1), v(`space-${i + 1}`)]),
);

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    screens: {
      sm: "430px",
      md: "768px",
      lg: "1024px",
      xl: "1440px",
    },
    colors: {
      transparent: "transparent",
      current: "currentColor",
      bg: v("bg"),
      surface: v("surface"),
      "surface-2": v("surface-2"),
      ink: v("ink"),
      muted: v("muted"),
      accent: v("accent"),
      "accent-ink": v("accent-ink"),
      "accent-deep": v("accent-deep"),
      field: v("field"),
      "field-ink": v("field-ink"),
      "glass-fill": v("glass-fill-strong"),
    },
    spacing: {
      0: "0",
      px: "1px",
      ...space,
      margin: v("margin"),
      gutter: v("gutter"),
      tap: v("tap"),
      button: v("button-h"),
      inset: v("button-inset"),
      "icon-sm": v("icon-sm"),
      "icon-md": v("icon-md"),
      dot: v("dot"),
    },
    fontFamily: {
      sans: v("font-sans"),
    },
    fontSize: {
      mono: v("step-mono"),
      "mono-static": v("step-mono-static"),
      head: v("step-head"),
      lead: v("step-lead"),
      body: v("step-body"),
      small: v("step-small"),
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
    letterSpacing: {
      mono: v("track-mono"),
      head: v("track-head"),
      body: v("track-body"),
      normal: "0",
    },
    lineHeight: {
      mono: v("leading-mono"),
      head: v("leading-head"),
      lead: v("leading-lead"),
      body: v("leading-body"),
      none: "1",
    },
    borderRadius: {
      none: v("radius-none"),
      pill: v("radius-pill"),
      screen: v("radius-screen"),
      panel: v("radius-panel"),
    },
    boxShadow: {
      none: "none",
      float: v("shadow-float"),
      rim: v("glass-rim"),
    },
    transitionTimingFunction: {
      out: v("ease-out"),
      spring: v("ease-spring"),
      inout: v("ease-inout"),
    },
    transitionDuration: {
      fast: v("dur-fast"),
      base: v("dur-base"),
      slow: v("dur-slow"),
      scene: v("dur-scene"),
    },
    extend: {
      maxWidth: {
        lead: v("measure-lead"),
        body: v("measure-body"),
      },
      translate: {
        nudge: v("nudge"),
      },
      gridTemplateColumns: {
        page: "repeat(var(--cols), minmax(0, 1fr))",
      },
      scale: {
        press: v("press-scale"),
        hover: v("hover-scale"),
      },
    },
  },
  plugins: [],
} satisfies Config;
