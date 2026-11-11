import { useEffect, type RefObject } from "react";
import { useReducedMotion } from "motion/react";
export function useScrollMorph(ref: RefObject<HTMLElement | null>) {
  const reduce = useReducedMotion();
  useEffect(() => {
    const main = ref.current;
    if (!main) return;
    let frame = 0;
    const tracked = new Set<HTMLElement>(),
      visible = new Set<HTMLElement>();
    const last = new WeakMap<HTMLElement, string>();
    const intersection =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              entries.forEach((e) => {
                if (e.isIntersecting) visible.add(e.target as HTMLElement);
                else visible.delete(e.target as HTMLElement);
              });
              schedule();
            },
            { rootMargin: "120px" },
          );
    function collect() {
      for (const el of tracked)
        if (!el.isConnected) {
          intersection?.unobserve(el);
          tracked.delete(el);
          visible.delete(el);
        }
      main!
        .querySelectorAll<HTMLElement>(
          ".allowance-card,.limit-card,.summary,.transaction",
        )
        .forEach((el) => {
          if (tracked.has(el)) return;
          tracked.add(el);
          el.dataset.scrollMorph = "";
          if (intersection) intersection.observe(el);
          else visible.add(el);
        });
      schedule();
    }
    function paint() {
      frame = 0;
      if (document.hidden) return;
      if (reduce || window.matchMedia("(min-width: 960px)").matches) {
        tracked.forEach((el) => {
          ["--morph-edge", "--morph-x", "--morph-y"].forEach((p) =>
            el.style.removeProperty(p),
          );
          last.delete(el);
        });
        return;
      }
      if (document.querySelector("dialog[open]")) return;
      const viewport = window.visualViewport,
        top = Math.max(
          viewport?.offsetTop || 0,
          document.querySelector("header")?.getBoundingClientRect().bottom ||
            64,
        ),
        bottom = Math.min(
          (viewport?.offsetTop || 0) + (viewport?.height || innerHeight),
          document.querySelector(".bottom-nav")?.getBoundingClientRect().top ||
            innerHeight,
        );
      if (bottom <= top) return;
      const band = Math.min(120, (bottom - top) * 0.24),
        updates: [HTMLElement, number, string][] = [];
      visible.forEach((el) => {
        if (!el.getClientRects().length) return;
        const rect = el.getBoundingClientRect(),
          height = el.offsetHeight;
        if (!height || rect.top + height < top - 120 || rect.top > bottom + 120)
          return;
        const center = rect.top + height / 2;
        let edge = Math.max(
          0,
          Math.min(
            1,
            Math.max(
              (top + band - center) / band,
              (center - bottom + band) / band,
            ),
          ),
        );
        edge = edge * edge * (3 - 2 * edge);
        const value = edge.toFixed(3);
        if (last.get(el) !== value) updates.push([el, edge, value]);
      });
      updates.forEach(([el, edge, value]) => {
        el.style.setProperty("--morph-edge", value);
        el.style.setProperty("--morph-x", (1 - edge * 0.06).toFixed(4));
        el.style.setProperty("--morph-y", (1 - edge * 0.018).toFixed(4));
        last.set(el, value);
      });
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(paint);
    }
    const mutations = new MutationObserver(collect);
    mutations.observe(main, { childList: true, subtree: true });
    const modal = new MutationObserver(schedule);
    document
      .querySelectorAll("dialog")
      .forEach((el) =>
        modal.observe(el, { attributes: true, attributeFilter: ["open"] }),
      );
    const resize =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(schedule);
    resize?.observe(main);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.visualViewport?.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", schedule);
    collect();
    return () => {
      cancelAnimationFrame(frame);
      mutations.disconnect();
      modal.disconnect();
      resize?.disconnect();
      intersection?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", schedule);
      tracked.forEach((el) => {
        delete el.dataset.scrollMorph;
        ["--morph-edge", "--morph-x", "--morph-y"].forEach((p) =>
          el.style.removeProperty(p),
        );
      });
    };
  }, [ref, reduce]);
}
