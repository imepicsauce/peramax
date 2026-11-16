import { useAppMotion } from "../hooks/useAppMotion";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent,
} from "react";
import { motion } from "motion/react";
export function Sheet({
  open,
  title,
  screenKey,
  onClose,
  children,
  autoFocusInput = false,
}: {
  open: boolean;
  title: string;
  screenKey: string;
  onClose: () => void;
  children: ReactNode;
  autoFocusInput?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    content = useRef(children),
    heading = useRef(title),
    key = useRef(screenKey),
    reduce = useAppMotion(),
    closing = useRef(false),
    animation = useRef<Animation | null>(null),
    drag = useRef<{ id: number; start: number; distance: number } | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [formSession, setFormSession] = useState(0);
  const exitFinished = useRef(false);
  const dirty = useRef(false),
    previousFocus = useRef<HTMLElement | null>(null),
    scrollPosition = useRef(0);
  useEffect(() => {
    dirty.current = false;
    setConfirmDiscard(false);
  }, [open, screenKey]);
  useEffect(() => {
    if (confirmDiscard)
      ref.current?.querySelector<HTMLButtonElement>(".keep-editing")?.focus();
  }, [confirmDiscard]);
  function keepEditing() {
    setConfirmDiscard(false);
    requestAnimationFrame(() => {
      if (ref.current) ref.current.scrollTop = scrollPosition.current;
      previousFocus.current?.focus({ preventScroll: true });
    });
  }
  if (open) {
    content.current = children;
    heading.current = title;
    key.current = screenKey;
  }
  function reset() {
    animation.current?.cancel();
    animation.current = null;
    drag.current = null;
    closing.current = false;
    if (ref.current) {
      ref.current.style.transform = "";
      ref.current.style.animation = "";
      delete ref.current.dataset.closing;
    }
  }
  function requestClose(discard = false) {
    const dialog = ref.current;
    if (!dialog || closing.current || !dialog.open) return;
    if (
      !discard &&
      (dirty.current || dialog.querySelector('form[data-dirty="true"]'))
    ) {
      previousFocus.current = document.activeElement as HTMLElement;
      scrollPosition.current = dialog.scrollTop;
      snapBack();
      setConfirmDiscard(true);
      dialog.scrollTop = 0;
      return;
    }
    closing.current = true;
    // Capture the current visual position before cancelling an interrupted animation.
    const visualTransform = getComputedStyle(dialog).transform;
    animation.current?.cancel();
    dialog.dataset.closing = "true";
    const finish = () => {
      exitFinished.current = true;
      onClose();
    };
    if (reduce || !dialog.animate) {
      finish();
      return;
    }
    dialog.style.animation = "none";
    const distance = matchMedia("(min-width: 960px)").matches
      ? 18
      : Math.min(window.innerHeight, (drag.current?.distance ?? 0) + 96);
    const exit = dialog.animate(
      [
        {
          opacity: 1,
          transform:
            visualTransform && visualTransform !== "none"
              ? visualTransform
              : dialog.style.transform || "translateY(0)",
        },
        { opacity: 0, transform: `translateY(${distance}px)` },
      ],
      { duration: 180, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" },
    );
    animation.current = exit;
    exit.onfinish = finish;
  }
  useLayoutEffect(() => {
    const dialog = ref.current!;
    reset();
    if (open) {
      setFormSession((value) => value + 1);
      exitFinished.current = false;
      if (!dialog.open) dialog.showModal();
      document.body.classList.add("modal-open");
    } else if (dialog.open) {
      const finish = () => {
        dialog.close();
        reset();
        exitFinished.current = false;
        document.body.classList.remove("modal-open");
      };
      if (exitFinished.current || reduce || !dialog.animate) finish();
      else {
        // Saving also closes through a brief exit, retaining the mounted form.
        closing.current = true;
        dialog.dataset.closing = "true";
        dialog.style.animation = "none";
        const exit = dialog.animate(
          [
            { opacity: 1, transform: "translateY(0)" },
            { opacity: 0, transform: "translateY(18px)" },
          ],
          {
            duration: 140,
            easing: "cubic-bezier(0.4, 0, 1, 1)",
            fill: "forwards",
          },
        );
        animation.current = exit;
        exit.onfinish = finish;
      }
    } else document.body.classList.remove("modal-open");
    return () => {
      reset();
      document.body.classList.remove("modal-open");
    };
  }, [open, screenKey]);
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      // Never steal focus if the user has already started editing before this frame.
      if (
        ref.current?.contains(document.activeElement) &&
        document.activeElement?.matches("input, select, textarea")
      )
        return;
      const element = autoFocusInput
        ? ref.current?.querySelector<HTMLInputElement | HTMLButtonElement>(
            "input, select",
          )
        : null;
      (
        element || ref.current?.querySelector<HTMLButtonElement>(".close")
      )?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [screenKey, open, autoFocusInput]);
  function snapBack() {
    const dialog = ref.current;
    drag.current = null;
    if (!dialog || closing.current) return;
    const rendered = getComputedStyle(dialog).transform;
    const from =
      rendered && rendered !== "none" ? rendered : dialog.style.transform;
    animation.current?.cancel();
    dialog.style.transform = "";
    if (!reduce && dialog.animate)
      animation.current = dialog.animate(
        [
          { transform: from || "translateY(0)" },
          { transform: "translateY(0)" },
        ],
        { duration: 180, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
  }
  function pointerDown(e: PointerEvent<HTMLButtonElement>) {
    if (
      confirmDiscard ||
      e.button !== 0 ||
      closing.current ||
      matchMedia("(min-width: 960px)").matches ||
      getComputedStyle(e.currentTarget).display === "none"
    )
      return;
    animation.current?.cancel();
    drag.current = { id: e.pointerId, start: e.clientY, distance: 0 };
    ref.current!.style.animation = "none";
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!open || !viewport) return;
    const update = () => {
      ref.current?.style.setProperty(
        "--sheet-viewport-height",
        `${viewport.height}px`,
      );
      ref.current?.style.setProperty(
        "--sheet-keyboard-offset",
        `${Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)}px`,
      );
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby="sheet-title"
      onChangeCapture={(e) => {
        const form = (e.target as HTMLElement).closest("form");
        if (form && !form.hasAttribute("data-dirty")) dirty.current = true;
      }}
      onCancel={(e) => {
        e.preventDefault();
        if (confirmDiscard) keepEditing();
        else requestClose();
      }}
      onClick={(e) => {
        if (confirmDiscard || e.target !== e.currentTarget) return;
        const r = e.currentTarget.getBoundingClientRect();
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        )
          requestClose();
      }}
    >
      <div className="sheet-body" hidden={confirmDiscard}>
        <button
          type="button"
          className="sheet-handle"
          aria-label="Drag down to close dialog"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              requestClose();
            }
          }}
          onPointerDown={pointerDown}
          onPointerMove={(e) => {
            if (
              !drag.current ||
              drag.current.id !== e.pointerId ||
              closing.current
            )
              return;
            drag.current.distance = Math.max(0, e.clientY - drag.current.start);
            ref.current!.style.transform = `translateY(${drag.current.distance}px)`;
          }}
          onPointerUp={(e) => {
            if (!drag.current || drag.current.id !== e.pointerId) return;
            if (drag.current.distance >= 80) requestClose();
            else snapBack();
            drag.current = null;
            if (e.currentTarget.hasPointerCapture(e.pointerId))
              e.currentTarget.releasePointerCapture(e.pointerId);
          }}
          onPointerCancel={snapBack}
          onLostPointerCapture={() => {
            if (drag.current) snapBack();
          }}
        >
          <span aria-hidden="true" />
        </button>
        <div className="sheet-heading">
          <h2 id="sheet-title">{heading.current}</h2>
          <button
            className="close"
            aria-label="Close dialog"
            onClick={() => requestClose()}
          >
            ×
          </button>
        </div>
        <motion.div
          key={`${key.current}-${formSession}`}
          initial={!open || reduce ? false : { opacity: 0.8 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduce ? 0 : 0.16 }}
        >
          {content.current}
        </motion.div>
      </div>
      {confirmDiscard && (
        <section
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="discard-title"
          aria-describedby="discard-description"
          className="discard-confirm"
        >
          <h2 id="discard-title">Discard your changes?</h2>
          <p id="discard-description">
            Your edits haven’t been saved. Keep editing to finish, or discard
            them.
          </p>
          <div className="dialogactions">
            <button className="secondary keep-editing" onClick={keepEditing}>
              Keep editing
            </button>
            <button className="primary" onClick={() => requestClose(true)}>
              Discard changes
            </button>
          </div>
        </section>
      )}
    </dialog>
  );
}
