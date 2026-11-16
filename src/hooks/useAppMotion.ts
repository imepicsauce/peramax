import { useSyncExternalStore } from "react";
import { useReducedMotion } from "motion/react";
const eventName = "peramax-motion-change";
function subscribe(callback: () => void) {
  window.addEventListener(eventName, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(eventName, callback);
    window.removeEventListener("storage", callback);
  };
}
function snapshot() {
  try {
    return localStorage.getItem("peramax-reduce-motion") === "true";
  } catch {
    return document.documentElement.classList.contains("reduce-motion");
  }
}
/** CSS, declarative Motion, and imperative gestures share the same preference. */
export function useAppMotion() {
  const system = useReducedMotion();
  const app = useSyncExternalStore(subscribe, snapshot, () => false);
  return Boolean(system || app);
}
