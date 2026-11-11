import { describe, it, expect } from "vitest";
import {
  parseAmount,
  periodRange,
  todayInManila,
  planSummary,
  isDate,
  movePeriod,
} from "../src/lib/finance";
import { emptyPlan, type Expense } from "../src/lib/types";
describe("financial rules", () => {
  it("uses exact integer centavos and rejects invalid amounts", () => {
    expect(parseAmount("0.29")).toBe(29);
    expect(parseAmount("2500.50")).toBe(250050);
    expect(parseAmount("0", true)).toBe(0);
    for (const value of [
      "0",
      "-5",
      "1.001",
      "NaN",
      "Infinity",
      "100000000",
      "1e3",
      "",
    ])
      expect(() => parseAmount(value)).toThrow();
  });
  it("groups Philippine calendar dates across UTC midnight", () => {
    expect(todayInManila(new Date("2026-11-10T15:59:59Z"))).toBe("2026-11-10");
    expect(todayInManila(new Date("2026-11-10T16:00:00Z"))).toBe("2026-11-11");
  });
  it("handles Monday weeks, leap years, and month navigation", () => {
    expect(periodRange("2027-01-01", "week")).toEqual({
      start: "2026-12-28",
      end: "2027-01-03",
    });
    expect(periodRange("2028-02-05", "month").end).toBe("2028-02-29");
    expect(movePeriod("2026-01-31", "month", 1)).toBe("2026-02-01");
    expect(isDate("2026-02-30")).toBe(false);
  });
  it("keeps daily and weekly limits independent and represents overspending", () => {
    const entries: Expense[] = [
      {
        id: "a",
        amount: 25000,
        date: "2026-11-09",
        category: "Food",
        payment: "Cash",
        note: "",
      },
      {
        id: "b",
        amount: 40000,
        date: "2026-11-10",
        category: "Food",
        payment: "Cash",
        note: "",
      },
      {
        id: "c",
        amount: 90000,
        date: "2026-11-08",
        category: "Food",
        payment: "Cash",
        note: "",
      },
    ];
    const result = planSummary(
      entries,
      { allowance: 50000, frequency: "week", daily: 30000, weekly: 80000 },
      "2026-11-10",
    );
    expect(result.spent).toBe(65000);
    expect(result.left).toBe(-15000);
    expect(result.limits[0].spent).toBe(40000);
    expect(planSummary(entries, emptyPlan, "2026-11-10").left).toBeNull();
  });
});
