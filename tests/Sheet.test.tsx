import { useState } from "react";
import { fireEvent, render, screen, act } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Sheet } from "../src/components/Sheet";
const settings = vi.hoisted(() => ({ reduced: false }));
vi.mock("motion/react", async (importOriginal) => {
  const original = await importOriginal<typeof import("motion/react")>();
  return { ...original, useReducedMotion: () => settings.reduced };
});
const originalDescriptors = [
  "animate",
  "setPointerCapture",
  "hasPointerCapture",
].map(
  (name) =>
    [
      name,
      Object.getOwnPropertyDescriptor(HTMLElement.prototype, name),
    ] as const,
);
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  settings.reduced = false;
  for (const [name, descriptor] of originalDescriptors) {
    if (descriptor)
      Object.defineProperty(HTMLElement.prototype, name, descriptor);
    else Reflect.deleteProperty(HTMLElement.prototype, name);
  }
});
function Fixture() {
  const [open, setOpen] = useState(true);
  return (
    <Sheet
      open={open}
      title="Test form"
      screenKey="test"
      onClose={() => setOpen(false)}
    >
      <input aria-label="Draft" />
    </Sheet>
  );
}
function mockAnimation() {
  Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", {
    configurable: true,
    value: () => false,
  });

  const animations: {
    onfinish: null | (() => void);
    cancel: ReturnType<typeof vi.fn>;
  }[] = [];
  const animate = vi.fn(() => {
    const value = { onfinish: null, cancel: vi.fn() };
    animations.push(value);
    return value as unknown as Animation;
  });
  Object.defineProperty(HTMLElement.prototype, "animate", {
    configurable: true,
    value: animate,
  });
  return { animations, animate };
}
it("keeps the form mounted until its close animation finishes", () => {
  const { animations } = mockAnimation();
  render(<Fixture />);
  fireEvent.change(screen.getByLabelText("Draft"), {
    target: { value: "unsaved" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByLabelText("Draft")).toHaveValue("unsaved");
  fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
  expect(animations).toHaveLength(1);
  act(() => animations[0].onfinish?.());
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it("snaps back short drags and dismisses a downward handle drag", () => {
  const { animations } = mockAnimation();
  vi.stubGlobal("PointerEvent", MouseEvent);
  render(<Fixture />);
  const handle = screen.getByRole("button", {
    name: "Drag down to close dialog",
  });
  fireEvent.pointerDown(handle, { clientY: 0, button: 0 });
  fireEvent.pointerMove(handle, { clientY: 30 });
  fireEvent.pointerUp(handle, { clientY: 30 });
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(animations).toHaveLength(1);
  fireEvent.pointerDown(handle, { clientY: 0, button: 0 });
  fireEvent.pointerMove(handle, { clientY: 100 });
  fireEvent.pointerUp(handle, { clientY: 100 });
  act(() => animations[1].onfinish?.());
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it("skips exit motion when reduced motion is requested", () => {
  settings.reduced = true;
  const { animate } = mockAnimation();
  render(<Fixture />);
  fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
  expect(animate).not.toHaveBeenCalled();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it("ignores handle dragging on desktop and cancels interrupted mobile drags", () => {
  const { animate } = mockAnimation();
  vi.stubGlobal("PointerEvent", MouseEvent);
  const original = window.matchMedia;
  const media = vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
    ...original(query),
    matches: query.includes("960px"),
  }));
  render(<Fixture />);
  const handle = screen.getByRole("button", {
    name: "Drag down to close dialog",
  });
  fireEvent.pointerDown(handle, { clientY: 0, button: 0 });
  fireEvent.pointerMove(handle, { clientY: 100 });
  fireEvent.pointerUp(handle, { clientY: 100 });
  expect(animate).not.toHaveBeenCalled();
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  media.mockRestore();
  fireEvent.pointerDown(handle, { clientY: 0, button: 0 });
  fireEvent.pointerMove(handle, { clientY: 100 });
  fireEvent.pointerCancel(handle);
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByRole("dialog").style.transform).toBe("");
});
it("honors the in-app reduced animation setting for imperative sheet closing", () => {
  localStorage.setItem("peramax-reduce-motion", "true");
  const { animate } = mockAnimation();
  render(<Fixture />);
  fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
  expect(animate).not.toHaveBeenCalled();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it("continues a long drag downward rather than jumping back on release", () => {
  const { animate, animations } = mockAnimation();
  vi.stubGlobal("PointerEvent", MouseEvent);
  render(<Fixture />);
  const handle = screen.getByRole("button", {
    name: "Drag down to close dialog",
  });
  fireEvent.pointerDown(handle, { clientY: 0, button: 0 });
  fireEvent.pointerMove(handle, { clientY: 180 });
  fireEvent.pointerUp(handle, { clientY: 180 });
  const frames = animate.mock.calls[0] as unknown as [Keyframe[], unknown];
  expect(frames[0][0].transform).toBe("translateY(180px)");
  expect(frames[0][1].transform).toBe("translateY(276px)");
  act(() => animations[0].onfinish?.());
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it("animates a programmatic close without discarding the visible form midway", () => {
  const { animations } = mockAnimation();
  const props = { title: "Test form", screenKey: "form", onClose: vi.fn() };
  const view = render(
    <Sheet {...props} open={true}>
      <input aria-label="Saved draft" />
    </Sheet>,
  );
  fireEvent.change(screen.getByLabelText("Saved draft"), {
    target: { value: "finished" },
  });
  view.rerender(
    <Sheet {...props} open={false}>
      <input aria-label="Saved draft" />
    </Sheet>,
  );
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByLabelText("Saved draft")).toHaveValue("finished");
  act(() => animations[0].onfinish?.());
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
it("cancels snapback before a second drag and does not stack live animations", () => {
  const { animations } = mockAnimation();
  vi.stubGlobal("PointerEvent", MouseEvent);
  render(<Fixture />);
  const handle = screen.getByRole("button", {
    name: "Drag down to close dialog",
  });
  fireEvent.pointerDown(handle, { button: 0, clientY: 0 });
  fireEvent.pointerMove(handle, { clientY: 30 });
  fireEvent.pointerUp(handle, { clientY: 30 });
  fireEvent.pointerDown(handle, { button: 0, clientY: 0 });
  expect(animations[0].cancel).toHaveBeenCalled();
  fireEvent.pointerMove(handle, { clientY: 120 });
  fireEvent.pointerUp(handle, { clientY: 120 });
  act(() => animations[1].onfinish?.());
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
