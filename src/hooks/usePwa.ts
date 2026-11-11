import { useEffect, useRef, useState } from "react";
interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
export function usePwa(blocked: boolean, enabled = import.meta.env.PROD) {
  const [offline, setOffline] = useState(!navigator.onLine),
    [ready, setReady] = useState(false),
    [updateAvailable, setUpdateAvailable] = useState(false),
    [installed, setInstalled] = useState(false),
    [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null),
    [error, setError] = useState(""),
    [updating, setUpdating] = useState(false);
  const registration = useRef<ServiceWorkerRegistration | null>(null),
    accepted = useRef(false),
    blockedRef = useRef(blocked);
  blockedRef.current = blocked;
  useEffect(() => {
    let active = true;
    const mode = matchMedia("(display-mode: standalone)");
    const detect = () =>
      setInstalled(
        mode.matches ||
          Boolean(
            (navigator as Navigator & { standalone?: boolean }).standalone,
          ),
      );
    detect();
    mode.addEventListener("change", detect);
    const online = () => setOffline(false),
      offline = () => setOffline(true);
    const install = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };
    const done = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    window.addEventListener("beforeinstallprompt", install);
    window.addEventListener("appinstalled", done);
    const cleanups: (() => void)[] = [];
    if (enabled && "serviceWorker" in navigator) {
      const serviceWorker = navigator.serviceWorker;
      const controllerChanged = () => {
        if (!active) return;
        if (accepted.current && !blockedRef.current) window.location.reload();
        else if (accepted.current) {
          setUpdating(false);
          setUpdateAvailable(true);
        }
      };
      serviceWorker.addEventListener("controllerchange", controllerChanged);
      cleanups.push(() =>
        serviceWorker.removeEventListener(
          "controllerchange",
          controllerChanged,
        ),
      );
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          if (!active) return;
          registration.current = reg;
          if (reg.waiting) setUpdateAvailable(true);
          const watch = () => {
            const worker = reg.installing;
            if (!worker) return;
            const changed = () => {
              if (
                active &&
                worker.state === "installed" &&
                serviceWorker.controller
              )
                setUpdateAvailable(true);
            };
            worker.addEventListener("statechange", changed);
            cleanups.push(() =>
              worker.removeEventListener("statechange", changed),
            );
            changed();
          };
          reg.addEventListener("updatefound", watch);
          cleanups.push(() => reg.removeEventListener("updatefound", watch));
          watch();
          serviceWorker.ready
            .then(() => {
              if (active) setReady(true);
            })
            .catch(() => {});
        })
        .catch(() => {
          if (active)
            setError(
              "Offline setup was unavailable. Reconnect and reopen the app to retry.",
            );
        });
    }
    return () => {
      active = false;
      mode.removeEventListener("change", detect);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      window.removeEventListener("beforeinstallprompt", install);
      window.removeEventListener("appinstalled", done);
      cleanups.forEach((fn) => fn());
    };
  }, [enabled]);
  async function install() {
    if (!installPrompt) return false;
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      return true;
    } catch {
      setInstallPrompt(null);
      return false;
    }
  }
  function update() {
    if (blockedRef.current) return;
    accepted.current = true;
    const worker = registration.current?.waiting;
    if (worker) {
      setUpdating(true);
      worker.postMessage({ type: "SKIP_WAITING" });
    } else window.location.reload();
  }
  return {
    offline,
    ready,
    installed,
    updateAvailable,
    updating,
    error,
    install,
    update,
  };
}
