import { Nav } from "./components/Nav";
import { StickyCta } from "./components/StickyCta";
import { Hero } from "./sections/Hero";

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
      </main>
      <StickyCta />
    </>
  );
}
