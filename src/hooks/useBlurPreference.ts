import { useSyncExternalStore } from "react";
const key = "peramax-disable-blur";
let sessionValue = false;
function snapshot() {
  try { return localStorage.getItem(key) === "true"; } catch { return sessionValue; }
}
function subscribe(callback: () => void) {
  window.addEventListener("peramax-blur-change", callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener("peramax-blur-change", callback); window.removeEventListener("storage", callback); };
}
export function useBlurPreference() { return useSyncExternalStore(subscribe, snapshot, () => false); }
export function setBlurDisabled(value: boolean) {
  sessionValue = value;
  document.documentElement.classList.toggle("no-blur", value);
  try { localStorage.setItem(key, String(value)); } catch { /* Session preference still works. */ }
  window.dispatchEvent(new Event("peramax-blur-change"));
}
