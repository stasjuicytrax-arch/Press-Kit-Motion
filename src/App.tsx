import { useEffect } from "react";
import { Nav } from "./components/Nav";
import { StickyCta } from "./components/StickyCta";
import { CookieBanner } from "./components/CookieBanner";
import { Hero } from "./sections/Hero";
import { MarqueeBand } from "./components/MarqueeBand";
import { Problem } from "./sections/Problem";
import { Work } from "./sections/Work";
import { Inside } from "./sections/Inside";
import { Builder } from "./sections/Builder";
import { Process } from "./sections/Process";
import { Pricing } from "./sections/Pricing";
import { Faq } from "./sections/Faq";
import { FinalCta } from "./sections/FinalCta";
import { Footer } from "./sections/Footer";
import { startReveal } from "./lib/reveal";
import { startMotion } from "./lib/motion";
import { startOffscreenPause } from "./lib/offscreen";

// Порядок секций — TZ.md §7: утверждение → доказательство.
export default function App() {
  useEffect(() => {
    startReveal();
    startMotion();
    startOffscreenPause();
  }, []);

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <MarqueeBand />
        <Problem />
        <Work />
        <Inside />
        <Builder />
        <Process />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <StickyCta />
      <CookieBanner />
    </>
  );
}
