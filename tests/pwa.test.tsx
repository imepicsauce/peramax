import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usePwa } from "../src/hooks/usePwa";
afterEach(() => {
  delete (navigator as unknown as Record<string, unknown>).serviceWorker;
});
function setup(waiting = true) {
  const worker = { postMessage: vi.fn() };
  const registration = Object.assign(new EventTarget(), {
    waiting: waiting ? worker : null,
    installing: null,
  });
  const service = Object.assign(new EventTarget(), {
    register: vi.fn().mockResolvedValue(registration),
    ready: Promise.resolve(registration),
    controller: waiting ? {} : null,
  });
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: service,
  });
  return { worker, service };
}
describe("PWA lifecycle", () => {
  it("offers updates without automatically activating them and blocks updates during forms", async () => {
    const { worker, service } = setup();
    const { result, rerender } = renderHook(
      ({ blocked }) => usePwa(blocked, true),
      { initialProps: { blocked: true } },
    );
    await waitFor(() => expect(result.current.updateAvailable).toBe(true));
    expect(result.current.ready).toBe(true);
    expect(service.register).toHaveBeenCalledWith("/sw.js", { scope: "/" });
    expect(worker.postMessage).not.toHaveBeenCalled();
    act(() => result.current.update());
    expect(worker.postMessage).not.toHaveBeenCalled();
    rerender({ blocked: false });
    act(() => result.current.update());
    expect(worker.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
    rerender({ blocked: true });
    act(() => service.dispatchEvent(new Event("controllerchange")));
    expect(result.current.updating).toBe(false);
    expect(result.current.updateAvailable).toBe(true);
  });
  it("does not offer an update on first installation and responds to connectivity", async () => {
    setup(false);
    const { result } = renderHook(() => usePwa(false, true));
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.updateAvailable).toBe(false);
    act(() => window.dispatchEvent(new Event("offline")));
    expect(result.current.offline).toBe(true);
    act(() => window.dispatchEvent(new Event("online")));
    expect(result.current.offline).toBe(false);
  });
  it("runs installation only after user action", async () => {
    const { result } = renderHook(() => usePwa(false, false));
    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = Object.assign(
      new Event("beforeinstallprompt", { cancelable: true }),
      { prompt, userChoice: Promise.resolve({ outcome: "accepted" }) },
    );
    act(() => window.dispatchEvent(event));
    expect(event.defaultPrevented).toBe(true);
    expect(prompt).not.toHaveBeenCalled();
    await act(async () => {
      expect(await result.current.install()).toBe(true);
    });
    expect(prompt).toHaveBeenCalledTimes(1);
    act(() => window.dispatchEvent(new Event("appinstalled")));
    expect(result.current.installed).toBe(true);
  });
  it("reports service-worker setup failures while leaving the app usable", async () => {
    const { service } = setup();
    service.register.mockRejectedValue(new Error("blocked"));
    const { result } = renderHook(() => usePwa(false, true));
    await waitFor(() =>
      expect(result.current.error).toContain("Offline setup was unavailable"),
    );
  });
});
