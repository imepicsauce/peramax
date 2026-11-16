import { useAppMotion } from "./hooks/useAppMotion";
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import App from "./App";
import "./styles/app.css";
import "./styles/effects.css";
import "./styles/responsive.css";
import "./styles/surfaces.css";
import "./styles/ux.css";
function AppMotion() {
  const reduced = useAppMotion();
  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reduced);
  }, [reduced]);
  return (
    <MotionConfig reducedMotion={reduced ? "always" : "never"}>
      <App />
    </MotionConfig>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppMotion />
  </StrictMode>,
);
