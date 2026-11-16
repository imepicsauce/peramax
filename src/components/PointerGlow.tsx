import { useBlurPreference } from "../hooks/useBlurPreference";
import { useAppMotion } from "../hooks/useAppMotion";
import { useEffect, useRef } from "react";
export function PointerGlow({ blocked }: { blocked: boolean }) {
  const blurDisabled = useBlurPreference();
  const ref = useRef<HTMLDivElement>(null),
    reduce = useAppMotion();
  useEffect(() => {
    const layer = ref.current;
    if (!layer) return;
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;
    const hide = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      layer.classList.remove("visible");
    };
    if (blocked || reduce || blurDisabled) {
      hide();
      return;
    }
    const move = (event: PointerEvent) => {
      if (!fine.matches || event.pointerType !== "mouse" || !event.isPrimary) {
        hide();
        return;
      }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        layer.style.setProperty("--glow-x", `${event.clientX - 150}px`);
        layer.style.setProperty("--glow-y", `${event.clientY - 150}px`);
        layer.classList.add("visible");
        frame = 0;
      });
    };
    const out = (event: PointerEvent) => {
      if (!event.relatedTarget) hide();
    };
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerout", out, { passive: true });
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("blur", hide);
    fine.addEventListener("change", hide);
    return () => {
      hide();
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerout", out);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("blur", hide);
      fine.removeEventListener("change", hide);
    };
  }, [blocked, reduce, blurDisabled]);
  return (
    <div className="pointer-glow" aria-hidden="true" ref={ref}>
      <div />
    </div>
  );
}
