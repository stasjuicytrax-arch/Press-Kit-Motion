import { useEffect } from "react";
import { Problem } from "./Problem";
import { Work } from "./Work";
import { Inside } from "./Inside";
import { Builder } from "./Builder";
import { Process } from "./Process";
import { Pricing } from "./Pricing";
import { Faq } from "./Faq";
import { FinalCta } from "./FinalCta";

// Секции ниже первого экрана (ленивый чанк, App.tsx). Порядок — TZ.md §7.
export default function Below({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
    // onReady — один раз, после того как все секции в DOM
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <Problem />
      <Work />
      <Inside />
      <Builder />
      <Process />
      <Pricing />
      <Faq />
      <FinalCta />
    </>
  );
}
