import { describe, it, expect } from "vitest";
import { browserRepository, STORAGE_KEY } from "../src/lib/storage";
import { emptyState } from "../src/lib/types";
describe("repository migration", () => {
  it("preserves old expenses, plan, savings, and legacy keys", () => {
    const entries = [
        {
          id: "a",
          amount: 12345,
          category: "Food",
          payment: "Cash",
          date: "2026-11-10",
          note: "Lunch",
        },
      ],
      plan = {
        allowance: 250000,
        frequency: "week",
        daily: 30000,
        weekly: 180000,
      },
      goal = { name: "Laptop", target: 3000000, saved: 100000, date: "" };
    localStorage.setItem("peramax-v1", JSON.stringify(entries));
    localStorage.setItem("peramax-plan-v1", JSON.stringify(plan));
    localStorage.setItem("peramax-savings-goal-v1", JSON.stringify(goal));
    const repo = browserRepository(localStorage),
      loaded = repo.load("2026-11-11");
    expect(loaded.state.expenses).toEqual(entries);
    expect(loaded.state.plan).toEqual(plan);
    expect(loaded.state.goal).toEqual(goal);
    repo.save(loaded.state);
    expect(repo.load("2026-11-12").state).toEqual(loaded.state);
    expect(localStorage.getItem("peramax-v1")).toBe(JSON.stringify(entries));
  });
  it("preserves an intentionally empty list without reseeding demo entries", () => {
    localStorage.setItem("peramax-v1", "[]");
    expect(
      browserRepository(localStorage).load("2026-11-11").state.expenses,
    ).toEqual([]);
  });
  it("seeds identifiable demo entries only for a new user", () => {
    const result = browserRepository(localStorage).load("2026-11-11");
    expect(result.state.expenses.length).toBeGreaterThan(0);
    expect(result.state.expenses.every((e) => e.demo)).toBe(true);
  });
  it("does not overwrite malformed or unsupported state", () => {
    localStorage.setItem(STORAGE_KEY, "{invalid");
    const result = browserRepository(localStorage).load("2026-11-11");
    expect(result.canPersist).toBe(false);
    expect(result.warning).toContain("untouched");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("{invalid");
  });
  it("prefers the new state even after all expenses are removed", () => {
    const repo = browserRepository(localStorage);
    repo.save(emptyState());
    expect(repo.load("2026-11-11").state.expenses).toEqual([]);
  });
});
