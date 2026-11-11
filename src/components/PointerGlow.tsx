import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
export function PointerGlow({ blocked }: { blocked: boolean }) {
  const ref = useRef<HTMLDivElement>(null),
    reduce = useReducedMotion();
  useEffect(() => {
    const layer = ref.current;
    if (!layer) return;
    let frame = 0,
      touch: number | null = null,
      x = 0,
      y = 0;
    const hide = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      layer.classList.remove("visible");
    };
    if (blocked || reduce) {
      hide();
      return;
    }
    const show = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!frame)
        frame = requestAnimationFrame(() => {
          layer.style.setProperty("--glow-x", `${x - 150}px`);
          layer.style.setProperty("--glow-y", `${y - 150}px`);
          layer.classList.add("visible");
          frame = 0;
        });
    };
    const down = (e: PointerEvent) => {
      if (!e.isPrimary) return;
      if (e.pointerType !== "mouse") touch = e.pointerId;
      show(e);
    };
    const move = (e: PointerEvent) => {
      if (e.isPrimary && (e.pointerType === "mouse" || touch === e.pointerId))
        show(e);
    };
    const up = (e: PointerEvent) => {
      if (touch === e.pointerId) {
        touch = null;
        hide();
      }
    };
    const out = (e: PointerEvent) => {
      if (!e.relatedTarget) hide();
    };
    const visibility = () => {
      if (document.hidden) hide();
    };
    document.addEventListener("pointerdown", down, { passive: true });
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerup", up, { passive: true });
    document.addEventListener("pointercancel", hide, { passive: true });
    document.addEventListener("pointerout", out, { passive: true });
    window.addEventListener("blur", hide);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      hide();
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", hide);
      document.removeEventListener("pointerout", out);
      window.removeEventListener("blur", hide);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [blocked, reduce]);
  return (
    <div className="pointer-glow" aria-hidden="true" ref={ref}>
      <div />
    </div>
  );
}
