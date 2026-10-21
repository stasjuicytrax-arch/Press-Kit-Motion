import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { captureUtm } from "./lib/utm";
import { trackClicks } from "./lib/metrika";
import "./styles/globals.css";

captureUtm();
trackClicks();

// Анимации включаются только при живом JS: без скрипта контент виден в покое (DESIGN.md §8).
document.documentElement.classList.add("js-motion");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
