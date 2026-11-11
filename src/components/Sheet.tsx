import { useEffect, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
export function Sheet({
  open,
  title,
  screenKey,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  screenKey: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    content = useRef(children),
    heading = useRef(title),
    key = useRef(screenKey),
    reduce = useReducedMotion();
  if (open) {
    content.current = children;
    heading.current = title;
    key.current = screenKey;
  }
  useEffect(() => {
    const dialog = ref.current!;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
    document.body.classList.toggle("modal-open", open);
    return () => document.body.classList.remove("modal-open");
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const element = ref.current?.querySelector<
        HTMLInputElement | HTMLButtonElement
      >("input, select");
      (
        element || ref.current?.querySelector<HTMLButtonElement>(".close")
      )?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [screenKey, open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby="sheet-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const r = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < r.left ||
          event.clientX > r.right ||
          event.clientY < r.top ||
          event.clientY > r.bottom
        )
          onClose();
      }}
    >
      <div className="sheet-heading">
        <h2 id="sheet-title">{heading.current}</h2>
        <button className="close" aria-label="Close dialog" onClick={onClose}>
          ×
        </button>
      </div>
      <motion.div
        key={open ? key.current : "closed"}
        initial={!open || reduce ? false : { opacity: 0.4, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.18 }}
      >
        {content.current}
      </motion.div>
    </dialog>
  );
}
