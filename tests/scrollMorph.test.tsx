import { useRef } from "react";
import { render, waitFor } from "@testing-library/react";
import { it, expect, vi } from "vitest";
import { useScrollMorph } from "../src/hooks/useScrollMorph";
vi.mock("motion/react", () => ({ useReducedMotion: () => false }));
function Fixture() {
  const ref = useRef<HTMLElement>(null);
  useScrollMorph(ref);
  return <main ref={ref}><div className="weekly-saving-card">Weekly saving goal</div></main>;
}
it("morphs the weekly saving card near the mobile viewport edge and cleans up", async () => {
  const rect = { top: 0, bottom: 100, left: 0, right: 300, width: 300, height: 100, x: 0, y: 0, toJSON() {} };
  const bounds = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(rect);
  const rects = vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([rect] as unknown as DOMRectList);
  const height = vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(100);
  try {
    const view = render(<Fixture />);
    const card = view.container.querySelector<HTMLElement>(".weekly-saving-card")!;
    await waitFor(() => expect(Number(card.style.getPropertyValue("--morph-edge"))).toBeGreaterThan(0));
    expect(card).toHaveAttribute("data-scroll-morph");
    view.unmount();
    expect(card.style.getPropertyValue("--morph-edge")).toBe("");
  } finally { bounds.mockRestore(); rects.mockRestore(); height.mockRestore(); }
});
